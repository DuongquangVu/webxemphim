// Admin Dashboard JavaScript

// Global data
let cinemasData = [];
let moviesData = [];
let roomsData = [];

// Khởi tạo
document.addEventListener("DOMContentLoaded", async () => {
  // Kiểm tra quyền admin
  const user = API.getUser();
  if (!user || user.role !== "admin") {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "/";
    return;
  }

  document.getElementById("adminName").textContent = user.name;

  // Setup navigation
  setupNavigation();

  // Setup forms
  setupForms();

  // Load initial data
  await loadDashboard();
  await loadBaseData();
});

// Setup navigation
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item[data-section]");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      // Update active state
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      // Show section
      const section = item.dataset.section;
      document
        .querySelectorAll(".content-section")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(`${section}Section`).classList.add("active");

      // Load section data
      loadSectionData(section);
    });
  });

  // Menu toggle for mobile
  document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("active");
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    API.removeToken();
    API.removeUser();
    window.location.href = "/";
  });
}

// Load base data (cinemas, movies)
async function loadBaseData() {
  try {
    const [cinemasRes, moviesRes] = await Promise.all([
      API.get("/cinemas"),
      API.get("/movies"),
    ]);

    cinemasData = cinemasRes.data || cinemasRes.cinemas || [];
    moviesData = moviesRes.data || moviesRes.movies || [];

    // Populate selects
    populateCinemaSelects();
    populateMovieSelects();
  } catch (error) {
    console.error("Error loading base data:", error);
  }
}

// Populate cinema selects
function populateCinemaSelects() {
  const selects = [
    "roomCinema",
    "showtimeCinema",
    "roomCinemaFilter",
    "showtimeCinemaFilter",
  ];

  selects.forEach((id) => {
    const select = document.getElementById(id);
    if (select) {
      const firstOption = select.querySelector("option");
      select.innerHTML = "";
      if (firstOption) select.appendChild(firstOption);

      cinemasData.forEach((cinema) => {
        const option = document.createElement("option");
        option.value = cinema.id;
        option.textContent = cinema.name;
        select.appendChild(option);
      });
    }
  });
}

// Populate movie selects
function populateMovieSelects() {
  const selects = ["showtimeMovie", "showtimeMovieFilter"];

  selects.forEach((id) => {
    const select = document.getElementById(id);
    if (select) {
      const firstOption = select.querySelector("option");
      select.innerHTML = "";
      if (firstOption) select.appendChild(firstOption);

      moviesData.forEach((movie) => {
        const option = document.createElement("option");
        option.value = movie.id;
        option.textContent = movie.title;
        select.appendChild(option);
      });
    }
  });
}

// Load section data
function loadSectionData(section) {
  switch (section) {
    case "dashboard":
      loadDashboard();
      break;
    case "movies":
      loadMovies();
      break;
    case "cinemas":
      loadCinemas();
      break;
    case "rooms":
      loadRooms();
      break;
    case "showtimes":
      loadShowtimes();
      break;
    case "bookings":
      loadBookings();
      break;
    case "users":
      loadUsers();
      break;
  }
}

// Load Dashboard
async function loadDashboard() {
  try {
    const response = await API.get("/admin/dashboard");

    document.getElementById("totalBookings").textContent =
      response.today_bookings || 0;
    document.getElementById("todayRevenue").textContent = formatCurrency(
      response.today_revenue || 0
    );
    document.getElementById("totalMovies").textContent =
      response.total_movies || 0;
    document.getElementById("totalUsers").textContent =
      response.total_users || 0;

    // Load recent bookings
    renderRecentBookings(response.recent_bookings || []);

    // Load revenue chart if Chart.js is available
    if (typeof Chart !== "undefined") {
      loadRevenueChart();
    }
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

// Render recent bookings
function renderRecentBookings(bookings) {
  const tbody = document.getElementById("recentBookingsTable");
  if (!tbody) return;

  if (!bookings || bookings.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center"><div class="empty-state"><i class="fas fa-ticket-alt"></i><p>Chưa có đặt vé nào</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = bookings
    .map(
      (booking) => `
        <tr>
            <td><span class="booking-id">${
              booking.booking_code || booking.id
            }</span></td>
            <td>${booking.user_name || "Khách"}</td>
            <td>${booking.movie_title || "N/A"}</td>
            <td>${formatDateTime(booking.showtime || booking.start_time)}</td>
            <td><strong>${formatCurrency(booking.total_amount)}</strong></td>
            <td><span class="status-badge ${getStatusClass(
              booking.status
            )}">${getStatusText(booking.status)}</span></td>
        </tr>
    `
    )
    .join("");
}

// Get status class for badge styling
function getStatusClass(status) {
  const statusMap = {
    pending: "pending",
    pending_payment: "pending-payment",
    confirmed: "confirmed",
    completed: "completed",
    paid: "paid",
    cancelled: "cancelled",
    canceled: "cancelled",
  };
  return statusMap[status] || "pending";
}

// Load revenue chart
async function loadRevenueChart() {
  try {
    const days = document.getElementById("revenueRange")?.value || 30;
    const response = await API.get(`/admin/stats/revenue?days=${days}`);

    const ctx = document.getElementById("revenueChart")?.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart
    if (window.revenueChartInstance) {
      window.revenueChartInstance.destroy();
    }

    window.revenueChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: response.labels || [],
        datasets: [
          {
            label: "Doanh thu (VNĐ)",
            data: response.data || [],
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatCurrency(value),
              color: "#94a3b8",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "#94a3b8",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error loading revenue chart:", error);
  }
}

// Load Movies
async function loadMovies() {
  const tbody = document.getElementById("moviesTable");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center">Đang tải...</td></tr>';

  try {
    const response = await API.get("/movies");
    const movies = response.data || response.movies || [];

    if (movies.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center">Chưa có phim nào</td></tr>';
      return;
    }

    tbody.innerHTML = movies
      .map(
        (movie) => `
            <tr>
                <td>${movie.id}</td>
                <td><img src="${
                  movie.poster_url || "/images/no-poster.jpg"
                }" alt="${
          movie.title
        }" class="table-poster" onerror="this.src='/images/no-poster.jpg'"></td>
                <td>${movie.title}</td>
                <td>${movie.genre || "N/A"}</td>
                <td>${movie.duration} phút</td>
                <td><span class="status-badge ${
                  movie.status
                }">${getMovieStatusText(movie.status)}</span></td>
                <td class="actions">
                    <button class="action-btn edit" onclick="editMovie(${
                      movie.id
                    })">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteMovie(${
                      movie.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading movies:", error);
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

// Load Cinemas
async function loadCinemas() {
  const tbody = document.getElementById("cinemasTable");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';

  try {
    const response = await API.get("/cinemas");
    const cinemas = response.data || response.cinemas || [];

    if (cinemas.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center">Chưa có rạp nào</td></tr>';
      return;
    }

    tbody.innerHTML = cinemas
      .map(
        (cinema) => `
            <tr>
                <td>${cinema.id}</td>
                <td>${cinema.name}</td>
                <td>${cinema.address}, ${cinema.city}</td>
                <td>${cinema.room_count || 0}</td>
                <td><span class="status-badge ${cinema.status || "active"}">${
          cinema.status === "active" ? "Hoạt động" : "Ngừng"
        }</span></td>
                <td class="actions">
                    <button class="action-btn edit" onclick="editCinema(${
                      cinema.id
                    })">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteCinema(${
                      cinema.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading cinemas:", error);
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

// Load Rooms
async function loadRooms() {
  const tbody = document.getElementById("roomsTable");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';

  try {
    const cinemaId = document.getElementById("roomCinemaFilter")?.value;
    let url = "/admin/rooms";
    if (cinemaId) url += `?cinema_id=${cinemaId}`;

    const response = await API.get(url);
    const rooms = response.data || response.rooms || [];

    if (rooms.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center">Chưa có phòng nào</td></tr>';
      return;
    }

    tbody.innerHTML = rooms
      .map(
        (room) => `
            <tr>
                <td>${room.id}</td>
                <td>${room.name}</td>
                <td>${room.cinema_name || "N/A"}</td>
                <td>${room.total_seats || 0}</td>
                <td>${room.room_type || "2D"}</td>
                <td class="actions">
                    <button class="action-btn edit" onclick="editRoom(${
                      room.id
                    })">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteRoom(${
                      room.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading rooms:", error);
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

// Load Showtimes
async function loadShowtimes() {
  const tbody = document.getElementById("showtimesTable");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';

  try {
    const cinemaId = document.getElementById("showtimeCinemaFilter")?.value;
    const movieId = document.getElementById("showtimeMovieFilter")?.value;
    const date = document.getElementById("showtimeDateFilter")?.value;

    let params = [];
    if (cinemaId) params.push(`cinema_id=${cinemaId}`);
    if (movieId) params.push(`movie_id=${movieId}`);
    if (date) params.push(`date=${date}`);

    let url = "/admin/showtimes";
    if (params.length > 0) url += "?" + params.join("&");

    const response = await API.get(url);
    const showtimes = response.data || response.showtimes || [];

    if (showtimes.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center">Chưa có suất chiếu nào</td></tr>';
      return;
    }

    tbody.innerHTML = showtimes
      .map(
        (st) => `
            <tr>
                <td>${st.id}</td>
                <td>${st.movie_title || "N/A"}</td>
                <td>${st.cinema_name || "N/A"} - ${st.room_name || "N/A"}</td>
                <td>${formatDateTime(st.start_time)}</td>
                <td>${formatCurrency(st.base_price)}</td>
                <td class="actions">
                    <button class="action-btn edit" onclick="editShowtime(${
                      st.id
                    })">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteShowtime(${
                      st.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading showtimes:", error);
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

// Load Bookings
async function loadBookings() {
  const tbody = document.getElementById("bookingsTable");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="8" class="text-center">Đang tải...</td></tr>';

  try {
    const status = document.getElementById("bookingStatusFilter")?.value;
    const date = document.getElementById("bookingDateFilter")?.value;

    let params = [];
    if (status) params.push(`status=${status}`);
    if (date) params.push(`date=${date}`);

    let url = "/admin/bookings";
    if (params.length > 0) url += "?" + params.join("&");

    const response = await API.get(url);
    const bookings = response.data || response.bookings || [];

    if (bookings.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="text-center">Chưa có đặt vé nào</td></tr>';
      return;
    }

    tbody.innerHTML = bookings
      .map(
        (booking) => `
            <tr>
                <td><span class="booking-id">${
                  booking.booking_code || booking.id
                }</span></td>
                <td>${booking.user_name || booking.username || "N/A"}</td>
                <td>${booking.movie_title || "N/A"}</td>
                <td>${booking.cinema_name || "N/A"}</td>
                <td>${formatDateTime(
                  booking.start_time || booking.showtime
                )}</td>
                <td><strong>${formatCurrency(
                  booking.total_amount
                )}</strong></td>
                <td><span class="status-badge ${getStatusClass(
                  booking.payment_status || booking.status
                )}">${getStatusText(
          booking.payment_status || booking.status
        )}</span></td>
                <td class="actions">
                    ${getBookingActions(booking)}
                </td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading bookings:", error);
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

// Lấy các nút hành động cho booking
function getBookingActions(booking) {
  const status = booking.payment_status || booking.status;
  let actions = `
    <button class="action-btn view" onclick="viewBooking(${booking.id})" title="Xem chi tiết">
      <i class="fas fa-eye"></i>
    </button>
  `;

  // Nếu đang chờ thanh toán -> hiện nút xác nhận và hủy
  if (status === "pending") {
    actions += `
      <button class="action-btn confirm" onclick="confirmBookingPayment(${booking.id}, '${booking.booking_code}')" title="Xác nhận đã thanh toán">
        <i class="fas fa-check"></i>
      </button>
      <button class="action-btn delete" onclick="cancelAdminBooking(${booking.id}, '${booking.booking_code}')" title="Hủy đơn">
        <i class="fas fa-times"></i>
      </button>
    `;
  }

  return actions;
}

// Xác nhận thanh toán booking
async function confirmBookingPayment(bookingId, bookingCode) {
  if (!confirm(`Xác nhận đã thanh toán cho đơn ${bookingCode}?`)) return;

  try {
    const response = await API.post(`/admin/bookings/${bookingId}/confirm`, {
      payment_method: "cash",
    });

    showToast(response.message || "Xác nhận thanh toán thành công!", "success");
    loadBookings();
  } catch (error) {
    console.error("Confirm payment error:", error);
    showToast(error.message || "Lỗi khi xác nhận thanh toán", "error");
  }
}

// Hủy booking (admin)
async function cancelAdminBooking(bookingId, bookingCode) {
  if (!confirm(`Bạn có chắc muốn HỦY đơn đặt vé ${bookingCode}?`)) return;

  try {
    const response = await API.post(`/admin/bookings/${bookingId}/cancel`);

    showToast(response.message || "Hủy đơn thành công!", "success");
    loadBookings();
  } catch (error) {
    console.error("Cancel booking error:", error);
    showToast(error.message || "Lỗi khi hủy đơn", "error");
  }
}

// Load Users
async function loadUsers() {
  const tbody = document.getElementById("usersTable");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center">Đang tải...</td></tr>';

  try {
    const response = await API.get("/admin/users");
    const users = response.data || response.users || [];

    if (users.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center">Chưa có người dùng nào</td></tr>';
      return;
    }

    tbody.innerHTML = users
      .map(
        (user) => `
            <tr>
                <td>${user.id}</td>
                <td>${user.full_name || user.username}</td>
                <td>${user.email}</td>
                <td>${user.phone || "-"}</td>
                <td><span class="status-badge ${
                  user.role === "admin" ? "active" : ""
                }">${user.role === "admin" ? "Admin" : "Khách hàng"}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td class="actions">
                    <button class="action-btn edit" onclick="editUser(${
                      user.id
                    })">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading users:", error);
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

// Setup Forms
function setupForms() {
  // Movie form
  const movieForm = document.getElementById("movieForm");
  if (movieForm) movieForm.addEventListener("submit", saveMovie);

  // Cinema form
  const cinemaForm = document.getElementById("cinemaForm");
  if (cinemaForm) cinemaForm.addEventListener("submit", saveCinema);

  // Room form
  const roomForm = document.getElementById("roomForm");
  if (roomForm) roomForm.addEventListener("submit", saveRoom);

  // Showtime form
  const showtimeForm = document.getElementById("showtimeForm");
  if (showtimeForm) showtimeForm.addEventListener("submit", saveShowtime);

  // Cinema change for room selection
  const showtimeCinema = document.getElementById("showtimeCinema");
  if (showtimeCinema)
    showtimeCinema.addEventListener("change", loadRoomsForCinema);

  // Filter changes
  const roomCinemaFilter = document.getElementById("roomCinemaFilter");
  if (roomCinemaFilter) roomCinemaFilter.addEventListener("change", loadRooms);

  const showtimeCinemaFilter = document.getElementById("showtimeCinemaFilter");
  if (showtimeCinemaFilter)
    showtimeCinemaFilter.addEventListener("change", loadShowtimes);

  const showtimeMovieFilter = document.getElementById("showtimeMovieFilter");
  if (showtimeMovieFilter)
    showtimeMovieFilter.addEventListener("change", loadShowtimes);

  const showtimeDateFilter = document.getElementById("showtimeDateFilter");
  if (showtimeDateFilter)
    showtimeDateFilter.addEventListener("change", loadShowtimes);

  const bookingStatusFilter = document.getElementById("bookingStatusFilter");
  if (bookingStatusFilter)
    bookingStatusFilter.addEventListener("change", loadBookings);

  const bookingDateFilter = document.getElementById("bookingDateFilter");
  if (bookingDateFilter)
    bookingDateFilter.addEventListener("change", loadBookings);

  const revenueRange = document.getElementById("revenueRange");
  if (revenueRange) revenueRange.addEventListener("change", loadRevenueChart);
}

// Load rooms for cinema (in showtime form)
async function loadRoomsForCinema() {
  const cinemaId = document.getElementById("showtimeCinema")?.value;
  const roomSelect = document.getElementById("showtimeRoom");
  if (!roomSelect) return;

  roomSelect.innerHTML = '<option value="">Chọn phòng</option>';

  if (!cinemaId) return;

  try {
    const response = await API.get(`/admin/rooms?cinema_id=${cinemaId}`);
    const rooms = response.data || response.rooms || [];

    rooms.forEach((room) => {
      const option = document.createElement("option");
      option.value = room.id;
      option.textContent = room.name;
      roomSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading rooms:", error);
  }
}

// Movie CRUD
function openMovieModal(movie = null) {
  const modalTitle = document.getElementById("movieModalTitle");
  const form = document.getElementById("movieForm");
  if (modalTitle) modalTitle.textContent = movie ? "Sửa phim" : "Thêm phim mới";
  if (form) form.reset();

  if (movie) {
    setFormValue("movieId", movie.id);
    setFormValue("movieTitle", movie.title);
    setFormValue("movieGenre", movie.genre);
    setFormValue("movieDuration", movie.duration);
    setFormValue(
      "movieReleaseDate",
      movie.release_date ? movie.release_date.split("T")[0] : ""
    );
    setFormValue("movieDirector", movie.director);
    setFormValue("movieRating", movie.rating || "P");
    setFormValue("movieCast", movie.actors || movie.cast);
    setFormValue("moviePoster", movie.poster_url);
    setFormValue("movieTrailer", movie.trailer_url);
    setFormValue("movieDescription", movie.description);
    setFormValue("movieStatus", movie.status || "now_showing");
  } else {
    setFormValue("movieId", "");
  }

  const modal = document.getElementById("movieModal");
  if (modal) modal.classList.add("active");
}

async function editMovie(id) {
  try {
    const response = await API.get(`/movies/${id}`);
    const movie = response.data || response.movie || response;
    openMovieModal(movie);
  } catch (error) {
    alert("Không thể tải thông tin phim!");
  }
}

async function saveMovie(e) {
  e.preventDefault();

  const id = document.getElementById("movieId")?.value;
  const data = {
    title: document.getElementById("movieTitle")?.value,
    genre: document.getElementById("movieGenre")?.value,
    duration: parseInt(document.getElementById("movieDuration")?.value),
    release_date: document.getElementById("movieReleaseDate")?.value,
    director: document.getElementById("movieDirector")?.value,
    rating: document.getElementById("movieRating")?.value,
    actors: document.getElementById("movieCast")?.value,
    poster_url: document.getElementById("moviePoster")?.value,
    trailer_url: document.getElementById("movieTrailer")?.value,
    description: document.getElementById("movieDescription")?.value,
    status: document.getElementById("movieStatus")?.value,
  };

  try {
    if (id) {
      await API.put(`/admin/movies/${id}`, data);
    } else {
      await API.post("/admin/movies", data);
    }

    closeModal("movieModal");
    loadMovies();
    loadBaseData();
    showToast("Lưu phim thành công!", "success");
  } catch (error) {
    showToast(error.message || "Có lỗi xảy ra!", "error");
  }
}

async function deleteMovie(id) {
  if (!confirm("Bạn có chắc muốn xóa phim này?")) return;

  try {
    await API.delete(`/admin/movies/${id}`);
    loadMovies();
    loadBaseData();
    showToast("Xóa phim thành công!", "success");
  } catch (error) {
    showToast(error.message || "Không thể xóa phim!", "error");
  }
}

// Cinema CRUD
function openCinemaModal(cinema = null) {
  const modalTitle = document.getElementById("cinemaModalTitle");
  const form = document.getElementById("cinemaForm");
  if (modalTitle) modalTitle.textContent = cinema ? "Sửa rạp" : "Thêm rạp mới";
  if (form) form.reset();

  if (cinema) {
    setFormValue("cinemaId", cinema.id);
    setFormValue("cinemaName", cinema.name);
    setFormValue("cinemaAddress", cinema.address);
    setFormValue("cinemaCity", cinema.city);
    setFormValue("cinemaPhone", cinema.phone);
  } else {
    setFormValue("cinemaId", "");
  }

  const modal = document.getElementById("cinemaModal");
  if (modal) modal.classList.add("active");
}

async function editCinema(id) {
  try {
    const response = await API.get(`/cinemas/${id}`);
    const cinema = response.data || response.cinema || response;
    openCinemaModal(cinema);
  } catch (error) {
    alert("Không thể tải thông tin rạp!");
  }
}

async function saveCinema(e) {
  e.preventDefault();

  const id = document.getElementById("cinemaId")?.value;
  const data = {
    name: document.getElementById("cinemaName")?.value,
    address: document.getElementById("cinemaAddress")?.value,
    city: document.getElementById("cinemaCity")?.value,
    phone: document.getElementById("cinemaPhone")?.value,
  };

  try {
    if (id) {
      await API.put(`/admin/cinemas/${id}`, data);
    } else {
      await API.post("/admin/cinemas", data);
    }

    closeModal("cinemaModal");
    loadCinemas();
    loadBaseData();
    showToast("Lưu rạp thành công!", "success");
  } catch (error) {
    showToast(error.message || "Có lỗi xảy ra!", "error");
  }
}

async function deleteCinema(id) {
  if (!confirm("Bạn có chắc muốn xóa rạp này?")) return;

  try {
    await API.delete(`/admin/cinemas/${id}`);
    loadCinemas();
    loadBaseData();
    showToast("Xóa rạp thành công!", "success");
  } catch (error) {
    showToast(error.message || "Không thể xóa rạp!", "error");
  }
}

// Room CRUD
function openRoomModal(room = null) {
  const modalTitle = document.getElementById("roomModalTitle");
  const form = document.getElementById("roomForm");
  if (modalTitle)
    modalTitle.textContent = room ? "Sửa phòng" : "Thêm phòng mới";
  if (form) form.reset();

  if (room) {
    setFormValue("roomId", room.id);
    setFormValue("roomCinema", room.cinema_id);
    setFormValue("roomName", room.name);
    setFormValue("roomType", room.room_type || "2D");
    setFormValue("roomRows", room.rows_count);
    setFormValue("roomSeatsPerRow", room.columns_count);
  } else {
    setFormValue("roomId", "");
  }

  const modal = document.getElementById("roomModal");
  if (modal) modal.classList.add("active");
}

async function editRoom(id) {
  try {
    const response = await API.get(`/admin/rooms/${id}`);
    const room = response.data || response.room || response;
    openRoomModal(room);
  } catch (error) {
    alert("Không thể tải thông tin phòng!");
  }
}

async function saveRoom(e) {
  e.preventDefault();

  const id = document.getElementById("roomId")?.value;
  const data = {
    cinema_id: document.getElementById("roomCinema")?.value,
    name: document.getElementById("roomName")?.value,
    room_type: document.getElementById("roomType")?.value,
    rows: parseInt(document.getElementById("roomRows")?.value) || 8,
    seats_per_row:
      parseInt(document.getElementById("roomSeatsPerRow")?.value) || 10,
  };

  try {
    if (id) {
      await API.put(`/admin/rooms/${id}`, data);
    } else {
      await API.post("/admin/rooms", data);
    }

    closeModal("roomModal");
    loadRooms();
    showToast("Lưu phòng thành công!", "success");
  } catch (error) {
    showToast(error.message || "Có lỗi xảy ra!", "error");
  }
}

async function deleteRoom(id) {
  if (!confirm("Bạn có chắc muốn xóa phòng này?")) return;

  try {
    await API.delete(`/admin/rooms/${id}`);
    loadRooms();
    showToast("Xóa phòng thành công!", "success");
  } catch (error) {
    showToast(error.message || "Không thể xóa phòng!", "error");
  }
}

// Showtime CRUD
function openShowtimeModal(showtime = null) {
  const modalTitle = document.getElementById("showtimeModalTitle");
  const form = document.getElementById("showtimeForm");
  if (modalTitle)
    modalTitle.textContent = showtime ? "Sửa suất chiếu" : "Thêm suất chiếu";
  if (form) form.reset();

  // Set default date to today
  setFormValue("showtimeDate", new Date().toISOString().split("T")[0]);

  if (showtime) {
    setFormValue("showtimeId", showtime.id);
    setFormValue("showtimeMovie", showtime.movie_id);
    setFormValue("showtimeCinema", showtime.cinema_id);

    // Load rooms then set value
    loadRoomsForCinema().then(() => {
      setFormValue("showtimeRoom", showtime.room_id);
    });

    const startTime = new Date(showtime.start_time);
    setFormValue("showtimeDate", startTime.toISOString().split("T")[0]);
    setFormValue("showtimeTime", startTime.toTimeString().slice(0, 5));
    setFormValue("showtimeBasePrice", showtime.base_price);
  } else {
    setFormValue("showtimeId", "");
  }

  const modal = document.getElementById("showtimeModal");
  if (modal) modal.classList.add("active");
}

async function editShowtime(id) {
  try {
    const response = await API.get(`/showtimes/${id}`);
    const showtime = response.data || response.showtime || response;
    openShowtimeModal(showtime);
  } catch (error) {
    alert("Không thể tải thông tin suất chiếu!");
  }
}

async function saveShowtime(e) {
  e.preventDefault();

  const id = document.getElementById("showtimeId")?.value;
  const date = document.getElementById("showtimeDate")?.value;
  const time = document.getElementById("showtimeTime")?.value;

  const data = {
    movie_id: document.getElementById("showtimeMovie")?.value,
    room_id: document.getElementById("showtimeRoom")?.value,
    start_time: `${date}T${time}:00`,
    base_price:
      parseInt(document.getElementById("showtimeBasePrice")?.value) || 85000,
  };

  try {
    if (id) {
      await API.put(`/admin/showtimes/${id}`, data);
    } else {
      await API.post("/admin/showtimes", data);
    }

    closeModal("showtimeModal");
    loadShowtimes();
    showToast("Lưu suất chiếu thành công!", "success");
  } catch (error) {
    showToast(error.message || "Có lỗi xảy ra!", "error");
  }
}

async function deleteShowtime(id) {
  if (!confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;

  try {
    await API.delete(`/admin/showtimes/${id}`);
    loadShowtimes();
    showToast("Xóa suất chiếu thành công!", "success");
  } catch (error) {
    showToast(error.message || "Không thể xóa suất chiếu!", "error");
  }
}

// View booking detail
async function viewBooking(id) {
  // Tạo modal nếu chưa có
  let modal = document.getElementById("bookingDetailModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "bookingDetailModal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-overlay" onclick="closeModal('bookingDetailModal')"></div>
      <div class="modal-content modal-lg">
        <button class="modal-close" onclick="closeModal('bookingDetailModal')">
          <i class="fas fa-times"></i>
        </button>
        <h2><i class="fas fa-ticket-alt"></i> Chi Tiết Đặt Vé</h2>
        <div id="bookingDetailContent">
          <div class="loading-spinner"><div class="spinner"></div></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const detailContent = document.getElementById("bookingDetailContent");
  detailContent.innerHTML =
    '<div class="loading-spinner"><div class="spinner"></div></div>';
  modal.classList.add("active");

  try {
    const response = await API.get(`/bookings/${id}`);
    const booking = response.data || response;

    detailContent.innerHTML = `
      <div class="booking-detail-grid">
        <div class="detail-section">
          <h4><i class="fas fa-info-circle"></i> Thông tin đặt vé</h4>
          <div class="detail-row">
            <span class="detail-label">Mã đặt vé:</span>
            <span class="detail-value booking-code-highlight">${
              booking.booking_code
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Trạng thái:</span>
            <span class="detail-value">
              <span class="status-badge ${getStatusClass(
                booking.payment_status
              )}">${getStatusText(booking.payment_status)}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phương thức TT:</span>
            <span class="detail-value">${getPaymentMethodText(
              booking.payment_method
            )}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ngày đặt:</span>
            <span class="detail-value">${formatDateTime(
              booking.created_at
            )}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4><i class="fas fa-user"></i> Khách hàng</h4>
          <div class="detail-row">
            <span class="detail-label">Họ tên:</span>
            <span class="detail-value">${
              booking.full_name || booking.username || "N/A"
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${booking.email || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Điện thoại:</span>
            <span class="detail-value">${booking.phone || "N/A"}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4><i class="fas fa-film"></i> Phim & Suất chiếu</h4>
          <div class="detail-row">
            <span class="detail-label">Phim:</span>
            <span class="detail-value"><strong>${
              booking.movie_title || "N/A"
            }</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Rạp:</span>
            <span class="detail-value">${booking.cinema_name || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phòng:</span>
            <span class="detail-value">${booking.room_name || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Suất chiếu:</span>
            <span class="detail-value">${formatDateTime(
              booking.start_time
            )}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4><i class="fas fa-couch"></i> Ghế đã đặt</h4>
          <div class="detail-seats">
            ${renderAdminBookingSeats(booking.tickets || [])}
          </div>
        </div>

        <div class="detail-section total-section">
          <div class="detail-row total-row">
            <span class="detail-label">Tổng tiền:</span>
            <span class="detail-value total-amount">${formatCurrency(
              booking.total_amount
            )}</span>
          </div>
        </div>
      </div>

      ${
        booking.payment_status === "pending"
          ? `
        <div class="detail-actions">
          <button class="btn btn-success" onclick="confirmBookingPayment(${booking.id}, '${booking.booking_code}'); closeModal('bookingDetailModal');">
            <i class="fas fa-check"></i> Xác nhận thanh toán
          </button>
          <button class="btn btn-danger" onclick="cancelAdminBooking(${booking.id}, '${booking.booking_code}'); closeModal('bookingDetailModal');">
            <i class="fas fa-times"></i> Hủy đơn
          </button>
        </div>
      `
          : ""
      }
    `;
  } catch (error) {
    console.error("Error loading booking detail:", error);
    detailContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 15px;"></i>
        <p>Không thể tải chi tiết đặt vé</p>
      </div>
    `;
  }
}

// Render ghế cho admin booking detail
function renderAdminBookingSeats(tickets) {
  if (!tickets || tickets.length === 0)
    return '<span class="text-muted">Không có thông tin ghế</span>';
  return tickets
    .map(
      (t) => `
    <span class="seat-badge">
      <i class="fas fa-chair"></i> ${t.row_name || ""}${t.seat_number || ""} 
      <small>(${formatCurrency(t.price)})</small>
    </span>
  `
    )
    .join("");
}

// Lấy text phương thức thanh toán
function getPaymentMethodText(method) {
  const methodMap = {
    cash: "Tiền mặt tại quầy",
    credit_card: "Thẻ tín dụng",
    e_wallet: "Ví điện tử",
    bank_transfer: "Chuyển khoản",
  };
  return methodMap[method] || method || "N/A";
}

// Edit user
async function editUser(id) {
  showToast("Tính năng sửa người dùng - ID: " + id, "info");
}

// Helper functions
function setFormValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN");
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `<span style="white-space: nowrap;">${time}</span><br><small style="color: var(--text-muted);">${day}</small>`;
}

function getStatusText(status) {
  const map = {
    pending: "Chờ thanh toán",
    pending_payment: "Chờ thanh toán",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
    completed: "Hoàn thành",
    paid: "Đã thanh toán",
  };
  return map[status] || status || "N/A";
}

function getMovieStatusText(status) {
  const map = {
    now_showing: "Đang chiếu",
    coming_soon: "Sắp chiếu",
    ended: "Đã kết thúc",
  };
  return map[status] || status;
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function showToast(message, type = "info") {
  // Create toast if not exists
  let toast = document.getElementById("adminToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "adminToast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
