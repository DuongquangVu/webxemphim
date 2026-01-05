const { BaseModel } = require("./BaseModel");

class Room extends BaseModel {
  constructor() {
    super("rooms");
  }

  // Lấy tất cả phòng với thông tin rạp
  async getAllWithCinema(cinemaId = null) {
    let sql = `SELECT r.*, c.name as cinema_name 
               FROM ${this.tableName} r
               INNER JOIN cinemas c ON r.cinema_id = c.id
               WHERE r.status = 'active'`;
    const params = [];

    if (cinemaId) {
      sql += ` AND r.cinema_id = ?`;
      params.push(cinemaId);
    }

    sql += ` ORDER BY c.name, r.name`;
    return await this.query(sql, params);
  }

  // Lấy phòng theo rạp
  async getByCinema(cinemaId) {
    const sql = `SELECT * FROM ${this.tableName} 
                     WHERE cinema_id = ? AND status = 'active'
                     ORDER BY name`;
    return await this.query(sql, [cinemaId]);
  }

  // Lấy phòng với thông tin rạp
  async getRoomWithCinema(roomId) {
    const sql = `SELECT r.*, c.name as cinema_name, c.address as cinema_address 
                     FROM ${this.tableName} r
                     INNER JOIN cinemas c ON r.cinema_id = c.id
                     WHERE r.id = ?`;
    const results = await this.query(sql, [roomId]);
    return results[0] || null;
  }

  // Lấy phòng với tất cả ghế
  async getRoomWithSeats(roomId) {
    const room = await this.getRoomWithCinema(roomId);
    if (!room) return null;

    const seatsSql = `SELECT * FROM seats 
                          WHERE room_id = ? 
                          ORDER BY row_name, seat_number`;
    const seats = await this.query(seatsSql, [roomId]);

    // Sắp xếp ghế theo hàng
    const seatsByRow = {};
    seats.forEach((seat) => {
      if (!seatsByRow[seat.row_name]) {
        seatsByRow[seat.row_name] = [];
      }
      seatsByRow[seat.row_name].push(seat);
    });

    return { ...room, seats, seatsByRow };
  }

  // Kiểm tra phòng có trống trong khoảng thời gian không
  async isRoomAvailable(roomId, startTime, endTime, excludeShowtimeId = null) {
    let sql = `SELECT COUNT(*) as count FROM showtimes 
                   WHERE room_id = ? 
                   AND status = 'scheduled'
                   AND ((start_time < ? AND end_time > ?) 
                        OR (start_time < ? AND end_time > ?)
                        OR (start_time >= ? AND end_time <= ?))`;
    const params = [
      roomId,
      endTime,
      startTime,
      endTime,
      startTime,
      startTime,
      endTime,
    ];

    if (excludeShowtimeId) {
      sql += ` AND id != ?`;
      params.push(excludeShowtimeId);
    }

    const results = await this.query(sql, params);
    return results[0].count === 0;
  }

  // Tạo phòng với ghế
  async createRoomWithSeats(roomData, rows, columns) {
    const room = await this.create(roomData);

    const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const seats = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 1; c <= columns; c++) {
        const rowName = rowLetters[r];
        const seatType = r >= rows - 2 ? "vip" : "standard";
        const priceModifier = seatType === "vip" ? 1.5 : 1.0;

        seats.push([room.id, rowName, c, seatType, priceModifier, "active"]);
      }
    }

    if (seats.length > 0) {
      await this.query(
        "INSERT INTO seats (room_id, row_name, seat_number, seat_type, price_modifier, status) VALUES ?",
        [seats]
      );
    }

    // Cập nhật tổng số ghế
    await this.update(room.id, {
      total_seats: rows * columns,
      rows_count: rows,
      columns_count: columns,
    });

    return await this.getRoomWithSeats(room.id);
  }
}

module.exports = new Room();
