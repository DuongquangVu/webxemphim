// Booking page JavaScript - Dark Theme Version

// Biến toàn cục
let selectedSeats = [];
let seatsData = [];
let showtimeData = null;
let movieData = null;
let countdownInterval = null;
let lockExpireTime = null;

// Lấy showtime_id từ URL
const urlParams = new URLSearchParams(window.location.search);
const showtimeId = urlParams.get("showtime");

// DOM Elements
const seatMap = document.getElementById("seatMap");
const bookingBtn = document.getElementById("bookingBtn");
const countdownEl = document.getElementById("countdown");
const countdownTimer = document.getElementById("countdownTimer");

// Khởi tạo trang
document.addEventListener("DOMContentLoaded", async () => {
  if (!showtimeId) {
    showToast("Không tìm thấy thông tin suất chiếu!", "error");
    setTimeout(() => (window.location.href = "/"), 2000);
    return;
  }

  // Kiểm tra đăng nhập
  if (!isLoggedIn()) {
    showToast("Vui lòng đăng nhập để đặt vé!", "warning");
    setTimeout(() => (window.location.href = "/?login=true"), 2000);
    return;
  }

  await loadShowtimeInfo();
  await loadSeats();
  setupEventListeners();
});

// Load thông tin suất chiếu
async function loadShowtimeInfo() {
  try {
    const response = await API.get(`/showtimes/${showtimeId}`);
    showtimeData = response.showtime;
    movieData = response.movie;

    // Cập nhật UI với thông tin
    const posterImg = document.getElementById("moviePosterMini");
    if (posterImg) {
      posterImg.src = movieData.poster_url || "/images/no-poster.jpg";
      posterImg.alt = movieData.title;
    }

    const titleEl = document.getElementById("bookingMovieTitle");
    if (titleEl) titleEl.textContent = movieData.title;

    const cinemaEl = document.getElementById("bookingCinema");
    if (cinemaEl) cinemaEl.textContent = showtimeData.cinema_name;

    const roomEl = document.getElementById("bookingRoom");
    if (roomEl) roomEl.textContent = showtimeData.room_name;

    // Format date and time
    const showDate = new Date(showtimeData.start_time);

    const dateEl = document.getElementById("bookingDate");
    if (dateEl) {
      dateEl.textContent = showDate.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    const timeEl = document.getElementById("bookingTime");
    if (timeEl) {
      timeEl.textContent = showDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Hide loading, show content
    document.getElementById("pageLoading").classList.add("hidden");
    document.getElementById("bookingContent").classList.remove("hidden");
  } catch (error) {
    console.error("Error loading showtime:", error);
    showToast("Không thể tải thông tin suất chiếu!", "error");
  }
}

// Load danh sách ghế
async function loadSeats() {
  try {
    const response = await API.get(`/showtimes/${showtimeId}/seats`);
    seatsData = response.seats;
    renderSeatMap();
  } catch (error) {
    console.error("Error loading seats:", error);
    showToast("Không thể tải danh sách ghế!", "error");
  }
}

// Render seat map
function renderSeatMap() {
  if (!seatsData || seatsData.length === 0) {
    seatMap.innerHTML =
      '<p class="text-center" style="color: var(--text-muted);">Không có ghế nào!</p>';
    return;
  }

  // Nhóm ghế theo hàng
  const rows = {};
  seatsData.forEach((seat) => {
    const rowKey = seat.row_name || seat.row_number;
    if (!rows[rowKey]) {
      rows[rowKey] = [];
    }
    rows[rowKey].push(seat);
  });

  // Sắp xếp ghế trong mỗi hàng theo số ghế
  Object.keys(rows).forEach((row) => {
    rows[row].sort((a, b) => a.seat_number - b.seat_number);
  });

  // Render
  let html = "";
  const sortedRows = Object.keys(rows).sort();

  sortedRows.forEach((row) => {
    html += `
            <div class="seat-row">
                <span class="row-label">${row}</span>
                <div class="seats">
        `;

    rows[row].forEach((seat) => {
      const statusClass = getSeatStatusClass(seat);
      const typeClass = seat.seat_type === "vip" ? "vip" : "";
      const isDisabled = seat.booking_status !== "available";
      const basePrice = showtimeData?.base_price || 85000;
      const seatPrice = basePrice * (seat.price_modifier || 1);

      html += `
                <button class="seat ${typeClass} ${statusClass}" 
                        data-id="${seat.id}" 
                        data-row="${seat.row_name || seat.row_number}"
                        data-number="${seat.seat_number}"
                        data-type="${seat.seat_type}"
                        data-price="${seatPrice}"
                        ${isDisabled ? "disabled" : ""}>
                    ${seat.seat_number}
                </button>
            `;
    });

    html += `
                </div>
                <span class="row-label">${row}</span>
            </div>
        `;
  });

  seatMap.innerHTML = html;

  // Thêm event listener cho các ghế
  document.querySelectorAll(".seat:not([disabled])").forEach((seat) => {
    seat.addEventListener("click", () => toggleSeat(seat));
  });
}

// Xác định class trạng thái ghế
function getSeatStatusClass(seat) {
  if (seat.booking_status === "booked") return "booked";
  if (seat.booking_status === "locked") return "booked"; // Locked seats show as booked
  if (seat.status !== "active") return "disabled";
  return "available";
}

// Toggle chọn ghế
async function toggleSeat(seatEl) {
  const seatId = seatEl.dataset.id;
  const isSelected = seatEl.classList.contains("selected");

  if (isSelected) {
    // Bỏ chọn ghế
    await unlockSeat(seatId);
    seatEl.classList.remove("selected");
    seatEl.classList.add("available");
    selectedSeats = selectedSeats.filter((s) => s.id !== seatId);
  } else {
    // Kiểm tra số ghế tối đa
    if (selectedSeats.length >= 8) {
      showToast("Bạn chỉ có thể chọn tối đa 8 ghế!", "warning");
      return;
    }

    // Khóa ghế
    const locked = await lockSeat(seatId);
    if (locked) {
      seatEl.classList.remove("available");
      seatEl.classList.add("selected");
      selectedSeats.push({
        id: seatId,
        row: seatEl.dataset.row,
        number: seatEl.dataset.number,
        type: seatEl.dataset.type,
        price: parseFloat(seatEl.dataset.price),
      });
    }
  }

  updateSummary();
}

// Khóa ghế
async function lockSeat(seatId) {
  try {
    const response = await API.post(`/showtimes/${showtimeId}/lock-seats`, {
      seatIds: [parseInt(seatId)],
    });

    // Cập nhật thời gian hết hạn khóa
    if (response.expires_at) {
      lockExpireTime = new Date(response.expires_at);
      startCountdown();
    }

    return true;
  } catch (error) {
    console.error("Error locking seat:", error);
    showToast(
      error.message ||
        "Không thể chọn ghế. Ghế có thể đã được người khác chọn!",
      "error"
    );
    // Reload lại danh sách ghế
    await loadSeats();
    return false;
  }
}

// Mở khóa ghế
async function unlockSeat(seatId) {
  try {
    await API.post(`/showtimes/${showtimeId}/unlock-seats`, {
      seatIds: [parseInt(seatId)],
    });
    return true;
  } catch (error) {
    console.error("Error unlocking seat:", error);
    return false;
  }
}

// Cập nhật tóm tắt đặt vé
function updateSummary() {
  const seatsDisplay = document.getElementById("selectedSeatsDisplay");
  const ticketCount = document.getElementById("ticketCount");
  const totalAmount = document.getElementById("totalAmount");

  if (selectedSeats.length === 0) {
    seatsDisplay.innerHTML = '<span class="no-seats">Chưa chọn ghế</span>';
    ticketCount.textContent = "0";
    totalAmount.textContent = "0 ₫";
    bookingBtn.disabled = true;
    countdownEl.classList.add("hidden");
    return;
  }

  // Sắp xếp ghế
  const sortedSeats = [...selectedSeats].sort((a, b) => {
    if (a.row !== b.row) return a.row.localeCompare(b.row);
    return parseInt(a.number) - parseInt(b.number);
  });

  // Hiển thị danh sách ghế với tags
  seatsDisplay.innerHTML = sortedSeats
    .map((s) => `<span class="seat-tag">${s.row}${s.number}</span>`)
    .join("");

  // Số vé
  ticketCount.textContent = selectedSeats.length;

  // Tính tổng tiền
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  totalAmount.textContent = formatCurrency(total);

  // Hiển thị countdown
  countdownEl.classList.remove("hidden");

  bookingBtn.disabled = false;
}

// Bắt đầu đếm ngược
function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  const updateCountdown = () => {
    if (!lockExpireTime) return;

    const now = new Date();
    const diff = lockExpireTime - now;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      showToast("Thời gian giữ ghế đã hết. Vui lòng chọn lại!", "warning");
      setTimeout(() => window.location.reload(), 2000);
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    countdownTimer.textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // Add urgent class when less than 2 minutes
    if (diff < 120000) {
      countdownEl.classList.add("urgent");
    }
  };

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

// Format tiền tệ
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Setup event listeners
function setupEventListeners() {
  // Chọn phương thức thanh toán
  document.querySelectorAll(".payment-method").forEach((method) => {
    method.addEventListener("click", () => {
      document
        .querySelectorAll(".payment-method")
        .forEach((m) => m.classList.remove("selected"));
      method.classList.add("selected");
      method.querySelector("input").checked = true;
    });
  });

  // Mobile: Toggle booking summary
  const summary = document.getElementById("bookingSummary");
  if (summary && window.innerWidth <= 992) {
    const toggle = document.createElement("div");
    toggle.className = "booking-summary-toggle";
    toggle.innerHTML =
      '<span>Xem thông tin đặt vé</span><i class="fas fa-chevron-up"></i>';
    summary.insertBefore(toggle, summary.firstChild);

    toggle.addEventListener("click", () => {
      summary.classList.toggle("expanded");
      toggle.querySelector("i").classList.toggle("fa-chevron-up");
      toggle.querySelector("i").classList.toggle("fa-chevron-down");
    });
  }
}

// Tiến hành thanh toán
function proceedToPayment() {
  if (selectedSeats.length === 0) {
    showToast("Vui lòng chọn ghế trước!", "warning");
    return;
  }

  // Cập nhật thông tin trong modal
  const paymentMovieInfo = document.getElementById("paymentMovieInfo");
  if (paymentMovieInfo) {
    const showDate = new Date(showtimeData.start_time);
    paymentMovieInfo.innerHTML = `
            <p><strong>Phim:</strong> ${movieData.title}</p>
            <p><strong>Rạp:</strong> ${showtimeData.cinema_name}</p>
            <p><strong>Phòng:</strong> ${showtimeData.room_name}</p>
            <p><strong>Suất chiếu:</strong> ${showDate.toLocaleString(
              "vi-VN"
            )}</p>
        `;
  }

  // Danh sách ghế
  const sortedSeats = [...selectedSeats].sort((a, b) => {
    if (a.row !== b.row) return a.row.localeCompare(b.row);
    return parseInt(a.number) - parseInt(b.number);
  });

  const paymentSeats = document.getElementById("paymentSeats");
  if (paymentSeats) {
    paymentSeats.innerHTML = `<p><strong>Ghế:</strong> ${sortedSeats
      .map((s) => `${s.row}${s.number}`)
      .join(", ")} (${selectedSeats.length} ghế)</p>`;
  }

  // Tổng tiền
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const paymentTotal = document.getElementById("paymentTotal");
  if (paymentTotal) {
    paymentTotal.textContent = formatCurrency(total);
  }

  // Mở modal
  showModal("paymentModal");
}

// Xác nhận thanh toán
async function confirmPayment() {
  const paymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  if (!paymentMethod) {
    showToast("Vui lòng chọn phương thức thanh toán!", "warning");
    return;
  }

  const confirmBtn = document.getElementById("confirmPaymentBtn");
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

  const errorEl = document.getElementById("paymentError");
  errorEl.textContent = "";

  try {
    // Tạo booking với phương thức thanh toán
    const bookingResponse = await API.post("/bookings", {
      showtimeId: parseInt(showtimeId),
      seatIds: selectedSeats.map((s) => parseInt(s.id)),
      paymentMethod: paymentMethod.value,
    });

    const bookingData =
      bookingResponse.data || bookingResponse.booking || bookingResponse;
    const bookingId = bookingData.id;
    const bookingCode = bookingData.booking_code;

    // Nếu thanh toán tại quầy (cash) - hiển thị mã đặt vé ngay
    if (paymentMethod.value === "cash") {
      // Đóng modal thanh toán
      closeModal("paymentModal");

      // Cập nhật modal thành công cho thanh toán tại quầy
      updateSuccessModalForCash(bookingCode);

      // Dừng countdown
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      // Hiển thị modal thành công
      showModal("successModal");
    } else {
      // Các phương thức khác - cần thanh toán online
      const paymentResponse = await API.post(`/bookings/${bookingId}/payment`, {
        payment_method: paymentMethod.value,
      });

      // Đóng modal thanh toán
      closeModal("paymentModal");

      // Hiển thị mã booking
      const bookingCodeEl = document.getElementById("bookingCode");
      if (bookingCodeEl) {
        bookingCodeEl.textContent =
          paymentResponse.booking_code ||
          paymentResponse.booking?.booking_code ||
          bookingCode ||
          "N/A";
      }

      // Dừng countdown
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }

      // Hiển thị modal thành công
      showModal("successModal");
    }
  } catch (error) {
    console.error("Payment error:", error);
    errorEl.textContent =
      error.message || "Có lỗi xảy ra trong quá trình đặt vé!";
    confirmBtn.disabled = false;
    confirmBtn.innerHTML =
      '<i class="fas fa-check-circle"></i> Xác nhận đặt vé';
  }
}

// Cập nhật modal thành công cho thanh toán tại quầy
function updateSuccessModalForCash(bookingCode) {
  const bookingCodeEl = document.getElementById("bookingCode");
  if (bookingCodeEl) {
    bookingCodeEl.textContent = bookingCode || "N/A";
  }

  const successTitle = document.querySelector("#successModal h2");
  if (successTitle) {
    successTitle.textContent = "Đặt Vé Thành Công!";
  }

  const successMsg = document.querySelector("#successModal p[style]");
  if (successMsg) {
    successMsg.innerHTML = `
      <strong style="color: var(--warning-color);"><i class="fas fa-exclamation-triangle"></i> Chờ thanh toán tại quầy</strong><br>
      Vui lòng đến quầy và xuất trình mã này để thanh toán và nhận vé.<br>
      <small>Đơn hàng sẽ tự động hủy nếu không thanh toán trong 30 phút.</small>
    `;
  }
}

// Modal functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// Make closeModal available globally
window.closeModal = closeModal;

// Xử lý khi rời trang - mở khóa ghế
window.addEventListener("beforeunload", async (e) => {
  if (selectedSeats.length > 0) {
    // Mở khóa tất cả ghế đã chọn
    for (const seat of selectedSeats) {
      await unlockSeat(seat.id);
    }
  }
});
