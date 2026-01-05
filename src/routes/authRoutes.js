const express = require("express");
const router = express.Router();
const { authController } = require("../controllers");
const {
  authenticate,
  validateBody,
  validateEmail,
  validatePassword,
} = require("../middlewares");

// Đăng ký
router.post(
  "/register",
  validateBody(["username", "email", "password"]),
  validateEmail,
  validatePassword,
  authController.register
);

// Đăng nhập
router.post(
  "/login",
  validateBody(["username", "password"]),
  authController.login
);

// Lấy thông tin profile (cần đăng nhập)
router.get("/profile", authenticate, authController.getProfile);

// Cập nhật profile (cần đăng nhập)
router.put(
  "/profile",
  authenticate,
  validateEmail,
  authController.updateProfile
);

// Đổi mật khẩu (cần đăng nhập)
router.put(
  "/change-password",
  authenticate,
  validateBody(["currentPassword", "newPassword"]),
  validatePassword,
  authController.changePassword
);

module.exports = router;
