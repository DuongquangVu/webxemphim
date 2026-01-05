const mysql = require("mysql2/promise");
const dbConfig = require("./database");

const initSQL = `
-- Tạo database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS cinebooking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinebooking;

-- Bảng Users (Người dùng)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng Movies (Phim)
CREATE TABLE IF NOT EXISTS movies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL COMMENT 'Thời lượng phim (phút)',
    release_date DATE,
    end_date DATE,
    genre VARCHAR(100),
    director VARCHAR(100),
    actors TEXT,
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    rating DECIMAL(3,1) DEFAULT 0,
    status ENUM('coming_soon', 'now_showing', 'ended') DEFAULT 'coming_soon',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng Cinemas (Rạp chiếu)
CREATE TABLE IF NOT EXISTS cinemas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    phone VARCHAR(20),
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng Rooms (Phòng chiếu)
CREATE TABLE IF NOT EXISTS rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cinema_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    room_type ENUM('2D', '3D', 'IMAX', '4DX') DEFAULT '2D',
    total_seats INT DEFAULT 0,
    rows_count INT DEFAULT 0,
    columns_count INT DEFAULT 0,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
);

-- Bảng Seats (Ghế)
CREATE TABLE IF NOT EXISTS seats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    row_name VARCHAR(5) NOT NULL COMMENT 'Ví dụ: A, B, C...',
    seat_number INT NOT NULL,
    seat_type ENUM('standard', 'vip', 'couple', 'disabled') DEFAULT 'standard',
    price_modifier DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Hệ số giá: 1.0 = giá gốc, 1.5 = VIP',
    status ENUM('active', 'inactive', 'broken') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat (room_id, row_name, seat_number)
);

-- Bảng Showtimes (Suất chiếu)
CREATE TABLE IF NOT EXISTS showtimes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    movie_id INT NOT NULL,
    room_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    base_price DECIMAL(10,2) NOT NULL COMMENT 'Giá vé cơ bản',
    status ENUM('scheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Bảng Bookings (Đặt vé)
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash', 'credit_card', 'e_wallet', 'bank_transfer') DEFAULT 'cash',
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP NULL COMMENT 'Thời gian hết hạn thanh toán',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
);

-- Bảng Tickets (Vé)
CREATE TABLE IF NOT EXISTS tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    ticket_code VARCHAR(20) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
);

-- Bảng Seat Locks (Khóa ghế tạm thời)
CREATE TABLE IF NOT EXISTS seat_locks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seat_id INT NOT NULL,
    showtime_id INT NOT NULL,
    user_id INT NOT NULL,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat_lock (seat_id, showtime_id)
);

-- Bảng Reviews (Đánh giá phim)
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_movie_review (user_id, movie_id)
);

-- Bảng Payment Transactions (Giao dịch thanh toán)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'credit_card', 'e_wallet', 'bank_transfer') NOT NULL,
    status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
    payment_gateway VARCHAR(50),
    gateway_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Index để tối ưu truy vấn
CREATE INDEX idx_showtimes_movie ON showtimes(movie_id);
CREATE INDEX idx_showtimes_room ON showtimes(room_id);
CREATE INDEX idx_showtimes_datetime ON showtimes(start_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_showtime ON bookings(showtime_id);
CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_seat_locks_expires ON seat_locks(expires_at);

-- Thêm dữ liệu mẫu

-- Admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('admin', 'admin@cinema.com', '$2a$10$i/uXsgS1gRmGsMN.ecpVxejiLOboaDl4FXO.mQMNSCWcs/WXccHh6', 'Administrator', '0123456789', 'admin');

-- Sample users (password: password123)
INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('user1', 'user1@gmail.com', '$2a$10$7UEDOAfeXWhJP1n1L3oa1.CkTsffN4jNfLZYodW9fE7zIXaqiOLKi', 'Nguyễn Văn A', '0987654321', 'user'),
('user2', 'user2@gmail.com', '$2a$10$7UEDOAfeXWhJP1n1L3oa1.CkTsffN4jNfLZYodW9fE7zIXaqiOLKi', 'Trần Thị B', '0912345678', 'user');

-- Sample movies
INSERT INTO movies (title, description, duration, release_date, end_date, genre, director, actors, poster_url, status) VALUES
('Avengers: Endgame', 'Biệt đội siêu anh hùng tập hợp một lần nữa để đảo ngược hành động của Thanos và khôi phục sự cân bằng cho vũ trụ.', 181, '2024-04-26', '2024-07-26', 'Hành động, Phiêu lưu', 'Anthony Russo, Joe Russo', 'Robert Downey Jr., Chris Evans, Mark Ruffalo', '/images/avengers.jpg', 'now_showing'),
('Spirited Away', 'Cô bé Chihiro bước vào thế giới linh hồn và phải tìm cách giải cứu cha mẹ.', 125, '2024-03-15', '2024-06-15', 'Hoạt hình, Phiêu lưu', 'Hayao Miyazaki', 'Rumi Hiiragi, Miyu Irino', '/images/spirited-away.jpg', 'now_showing'),
('Parasite', 'Câu chuyện về hai gia đình có hoàn cảnh khác biệt và những bí mật đen tối.', 132, '2024-05-01', '2024-08-01', 'Tâm lý, Kịch tính', 'Bong Joon-ho', 'Song Kang-ho, Lee Sun-kyun', '/images/parasite.jpg', 'now_showing'),
('Dune: Part Two', 'Paul Atreides tiếp tục hành trình của mình trên hành tinh Arrakis.', 166, '2024-06-01', '2024-09-01', 'Khoa học viễn tưởng', 'Denis Villeneuve', 'Timothée Chalamet, Zendaya', '/images/dune2.jpg', 'coming_soon');

-- Sample cinemas
INSERT INTO cinemas (name, address, city, phone, description) VALUES
('CGV Vincom Center', '72 Lê Thánh Tôn, Quận 1', 'Hồ Chí Minh', '028 3823 4567', 'Rạp chiếu phim hiện đại với công nghệ IMAX'),
('Lotte Cinema Landmark', 'Tầng 5, Landmark 81, Quận Bình Thạnh', 'Hồ Chí Minh', '028 3512 3456', 'Rạp chiếu phim cao cấp tại tòa nhà cao nhất Việt Nam'),
('Galaxy Cinema Nguyễn Du', '116 Nguyễn Du, Quận 1', 'Hồ Chí Minh', '028 3925 1234', 'Rạp chiếu phim với giá vé hợp lý');

-- Sample rooms
INSERT INTO rooms (cinema_id, name, room_type, total_seats, rows_count, columns_count) VALUES
(1, 'Phòng 1', '2D', 80, 8, 10),
(1, 'Phòng 2', '3D', 60, 6, 10),
(1, 'Phòng IMAX', 'IMAX', 120, 10, 12),
(2, 'Phòng 1', '2D', 100, 10, 10),
(2, 'Phòng 2', '4DX', 40, 4, 10),
(3, 'Phòng 1', '2D', 80, 8, 10),
(3, 'Phòng 2', '2D', 80, 8, 10);
`;

async function initDatabase() {
  let connection;
  try {
    // Kết nối không cần database trước
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
      multipleStatements: true,
    });

    console.log("Đang kết nối MySQL...");

    // Chạy script khởi tạo
    await connection.query(initSQL);
    console.log("✓ Đã tạo database và các bảng thành công!");

    // Tạo ghế cho các phòng
    await connection.query("USE cinebooking");

    // Lấy danh sách phòng
    const [rooms] = await connection.query(
      "SELECT id, rows_count, columns_count FROM rooms"
    );

    for (const room of rooms) {
      const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const seats = [];

      for (let r = 0; r < room.rows_count; r++) {
        for (let c = 1; c <= room.columns_count; c++) {
          const rowName = rowLetters[r];
          // Hàng cuối là VIP
          const seatType = r >= room.rows_count - 2 ? "vip" : "standard";
          const priceModifier = seatType === "vip" ? 1.5 : 1.0;

          seats.push([room.id, rowName, c, seatType, priceModifier, "active"]);
        }
      }

      if (seats.length > 0) {
        await connection.query(
          "INSERT IGNORE INTO seats (room_id, row_name, seat_number, seat_type, price_modifier, status) VALUES ?",
          [seats]
        );
      }
    }
    console.log("✓ Đã tạo ghế cho các phòng chiếu!");

    // Tạo suất chiếu mẫu
    const today = new Date();
    const showtimes = [];

    // Tạo suất chiếu cho 7 ngày tới
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      const times = ["09:00", "12:00", "15:00", "18:00", "21:00"];

      for (const time of times) {
        const [hours, minutes] = time.split(":");
        const startTime = new Date(date);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 2, endTime.getMinutes() + 30);

        // Movie 1 - Phòng 1, 4
        showtimes.push([
          1,
          1,
          startTime.toISOString().slice(0, 19).replace("T", " "),
          endTime.toISOString().slice(0, 19).replace("T", " "),
          85000,
          "scheduled",
        ]);

        // Movie 2 - Phòng 2, 6
        if (times.indexOf(time) % 2 === 0) {
          showtimes.push([
            2,
            2,
            startTime.toISOString().slice(0, 19).replace("T", " "),
            endTime.toISOString().slice(0, 19).replace("T", " "),
            95000,
            "scheduled",
          ]);
        }

        // Movie 3 - Phòng 3, 5
        if (times.indexOf(time) % 2 === 1) {
          showtimes.push([
            3,
            3,
            startTime.toISOString().slice(0, 19).replace("T", " "),
            endTime.toISOString().slice(0, 19).replace("T", " "),
            150000,
            "scheduled",
          ]);
        }
      }
    }

    await connection.query(
      "INSERT IGNORE INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status) VALUES ?",
      [showtimes]
    );
    console.log("✓ Đã tạo suất chiếu mẫu!");

    console.log("\n========================================");
    console.log("KHỞI TẠO DATABASE THÀNH CÔNG!");
    console.log("========================================");
    console.log("Tài khoản Admin:");
    console.log("  - Username: admin");
    console.log("  - Password: admin123");
    console.log("----------------------------------------");
    console.log("Tài khoản User mẫu:");
    console.log("  - Username: user1 hoặc user2");
    console.log("  - Password: password123");
    console.log("========================================\n");
  } catch (error) {
    console.error("Lỗi khởi tạo database:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy nếu gọi trực tiếp
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initDatabase };
