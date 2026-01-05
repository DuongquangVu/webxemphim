// Authentication Functions

// Check if user is logged in
function isLoggedIn() {
  return !!API.getToken();
}

// Check user role
function isAdmin() {
  const user = API.getUser();
  return user && user.role === "admin";
}

// Update UI based on auth state
function updateAuthUI() {
  const authButtons = document.getElementById("authButtons");
  const userMenu = document.getElementById("userMenu");
  const userName = document.getElementById("userName");

  if (isLoggedIn()) {
    const user = API.getUser();
    if (authButtons) authButtons.classList.add("hidden");
    if (userMenu) {
      userMenu.classList.remove("hidden");
      if (userName) userName.textContent = user.full_name || user.username;
    }
  } else {
    if (authButtons) authButtons.classList.remove("hidden");
    if (userMenu) userMenu.classList.add("hidden");
  }
}

// Show Login Modal
function showLoginModal() {
  closeModal("registerModal");
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.classList.add("active");
    document.getElementById("loginError").textContent = "";
    document.getElementById("loginForm").reset();
  }
}

// Show Register Modal
function showRegisterModal() {
  closeModal("loginModal");
  const modal = document.getElementById("registerModal");
  if (modal) {
    modal.classList.add("active");
    document.getElementById("registerError").textContent = "";
    document.getElementById("registerForm").reset();
  }
}

// Close Modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
}

// Handle Login
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const errorDiv = document.getElementById("loginError");
  const submitBtn = form.querySelector('button[type="submit"]');

  const username = form.username.value.trim();
  const password = form.password.value;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';

    const response = await AuthAPI.login(username, password);

    if (response.success) {
      API.setToken(response.data.token);
      API.setUser(response.data.user);

      closeModal("loginModal");
      updateAuthUI();
      showToast("Đăng nhập thành công!", "success");

      // Redirect admin to admin panel
      if (response.data.user.role === "admin") {
        setTimeout(() => {
          window.location.href = "/admin.html";
        }, 1000);
      } else {
        // Reload current page
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  } catch (error) {
    errorDiv.textContent = error.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng Nhập';
  }
}

// Handle Register
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const errorDiv = document.getElementById("registerError");
  const submitBtn = form.querySelector('button[type="submit"]');

  const data = {
    username: form.username.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
    full_name: form.full_name.value.trim(),
    phone: form.phone.value.trim(),
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';

    const response = await AuthAPI.register(data);

    if (response.success) {
      API.setToken(response.data.token);
      API.setUser(response.data.user);

      closeModal("registerModal");
      updateAuthUI();
      showToast("Đăng ký thành công!", "success");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  } catch (error) {
    errorDiv.textContent = error.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Đăng Ký';
  }
}

// Logout
function logout() {
  API.removeToken();
  API.removeUser();
  updateAuthUI();
  showToast("Đã đăng xuất", "success");

  // Redirect to home if on protected page
  const protectedPages = ["/profile.html", "/bookings.html", "/admin.html"];
  if (protectedPages.includes(window.location.pathname)) {
    window.location.href = "/";
  }
}

// Require login to continue
function requireLogin(callback) {
  if (!isLoggedIn()) {
    showLoginModal();
    showToast("Vui lòng đăng nhập để tiếp tục", "warning");
    return false;
  }
  if (callback) callback();
  return true;
}

// Require admin to continue
function requireAdmin(callback) {
  if (!isLoggedIn()) {
    showLoginModal();
    showToast("Vui lòng đăng nhập", "warning");
    return false;
  }
  if (!isAdmin()) {
    showToast("Bạn không có quyền truy cập", "error");
    window.location.href = "/";
    return false;
  }
  if (callback) callback();
  return true;
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector(".toggle-password i");

  if (input.type === "password") {
    input.type = "text";
    button.classList.remove("fa-eye");
    button.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    button.classList.remove("fa-eye-slash");
    button.classList.add("fa-eye");
  }
}

// Switch from login to register modal
function switchToRegister() {
  closeModal("loginModal");
  setTimeout(() => showRegisterModal(), 150);
}

// Switch from register to login modal
function switchToLogin() {
  closeModal("registerModal");
  setTimeout(() => showLoginModal(), 150);
}

// Initialize auth on page load
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
});
