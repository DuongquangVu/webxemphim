const { Booking, Ticket, Seat, Showtime, SeatLock } = require("../models");
const BookingService = require("../services/bookingService");

class BookingController {
  // Tạo booking mới (luồng đặt vé)
  async createBooking(req, res) {
    try {
      const { showtimeId, seatIds, paymentMethod = "cash" } = req.body;
      const userId = req.user.id;

      // Validate input
      if (
        !showtimeId ||
        !seatIds ||
        !Array.isArray(seatIds) ||
        seatIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn suất chiếu và ghế",
        });
      }

      // Kiểm tra suất chiếu
      const showtime = await Showtime.getShowtimeDetail(showtimeId);
      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }

      // Kiểm tra suất chiếu đã qua chưa
      if (new Date(showtime.start_time) < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Suất chiếu này đã bắt đầu",
        });
      }

      // Kiểm tra tất cả ghế có thể đặt không
      const unavailableSeats = [];
      for (const seatId of seatIds) {
        const availability = await Seat.isSeatAvailable(
          seatId,
          showtimeId,
          userId
        );
        if (!availability.available) {
          unavailableSeats.push({ seatId, reason: availability.reason });
        }
      }

      if (unavailableSeats.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Một số ghế không thể đặt",
          unavailableSeats,
        });
      }

      // Sử dụng BookingService để tạo booking
      const result = await BookingService.createBooking(
        userId,
        showtimeId,
        seatIds,
        paymentMethod
      );

      // Thông báo tùy theo phương thức thanh toán
      const message =
        paymentMethod === "cash"
          ? "Đặt vé thành công. Vui lòng thanh toán tại quầy trong 30 phút."
          : "Đặt vé thành công. Vui lòng thanh toán trong 10 phút.";

      res.status(201).json({
        success: true,
        message: message,
        data: result,
      });
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi server",
      });
    }
  }

  // Lấy chi tiết booking
  async getBookingDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const booking = await Booking.getBookingDetail(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy booking",
        });
      }

      // Kiểm tra quyền truy cập (user chỉ xem được booking của mình)
      if (req.user.role !== "admin" && booking.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      console.error("Get booking detail error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy booking theo mã
  async getByCode(req, res) {
    try {
      const { code } = req.params;
      const booking = await Booking.getByCode(code);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy booking",
        });
      }

      // Lấy chi tiết đầy đủ
      const bookingDetail = await Booking.getBookingDetail(booking.id);

      res.json({
        success: true,
        data: bookingDetail,
      });
    } catch (error) {
      console.error("Get booking by code error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy lịch sử đặt vé của user
  async getUserBookings(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await Booking.getUserBookings(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Get user bookings error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Hủy booking
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy booking",
        });
      }

      // Kiểm tra quyền
      if (req.user.role !== "admin" && booking.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền hủy booking này",
        });
      }

      // Chỉ hủy được booking pending
      if (booking.payment_status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể hủy booking chưa thanh toán",
        });
      }

      // Hủy booking và vé
      await Booking.cancelBooking(id);
      await Ticket.cancelTicketsByBooking(id);

      res.json({
        success: true,
        message: "Đã hủy booking",
      });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Xác nhận thanh toán (mô phỏng)
  async confirmPayment(req, res) {
    try {
      const { id } = req.params;
      const { paymentMethod = "cash" } = req.body;
      const userId = req.user.id;

      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy booking",
        });
      }

      // Kiểm tra quyền
      if (req.user.role !== "admin" && booking.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      // Kiểm tra trạng thái
      if (booking.payment_status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Không thể thanh toán. Trạng thái hiện tại: ${booking.payment_status}`,
        });
      }

      // Kiểm tra hết hạn
      if (await Booking.isExpired(id)) {
        await Booking.cancelBooking(id);
        return res.status(400).json({
          success: false,
          message: "Booking đã hết hạn thanh toán",
        });
      }

      // Xác nhận thanh toán
      await Booking.confirmPayment(id, paymentMethod);

      // Mở khóa ghế
      await SeatLock.unlockAllByUser(booking.showtime_id, userId);

      // Lấy booking detail đầy đủ
      const bookingDetail = await Booking.getBookingDetail(id);

      res.json({
        success: true,
        message: "Thanh toán thành công",
        data: bookingDetail,
      });
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Validate vé (cho nhân viên rạp)
  async validateTicket(req, res) {
    try {
      const { ticketCode } = req.params;
      const result = await Ticket.validateTicket(ticketCode);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: "Vé hợp lệ",
        data: result.ticket,
      });
    } catch (error) {
      console.error("Validate ticket error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Đánh dấu vé đã sử dụng
  async useTicket(req, res) {
    try {
      const { ticketCode } = req.params;

      const ticket = await Ticket.getByCode(ticketCode);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy vé",
        });
      }

      if (ticket.status === "used") {
        return res.status(400).json({
          success: false,
          message: "Vé đã được sử dụng",
        });
      }

      await Ticket.markAsUsed(ticket.id);

      res.json({
        success: true,
        message: "Đã xác nhận vé",
      });
    } catch (error) {
      console.error("Use ticket error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
}

module.exports = new BookingController();
