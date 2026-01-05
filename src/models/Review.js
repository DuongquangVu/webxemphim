const { BaseModel } = require("./BaseModel");

class Review extends BaseModel {
  constructor() {
    super("reviews");
  }

  // Tạo hoặc cập nhật đánh giá
  async createOrUpdate(userId, movieId, rating, comment) {
    const existing = await this.findOne({ user_id: userId, movie_id: movieId });

    if (existing) {
      return await this.update(existing.id, { rating, comment });
    }

    return await this.create({
      user_id: userId,
      movie_id: movieId,
      rating,
      comment,
    });
  }

  // Lấy đánh giá của phim
  async getByMovie(movieId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const sql = `
            SELECT r.*, u.username, u.full_name
            FROM ${this.tableName} r
            INNER JOIN users u ON r.user_id = u.id
            WHERE r.movie_id = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;
    const reviews = await this.query(sql, [
      movieId,
      limit.toString(),
      offset.toString(),
    ]);

    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE movie_id = ?`;
    const countResult = await this.query(countSql, [movieId]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  // Lấy đánh giá của user cho phim
  async getUserReview(userId, movieId) {
    return await this.findOne({ user_id: userId, movie_id: movieId });
  }

  // Lấy tất cả đánh giá của user
  async getUserReviews(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const sql = `
            SELECT r.*, m.title as movie_title, m.poster_url
            FROM ${this.tableName} r
            INNER JOIN movies m ON r.movie_id = m.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;
    return await this.query(sql, [userId, limit.toString(), offset.toString()]);
  }

  // Tính rating trung bình của phim
  async getAverageRating(movieId) {
    const sql = `SELECT AVG(rating) as average, COUNT(*) as count 
                     FROM ${this.tableName} WHERE movie_id = ?`;
    const results = await this.query(sql, [movieId]);
    return {
      average: results[0].average
        ? parseFloat(results[0].average).toFixed(1)
        : 0,
      count: results[0].count,
    };
  }

  // Kiểm tra user đã xem phim chưa (đã có booking đã thanh toán)
  async hasUserWatchedMovie(userId, movieId) {
    const sql = `
            SELECT COUNT(*) as count FROM bookings b
            INNER JOIN showtimes s ON b.showtime_id = s.id
            WHERE b.user_id = ? AND s.movie_id = ? AND b.payment_status = 'paid'
        `;
    const results = await this.query(sql, [userId, movieId]);
    return results[0].count > 0;
  }

  // Xóa đánh giá
  async deleteReview(userId, movieId) {
    const sql = `DELETE FROM ${this.tableName} WHERE user_id = ? AND movie_id = ?`;
    await this.query(sql, [userId, movieId]);
  }
}

module.exports = new Review();
