const mysql = require("mysql2/promise");
const dbConfig = require("../config/database");

// Tạo connection pool
const pool = mysql.createPool(dbConfig);

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  async query(sql, params = []) {
    const [results] = await this.pool.execute(sql, params);
    return results;
  }

  async findAll(
    conditions = {},
    orderBy = "id DESC",
    limit = null,
    offset = null
  ) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => {
          params.push(conditions[key]);
          return `${key} = ?`;
        })
        .join(" AND ");
      sql += ` WHERE ${whereClause}`;
    }

    sql += ` ORDER BY ${orderBy}`;

    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
      if (offset) {
        sql += ` OFFSET ${parseInt(offset)}`;
      }
    }

    return await this.query(sql, params);
  }

  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.query(sql, [id]);
    return results[0] || null;
  }

  async findOne(conditions) {
    let sql = `SELECT * FROM ${this.tableName} WHERE `;
    const params = [];

    const whereClause = Object.keys(conditions)
      .map((key) => {
        params.push(conditions[key]);
        return `${key} = ?`;
      })
      .join(" AND ");

    sql += whereClause + " LIMIT 1";
    const results = await this.query(sql, params);
    return results[0] || null;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO ${this.tableName} (${keys.join(
      ", "
    )}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);

    return { id: result.insertId, ...data };
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

    await this.query(sql, [...values, id]);
    return await this.findById(id);
  }

  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    return result.affectedRows > 0;
  }

  async count(conditions = {}) {
    let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => {
          params.push(conditions[key]);
          return `${key} = ?`;
        })
        .join(" AND ");
      sql += ` WHERE ${whereClause}`;
    }

    const results = await this.query(sql, params);
    return results[0].total;
  }
}

module.exports = { BaseModel, pool };
