const express = require("express");
const router = express.Router();
const { adminController } = require("../controllers");
const { authenticate, isAdmin, validateBody } = require("../middlewares");

// Middleware: Tất cả route admin cần đăng nhập và có quyền admin
router.use(authenticate, isAdmin);

// ==================== DASHBOARD ====================
router.get("/dashboard", adminController.getDashboardStats);

// ==================== QUẢN LÝ PHIM ====================
router.post(
  "/movies",
  validateBody(["title", "duration"]),
  adminController.createMovie
);
router.put("/movies/:id", adminController.updateMovie);
router.delete("/movies/:id", adminController.deleteMovie);

// ==================== QUẢN LÝ RẠP ====================
router.post(
  "/cinemas",
  validateBody(["name", "address"]),
  adminController.createCinema
);
router.put("/cinemas/:id", adminController.updateCinema);
router.delete("/cinemas/:id", adminController.deleteCinema);

// ==================== QUẢN LÝ PHÒNG ====================
router.get("/rooms", adminController.getAllRooms);
router.get("/rooms/:id", adminController.getRoomById);
router.get("/cinemas/:cinemaId/rooms", adminController.getRoomsByCinema);
router.post(
  "/rooms",
  validateBody(["cinema_id", "name", "rows", "columns"]),
  adminController.createRoom
);
router.put("/rooms/:id", adminController.updateRoom);
router.delete("/rooms/:id", adminController.deleteRoom);

// ==================== QUẢN LÝ GHẾ ====================
router.get("/rooms/:roomId/seats", adminController.getSeatsByRoom);
router.put("/seats/:id", adminController.updateSeat);

// ==================== QUẢN LÝ SUẤT CHIẾU ====================
router.get("/showtimes", adminController.getAllShowtimes);
router.post(
  "/showtimes",
  validateBody(["movie_id", "room_id", "start_time", "base_price"]),
  adminController.createShowtime
);
router.put("/showtimes/:id", adminController.updateShowtime);
router.delete("/showtimes/:id", adminController.deleteShowtime);
router.post("/showtimes/:id/cancel", adminController.cancelShowtime);

// ==================== THỐNG KÊ ====================
router.get("/stats/revenue", adminController.getRevenueByDate);
router.get("/stats/revenue/movie", adminController.getRevenueByMovie);
router.get("/stats/revenue/cinema", adminController.getRevenueByCinema);

// ==================== QUẢN LÝ USER ====================
router.get("/users", adminController.getAllUsers);

// ==================== QUẢN LÝ BOOKING ====================
router.get("/bookings", adminController.getAllBookings);
router.post("/bookings/:id/confirm", adminController.confirmBookingPayment);
router.post("/bookings/:id/cancel", adminController.cancelBooking);

module.exports = router;
