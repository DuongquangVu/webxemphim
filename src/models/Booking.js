const { BaseModel } = require("./BaseModel");
const { v4: uuidv4 } = require("uuid");

class Booking extends BaseModel {
  constructor() {
    super("bookings");
  }

  // Tạo mã đặt vé unique
  generateBookingCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK${timestamp}${random}`;
  }

  // Tạo booking mới
  async createBooking(bookingData, expireMinutes = 10) {
    const bookingCode = this.generateBookingCode();
    const expiredAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    return await this.create({
      ...bookingData,
      booking_code: bookingCode,
      expired_at: expiredAt.toISOString().slice(0, 19).replace("T", " "),
    });
  }

  // Lấy booking theo mã
  async getByCode(bookingCode) {
    return await this.findOne({ booking_code: bookingCode });
  }

  // Lấy booking chi tiết
  async getBookingDetail(bookingId) {
    const sql = `
            SELECT b.*, 
                   u.username, u.email, u.full_name, u.phone,
                   s.start_time, s.end_time, s.base_price,
                   m.title as movie_title, m.poster_url, m.duration,
                   r.name as room_name, r.room_type,
                   c.name as cinema_name, c.address as cinema_address
            FROM ${this.tableName} b
            INNER JOIN users u ON b.user_id = u.id
            INNER JOIN showtimes s ON b.showtime_id = s.id
            INNER JOIN movies m ON s.movie_id = m.id
            INNER JOIN rooms r ON s.room_id = r.id
            INNER JOIN cinemas c ON r.cinema_id = c.id
            WHERE b.id = ?
        `;
    const results = await this.query(sql, [bookingId]);
    const booking = results[0];

    if (booking) {
      // Lấy danh sách vé
      const ticketsSql = `
                SELECT t.*, se.row_name, se.seat_number, se.seat_type
                FROM tickets t
                INNER JOIN seats se ON t.seat_id = se.id
                WHERE t.booking_id = ?
            `;
      booking.tickets = await this.query(ticketsSql, [bookingId]);
    }

    return booking || null;
  }

  // Lấy lịch sử đặt vé của user
  async getUserBookings(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const sql = `
            SELECT b.*, 
                   s.start_time,
                   m.title as movie_title, m.poster_url,
                   c.name as cinema_name,
                   r.name as room_name,
                   (SELECT COUNT(*) FROM tickets WHERE booking_id = b.id) as ticket_count
            FROM ${this.tableName} b
            INNER JOIN showtimes s ON b.showtime_id = s.id
            INNER JOIN movies m ON s.movie_id = m.id
            INNER JOIN rooms r ON s.room_id = r.id
            INNER JOIN cinemas c ON r.cinema_id = c.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `;
    const bookings = await this.query(sql, [
      userId,
      limit.toString(),
      offset.toString(),
    ]);

    // Đếm tổng
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE user_id = ?`;
    const countResult = await this.query(countSql, [userId]);

    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  // Hủy booking
  async cancelBooking(bookingId) {
    return await this.update(bookingId, {
      payment_status: "cancelled",
    });
  }

  // Xác nhận thanh toán
  async confirmPayment(bookingId, paymentMethod = "cash") {
    return await this.update(bookingId, {
      payment_status: "paid",
      payment_method: paymentMethod,
    });
  }

  // Kiểm tra booking đã hết hạn chưa
  async isExpired(bookingId) {
    const booking = await this.findById(bookingId);
    if (!booking) return true;
    if (booking.payment_status !== "pending") return false;
    return new Date(booking.expired_at) < new Date();
  }

  // Hủy các booking hết hạn
  async cancelExpiredBookings() {
    const sql = `
            UPDATE ${this.tableName} 
            SET payment_status = 'cancelled'
            WHERE payment_status = 'pending' 
            AND expired_at < NOW()
        `;
    const result = await this.query(sql);
    return result.affectedRows;
  }

  // Thống kê booking theo ngày
  async getBookingStats(startDate, endDate) {
    const sql = `
            SELECT 
                DATE(booking_time) as date,
                COUNT(*) as total_bookings,
                SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_bookings,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue
            FROM ${this.tableName}
            WHERE DATE(booking_time) BETWEEN ? AND ?
            GROUP BY DATE(booking_time)
            ORDER BY date
        `;
    return await this.query(sql, [startDate, endDate]);
  }
}

module.exports = new Booking();
