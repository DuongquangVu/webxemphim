// Main JavaScript

// Toast Notification
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "check-circle";
  if (type === "error") icon = "times-circle";
  if (type === "warning") icon = "exclamation-circle";

  toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Format time
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format datetime
function formatDateTime(dateString) {
  return `${formatTime(dateString)} - ${formatDate(dateString)}`;
}

// Create movie card HTML
function createMovieCard(movie) {
  const statusClass =
    movie.status === "now_showing" ? "now-showing" : "coming-soon";
  const statusText =
    movie.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu";

  return `
        <div class="movie-card" onclick="window.location.href='/movie.html?id=${
          movie.id
        }'">
            <div class="movie-poster">
                ${
                  movie.poster_url
                    ? `<img src="${movie.poster_url}" alt="${movie.title}" onerror="this.parentElement.innerHTML='<div class=\\'movie-poster-placeholder\\'><i class=\\'fas fa-film\\'></i></div>'">`
                    : `<div class="movie-poster-placeholder"><i class="fas fa-film"></i></div>`
                }
                <div class="movie-overlay">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='/movie.html?id=${
                      movie.id
                    }'">
                        ${
                          movie.status === "now_showing"
                            ? '<i class="fas fa-ticket-alt"></i> Đặt vé ngay'
                            : '<i class="fas fa-info-circle"></i> Xem chi tiết'
                        }
                    </button>
                </div>
                ${
                  movie.rating > 0
                    ? `<span class="movie-rating"><i class="fas fa-star"></i> ${movie.rating}</span>`
                    : ""
                }
                <span class="movie-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="movie-content">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span><i class="fas fa-clock"></i> ${
                      movie.duration
                    } phút</span>
                    ${
                      movie.genre
                        ? `<span><i class="fas fa-tag"></i> ${
                            movie.genre.split(",")[0]
                          }</span>`
                        : ""
                    }
                </div>
            </div>
        </div>
    `;
}

// Create cinema card HTML
function createCinemaCard(cinema) {
  return `
        <div class="cinema-card" onclick="window.location.href='/cinema.html?id=${
          cinema.id
        }'">
            <div class="cinema-icon">
                <i class="fas fa-building"></i>
            </div>
            <div class="cinema-info">
                <h3>${cinema.name}</h3>
                <p class="cinema-address"><i class="fas fa-map-marker-alt"></i> ${
                  cinema.address
                }</p>
                ${
                  cinema.phone
                    ? `<p class="cinema-phone"><i class="fas fa-phone"></i> ${cinema.phone}</p>`
                    : ""
                }
            </div>
            ${
              cinema.room_count !== undefined
                ? `<span class="cinema-rooms"><i class="fas fa-door-open"></i> ${cinema.room_count} phòng chiếu</span>`
                : ""
            }
        </div>
    `;
}

// Load now showing movies
async function loadNowShowingMovies() {
  const container = document.getElementById("nowShowingMovies");
  if (!container) return;

  try {
    const response = await MoviesAPI.getNowShowing(8);

    if (response.success && response.data.length > 0) {
      container.innerHTML = response.data.map(createMovieCard).join("");
    } else {
      container.innerHTML =
        '<p class="text-center">Chưa có phim đang chiếu</p>';
    }
  } catch (error) {
    container.innerHTML =
      '<p class="text-center">Không thể tải danh sách phim</p>';
    console.error("Load now showing error:", error);
  }
}

// Load coming soon movies
async function loadComingSoonMovies() {
  const container = document.getElementById("comingSoonMovies");
  if (!container) return;

  try {
    const response = await MoviesAPI.getComingSoon(4);

    if (response.success && response.data.length > 0) {
      container.innerHTML = response.data.map(createMovieCard).join("");
    } else {
      container.innerHTML = '<p class="text-center">Chưa có phim sắp chiếu</p>';
    }
  } catch (error) {
    container.innerHTML =
      '<p class="text-center">Không thể tải danh sách phim</p>';
    console.error("Load coming soon error:", error);
  }
}

// Load cinemas
async function loadCinemas() {
  const container = document.getElementById("cinemasList");
  if (!container) return;

  try {
    const response = await CinemasAPI.getAll();

    if (response.success && response.data.length > 0) {
      container.innerHTML = response.data.map(createCinemaCard).join("");
    } else {
      container.innerHTML = '<p class="text-center">Chưa có rạp nào</p>';
    }
  } catch (error) {
    container.innerHTML =
      '<p class="text-center">Không thể tải danh sách rạp</p>';
    console.error("Load cinemas error:", error);
  }
}

// Get URL parameters
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  // Update auth UI
  if (typeof updateAuthUI === "function") {
    updateAuthUI();
  }

  // Load hero banner
  loadHeroBanner();

  // Load data for home page
  if (document.getElementById("nowShowingMovies")) {
    loadNowShowingMovies();
  }

  if (document.getElementById("comingSoonMovies")) {
    loadComingSoonMovies();
  }

  if (document.getElementById("cinemasList")) {
    loadCinemas();
  }

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal("loginModal");
      closeModal("registerModal");
    }
  });
});

// Load Hero Banner from movies
let heroMovies = [];
let currentHeroSlide = 0;
let heroInterval = null;

async function loadHeroBanner() {
  const slideshow = document.getElementById("heroSlideshow");
  const indicators = document.getElementById("heroIndicators");

  if (!slideshow) return;

  try {
    const response = await MoviesAPI.getNowShowing(5);

    if (response.success && response.data.length > 0) {
      heroMovies = response.data.filter((m) => m.banner_url || m.poster_url);

      if (heroMovies.length === 0) {
        // Fallback nếu không có ảnh
        showDefaultHero();
        return;
      }

      // Render slides
      slideshow.innerHTML = heroMovies
        .map(
          (movie, index) => `
        <div class="hero-slide ${index === 0 ? "active" : ""}" 
             style="background-image: url('${
               movie.banner_url || movie.poster_url
             }')"
             data-movie-id="${movie.id}">
        </div>
      `
        )
        .join("");

      // Render indicators
      if (indicators) {
        indicators.innerHTML = heroMovies
          .map(
            (_, index) => `
          <span class="indicator ${
            index === 0 ? "active" : ""
          }" data-index="${index}"></span>
        `
          )
          .join("");
      }

      // Update hero content với phim đầu tiên
      updateHeroContent(heroMovies[0]);

      // Start slideshow
      initHeroSlideshow();
    } else {
      showDefaultHero();
    }
  } catch (error) {
    console.error("Load hero banner error:", error);
    showDefaultHero();
  }
}

function showDefaultHero() {
  const slideshow = document.getElementById("heroSlideshow");
  if (slideshow) {
    slideshow.innerHTML = `
      <div class="hero-slide active" style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)"></div>
    `;
  }
}

function updateHeroContent(movie) {
  const title = document.getElementById("heroTitle");
  const subtitle = document.getElementById("heroSubtitle");
  const buttons = document.getElementById("heroButtons");

  if (title) {
    title.innerHTML = `${movie.title} <span class="text-accent">⭐ ${
      movie.rating || ""
    }</span>`;
  }

  if (subtitle) {
    subtitle.textContent = movie.description
      ? movie.description.length > 150
        ? movie.description.substring(0, 150) + "..."
        : movie.description
      : `${movie.genre || ""} • ${movie.duration || ""} phút`;
  }

  if (buttons) {
    buttons.innerHTML = `
      <a href="/movie.html?id=${movie.id}" class="btn btn-primary btn-lg">
        <i class="fas fa-ticket-alt"></i> Đặt vé ngay
      </a>
      <a href="/movie.html?id=${movie.id}" class="btn btn-outline btn-lg">
        <i class="fas fa-info-circle"></i> Xem chi tiết
      </a>
    `;
  }
}

// Hero Slideshow
function initHeroSlideshow() {
  const slides = document.querySelectorAll(".hero-slide");
  const indicators = document.querySelectorAll(".hero-indicators .indicator");

  if (slides.length <= 1) return;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === index);
    });

    // Update content
    if (heroMovies[index]) {
      updateHeroContent(heroMovies[index]);
    }
  }

  function nextSlide() {
    currentHeroSlide = (currentHeroSlide + 1) % slides.length;
    showSlide(currentHeroSlide);
  }

  // Clear existing interval
  if (heroInterval) clearInterval(heroInterval);

  // Auto slide every 5 seconds
  heroInterval = setInterval(nextSlide, 5000);

  // Click indicators
  indicators.forEach((indicator, i) => {
    indicator.addEventListener("click", () => {
      currentHeroSlide = i;
      showSlide(currentHeroSlide);
    });
  });

  // Click slide to go to movie
  slides.forEach((slide) => {
    slide.addEventListener("click", () => {
      const movieId = slide.dataset.movieId;
      if (movieId) {
        window.location.href = `/movie.html?id=${movieId}`;
      }
    });
    slide.style.cursor = "pointer";
  });
}
