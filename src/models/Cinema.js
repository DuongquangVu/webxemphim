const { BaseModel } = require("./BaseModel");

class Cinema extends BaseModel {
  constructor() {
    super("cinemas");
  }

  // Lấy rạp theo thành phố
  async getByCity(city) {
    const sql = `SELECT * FROM ${this.tableName} 
                     WHERE city = ? AND status = 'active'
                     ORDER BY name`;
    return await this.query(sql, [city]);
  }

  // Lấy rạp với số phòng chiếu và tổng số ghế
  async getCinemaWithRoomCount() {
    const sql = `SELECT c.*, 
                     COUNT(DISTINCT r.id) as room_count,
                     COALESCE(SUM(r.total_seats), 0) as total_seats
                     FROM ${this.tableName} c
                     LEFT JOIN rooms r ON c.id = r.cinema_id
                     WHERE c.status = 'active'
                     GROUP BY c.id
                     ORDER BY c.name`;
    return await this.query(sql);
  }

  // Lấy rạp có suất chiếu của phim
  async getCinemasShowingMovie(movieId, date) {
    const sql = `SELECT DISTINCT c.* FROM ${this.tableName} c
                     INNER JOIN rooms r ON c.id = r.cinema_id
                     INNER JOIN showtimes s ON r.id = s.room_id
                     WHERE s.movie_id = ? 
                     AND DATE(s.start_time) = ? 
                     AND s.status = 'scheduled'
                     AND c.status = 'active'
                     ORDER BY c.name`;
    return await this.query(sql, [movieId, date]);
  }

  // Lấy danh sách thành phố có rạp với số lượng
  async getCities() {
    const sql = `SELECT city, COUNT(*) as cinema_count 
                     FROM ${this.tableName} 
                     WHERE status = 'active' 
                     GROUP BY city
                     ORDER BY city`;
    return await this.query(sql);
  }

  // Lấy rạp với tất cả phòng chiếu
  async getCinemaWithRooms(cinemaId) {
    const cinema = await this.findById(cinemaId);
    if (!cinema) return null;

    const roomsSql = `SELECT * FROM rooms WHERE cinema_id = ? ORDER BY name`;
    const rooms = await this.query(roomsSql, [cinemaId]);

    return { ...cinema, rooms };
  }
}

module.exports = new Cinema();
