// Movie Detail Page JavaScript - Dark Theme Version

let currentMovie = null;
let selectedDate = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const movieId = getUrlParam("id");
  if (movieId) {
    loadMovieDetail(movieId);
  } else {
    window.location.href = "/movies.html";
  }
});

// Load movie detail
async function loadMovieDetail(movieId) {
  const loading = document.getElementById("movieLoading");
  const content = document.getElementById("movieContent");

  try {
    const response = await MoviesAPI.getById(movieId);

    if (response.success) {
      currentMovie = response.data;
      displayMovieDetail(currentMovie);

      loading.classList.add("hidden");
      content.classList.remove("hidden");

      // Generate dates and load showtimes
      if (currentMovie.status === "now_showing") {
        generateDateList();
      } else {
        const showtimeSection = document.getElementById("showtimes");
        if (showtimeSection) {
          showtimeSection.style.display = "none";
        }
        // Update book now button for coming soon movies
        const bookBtn = document.getElementById("bookNowBtn");
        if (bookBtn) {
          bookBtn.innerHTML = '<i class="fas fa-bell"></i> Thông báo khi chiếu';
          bookBtn.classList.remove("btn-primary");
          bookBtn.classList.add("btn-outline");
        }
      }

      // Load reviews
      loadReviews(movieId);
    }
  } catch (error) {
    console.error("Load movie detail error:", error);
    showToast("Không thể tải thông tin phim", "error");
  }
}

// Display movie detail
function displayMovieDetail(movie) {
  document.title = `${movie.title} - CinemaBooking`;

  // Poster
  const posterContainer = document.getElementById("moviePoster");
  if (movie.poster_url) {
    posterContainer.innerHTML = `<img src="${movie.poster_url}" alt="${movie.title}" onerror="this.parentElement.innerHTML='<div class=\\'movie-poster-placeholder\\'><i class=\\'fas fa-film\\'></i></div>'">`;
  }

  // Backdrop (using poster as backdrop)
  const backdropContainer = document.getElementById("movieBackdrop");
  if (backdropContainer && movie.poster_url) {
    backdropContainer.innerHTML = `<img src="${movie.poster_url}" alt="">`;
  }

  // Basic info
  document.getElementById("movieTitle").textContent = movie.title;
  document.getElementById("movieDuration").textContent = movie.duration || "-";
  document.getElementById("movieGenre").textContent =
    movie.genre || "Chưa phân loại";
  document.getElementById("movieDirector").textContent = movie.director || "-";
  document.getElementById("movieActors").textContent = movie.actors || "-";
  document.getElementById("movieDescription").textContent =
    movie.description || "Chưa có mô tả";

  // Release date
  if (movie.release_date) {
    document.getElementById("movieReleaseDate").textContent = formatDate(
      movie.release_date
    );
  }

  // Rating
  const ratingEl = document.getElementById("movieRating");
  const ratingBadgeEl = document.getElementById("movieRatingBadge");
  if (movie.rating_average > 0) {
    if (ratingEl) ratingEl.textContent = movie.rating_average.toFixed(1);
    if (ratingBadgeEl)
      ratingBadgeEl.innerHTML = `<i class="fas fa-star"></i> ${movie.rating_average.toFixed(
        1
      )}`;
  } else {
    if (ratingEl) ratingEl.textContent = "-";
    if (ratingBadgeEl)
      ratingBadgeEl.innerHTML = '<i class="fas fa-star"></i> Mới';
  }

  // Review count
  const reviewCountEl = document.getElementById("movieReviewCount");
  if (reviewCountEl) {
    reviewCountEl.textContent = movie.rating_count || 0;
  }

  // Status badge
  const statusBadge = document.getElementById("movieStatusBadge");
  if (statusBadge) {
    if (movie.status === "now_showing") {
      statusBadge.textContent = "Đang chiếu";
      statusBadge.style.background = "var(--success)";
    } else if (movie.status === "coming_soon") {
      statusBadge.textContent = "Sắp chiếu";
      statusBadge.style.background = "var(--warning)";
      statusBadge.style.color = "#000";
    } else {
      statusBadge.textContent = "Đã kết thúc";
    }
  }
}

// Generate date list (7 days from today)
function generateDateList() {
  const container = document.getElementById("dateList");
  if (!container) return;

  const today = new Date();
  const dates = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  container.innerHTML = dates
    .map((date, index) => {
      const dateStr = date.toISOString().split("T")[0];
      const day = date.getDate();
      const weekday = date.toLocaleDateString("vi-VN", { weekday: "short" });
      const month = date.toLocaleDateString("vi-VN", { month: "short" });
      const isToday = index === 0;

      return `
        <div class="date-tab ${
          isToday ? "active" : ""
        }" data-date="${dateStr}" onclick="selectDate('${dateStr}', this)">
          <span class="day">${isToday ? "Hôm nay" : weekday}</span>
          <span class="date">${day}/${date.getMonth() + 1}</span>
        </div>
      `;
    })
    .join("");

  // Load showtimes for today
  selectedDate = today.toISOString().split("T")[0];
  loadShowtimes(selectedDate);
}

// Select date
function selectDate(dateStr, element) {
  // Update active state
  document
    .querySelectorAll(".date-tab")
    .forEach((el) => el.classList.remove("active"));
  element.classList.add("active");

  selectedDate = dateStr;
  loadShowtimes(dateStr);
}

// Load showtimes for selected date
async function loadShowtimes(date) {
  const container = document.getElementById("showtimesByCinema");
  if (!container) return;

  container.innerHTML =
    '<div class="loading-spinner"><div class="spinner"></div><p>Đang tải suất chiếu...</p></div>';

  try {
    const response = await ShowtimesAPI.getByMovie(currentMovie.id, date);

    if (response.success && response.data.length > 0) {
      displayShowtimesByCinema(response.data);
    } else {
      container.innerHTML =
        '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Không có suất chiếu cho ngày này</p>';
    }
  } catch (error) {
    console.error("Load showtimes error:", error);
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Không thể tải suất chiếu</p>';
  }
}

// Display showtimes grouped by cinema
function displayShowtimesByCinema(cinemas) {
  const container = document.getElementById("showtimesByCinema");
  if (!container) return;

  container.innerHTML = cinemas
    .map((cinema) => {
      const showtimesHtml = cinema.showtimes
        .map((st) => {
          const startTime = new Date(st.start_time);
          const now = new Date();
          const isPast = startTime < now;

          return `
            <div class="time-slot ${isPast ? "disabled" : ""}" 
                 onclick="${isPast ? "" : `selectShowtime(${st.id})`}"
                 ${isPast ? "style='pointer-events:none'" : ""}>
              <span class="time">${formatTime(st.start_time)}</span>
              <span class="room">${st.room_name || "Phòng chiếu"}</span>
              <span class="seats-left">${
                st.available_seats || ""
              } ghế trống</span>
            </div>
          `;
        })
        .join("");

      return `
        <div class="cinema-showtime-card">
          <div class="cinema-showtime-header">
            <h3><i class="fas fa-building"></i> ${cinema.cinema_name}</h3>
            <span class="cinema-address">${cinema.cinema_address}</span>
          </div>
          <div class="time-slots">
            ${showtimesHtml}
          </div>
        </div>
      `;
    })
    .join("");
}

// Select showtime - redirect to booking page
function selectShowtime(showtimeId) {
  if (!requireLogin()) return;

  window.location.href = `/booking.html?showtime=${showtimeId}`;
}

// Open trailer modal
function openTrailer() {
  if (currentMovie && currentMovie.trailer_url) {
    // Create trailer modal if needed
    showToast("Tính năng xem trailer đang phát triển", "info");
  } else {
    showToast("Chưa có trailer cho phim này", "info");
  }
}

// Load reviews
async function loadReviews(movieId) {
  const container = document.getElementById("reviewsList");
  if (!container) return;

  try {
    const response = await MoviesAPI.getReviews(movieId);

    if (response.success && response.data.length > 0) {
      container.innerHTML = `
        <div class="reviews-list">
          ${response.data
            .map(
              (review) => `
            <div class="review-card">
              <div class="review-header">
                <div class="review-author">
                  <div class="review-avatar">${(review.full_name ||
                    review.username)[0].toUpperCase()}</div>
                  <div class="review-author-info">
                    <h4>${review.full_name || review.username}</h4>
                    <span>${formatDate(review.created_at)}</span>
                  </div>
                </div>
                <div class="review-rating">
                  ${'<i class="fas fa-star"></i>'.repeat(
                    Math.floor(review.rating / 2)
                  )}
                  ${
                    review.rating % 2
                      ? '<i class="fas fa-star-half-alt"></i>'
                      : ""
                  }
                  <span style="margin-left: 5px;">${review.rating}/10</span>
                </div>
              </div>
              <p class="review-content">${
                review.comment || "<em>Không có bình luận</em>"
              }</p>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 15px;"></i>
          <p>Chưa có đánh giá nào cho phim này</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Load reviews error:", error);
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-muted);">Không thể tải đánh giá</p>';
  }
}
