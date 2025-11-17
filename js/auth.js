const API_BASE = 'http://127.0.0.1:5000/api';
const USER_STORAGE_KEY = 'memoaUser';

function saveUserSession(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
}

function initRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const payload = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      password: formData.get('password'),
    };

    try {
      const result = await request('/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      saveUserSession(result.user);
      window.location.href = './hello.html';
    } catch (error) {
      alert(error.message);
    }
  });
}

function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const payload = {
      email: formData.get('email').trim(),
      password: formData.get('password'),
    };

    try {
      const result = await request('/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      saveUserSession(result.user);
      window.location.href = './hello.html';
    } catch (error) {
      alert(error.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
});

