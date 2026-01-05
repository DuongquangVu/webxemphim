const jwt = require("jsonwebtoken");
const User = require("../models/User");

class AuthController {
  // Đăng ký
  async register(req, res) {
    try {
      const { username, email, password, full_name, phone } = req.body;

      // Validate
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin bắt buộc",
        });
      }

      // Kiểm tra username đã tồn tại
      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Tên đăng nhập đã tồn tại",
        });
      }

      // Kiểm tra email đã tồn tại
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }

      // Tạo user mới
      const newUser = await User.createUser({
        username,
        email,
        password,
        full_name: full_name || null,
        phone: phone || null,
        role: "user",
      });

      // Tạo token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            full_name: newUser.full_name,
            role: "user",
          },
          token,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Đăng nhập
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập tên đăng nhập và mật khẩu",
        });
      }

      // Tìm user
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Tên đăng nhập hoặc mật khẩu không đúng",
        });
      }

      // Kiểm tra password
      const isValidPassword = await User.validatePassword(
        password,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Tên đăng nhập hoặc mật khẩu không đúng",
        });
      }

      // Tạo token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      res.json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy thông tin user hiện tại
  async getProfile(req, res) {
    try {
      const user = await User.findByIdSafe(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy user",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Cập nhật thông tin user
  async updateProfile(req, res) {
    try {
      const { full_name, phone, email } = req.body;
      const userId = req.user.id;

      // Kiểm tra email mới có trùng với user khác không
      if (email) {
        const existingEmail = await User.findByEmail(email);
        if (existingEmail && existingEmail.id !== userId) {
          return res.status(400).json({
            success: false,
            message: "Email đã được sử dụng",
          });
        }
      }

      const updatedUser = await User.update(userId, {
        full_name: full_name || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });

      res.json({
        success: true,
        message: "Cập nhật thông tin thành công",
        data: await User.findByIdSafe(userId),
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Đổi mật khẩu
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
        });
      }

      const user = await User.findById(userId);
      const isValidPassword = await User.validatePassword(
        currentPassword,
        user.password
      );

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại không đúng",
        });
      }

      await User.updatePassword(userId, newPassword);

      res.json({
        success: true,
        message: "Đổi mật khẩu thành công",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
