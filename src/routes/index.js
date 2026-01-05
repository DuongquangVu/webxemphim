const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const movieRoutes = require("./movieRoutes");
const showtimeRoutes = require("./showtimeRoutes");
const bookingRoutes = require("./bookingRoutes");
const cinemaRoutes = require("./cinemaRoutes");
const adminRoutes = require("./adminRoutes");

// API Routes
router.use("/auth", authRoutes);
router.use("/movies", movieRoutes);
router.use("/showtimes", showtimeRoutes);
router.use("/bookings", bookingRoutes);
router.use("/cinemas", cinemaRoutes);
router.use("/admin", adminRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Cinema Booking API is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
