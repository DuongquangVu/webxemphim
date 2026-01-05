const { BaseModel } = require("./BaseModel");

class Seat extends BaseModel {
  constructor() {
    super("seats");
  }

  // Lấy ghế theo phòng
  async getByRoom(roomId) {
    const sql = `SELECT * FROM ${this.tableName} 
                     WHERE room_id = ? 
                     ORDER BY row_name, seat_number`;
    return await this.query(sql, [roomId]);
  }

  // Lấy ghế với trạng thái đặt cho suất chiếu
  async getSeatsWithBookingStatus(roomId, showtimeId) {
    const sql = `
            SELECT s.*, 
                   CASE 
                       WHEN t.id IS NOT NULL THEN 'booked'
                       WHEN sl.id IS NOT NULL AND sl.expires_at > NOW() THEN 'locked'
                       ELSE 'available'
                   END as booking_status,
                   sl.user_id as locked_by,
                   sl.expires_at as lock_expires_at
            FROM ${this.tableName} s
            LEFT JOIN tickets t ON s.id = t.seat_id 
                AND t.booking_id IN (
                    SELECT id FROM bookings 
                    WHERE showtime_id = ? AND payment_status IN ('pending', 'paid')
                )
            LEFT JOIN seat_locks sl ON s.id = sl.seat_id 
                AND sl.showtime_id = ? 
                AND sl.expires_at > NOW()
            WHERE s.room_id = ? AND s.status = 'active'
            ORDER BY s.row_name, s.seat_number
        `;
    return await this.query(sql, [showtimeId, showtimeId, roomId]);
  }

  // Lấy ghế theo ID với check booking status
  async getSeatWithStatus(seatId, showtimeId) {
    const sql = `
            SELECT s.*, 
                   CASE 
                       WHEN t.id IS NOT NULL THEN 'booked'
                       WHEN sl.id IS NOT NULL AND sl.expires_at > NOW() THEN 'locked'
                       ELSE 'available'
                   END as booking_status
            FROM ${this.tableName} s
            LEFT JOIN tickets t ON s.id = t.seat_id 
                AND t.booking_id IN (
                    SELECT id FROM bookings 
                    WHERE showtime_id = ? AND payment_status IN ('pending', 'paid')
                )
            LEFT JOIN seat_locks sl ON s.id = sl.seat_id 
                AND sl.showtime_id = ? 
                AND sl.expires_at > NOW()
            WHERE s.id = ?
        `;
    const results = await this.query(sql, [showtimeId, showtimeId, seatId]);
    return results[0] || null;
  }

  // Kiểm tra ghế có thể đặt được không
  async isSeatAvailable(seatId, showtimeId, userId = null) {
    const seat = await this.getSeatWithStatus(seatId, showtimeId);
    if (!seat) return { available: false, reason: "Ghế không tồn tại" };
    if (seat.status !== "active")
      return { available: false, reason: "Ghế không hoạt động" };
    if (seat.booking_status === "booked")
      return { available: false, reason: "Ghế đã được đặt" };
    if (seat.booking_status === "locked" && seat.locked_by !== userId) {
      return { available: false, reason: "Ghế đang được người khác giữ" };
    }
    return { available: true };
  }

  // Đếm ghế trống của suất chiếu
  async countAvailableSeats(roomId, showtimeId) {
    const sql = `
            SELECT COUNT(*) as count FROM ${this.tableName} s
            WHERE s.room_id = ? 
            AND s.status = 'active'
            AND s.id NOT IN (
                SELECT seat_id FROM tickets 
                WHERE booking_id IN (
                    SELECT id FROM bookings 
                    WHERE showtime_id = ? AND payment_status IN ('pending', 'paid')
                )
            )
        `;
    const results = await this.query(sql, [roomId, showtimeId]);
    return results[0].count;
  }

  // Lấy nhiều ghế theo danh sách ID
  async getSeatsById(seatIds) {
    if (!seatIds || seatIds.length === 0) return [];
    const placeholders = seatIds.map(() => "?").join(",");
    const sql = `SELECT * FROM ${this.tableName} WHERE id IN (${placeholders})`;
    return await this.query(sql, seatIds);
  }
}

module.exports = new Seat();
