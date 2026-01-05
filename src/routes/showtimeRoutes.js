const express = require("express");
const router = express.Router();
const { showtimeController } = require("../controllers");
const { authenticate, validateDate } = require("../middlewares");

// Lấy suất chiếu theo phim (public)
router.get("/movie/:movieId", showtimeController.getByMovie);

// Lấy rạp chiếu phim theo ngày (public)
router.get(
  "/movie/:movieId/cinemas",
  showtimeController.getCinemasShowingMovie
);

// Lấy suất chiếu theo rạp (public)
router.get("/cinema/:cinemaId", showtimeController.getByCinema);

// Lấy suất chiếu theo ngày (public)
router.get("/date/:date", validateDate("date"), showtimeController.getByDate);

// Lấy chi tiết suất chiếu (public)
router.get("/:id", showtimeController.getShowtimeDetail);

// Lấy sơ đồ ghế của suất chiếu (public)
router.get("/:id/seats", showtimeController.getSeats);

// Khóa ghế tạm thời (cần đăng nhập)
router.post("/:id/lock-seats", authenticate, showtimeController.lockSeats);

// Mở khóa ghế (cần đăng nhập)
router.post("/:id/unlock-seats", authenticate, showtimeController.unlockSeats);

module.exports = router;
