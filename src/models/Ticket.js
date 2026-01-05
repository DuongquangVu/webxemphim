const { BaseModel } = require("./BaseModel");

class Ticket extends BaseModel {
  constructor() {
    super("tickets");
  }

  // Tạo mã vé unique
  generateTicketCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TK${timestamp}${random}`;
  }

  // Tạo vé mới
  async createTicket(ticketData) {
    const ticketCode = this.generateTicketCode();
    return await this.create({
      ...ticketData,
      ticket_code: ticketCode,
    });
  }

  // Tạo nhiều vé cho một booking
  async createTicketsForBooking(bookingId, seats, basePrice) {
    const tickets = [];
    for (const seat of seats) {
      const price = basePrice * (seat.price_modifier || 1);
      const ticket = await this.createTicket({
        booking_id: bookingId,
        seat_id: seat.id,
        price: price,
      });
      tickets.push(ticket);
    }
    return tickets;
  }

  // Lấy vé theo mã
  async getByCode(ticketCode) {
    const sql = `
            SELECT t.*, 
                   se.row_name, se.seat_number, se.seat_type,
                   b.booking_code, b.payment_status,
                   s.start_time, s.end_time,
                   m.title as movie_title,
                   r.name as room_name,
                   c.name as cinema_name
            FROM ${this.tableName} t
            INNER JOIN seats se ON t.seat_id = se.id
            INNER JOIN bookings b ON t.booking_id = b.id
            INNER JOIN showtimes s ON b.showtime_id = s.id
            INNER JOIN movies m ON s.movie_id = m.id
            INNER JOIN rooms r ON s.room_id = r.id
            INNER JOIN cinemas c ON r.cinema_id = c.id
            WHERE t.ticket_code = ?
        `;
    const results = await this.query(sql, [ticketCode]);
    return results[0] || null;
  }

  // Lấy vé theo booking
  async getByBooking(bookingId) {
    const sql = `
            SELECT t.*, se.row_name, se.seat_number, se.seat_type
            FROM ${this.tableName} t
            INNER JOIN seats se ON t.seat_id = se.id
            WHERE t.booking_id = ?
            ORDER BY se.row_name, se.seat_number
        `;
    return await this.query(sql, [bookingId]);
  }

  // Đánh dấu vé đã sử dụng
  async markAsUsed(ticketId) {
    return await this.update(ticketId, { status: "used" });
  }

  // Hủy vé
  async cancelTicket(ticketId) {
    return await this.update(ticketId, { status: "cancelled" });
  }

  // Hủy tất cả vé của booking
  async cancelTicketsByBooking(bookingId) {
    const sql = `UPDATE ${this.tableName} SET status = 'cancelled' WHERE booking_id = ?`;
    await this.query(sql, [bookingId]);
  }

  // Kiểm tra vé hợp lệ để vào rạp
  async validateTicket(ticketCode) {
    const ticket = await this.getByCode(ticketCode);

    if (!ticket) {
      return { valid: false, message: "Vé không tồn tại" };
    }

    if (ticket.status === "used") {
      return { valid: false, message: "Vé đã được sử dụng" };
    }

    if (ticket.status === "cancelled") {
      return { valid: false, message: "Vé đã bị hủy" };
    }

    if (ticket.payment_status !== "paid") {
      return { valid: false, message: "Vé chưa được thanh toán" };
    }

    // Kiểm tra thời gian
    const now = new Date();
    const showStart = new Date(ticket.start_time);
    const showEnd = new Date(ticket.end_time);

    if (now > showEnd) {
      return { valid: false, message: "Suất chiếu đã kết thúc" };
    }

    // Cho phép vào trước 30 phút
    const allowedEntry = new Date(showStart.getTime() - 30 * 60 * 1000);
    if (now < allowedEntry) {
      return {
        valid: false,
        message: `Vui lòng quay lại lúc ${allowedEntry.toLocaleTimeString()}`,
      };
    }

    return { valid: true, ticket };
  }
}

module.exports = new Ticket();
