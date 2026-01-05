const {
  Movie,
  Cinema,
  Room,
  Seat,
  Showtime,
  Booking,
  User,
} = require("../models");
const { pool } = require("../models/BaseModel");

class AdminController {
  // ==================== QUẢN LÝ PHIM ====================

  // Thêm phim mới
  async createMovie(req, res) {
    try {
      const movieData = req.body;

      if (!movieData.title || !movieData.duration) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập tiêu đề và thời lượng phim",
        });
      }

      const movie = await Movie.create(movieData);

      res.status(201).json({
        success: true,
        message: "Thêm phim thành công",
        data: movie,
      });
    } catch (error) {
      console.error("Create movie error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Cập nhật phim
  async updateMovie(req, res) {
    try {
      const { id } = req.params;
      const movieData = req.body;

      const movie = await Movie.findById(id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phim",
        });
      }

      const updatedMovie = await Movie.update(id, movieData);

      res.json({
        success: true,
        message: "Cập nhật phim thành công",
        data: updatedMovie,
      });
    } catch (error) {
      console.error("Update movie error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Xóa phim
  async deleteMovie(req, res) {
    try {
      const { id } = req.params;

      const movie = await Movie.findById(id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phim",
        });
      }

      await Movie.delete(id);

      res.json({
        success: true,
        message: "Xóa phim thành công",
      });
    } catch (error) {
      console.error("Delete movie error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // ==================== QUẢN LÝ RẠP ====================

  // Thêm rạp mới
  async createCinema(req, res) {
    try {
      const cinemaData = req.body;

      if (!cinemaData.name || !cinemaData.address) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập tên và địa chỉ rạp",
        });
      }

      const cinema = await Cinema.create(cinemaData);

      res.status(201).json({
        success: true,
        message: "Thêm rạp thành công",
        data: cinema,
      });
    } catch (error) {
      console.error("Create cinema error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Cập nhật rạp
  async updateCinema(req, res) {
    try {
      const { id } = req.params;
      const cinemaData = req.body;

      const cinema = await Cinema.findById(id);
      if (!cinema) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy rạp",
        });
      }

      const updatedCinema = await Cinema.update(id, cinemaData);

      res.json({
        success: true,
        message: "Cập nhật rạp thành công",
        data: updatedCinema,
      });
    } catch (error) {
      console.error("Update cinema error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Xóa rạp
  async deleteCinema(req, res) {
    try {
      const { id } = req.params;

      const cinema = await Cinema.findById(id);
      if (!cinema) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy rạp",
        });
      }

      await Cinema.delete(id);

      res.json({
        success: true,
        message: "Xóa rạp thành công",
      });
    } catch (error) {
      console.error("Delete cinema error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // ==================== QUẢN LÝ PHÒNG ====================

  // Thêm phòng mới
  async createRoom(req, res) {
    try {
      const { cinema_id, name, room_type, rows, columns } = req.body;

      if (!cinema_id || !name || !rows || !columns) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đầy đủ thông tin phòng",
        });
      }

      // Kiểm tra rạp tồn tại
      const cinema = await Cinema.findById(cinema_id);
      if (!cinema) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy rạp",
        });
      }

      // Tạo phòng với ghế
      const room = await Room.createRoomWithSeats(
        { cinema_id, name, room_type: room_type || "2D" },
        parseInt(rows),
        parseInt(columns)
      );

      res.status(201).json({
        success: true,
        message: "Thêm phòng thành công",
        data: room,
      });
    } catch (error) {
      console.error("Create room error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Cập nhật phòng
  async updateRoom(req, res) {
    try {
      const { id } = req.params;
      const roomData = req.body;

      const room = await Room.findById(id);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phòng",
        });
      }

      const updatedRoom = await Room.update(id, roomData);

      res.json({
        success: true,
        message: "Cập nhật phòng thành công",
        data: updatedRoom,
      });
    } catch (error) {
      console.error("Update room error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Xóa phòng
  async deleteRoom(req, res) {
    try {
      const { id } = req.params;

      const room = await Room.findById(id);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phòng",
        });
      }

      await Room.delete(id);

      res.json({
        success: true,
        message: "Xóa phòng thành công",
      });
    } catch (error) {
      console.error("Delete room error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy tất cả phòng
  async getAllRooms(req, res) {
    try {
      const { cinema_id } = req.query;
      const rooms = await Room.getAllWithCinema(cinema_id || null);

      res.json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      console.error("Get all rooms error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy phòng theo ID
  async getRoomById(req, res) {
    try {
      const { id } = req.params;
      const room = await Room.getRoomWithCinema(id);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phòng",
        });
      }

      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      console.error("Get room by id error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy danh sách phòng của rạp
  async getRoomsByCinema(req, res) {
    try {
      const { cinemaId } = req.params;
      const rooms = await Room.getByCinema(cinemaId);

      res.json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      console.error("Get rooms by cinema error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // ==================== QUẢN LÝ GHẾ ====================

  // Cập nhật ghế
  async updateSeat(req, res) {
    try {
      const { id } = req.params;
      const seatData = req.body;

      const seat = await Seat.findById(id);
      if (!seat) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy ghế",
        });
      }

      const updatedSeat = await Seat.update(id, seatData);

      res.json({
        success: true,
        message: "Cập nhật ghế thành công",
        data: updatedSeat,
      });
    } catch (error) {
      console.error("Update seat error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy danh sách ghế của phòng
  async getSeatsByRoom(req, res) {
    try {
      const { roomId } = req.params;
      const room = await Room.getRoomWithSeats(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phòng",
        });
      }

      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      console.error("Get seats by room error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // ==================== QUẢN LÝ SUẤT CHIẾU ====================

  // Thêm suất chiếu
  async createShowtime(req, res) {
    try {
      const { movie_id, room_id, start_time, base_price } = req.body;

      if (!movie_id || !room_id || !start_time || !base_price) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đầy đủ thông tin suất chiếu",
        });
      }

      // Kiểm tra phim
      const movie = await Movie.findById(movie_id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phim",
        });
      }

      // Kiểm tra phòng
      const room = await Room.findById(room_id);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phòng",
        });
      }

      // Tính end_time dựa trên duration của phim (+ 15 phút quảng cáo)
      const startDate = new Date(start_time);
      const endDate = new Date(
        startDate.getTime() + (movie.duration + 15) * 60 * 1000
      );

      // Kiểm tra phòng có trống không
      const isAvailable = await Room.isRoomAvailable(
        room_id,
        startDate,
        endDate
      );
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Phòng đã có suất chiếu trong khoảng thời gian này",
        });
      }

      const showtime = await Showtime.create({
        movie_id,
        room_id,
        start_time: startDate.toISOString().slice(0, 19).replace("T", " "),
        end_time: endDate.toISOString().slice(0, 19).replace("T", " "),
        base_price,
        status: "scheduled",
      });

      res.status(201).json({
        success: true,
        message: "Thêm suất chiếu thành công",
        data: showtime,
      });
    } catch (error) {
      console.error("Create showtime error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Cập nhật suất chiếu
  async updateShowtime(req, res) {
    try {
      const { id } = req.params;
      const showtimeData = req.body;

      const showtime = await Showtime.findById(id);
      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }

      const updatedShowtime = await Showtime.update(id, showtimeData);

      res.json({
        success: true,
        message: "Cập nhật suất chiếu thành công",
        data: updatedShowtime,
      });
    } catch (error) {
      console.error("Update showtime error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Hủy suất chiếu
  async cancelShowtime(req, res) {
    try {
      const { id } = req.params;

      const showtime = await Showtime.findById(id);
      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }

      await Showtime.update(id, { status: "cancelled" });

      res.json({
        success: true,
        message: "Đã hủy suất chiếu",
      });
    } catch (error) {
      console.error("Cancel showtime error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Xóa suất chiếu
  async deleteShowtime(req, res) {
    try {
      const { id } = req.params;

      const showtime = await Showtime.findById(id);
      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy suất chiếu",
        });
      }

      // Kiểm tra có booking nào không
      const bookings = await pool.query(
        "SELECT COUNT(*) as count FROM bookings WHERE showtime_id = ? AND status != 'cancelled'",
        [id]
      );

      if (bookings[0][0].count > 0) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa suất chiếu đã có người đặt vé",
        });
      }

      await Showtime.delete(id);

      res.json({
        success: true,
        message: "Xóa suất chiếu thành công",
      });
    } catch (error) {
      console.error("Delete showtime error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy tất cả suất chiếu (admin)
  async getAllShowtimes(req, res) {
    try {
      const { date, movie_id, cinema_id, page = 1, limit = 20 } = req.query;

      let sql = `SELECT s.*, 
                       m.title as movie_title,
                       r.name as room_name, r.room_type,
                       c.name as cinema_name
                       FROM showtimes s
                       INNER JOIN movies m ON s.movie_id = m.id
                       INNER JOIN rooms r ON s.room_id = r.id
                       INNER JOIN cinemas c ON r.cinema_id = c.id
                       WHERE 1=1`;
      const params = [];

      if (date) {
        sql += ` AND DATE(s.start_time) = ?`;
        params.push(date);
      }

      if (movie_id) {
        sql += ` AND s.movie_id = ?`;
        params.push(movie_id);
      }

      if (cinema_id) {
        sql += ` AND r.cinema_id = ?`;
        params.push(cinema_id);
      }

      sql += ` ORDER BY s.start_time DESC`;

      const [rows] = await pool.execute(sql, params);

      res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error("Get all showtimes error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // ==================== THỐNG KÊ DOANH THU ====================

  // Thống kê tổng quan
  async getDashboardStats(req, res) {
    try {
      // Đặt vé hôm nay
      const [todayBookings] = await pool.execute(`
                SELECT COUNT(*) as total FROM bookings 
                WHERE DATE(booking_time) = CURDATE()
            `);

      // Doanh thu hôm nay
      const [todayRevenue] = await pool.execute(`
                SELECT COALESCE(SUM(total_amount), 0) as revenue
                FROM bookings 
                WHERE payment_status = 'paid' AND DATE(booking_time) = CURDATE()
            `);

      // Số phim đang chiếu
      const [movieCount] = await pool.execute(`
                SELECT COUNT(*) as total FROM movies WHERE status = 'now_showing'
            `);

      // Số user
      const [userCount] = await pool.execute(`
                SELECT COUNT(*) as total FROM users WHERE role = 'user'
            `);

      // Đặt vé gần đây
      const [recentBookings] = await pool.execute(`
                SELECT b.id, b.booking_code, b.total_amount, b.payment_status as status, b.booking_time,
                       u.full_name as user_name, m.title as movie_title,
                       s.start_time as showtime
                FROM bookings b
                LEFT JOIN users u ON b.user_id = u.id
                LEFT JOIN showtimes s ON b.showtime_id = s.id
                LEFT JOIN movies m ON s.movie_id = m.id
                ORDER BY b.booking_time DESC
                LIMIT 10
            `);

      res.json({
        success: true,
        today_bookings: todayBookings[0].total,
        today_revenue: todayRevenue[0].revenue,
        total_movies: movieCount[0].total,
        total_users: userCount[0].total,
        recent_bookings: recentBookings,
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Thống kê doanh thu theo ngày
  async getRevenueByDate(req, res) {
    try {
      const { days = 30 } = req.query;
      const numDays = parseInt(days) || 30;

      // Lấy doanh thu theo ngày trong N ngày qua
      const [results] = await pool.execute(
        `
        SELECT 
          DATE(booking_time) as date,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings 
        WHERE payment_status = 'paid' 
          AND booking_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(booking_time)
        ORDER BY date ASC
      `,
        [numDays]
      );

      // Tạo mảng labels và data cho chart
      const labels = [];
      const data = [];

      for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const label = date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });

        labels.push(label);

        const found = results.find(
          (r) => r.date && r.date.toISOString().split("T")[0] === dateStr
        );
        data.push(found ? Number(found.revenue) : 0);
      }

      res.json({
        success: true,
        labels,
        data,
      });
    } catch (error) {
      console.error("Get revenue by date error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Thống kê doanh thu theo phim
  async getRevenueByMovie(req, res) {
    try {
      const { startDate, endDate } = req.query;

      let sql = `
                SELECT m.id, m.title, m.poster_url,
                       COUNT(DISTINCT b.id) as booking_count,
                       COUNT(t.id) as ticket_count,
                       COALESCE(SUM(b.total_amount), 0) as revenue
                FROM movies m
                LEFT JOIN showtimes s ON m.id = s.movie_id
                LEFT JOIN bookings b ON s.id = b.showtime_id AND b.payment_status = 'paid'
                LEFT JOIN tickets t ON b.id = t.booking_id
            `;
      const params = [];

      if (startDate && endDate) {
        sql += ` WHERE DATE(b.booking_time) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }

      sql += ` GROUP BY m.id ORDER BY revenue DESC`;

      const [rows] = await pool.execute(sql, params);

      res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error("Get revenue by movie error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Thống kê doanh thu theo rạp
  async getRevenueByCinema(req, res) {
    try {
      const { startDate, endDate } = req.query;

      let sql = `
                SELECT c.id, c.name, c.address,
                       COUNT(DISTINCT b.id) as booking_count,
                       COUNT(t.id) as ticket_count,
                       COALESCE(SUM(b.total_amount), 0) as revenue
                FROM cinemas c
                LEFT JOIN rooms r ON c.id = r.cinema_id
                LEFT JOIN showtimes s ON r.id = s.room_id
                LEFT JOIN bookings b ON s.id = b.showtime_id AND b.payment_status = 'paid'
                LEFT JOIN tickets t ON b.id = t.booking_id
            `;
      const params = [];

      if (startDate && endDate) {
        sql += ` WHERE DATE(b.booking_time) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }

      sql += ` GROUP BY c.id ORDER BY revenue DESC`;

      const [rows] = await pool.execute(sql, params);

      res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error("Get revenue by cinema error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // ==================== QUẢN LÝ USER ====================

  // Lấy danh sách user
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const users = await User.getAllUsers(parseInt(page), parseInt(limit));

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy tất cả bookings (admin)
  async getAllBookings(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;

      let sql = `
                SELECT b.*, 
                       b.payment_status as status,
                       u.username, u.email, u.full_name as user_name,
                       s.start_time,
                       m.title as movie_title,
                       c.name as cinema_name
                FROM bookings b
                INNER JOIN users u ON b.user_id = u.id
                INNER JOIN showtimes s ON b.showtime_id = s.id
                INNER JOIN movies m ON s.movie_id = m.id
                INNER JOIN rooms r ON s.room_id = r.id
                INNER JOIN cinemas c ON r.cinema_id = c.id
            `;
      const params = [];

      if (status) {
        sql += ` WHERE b.payment_status = ?`;
        params.push(status);
      }

      sql += ` ORDER BY b.created_at DESC`;

      const [rows] = await pool.execute(sql, params);

      res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error("Get all bookings error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Xác nhận thanh toán booking (admin)
  async confirmBookingPayment(req, res) {
    try {
      const { id } = req.params;
      const { payment_method = "cash" } = req.body;

      // Kiểm tra booking tồn tại
      const [bookings] = await pool.execute(
        "SELECT * FROM bookings WHERE id = ?",
        [id]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn đặt vé",
        });
      }

      const booking = bookings[0];

      // Kiểm tra trạng thái
      if (booking.payment_status === "paid") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt vé này đã được thanh toán",
        });
      }

      if (booking.payment_status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Không thể xác nhận đơn đã bị hủy",
        });
      }

      // Cập nhật trạng thái thanh toán
      await pool.execute(
        "UPDATE bookings SET payment_status = 'paid', payment_method = ? WHERE id = ?",
        [payment_method, id]
      );

      res.json({
        success: true,
        message: "Xác nhận thanh toán thành công",
        data: {
          booking_id: id,
          booking_code: booking.booking_code,
          payment_status: "paid",
          payment_method: payment_method,
        },
      });
    } catch (error) {
      console.error("Confirm booking payment error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Hủy booking (admin)
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;

      // Kiểm tra booking tồn tại
      const [bookings] = await pool.execute(
        "SELECT * FROM bookings WHERE id = ?",
        [id]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn đặt vé",
        });
      }

      const booking = bookings[0];

      if (booking.payment_status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt vé này đã bị hủy",
        });
      }

      // Cập nhật trạng thái
      await pool.execute(
        "UPDATE bookings SET payment_status = 'cancelled' WHERE id = ?",
        [id]
      );

      res.json({
        success: true,
        message: "Hủy đơn đặt vé thành công",
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
}

module.exports = new AdminController();
