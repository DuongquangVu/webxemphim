const express = require("express");
const router = express.Router();
const { movieController } = require("../controllers");
const {
  authenticate,
  optionalAuth,
  validatePagination,
} = require("../middlewares");

// Lấy phim đang chiếu (public)
router.get("/now-showing", movieController.getNowShowing);

// Lấy phim sắp chiếu (public)
router.get("/coming-soon", movieController.getComingSoon);

// Tìm kiếm phim (public)
router.get("/search", movieController.searchMovies);

// Lấy tất cả phim (public)
router.get("/", validatePagination, movieController.getAllMovies);

// Lấy phim theo thể loại (public)
router.get("/genre/:genre", movieController.getByGenre);

// Lấy chi tiết phim (public)
router.get("/:id", movieController.getMovieDetail);

// Lấy đánh giá của phim (public)
router.get("/:id/reviews", validatePagination, movieController.getMovieReviews);

// Thêm đánh giá (cần đăng nhập)
router.post("/:id/reviews", authenticate, movieController.addReview);

module.exports = router;
