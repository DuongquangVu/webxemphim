// Bookings history page JavaScript - Dark Theme Version

let bookingsData = [];
let currentFilter = "all";

// DOM Elements
const bookingsList = document.getElementById("bookingsList");
const emptyState = document.getElementById("emptyState");

// Khởi tạo trang
document.addEventListener("DOMContentLoaded", async () => {
  // Kiểm tra đăng nhập
  if (!API.getToken()) {
    showToast("Vui lòng đăng nhập để xem lịch sử đặt vé!", "warning");
    setTimeout(() => (window.location.href = "/?login=true"), 2000);
    return;
  }

  await loadBookings();
  setupEventListeners();
});

// Load danh sách đặt vé
async function loadBookings() {
  try {
    bookingsList.innerHTML =
      '<div class="loading-spinner"><div class="spinner"></div><p>Đang tải...</p></div>';

    const response = await API.get("/bookings/my-bookings");
    // API trả về data, map payment_status thành status
    bookingsData = (response.data || []).map((booking) => ({
      ...booking,
      status: booking.payment_status,
      movie_poster: booking.poster_url,
      showtime: booking.start_time, // Map start_time từ API
    }));

    updateFilterCounts();
    renderBookings();
  } catch (error) {
    console.error("Error loading bookings:", error);
    bookingsList.innerHTML =
      '<div style="text-align:center;color:var(--text-muted);padding:40px;">Có lỗi xảy ra khi tải dữ liệu!</div>';
  }
}

// Update filter counts
function updateFilterCounts() {
  const counts = {
    all: bookingsData.length,
    confirmed: bookingsData.filter(
      (b) => b.status === "confirmed" || b.status === "paid"
    ).length,
    pending: bookingsData.filter((b) => b.status === "pending").length,
    cancelled: bookingsData.filter((b) => b.status === "cancelled").length,
  };

  document.getElementById("countAll").textContent = counts.all;
  document.getElementById("countConfirmed").textContent = counts.confirmed;
  document.getElementById("countPending").textContent = counts.pending;
  document.getElementById("countCancelled").textContent = counts.cancelled;
}

// Render danh sách booking
function renderBookings() {
  let filteredBookings;

  if (currentFilter === "all") {
    filteredBookings = bookingsData;
  } else if (currentFilter === "confirmed") {
    // Confirmed bao gồm cả paid
    filteredBookings = bookingsData.filter(
      (b) => b.status === "confirmed" || b.status === "paid"
    );
  } else {
    filteredBookings = bookingsData.filter((b) => b.status === currentFilter);
  }

  if (filteredBookings.length === 0) {
    bookingsList.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  bookingsList.innerHTML = filteredBookings
    .map(
      (booking) => `
    <div class="booking-card">
      <div class="booking-card-header">
        <span class="booking-id">
          <i class="fas fa-ticket-alt"></i> ${booking.booking_code}
        </span>
        <span class="booking-status ${booking.status}">${getStatusText(
        booking.status
      )}</span>
      </div>
      <div class="booking-card-body">
        <div class="booking-movie-poster">
          <img src="${booking.movie_poster || "/images/no-poster.jpg"}" alt="${
        booking.movie_title
      }">
        </div>
        <div class="booking-details">
          <h3 class="booking-movie-title">${booking.movie_title}</h3>
          <div class="booking-info-row">
            <i class="fas fa-building"></i>
            <span>${booking.cinema_name}</span>
          </div>
          <div class="booking-info-row">
            <i class="fas fa-door-open"></i>
            <span>${booking.room_name}</span>
          </div>
          <div class="booking-info-row">
            <i class="fas fa-calendar"></i>
            <span>${formatDate(booking.showtime)}</span>
          </div>
          <div class="booking-info-row">
            <i class="fas fa-clock"></i>
            <span>${formatTime(booking.showtime)}</span>
          </div>
          <div class="booking-seats">
            ${(booking.seats || "")
              .split(", ")
              .map((seat) => `<span class="booking-seat-tag">${seat}</span>`)
              .join("")}
          </div>
        </div>
        <div class="booking-price-section">
          <div class="booking-total">
            <span class="booking-total-label">Tổng tiền</span>
            <span class="booking-total-value">${formatCurrency(
              booking.total_amount
            )}</span>
          </div>
          <div class="booking-actions">
            <button class="btn btn-outline" onclick="viewBookingDetail(${
              booking.id
            })">
              <i class="fas fa-eye"></i> Chi tiết
            </button>
            ${
              booking.status === "confirmed" &&
              isShowtimePassed(booking.showtime)
                ? `
              <button class="btn btn-primary" onclick="openReviewModal(${booking.movie_id}, '${booking.movie_title}')">
                <i class="fas fa-star"></i> Đánh giá
              </button>
            `
                : ""
            }
            ${
              booking.status === "pending"
                ? `
              <button class="btn btn-primary" onclick="continuePayment(${booking.id})">
                <i class="fas fa-credit-card"></i> Thanh toán
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
      <div class="booking-card-footer">
        <span class="booking-date">
          <i class="fas fa-clock"></i> Đặt ngày ${formatDate(
            booking.created_at
          )}
        </span>
      </div>
    </div>
  `
    )
    .join("");
}

// Lấy text trạng thái
function getStatusText(status) {
  const statusMap = {
    pending: "Chờ thanh toán",
    confirmed: "Đã xác nhận",
    paid: "Đã thanh toán",
    cancelled: "Đã hủy",
    expired: "Đã hết hạn",
  };
  return statusMap[status] || status;
}

// Format date
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time
function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Kiểm tra suất chiếu đã qua chưa
function isShowtimePassed(dateString) {
  return new Date(dateString) < new Date();
}

// Setup event listeners
function setupEventListeners() {
  // Filter tabs
  document.querySelectorAll(".filter-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.status;
      renderBookings();
    });
  });

  // Review form
  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", submitReview);
  }

  // Star rating
  document.querySelectorAll("#starRating i").forEach((star) => {
    star.addEventListener("click", () => {
      const rating = star.dataset.rating;
      document.getElementById("ratingValue").value = rating;
      updateStars(rating);
    });

    star.addEventListener("mouseenter", () => {
      updateStars(star.dataset.rating);
    });
  });

  const starRating = document.getElementById("starRating");
  if (starRating) {
    starRating.addEventListener("mouseleave", () => {
      updateStars(document.getElementById("ratingValue").value);
    });
  }
}

// Update star display
function updateStars(rating) {
  document.querySelectorAll("#starRating i").forEach((star) => {
    star.classList.toggle("active", star.dataset.rating <= rating);
  });
}

// Xem chi tiết booking
async function viewBookingDetail(bookingId) {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    const booking = response.booking;
    const tickets = response.tickets || [];

    const content = document.getElementById("bookingDetailContent");
    content.innerHTML = `
            <div class="booking-detail">
                <div class="detail-section">
                    <h4><i class="fas fa-film"></i> Thông tin phim</h4>
                    <div class="movie-detail-info">
                        <img src="${
                          booking.movie_poster || "/images/no-poster.jpg"
                        }" alt="${booking.movie_title}">
                        <div>
                            <h3>${booking.movie_title}</h3>
                            <p><i class="fas fa-map-marker-alt"></i> ${
                              booking.cinema_name
                            } - ${booking.room_name}</p>
                            <p><i class="fas fa-calendar"></i> ${formatDate(
                              booking.showtime
                            )}</p>
                            <p><i class="fas fa-clock"></i> ${formatTime(
                              booking.showtime
                            )}</p>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-couch"></i> Danh sách ghế</h4>
                    <div class="tickets-list">
                        ${tickets
                          .map(
                            (ticket) => `
                            <div class="ticket-item ${ticket.seat_type}">
                                <div class="seat-name">${ticket.row_number}${
                              ticket.seat_number
                            }</div>
                                <div class="seat-type">${
                                  ticket.seat_type === "vip" ? "VIP" : "Thường"
                                }</div>
                                <div class="seat-price">${formatCurrency(
                                  ticket.price
                                )}</div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-credit-card"></i> Thanh toán</h4>
                    <div class="payment-info">
                        <p>
                            <span>Trạng thái:</span>
                            <span class="booking-status ${
                              booking.status
                            }">${getStatusText(booking.status)}</span>
                        </p>
                        <p>
                            <span>Phương thức:</span>
                            <span>${
                              booking.payment_method || "Chưa thanh toán"
                            }</span>
                        </p>
                        <p>
                            <span>Số ghế:</span>
                            <span>${tickets.length} ghế</span>
                        </p>
                        <p>
                            <span>Tổng tiền:</span>
                            <span class="total-amount">${formatCurrency(
                              booking.total_amount
                            )}</span>
                        </p>
                    </div>
                </div>

                <div class="detail-actions">
                    ${
                      booking.status === "confirmed"
                        ? `
                        <button class="btn btn-outline" onclick="printTicket(${booking.id})">
                            <i class="fas fa-print"></i> In vé
                        </button>
                    `
                        : ""
                    }
                    <button class="btn btn-primary" onclick="closeModal('bookingDetailModal')">
                        Đóng
                    </button>
                </div>
            </div>
        `;

    document.getElementById("bookingDetailModal").classList.add("active");
  } catch (error) {
    console.error("Error loading booking detail:", error);
    alert("Không thể tải chi tiết đặt vé!");
  }
}

// In vé
function printTicket(bookingId) {
  // Tạo trang in vé
  window.open(`/print-ticket.html?id=${bookingId}`, "_blank");
}

// Tiếp tục thanh toán
function continuePayment(bookingId) {
  // Chuyển đến trang thanh toán
  window.location.href = `/payment.html?booking=${bookingId}`;
}

// Xem chi tiết booking
async function viewBookingDetail(bookingId) {
  const detailContent = document.getElementById("bookingDetailContent");
  if (!detailContent) return;

  // Hiển thị loading
  detailContent.innerHTML =
    '<div class="loading-spinner"><div class="spinner"></div></div>';
  document.getElementById("bookingDetailModal").classList.add("active");

  try {
    const response = await API.get(`/bookings/${bookingId}`);
    const booking = response.data || response.booking || response;

    // Render chi tiết vé
    detailContent.innerHTML = `
      <div class="ticket-header">
        <div class="ticket-logo">
          <i class="fas fa-film"></i>
          <span>CinemaBooking</span>
        </div>
        <div class="ticket-status ${booking.payment_status}">
          ${getStatusText(booking.payment_status)}
        </div>
      </div>

      <div class="ticket-movie">
        <img src="${booking.poster_url || "/images/no-poster.jpg"}" alt="${
      booking.movie_title
    }" class="ticket-poster">
        <div class="ticket-movie-info">
          <h2>${booking.movie_title || "N/A"}</h2>
          <p class="ticket-duration"><i class="fas fa-clock"></i> ${
            booking.duration || 0
          } phút</p>
        </div>
      </div>

      <div class="ticket-details">
        <div class="ticket-row">
          <div class="ticket-label">Mã đặt vé</div>
          <div class="ticket-value booking-code">${booking.booking_code}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label"><i class="fas fa-building"></i> Rạp</div>
          <div class="ticket-value">${booking.cinema_name || "N/A"}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label"><i class="fas fa-door-open"></i> Phòng</div>
          <div class="ticket-value">${booking.room_name || "N/A"}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label"><i class="fas fa-calendar"></i> Ngày chiếu</div>
          <div class="ticket-value">${formatDate(booking.start_time)}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label"><i class="fas fa-clock"></i> Giờ chiếu</div>
          <div class="ticket-value">${formatTime(booking.start_time)}</div>
        </div>
        <div class="ticket-row">
          <div class="ticket-label"><i class="fas fa-couch"></i> Ghế</div>
          <div class="ticket-value ticket-seats">
            ${renderTicketSeats(booking.tickets || [])}
          </div>
        </div>
      </div>

      <div class="ticket-price">
        <div class="ticket-price-row">
          <span>Số vé</span>
          <span>${
            booking.ticket_count || booking.tickets?.length || 0
          } vé</span>
        </div>
        <div class="ticket-price-row total">
          <span>Tổng tiền</span>
          <span class="price">${formatCurrency(booking.total_amount)}</span>
        </div>
      </div>

      <div class="ticket-footer">
        <div class="ticket-barcode">
          <div class="barcode-lines"></div>
          <span>${booking.booking_code}</span>
        </div>
        <p class="ticket-note">Vui lòng xuất trình mã này tại quầy để nhận vé</p>
      </div>
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

// Render ghế trong vé
function renderTicketSeats(tickets) {
  if (!tickets || tickets.length === 0) return "N/A";
  return tickets
    .map(
      (t) =>
        `<span class="seat-tag">${t.row_name || ""}${
          t.seat_number || ""
        }</span>`
    )
    .join("");
}

// Hủy booking
async function cancelBooking(bookingId) {
  if (!confirm("Bạn có chắc muốn hủy đặt vé này?")) return;

  try {
    await api.post(`/bookings/${bookingId}/cancel`);
    alert("Đã hủy đặt vé thành công!");
    await loadBookings();
  } catch (error) {
    console.error("Error cancelling booking:", error);
    alert(error.message || "Không thể hủy đặt vé!");
  }
}

// Mở modal đánh giá
let currentReviewMovieId = null;

function openReviewModal(movieId, movieTitle) {
  currentReviewMovieId = movieId;
  document.getElementById("reviewMovieId").value = movieId;
  document.getElementById("reviewComment").value = "";
  document.getElementById("ratingValue").value = 5;
  updateStars(5);

  document.getElementById("reviewModal").classList.add("active");
}

// Gửi đánh giá
async function submitReview(e) {
  e.preventDefault();

  const movieId = document.getElementById("reviewMovieId").value;
  const rating = document.getElementById("ratingValue").value;
  const comment = document.getElementById("reviewComment").value;

  try {
    await api.post(`/movies/${movieId}/reviews`, {
      rating: parseInt(rating),
      comment: comment,
    });

    alert("Cảm ơn bạn đã đánh giá!");
    closeModal("reviewModal");
  } catch (error) {
    console.error("Error submitting review:", error);
    alert(error.message || "Không thể gửi đánh giá!");
  }
}

// Close modal
window.closeModal = function (modalId) {
  document.getElementById(modalId).classList.remove("active");
};
