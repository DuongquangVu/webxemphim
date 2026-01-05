// API Configuration
const API_BASE_URL = "/api";

// API Helper Functions
class API {
  static getToken() {
    return localStorage.getItem("token");
  }

  static setToken(token) {
    localStorage.setItem("token", token);
  }

  static removeToken() {
    localStorage.removeItem("token");
  }

  static getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  static setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  static removeUser() {
    localStorage.removeItem("user");
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Có lỗi xảy ra");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  static get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  static post(endpoint, body) {
    return this.request(endpoint, { method: "POST", body });
  }

  static put(endpoint, body) {
    return this.request(endpoint, { method: "PUT", body });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

// Auth API
const AuthAPI = {
  login: (username, password) =>
    API.post("/auth/login", { username, password }),
  register: (data) => API.post("/auth/register", data),
  getProfile: () => API.get("/auth/profile"),
  updateProfile: (data) => API.put("/auth/profile", data),
  changePassword: (currentPassword, newPassword) =>
    API.put("/auth/change-password", { currentPassword, newPassword }),
};

// Movies API
const MoviesAPI = {
  getNowShowing: (limit = 8) => API.get(`/movies/now-showing?limit=${limit}`),
  getComingSoon: (limit = 4) => API.get(`/movies/coming-soon?limit=${limit}`),
  getAll: (page = 1, limit = 12, status = "") =>
    API.get(
      `/movies?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`
    ),
  getById: (id) => API.get(`/movies/${id}`),
  search: (keyword) =>
    API.get(`/movies/search?keyword=${encodeURIComponent(keyword)}`),
  getReviews: (id, page = 1) => API.get(`/movies/${id}/reviews?page=${page}`),
  addReview: (id, rating, comment) =>
    API.post(`/movies/${id}/reviews`, { rating, comment }),
};

// Showtimes API
const ShowtimesAPI = {
  getByMovie: (movieId, date = "") =>
    API.get(`/showtimes/movie/${movieId}${date ? `?date=${date}` : ""}`),
  getByCinema: (cinemaId, date = "") =>
    API.get(`/showtimes/cinema/${cinemaId}${date ? `?date=${date}` : ""}`),
  getDetail: (id) => API.get(`/showtimes/${id}`),
  getSeats: (id) => API.get(`/showtimes/${id}/seats`),
  lockSeats: (id, seatIds) =>
    API.post(`/showtimes/${id}/lock-seats`, { seatIds }),
  unlockSeats: (id, seatIds = null) =>
    API.post(`/showtimes/${id}/unlock-seats`, seatIds ? { seatIds } : {}),
  getCinemasShowingMovie: (movieId, date = "") =>
    API.get(
      `/showtimes/movie/${movieId}/cinemas${date ? `?date=${date}` : ""}`
    ),
};

// Bookings API
const BookingsAPI = {
  create: (showtimeId, seatIds) =>
    API.post("/bookings", { showtimeId, seatIds }),
  getMyBookings: (page = 1) => API.get(`/bookings/my-bookings?page=${page}`),
  getById: (id) => API.get(`/bookings/${id}`),
  getByCode: (code) => API.get(`/bookings/code/${code}`),
  confirmPayment: (id, paymentMethod = "cash") =>
    API.post(`/bookings/${id}/payment`, { paymentMethod }),
  cancel: (id) => API.post(`/bookings/${id}/cancel`),
};

// Cinemas API
const CinemasAPI = {
  getAll: () => API.get("/cinemas"),
  getById: (id) => API.get(`/cinemas/${id}`),
  getCities: () => API.get("/cinemas/cities"),
  getByCity: (city) => API.get(`/cinemas/city/${encodeURIComponent(city)}`),
};

// Admin API
const AdminAPI = {
  getDashboard: () => API.get("/admin/dashboard"),

  // Movies
  createMovie: (data) => API.post("/admin/movies", data),
  updateMovie: (id, data) => API.put(`/admin/movies/${id}`, data),
  deleteMovie: (id) => API.delete(`/admin/movies/${id}`),

  // Cinemas
  createCinema: (data) => API.post("/admin/cinemas", data),
  updateCinema: (id, data) => API.put(`/admin/cinemas/${id}`, data),
  deleteCinema: (id) => API.delete(`/admin/cinemas/${id}`),

  // Rooms
  getRoomsByCinema: (cinemaId) => API.get(`/admin/cinemas/${cinemaId}/rooms`),
  createRoom: (data) => API.post("/admin/rooms", data),
  updateRoom: (id, data) => API.put(`/admin/rooms/${id}`, data),
  deleteRoom: (id) => API.delete(`/admin/rooms/${id}`),

  // Seats
  getSeatsByRoom: (roomId) => API.get(`/admin/rooms/${roomId}/seats`),
  updateSeat: (id, data) => API.put(`/admin/seats/${id}`, data),

  // Showtimes
  getShowtimes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return API.get(`/admin/showtimes${query ? `?${query}` : ""}`);
  },
  createShowtime: (data) => API.post("/admin/showtimes", data),
  updateShowtime: (id, data) => API.put(`/admin/showtimes/${id}`, data),
  cancelShowtime: (id) => API.post(`/admin/showtimes/${id}/cancel`),

  // Stats
  getRevenueByDate: (startDate, endDate) =>
    API.get(`/admin/stats/revenue?startDate=${startDate}&endDate=${endDate}`),
  getRevenueByMovie: () => API.get("/admin/stats/revenue/movie"),
  getRevenueByCinema: () => API.get("/admin/stats/revenue/cinema"),

  // Users
  getUsers: (page = 1) => API.get(`/admin/users?page=${page}`),

  // Bookings
  getBookings: (status = "") =>
    API.get(`/admin/bookings${status ? `?status=${status}` : ""}`),
};
