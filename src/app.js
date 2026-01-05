require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api", routes);

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Handle 404 for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint không tồn tại",
  });
});

// Serve frontend for all other routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎬 CINEMA BOOKING SYSTEM                                 ║
║                                                            ║
║   Server đang chạy tại: http://localhost:${PORT}              ║
║   API endpoint: http://localhost:${PORT}/api                  ║
║                                                            ║
║   Để khởi tạo database, chạy: npm run init-db              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

// Cleanup expired bookings và seat locks mỗi 5 phút
const { bookingService } = require("./services");
setInterval(async () => {
  try {
    const result = await bookingService.cleanupExpiredBookings();
    if (result.cancelledBookings > 0 || result.cleanedLocks > 0) {
      console.log(
        `[Cleanup] Đã hủy ${result.cancelledBookings} booking hết hạn, xóa ${result.cleanedLocks} seat locks`
      );
    }
  } catch (error) {
    console.error("[Cleanup Error]", error.message);
  }
}, 5 * 60 * 1000);

module.exports = app;
