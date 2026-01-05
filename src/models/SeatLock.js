const { BaseModel } = require("./BaseModel");

class SeatLock extends BaseModel {
  constructor() {
    super("seat_locks");
  }

  // Khóa ghế tạm thời
  async lockSeat(seatId, showtimeId, userId, durationMinutes = 10) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Xóa lock cũ nếu có
    await this.query(
      "DELETE FROM seat_locks WHERE seat_id = ? AND showtime_id = ?",
      [seatId, showtimeId]
    );

    return await this.create({
      seat_id: seatId,
      showtime_id: showtimeId,
      user_id: userId,
      expires_at: expiresAt.toISOString().slice(0, 19).replace("T", " "),
    });
  }

  // Khóa nhiều ghế
  async lockSeats(seatIds, showtimeId, userId, durationMinutes = 10) {
    const locks = [];
    for (const seatId of seatIds) {
      const lock = await this.lockSeat(
        seatId,
        showtimeId,
        userId,
        durationMinutes
      );
      locks.push(lock);
    }
    return locks;
  }

  // Mở khóa ghế
  async unlockSeat(seatId, showtimeId, userId = null) {
    let sql = "DELETE FROM seat_locks WHERE seat_id = ? AND showtime_id = ?";
    const params = [seatId, showtimeId];

    if (userId) {
      sql += " AND user_id = ?";
      params.push(userId);
    }

    await this.query(sql, params);
  }

  // Mở khóa nhiều ghế
  async unlockSeats(seatIds, showtimeId, userId = null) {
    for (const seatId of seatIds) {
      await this.unlockSeat(seatId, showtimeId, userId);
    }
  }

  // Mở khóa tất cả ghế của user cho suất chiếu
  async unlockAllByUser(showtimeId, userId) {
    const sql = "DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ?";
    await this.query(sql, [showtimeId, userId]);
  }

  // Kiểm tra ghế đang bị khóa
  async isLocked(seatId, showtimeId) {
    const sql = `SELECT * FROM seat_locks 
                     WHERE seat_id = ? AND showtime_id = ? AND expires_at > NOW()`;
    const results = await this.query(sql, [seatId, showtimeId]);
    return results.length > 0 ? results[0] : null;
  }

  // Lấy ghế đang khóa của user
  async getUserLockedSeats(showtimeId, userId) {
    const sql = `SELECT sl.*, s.row_name, s.seat_number, s.seat_type
                     FROM seat_locks sl
                     INNER JOIN seats s ON sl.seat_id = s.id
                     WHERE sl.showtime_id = ? AND sl.user_id = ? AND sl.expires_at > NOW()`;
    return await this.query(sql, [showtimeId, userId]);
  }

  // Gia hạn khóa ghế
  async extendLock(seatId, showtimeId, userId, additionalMinutes = 5) {
    const sql = `UPDATE seat_locks 
                     SET expires_at = DATE_ADD(expires_at, INTERVAL ? MINUTE)
                     WHERE seat_id = ? AND showtime_id = ? AND user_id = ? AND expires_at > NOW()`;
    await this.query(sql, [additionalMinutes, seatId, showtimeId, userId]);
  }

  // Xóa các lock đã hết hạn
  async cleanExpiredLocks() {
    const sql = "DELETE FROM seat_locks WHERE expires_at < NOW()";
    const result = await this.query(sql);
    return result.affectedRows;
  }

  // Kiểm tra nhiều ghế có thể lock được không
  async canLockSeats(seatIds, showtimeId, userId) {
    const unavailable = [];

    for (const seatId of seatIds) {
      const lock = await this.isLocked(seatId, showtimeId);
      if (lock && lock.user_id !== userId) {
        unavailable.push(seatId);
      }
    }

    return {
      canLock: unavailable.length === 0,
      unavailableSeats: unavailable,
    };
  }
}

module.exports = new SeatLock();
