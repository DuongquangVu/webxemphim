const { Showtime, Cinema, Room, Seat, SeatLock } = require("../models");

class ShowtimeController {
  // Lấy lịch chiếu theo phim
  async getByMovie(req, res) {
    try {
      const { movieId } = req.params;
      const { date } = req.query;

      // Nếu có ngày, lấy lịch chiếu nhóm theo rạp
      if (date) {
        const schedule = await Showtime.getScheduleByMovieDate(movieId, date);
        return res.json({
          success: true,
          data: schedule,
          date,
        });
      }

      // Không có ngày, lấy tất cả từ hôm nay
      const today = new Date().toISOString().split("T")[0];
      const showtimes = await Showtime.getByMovie(movieId, today);

      res.json({
        success: true,
        data: showtimes,
      });
    } catch (error) {
      console.error("Get showtimes by movie error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy lịch chiếu theo rạp
  async getByCinema(req, res) {
    try {
      const { cinemaId } = req.params;
      const { date } = req.query;

      const showtimes = await Showtime.getByCinema(cinemaId, date || null);

      res.json({
        success: true,
        data: showtimes,
        date,
      });
    } catch (error) {
      console.error("Get showtimes by cinema error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy lịch chiếu theo ngày
  async getByDate(req, res) {
    try {
      const { date } = req.params;
      const showtimes = await Showtime.getByDate(date);

      res.json({
        success: true,
        data: showtimes,
        date,
      });
    } catch (error) {
      console.error("Get showtimes by date error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy chi tiết suất chiếu
  async getShowtimeDetail(req, res) {
    try {
      const { id } = req.params;
      const showtime = await Showtime.getShowtimeDetail(id);

      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }

      // Lấy số ghế trống
      const seatsInfo = await Showtime.getAvailableSeatsCount(id);

      res.json({
        success: true,
        showtime: {
          id: showtime.id,
          cinema_name: showtime.cinema_name,
          room_name: showtime.room_name,
          room_type: showtime.room_type,
          start_time: showtime.start_time,
          end_time: showtime.end_time,
          base_price: showtime.base_price,
          status: showtime.status,
          available_seats: seatsInfo?.available_seats || 0,
          total_seats: seatsInfo?.total_seats || 0,
        },
        movie: {
          id: showtime.movie_id,
          title: showtime.movie_title,
          poster_url: showtime.poster_url,
          duration: showtime.duration,
          rating: showtime.rating,
          genre: showtime.genre,
        },
      });
    } catch (error) {
      console.error("Get showtime detail error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy sơ đồ ghế của suất chiếu
  async getSeats(req, res) {
    try {
      const { id } = req.params;
      const showtime = await Showtime.getShowtimeDetail(id);

      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }

      // Lấy ghế với trạng thái booking
      const seats = await Seat.getSeatsWithBookingStatus(showtime.room_id, id);

      // Thống kê
      const stats = {
        total: seats.length,
        available: seats.filter((s) => s.booking_status === "available").length,
        booked: seats.filter((s) => s.booking_status === "booked").length,
        locked: seats.filter((s) => s.booking_status === "locked").length,
      };

      res.json({
        success: true,
        seats: seats,
        stats,
        showtime: {
          id: showtime.id,
          movie_title: showtime.movie_title,
          cinema_name: showtime.cinema_name,
          room_name: showtime.room_name,
          room_type: showtime.room_type,
          start_time: showtime.start_time,
          base_price: showtime.base_price,
        },
      });
    } catch (error) {
      console.error("Get showtime seats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Khóa ghế tạm thời
  async lockSeats(req, res) {
    try {
      const { id } = req.params; // showtime id
      const { seatIds } = req.body;
      const userId = req.user.id;

      if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn ít nhất một ghế",
        });
      }

      // Kiểm tra suất chiếu
      const showtime = await Showtime.getShowtimeDetail(id);
      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }

      // Kiểm tra tất cả ghế có thể đặt không
      const unavailableSeats = [];
      for (const seatId of seatIds) {
        const availability = await Seat.isSeatAvailable(seatId, id, userId);
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

      // Khóa ghế
      const lockDuration = parseInt(process.env.SEAT_LOCK_DURATION) || 10;
      await SeatLock.lockSeats(seatIds, id, userId, lockDuration);

      // Lấy thông tin ghế đã khóa
      const lockedSeats = await SeatLock.getUserLockedSeats(id, userId);

      res.json({
        success: true,
        message: `Đã giữ ${seatIds.length} ghế trong ${lockDuration} phút`,
        data: {
          lockedSeats,
          expiresIn: lockDuration * 60, // seconds
        },
      });
    } catch (error) {
      console.error("Lock seats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Mở khóa ghế
  async unlockSeats(req, res) {
    try {
      const { id } = req.params;
      const { seatIds } = req.body;
      const userId = req.user.id;

      if (seatIds && Array.isArray(seatIds)) {
        await SeatLock.unlockSeats(seatIds, id, userId);
      } else {
        await SeatLock.unlockAllByUser(id, userId);
      }

      res.json({
        success: true,
        message: "Đã hủy giữ ghế",
      });
    } catch (error) {
      console.error("Unlock seats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy rạp chiếu phim theo ngày
  async getCinemasShowingMovie(req, res) {
    try {
      const { movieId } = req.params;
      const { date } = req.query;

      const targetDate = date || new Date().toISOString().split("T")[0];
      const cinemas = await Cinema.getCinemasShowingMovie(movieId, targetDate);

      res.json({
        success: true,
        data: cinemas,
        date: targetDate,
      });
    } catch (error) {
      console.error("Get cinemas showing movie error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
}

module.exports = new ShowtimeController();
