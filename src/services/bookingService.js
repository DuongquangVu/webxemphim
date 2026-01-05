const { Booking, Ticket, Seat, Showtime, SeatLock } = require("../models");
const { pool } = require("../models/BaseModel");

class BookingService {
  /**
   * Luồng đặt vé hoàn chỉnh:
   * 1. Kiểm tra suất chiếu
   * 2. Kiểm tra ghế có thể đặt
   * 3. Tính tổng tiền
   * 4. Tạo booking
   * 5. Tạo tickets
   * 6. Mở khóa ghế tạm thời
   */
  async createBooking(userId, showtimeId, seatIds, paymentMethod = "cash") {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Lấy thông tin suất chiếu
      const showtime = await Showtime.getShowtimeDetail(showtimeId);
      if (!showtime) {
        throw new Error("Không tìm thấy suất chiếu");
      }

      // 2. Lấy thông tin ghế
      const seats = await Seat.getSeatsById(seatIds);
      if (seats.length !== seatIds.length) {
        throw new Error("Một số ghế không tồn tại");
      }

      // 3. Kiểm tra ghế có thể đặt không (double check)
      for (const seat of seats) {
        const availability = await Seat.isSeatAvailable(
          seat.id,
          showtimeId,
          userId
        );
        if (!availability.available) {
          throw new Error(
            `Ghế ${seat.row_name}${seat.seat_number}: ${availability.reason}`
          );
        }
      }

      // 4. Tính tổng tiền
      let totalAmount = 0;
      const ticketPrices = [];

      for (const seat of seats) {
        const price = showtime.base_price * (seat.price_modifier || 1);
        totalAmount += price;
        ticketPrices.push({ seatId: seat.id, price });
      }

      // 5. Tạo booking với thời gian hết hạn tùy theo phương thức thanh toán
      // Thanh toán tại quầy: 30 phút, Online: 10 phút
      const expireMinutes = paymentMethod === "cash" ? 30 : 10;
      const booking = await Booking.createBooking(
        {
          user_id: userId,
          showtime_id: showtimeId,
          total_amount: totalAmount,
          payment_status: "pending",
          payment_method: paymentMethod,
        },
        expireMinutes
      );

      // 6. Tạo tickets
      const tickets = [];
      for (const ticketInfo of ticketPrices) {
        const ticket = await Ticket.createTicket({
          booking_id: booking.id,
          seat_id: ticketInfo.seatId,
          price: ticketInfo.price,
        });
        tickets.push(ticket);
      }

      // 7. Mở khóa ghế tạm thời (vì đã tạo booking)
      await SeatLock.unlockSeats(seatIds, showtimeId, userId);

      await connection.commit();

      // Trả về booking detail đầy đủ
      const bookingDetail = await Booking.getBookingDetail(booking.id);

      return bookingDetail;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Xử lý thanh toán (mô phỏng)
   */
  async processPayment(bookingId, paymentMethod, paymentInfo = {}) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new Error("Không tìm thấy booking");
    }

    if (booking.payment_status !== "pending") {
      throw new Error("Booking đã được xử lý");
    }

    // Kiểm tra hết hạn
    if (await Booking.isExpired(bookingId)) {
      await Booking.cancelBooking(bookingId);
      throw new Error("Booking đã hết hạn thanh toán");
    }

    // Mô phỏng thanh toán (thực tế sẽ gọi API payment gateway)
    const paymentResult = await this.simulatePayment(
      booking,
      paymentMethod,
      paymentInfo
    );

    if (paymentResult.success) {
      await Booking.confirmPayment(bookingId, paymentMethod);
      return {
        success: true,
        message: "Thanh toán thành công",
        transactionId: paymentResult.transactionId,
      };
    } else {
      return {
        success: false,
        message: paymentResult.message,
      };
    }
  }

  /**
   * Mô phỏng thanh toán
   */
  async simulatePayment(booking, paymentMethod, paymentInfo) {
    // Giả lập độ trễ xử lý
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mô phỏng: 95% success rate
    const isSuccess = Math.random() < 0.95;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `TXN${Date.now()}${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`,
      };
    } else {
      return {
        success: false,
        message: "Thanh toán thất bại. Vui lòng thử lại.",
      };
    }
  }

  /**
   * Hủy booking và hoàn tiền (nếu đã thanh toán)
   */
  async cancelAndRefund(bookingId, reason = "") {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new Error("Không tìm thấy booking");
    }

    // Nếu đã thanh toán, xử lý hoàn tiền
    if (booking.payment_status === "paid") {
      // Mô phỏng hoàn tiền
      await Booking.update(bookingId, { payment_status: "refunded" });
    } else {
      await Booking.cancelBooking(bookingId);
    }

    // Hủy tất cả vé
    await Ticket.cancelTicketsByBooking(bookingId);

    return {
      success: true,
      message:
        booking.payment_status === "paid" ? "Đã hoàn tiền" : "Đã hủy booking",
    };
  }

  /**
   * Tự động hủy các booking hết hạn
   */
  async cleanupExpiredBookings() {
    const cancelledCount = await Booking.cancelExpiredBookings();
    const cleanedLocks = await SeatLock.cleanExpiredLocks();

    return {
      cancelledBookings: cancelledCount,
      cleanedLocks,
    };
  }

  /**
   * Kiểm tra và giữ ghế trước khi thanh toán
   */
  async holdSeats(userId, showtimeId, seatIds) {
    // Kiểm tra tất cả ghế
    const unavailable = [];

    for (const seatId of seatIds) {
      const availability = await Seat.isSeatAvailable(
        seatId,
        showtimeId,
        userId
      );
      if (!availability.available) {
        const seat = await Seat.findById(seatId);
        unavailable.push({
          seatId,
          seatName: seat ? `${seat.row_name}${seat.seat_number}` : seatId,
          reason: availability.reason,
        });
      }
    }

    if (unavailable.length > 0) {
      return {
        success: false,
        unavailableSeats: unavailable,
      };
    }

    // Khóa ghế
    const lockDuration = parseInt(process.env.SEAT_LOCK_DURATION) || 10;
    await SeatLock.lockSeats(seatIds, showtimeId, userId, lockDuration);

    return {
      success: true,
      message: `Đã giữ ${seatIds.length} ghế trong ${lockDuration} phút`,
      expiresIn: lockDuration * 60,
    };
  }
}

module.exports = new BookingService();
