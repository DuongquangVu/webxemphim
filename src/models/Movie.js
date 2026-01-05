const { BaseModel } = require("./BaseModel");

class Movie extends BaseModel {
  constructor() {
    super("movies");
  }

  // Lấy phim đang chiếu
  async getNowShowing(limit = 10) {
    const sql = `SELECT * FROM ${this.tableName} 
                     WHERE status = 'now_showing' 
                     ORDER BY release_date DESC 
                     LIMIT ?`;
    return await this.query(sql, [limit.toString()]);
  }

  // Lấy phim sắp chiếu
  async getComingSoon(limit = 10) {
    const sql = `SELECT * FROM ${this.tableName} 
                     WHERE status = 'coming_soon' 
                     ORDER BY release_date ASC 
                     LIMIT ?`;
    return await this.query(sql, [limit.toString()]);
  }

  // Tìm kiếm phim
  async search(keyword, limit = 10) {
    const sql = `SELECT * FROM ${this.tableName} 
                     WHERE title LIKE ? OR genre LIKE ? OR director LIKE ?
                     ORDER BY release_date DESC 
                     LIMIT ?`;
    const searchTerm = `%${keyword}%`;
    return await this.query(sql, [
      searchTerm,
      searchTerm,
      searchTerm,
      limit.toString(),
    ]);
  }

  // Lấy phim theo thể loại
  async getByGenre(genre, limit = 10) {
    const sql = `SELECT * FROM ${this.tableName} 
                     WHERE genre LIKE ? AND status = 'now_showing'
                     ORDER BY release_date DESC 
                     LIMIT ?`;
    return await this.query(sql, [`%${genre}%`, limit.toString()]);
  }

  // Lấy phim có suất chiếu trong ngày
  async getMoviesWithShowtimes(date) {
    const sql = `SELECT DISTINCT m.* FROM ${this.tableName} m
                     INNER JOIN showtimes s ON m.id = s.movie_id
                     WHERE DATE(s.start_time) = ? AND s.status = 'scheduled'
                     ORDER BY m.title`;
    return await this.query(sql, [date]);
  }

  // Cập nhật rating phim
  async updateRating(movieId) {
    const sql = `UPDATE ${this.tableName} 
                     SET rating = (
                         SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE movie_id = ?
                     )
                     WHERE id = ?`;
    await this.query(sql, [movieId, movieId]);
  }

  // Lấy phim với thống kê
  async getMovieWithStats(movieId) {
    const sql = `SELECT m.*, 
                     (SELECT COUNT(*) FROM reviews WHERE movie_id = m.id) as review_count,
                     (SELECT COUNT(*) FROM showtimes WHERE movie_id = m.id AND status = 'scheduled') as showtime_count
                     FROM ${this.tableName} m 
                     WHERE m.id = ?`;
    const results = await this.query(sql, [movieId]);
    return results[0] || null;
  }

  // Phân trang
  async paginate(page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (status) {
      sql += ` WHERE status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit.toString(), offset.toString());

    const movies = await this.query(sql, params);

    // Đếm tổng
    let countSql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    if (status) {
      countSql += ` WHERE status = ?`;
    }
    const countResult = await this.query(countSql, status ? [status] : []);

    return {
      data: movies,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }
}

module.exports = new Movie();
