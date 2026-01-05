# 🎬 Hệ thống đặt vé xem phim trực tuyến (CineBooking)

Hệ thống đặt vé xem phim trực tuyến hoàn chỉnh được xây dựng với NodeJS và MySQL.

## 📋 Tính năng

### Người dùng (User)

- ✅ Đăng ký / Đăng nhập tài khoản
- ✅ Xem danh sách phim đang chiếu / sắp chiếu
- ✅ Xem chi tiết phim (thông tin, trailer, đánh giá)
- ✅ Xem lịch chiếu theo rạp / phim
- ✅ Chọn ghế và đặt vé
- ✅ Thanh toán trực tuyến (mô phỏng)
- ✅ Xem lịch sử đặt vé
- ✅ Đánh giá phim sau khi xem

### Quản trị viên (Admin)

- ✅ Dashboard thống kê doanh thu
- ✅ Quản lý phim (CRUD)
- ✅ Quản lý rạp chiếu phim (CRUD)
- ✅ Quản lý phòng chiếu (CRUD)
- ✅ Quản lý suất chiếu (CRUD)
- ✅ Quản lý đặt vé
- ✅ Quản lý người dùng

### Tính năng nâng cao

- ✅ Khóa ghế tạm thời khi chọn (10 phút)
- ✅ Tự động hủy booking hết hạn
- ✅ Mô phỏng thanh toán online

## 🛠️ Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT (JSON Web Token)
- **Password Hashing:** bcryptjs
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Icons:** Font Awesome

## 📁 Cấu trúc thư mục

```
webdatvephim/
├── src/
│   ├── config/
│   │   ├── database.js        # Cấu hình kết nối MySQL
│   │   └── initDatabase.js    # Khởi tạo database & bảng
│   ├── controllers/
│   │   ├── authController.js  # Xử lý đăng nhập/đăng ký
│   │   ├── movieController.js # Xử lý phim
│   │   ├── showtimeController.js
│   │   ├── bookingController.js
│   │   ├── cinemaController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── BaseModel.js       # Base model với các method chung
│   │   ├── User.js
│   │   ├── Movie.js
│   │   ├── Cinema.js
│   │   ├── Room.js
│   │   ├── Seat.js
│   │   ├── Showtime.js
│   │   ├── Booking.js
│   │   ├── Ticket.js
│   │   ├── SeatLock.js
│   │   └── Review.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── movieRoutes.js
│   │   ├── showtimeRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── cinemaRoutes.js
│   │   └── adminRoutes.js
│   ├── middlewares/
│   │   ├── authMiddleware.js  # Xác thực JWT
│   │   └── validateMiddleware.js
│   ├── services/
│   │   ├── bookingService.js  # Logic đặt vé
│   │   └── paymentService.js  # Mô phỏng thanh toán
│   └── app.js                 # Entry point
├── public/
│   ├── index.html             # Trang chủ
│   ├── movie.html             # Chi tiết phim
│   ├── booking.html           # Đặt vé
│   ├── bookings.html          # Lịch sử đặt vé
│   ├── admin.html             # Trang admin
│   ├── css/
│   │   ├── style.css          # CSS chung
│   │   ├── movie.css
│   │   ├── booking.css
│   │   ├── bookings.css
│   │   └── admin.css
│   └── js/
│       ├── api.js             # API client
│       ├── auth.js            # Xử lý authentication
│       ├── main.js            # Trang chủ
│       ├── movie-detail.js    # Chi tiết phim
│       ├── booking.js         # Đặt vé
│       ├── bookings.js        # Lịch sử
│       └── admin.js           # Admin panel
├── .env                       # Biến môi trường
├── package.json
└── README.md
```

## ⚙️ Cài đặt

### Yêu cầu

- Node.js >= 14.x
- MySQL >= 5.7

### Các bước cài đặt

1. **Clone hoặc tải project**

2. **Cài đặt dependencies**

```bash
npm install
```

3. **Tạo database MySQL**

```sql
CREATE DATABASE cinebooking;
```

4. **Cấu hình file .env**

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cinebooking
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SEAT_LOCK_DURATION=600
```

5. **Khởi chạy ứng dụng**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. **Truy cập**

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin.html

## 👤 Tài khoản mặc định

### Admin

- Email: admin@cinebooking.com
- Password: admin123

### User (test)

- Email: user@test.com
- Password: user123

## 📊 Database Schema

### Bảng chính

- **users** - Thông tin người dùng
- **movies** - Thông tin phim
- **cinemas** - Thông tin rạp
- **rooms** - Phòng chiếu
- **seats** - Ghế ngồi
- **showtimes** - Suất chiếu
- **bookings** - Đơn đặt vé
- **tickets** - Vé chi tiết
- **seat_locks** - Khóa ghế tạm thời
- **reviews** - Đánh giá phim
- **payment_transactions** - Giao dịch thanh toán

## 🔌 API Endpoints

### Authentication

| Method | Endpoint           | Description |
| ------ | ------------------ | ----------- |
| POST   | /api/auth/register | Đăng ký     |
| POST   | /api/auth/login    | Đăng nhập   |
| GET    | /api/auth/profile  | Xem profile |

### Movies

| Method | Endpoint                | Description    |
| ------ | ----------------------- | -------------- |
| GET    | /api/movies             | Danh sách phim |
| GET    | /api/movies/:id         | Chi tiết phim  |
| GET    | /api/movies/:id/reviews | Đánh giá phim  |
| POST   | /api/movies/:id/reviews | Gửi đánh giá   |

### Showtimes

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| GET    | /api/showtimes           | Danh sách suất chiếu |
| GET    | /api/showtimes/:id       | Chi tiết suất chiếu  |
| GET    | /api/showtimes/:id/seats | Danh sách ghế        |

### Bookings

| Method | Endpoint                  | Description    |
| ------ | ------------------------- | -------------- |
| POST   | /api/bookings             | Tạo booking    |
| GET    | /api/bookings/my-bookings | Lịch sử đặt vé |
| POST   | /api/bookings/:id/payment | Thanh toán     |
| POST   | /api/bookings/lock-seat   | Khóa ghế       |
| POST   | /api/bookings/unlock-seat | Mở khóa ghế    |

### Admin

| Method | Endpoint             | Description        |
| ------ | -------------------- | ------------------ |
| GET    | /api/admin/dashboard | Thống kê dashboard |
| GET    | /api/admin/revenue   | Thống kê doanh thu |
| CRUD   | /api/admin/movies    | Quản lý phim       |
| CRUD   | /api/admin/cinemas   | Quản lý rạp        |
| CRUD   | /api/admin/rooms     | Quản lý phòng      |
| CRUD   | /api/admin/showtimes | Quản lý suất chiếu |
| GET    | /api/admin/bookings  | Quản lý đặt vé     |
| GET    | /api/admin/users     | Quản lý users      |

## 🔒 Bảo mật

- Mật khẩu được hash bằng bcryptjs
- JWT authentication với thời hạn 24h
- Middleware kiểm tra quyền admin
- Validate input data

## 📝 Luồng đặt vé

1. User chọn phim và suất chiếu
2. Chọn ghế → Ghế được khóa tạm thời (10 phút)
3. Xác nhận và chọn phương thức thanh toán
4. Thanh toán (mô phỏng)
5. Booking được xác nhận, vé được tạo
6. Ghế được đánh dấu đã đặt

## 🚀 Phát triển thêm

- [ ] Tích hợp cổng thanh toán thực (VNPay, MoMo)
- [ ] Gửi email xác nhận đặt vé
- [ ] Push notification
- [ ] Responsive hoàn chỉnh cho mobile
- [ ] PWA support
- [ ] Multi-language support

## 📄 License

MIT License

## 👨‍💻 Tác giả

Dự án được xây dựng cho mục đích học tập và demo.
