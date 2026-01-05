const { Movie, Review } = require("../models");

class MovieController {
  // Lấy danh sách phim đang chiếu
  async getNowShowing(req, res) {
    try {
      const { limit = 10 } = req.query;
      const movies = await Movie.getNowShowing(parseInt(limit));

      res.json({
        success: true,
        data: movies,
      });
    } catch (error) {
      console.error("Get now showing error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy danh sách phim sắp chiếu
  async getComingSoon(req, res) {
    try {
      const { limit = 10 } = req.query;
      const movies = await Movie.getComingSoon(parseInt(limit));

      res.json({
        success: true,
        data: movies,
      });
    } catch (error) {
      console.error("Get coming soon error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy tất cả phim (phân trang)
  async getAllMovies(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await Movie.paginate(
        parseInt(page),
        parseInt(limit),
        status || null
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Get all movies error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy chi tiết phim
  async getMovieDetail(req, res) {
    try {
      const { id } = req.params;
      const movie = await Movie.getMovieWithStats(id);

      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phim",
        });
      }

      // Lấy đánh giá
      const rating = await Review.getAverageRating(id);

      res.json({
        success: true,
        data: {
          ...movie,
          rating_average: rating.average,
          rating_count: rating.count,
        },
      });
    } catch (error) {
      console.error("Get movie detail error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Tìm kiếm phim
  async searchMovies(req, res) {
    try {
      const { keyword, limit = 10 } = req.query;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập từ khóa tìm kiếm",
        });
      }

      const movies = await Movie.search(keyword, parseInt(limit));

      res.json({
        success: true,
        data: movies,
        keyword,
      });
    } catch (error) {
      console.error("Search movies error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy phim theo thể loại
  async getByGenre(req, res) {
    try {
      const { genre } = req.params;
      const { limit = 10 } = req.query;
      const movies = await Movie.getByGenre(genre, parseInt(limit));

      res.json({
        success: true,
        data: movies,
        genre,
      });
    } catch (error) {
      console.error("Get by genre error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy đánh giá của phim
  async getMovieReviews(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const movie = await Movie.findById(id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phim",
        });
      }

      const result = await Review.getByMovie(
        id,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Get movie reviews error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Thêm đánh giá phim (user)
  async addReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      // Validate rating
      if (!rating || rating < 1 || rating > 10) {
        return res.status(400).json({
          success: false,
          message: "Đánh giá phải từ 1 đến 10",
        });
      }

      const movie = await Movie.findById(id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phim",
        });
      }

      // Tạo hoặc cập nhật đánh giá
      const review = await Review.createOrUpdate(
        userId,
        id,
        rating,
        comment || ""
      );

      // Cập nhật rating trung bình của phim
      await Movie.updateRating(id);

      res.json({
        success: true,
        message: "Đánh giá thành công",
        data: review,
      });
    } catch (error) {
      console.error("Add review error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
}

module.exports = new MovieController();
