const express = require("express");
const router = express.Router();
const { bookingController } = require("../controllers");
const {
  authenticate,
  isAdmin,
  validateBody,
  validatePagination,
} = require("../middlewares");

// Tạo booking mới (cần đăng nhập)
router.post(
  "/",
  authenticate,
  validateBody(["showtimeId", "seatIds"]),
  bookingController.createBooking
);

// Lấy lịch sử đặt vé của user (cần đăng nhập)
router.get(
  "/my-bookings",
  authenticate,
  validatePagination,
  bookingController.getUserBookings
);

// Lấy booking theo mã (cần đăng nhập)
router.get("/code/:code", authenticate, bookingController.getByCode);

// Lấy chi tiết booking (cần đăng nhập)
router.get("/:id", authenticate, bookingController.getBookingDetail);

// Xác nhận thanh toán (cần đăng nhập)
router.post("/:id/payment", authenticate, bookingController.confirmPayment);

// Hủy booking (cần đăng nhập)
router.post("/:id/cancel", authenticate, bookingController.cancelBooking);

// Validate vé (admin/staff)
router.get(
  "/ticket/validate/:ticketCode",
  authenticate,
  bookingController.validateTicket
);

// Đánh dấu vé đã sử dụng (admin)
router.post(
  "/ticket/use/:ticketCode",
  authenticate,
  isAdmin,
  bookingController.useTicket
);

module.exports = router;
