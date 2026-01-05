// Middleware validate request body
const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu các trường bắt buộc: ${missingFields.join(", ")}`,
      });
    }

    next();
  };
};

// Validate email format
const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }
  }

  next();
};

// Validate phone number
const validatePhone = (req, res, next) => {
  const { phone } = req.body;

  if (phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ (10-11 số)",
      });
    }
  }

  next();
};

// Validate password strength
const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (password && password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu phải có ít nhất 6 ký tự",
    });
  }

  next();
};

// Validate date format (YYYY-MM-DD)
const validateDate = (field) => {
  return (req, res, next) => {
    const date = req.query[field] || req.body[field] || req.params[field];

    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: `${field} phải có định dạng YYYY-MM-DD`,
        });
      }
    }

    next();
  };
};

// Validate pagination
const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;

  if (page) {
    page = parseInt(page);
    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "page phải là số nguyên dương",
      });
    }
  }

  if (limit) {
    limit = parseInt(limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "limit phải là số từ 1 đến 100",
      });
    }
  }

  next();
};

// Sanitize input - loại bỏ XSS
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key]
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;")
          .trim();
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);

  next();
};

module.exports = {
  validateBody,
  validateEmail,
  validatePhone,
  validatePassword,
  validateDate,
  validatePagination,
  sanitizeInput,
};
