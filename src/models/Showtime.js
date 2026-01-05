const { BaseModel } = require("./BaseModel");

class Showtime extends BaseModel {
  constructor() {
    super("showtimes");
  }

  // Lấy suất chiếu theo phim
  async getByMovie(movieId, startDate = null, endDate = null) {
    let sql = `SELECT s.*, 
                   r.name as room_name, r.room_type,
                   c.name as cinema_name, c.address as cinema_address
                   FROM ${this.tableName} s
                   INNER JOIN rooms r ON s.room_id = r.id
                   INNER JOIN cinemas c ON r.cinema_id = c.id
                   WHERE s.movie_id = ? AND s.status = 'scheduled'`;
    const params = [movieId];

    if (startDate) {
      sql += ` AND DATE(s.start_time) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND DATE(s.start_time) <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY s.start_time`;
    return await this.query(sql, params);
  }

  // Lấy suất chiếu theo rạp
  async getByCinema(cinemaId, date = null) {
    let sql = `SELECT s.*, 
                   m.id as movie_id, m.title as movie_title, m.poster_url, m.duration, m.genre, m.rating,
                   r.name as room_name, r.room_type
                   FROM ${this.tableName} s
                   INNER JOIN movies m ON s.movie_id = m.id
                   INNER JOIN rooms r ON s.room_id = r.id
                   WHERE r.cinema_id = ? AND s.status = 'scheduled'`;
    const params = [cinemaId];

    if (date) {
      sql += ` AND DATE(s.start_time) = ?`;
      params.push(date);
    }

    sql += ` ORDER BY s.start_time`;
    return await this.query(sql, params);
  }

  // Lấy suất chiếu theo ngày
  async getByDate(date) {
    const sql = `SELECT s.*, 
                     m.title as movie_title, m.poster_url, m.duration,
                     r.name as room_name, r.room_type,
                     c.name as cinema_name
                     FROM ${this.tableName} s
                     INNER JOIN movies m ON s.movie_id = m.id
                     INNER JOIN rooms r ON s.room_id = r.id
                     INNER JOIN cinemas c ON r.cinema_id = c.id
                     WHERE DATE(s.start_time) = ? AND s.status = 'scheduled'
                     ORDER BY s.start_time`;
    return await this.query(sql, [date]);
  }

  // Lấy chi tiết suất chiếu
  async getShowtimeDetail(showtimeId) {
    const sql = `SELECT s.*, 
                     m.id as movie_id, m.title as movie_title, m.poster_url, m.duration, m.genre, m.description, m.rating,
                     r.name as room_name, r.room_type, r.total_seats,
                     c.id as cinema_id, c.name as cinema_name, c.address as cinema_address
                     FROM ${this.tableName} s
                     INNER JOIN movies m ON s.movie_id = m.id
                     INNER JOIN rooms r ON s.room_id = r.id
                     INNER JOIN cinemas c ON r.cinema_id = c.id
                     WHERE s.id = ?`;
    const results = await this.query(sql, [showtimeId]);
    return results[0] || null;
  }

  // Lấy suất chiếu phim tại rạp theo ngày
  async getShowtimesByMovieAndCinema(movieId, cinemaId, date) {
    const sql = `SELECT s.*, 
                     r.name as room_name, r.room_type
                     FROM ${this.tableName} s
                     INNER JOIN rooms r ON s.room_id = r.id
                     WHERE s.movie_id = ? 
                     AND r.cinema_id = ? 
                     AND DATE(s.start_time) = ?
                     AND s.status = 'scheduled'
                     AND s.start_time > NOW()
                     ORDER BY s.start_time`;
    return await this.query(sql, [movieId, cinemaId, date]);
  }

  // Đếm ghế trống của suất chiếu
  async getAvailableSeatsCount(showtimeId) {
    const sql = `
            SELECT 
                r.total_seats,
                r.total_seats - COALESCE(
                    (SELECT COUNT(*) FROM tickets t 
                     INNER JOIN bookings b ON t.booking_id = b.id
                     WHERE b.showtime_id = ? AND b.payment_status IN ('pending', 'paid')), 
                    0
                ) as available_seats
            FROM ${this.tableName} s
            INNER JOIN rooms r ON s.room_id = r.id
            WHERE s.id = ?
        `;
    const results = await this.query(sql, [showtimeId, showtimeId]);
    return results[0] || null;
  }

  // Lấy lịch chiếu theo phim và ngày, nhóm theo rạp
  async getScheduleByMovieDate(movieId, date) {
    const sql = `SELECT s.*, 
                     r.name as room_name, r.room_type,
                     c.id as cinema_id, c.name as cinema_name, c.address as cinema_address
                     FROM ${this.tableName} s
                     INNER JOIN rooms r ON s.room_id = r.id
                     INNER JOIN cinemas c ON r.cinema_id = c.id
                     WHERE s.movie_id = ? 
                     AND DATE(s.start_time) = ?
                     AND s.status = 'scheduled'
                     ORDER BY c.name, s.start_time`;

    const showtimes = await this.query(sql, [movieId, date]);

    // Nhóm theo rạp
    const groupedByCinema = {};
    showtimes.forEach((st) => {
      if (!groupedByCinema[st.cinema_id]) {
        groupedByCinema[st.cinema_id] = {
          cinema_id: st.cinema_id,
          cinema_name: st.cinema_name,
          cinema_address: st.cinema_address,
          showtimes: [],
        };
      }
      groupedByCinema[st.cinema_id].showtimes.push(st);
    });

    return Object.values(groupedByCinema);
  }
}

module.exports = new Showtime();
