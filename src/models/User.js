const { BaseModel } = require("./BaseModel");
const bcrypt = require("bcryptjs");

class User extends BaseModel {
  constructor() {
    super("users");
  }

  async findByUsername(username) {
    return await this.findOne({ username });
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async createUser(userData) {
    // Hash password trước khi lưu
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return await this.create({
      ...userData,
      password: hashedPassword,
    });
  }

  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await this.update(userId, { password: hashedPassword });
  }

  // Lấy thông tin user không bao gồm password
  async findByIdSafe(id) {
    const sql = `SELECT id, username, email, full_name, phone, role, created_at, updated_at 
                     FROM ${this.tableName} WHERE id = ?`;
    const results = await this.query(sql, [id]);
    return results[0] || null;
  }

  async getAllUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const sql = `SELECT id, username, email, full_name, phone, role, created_at 
                     FROM ${this.tableName} 
                     ORDER BY created_at DESC 
                     LIMIT ? OFFSET ?`;
    return await this.query(sql, [limit.toString(), offset.toString()]);
  }
}

module.exports = new User();
