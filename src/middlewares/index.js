const { authenticate, isAdmin, optionalAuth } = require("./authMiddleware");
const {
  validateBody,
  validateEmail,
  validatePhone,
  validatePassword,
  validateDate,
  validatePagination,
  sanitizeInput,
} = require("./validateMiddleware");

module.exports = {
  authenticate,
  isAdmin,
  optionalAuth,
  validateBody,
  validateEmail,
  validatePhone,
  validatePassword,
  validateDate,
  validatePagination,
  sanitizeInput,
};
