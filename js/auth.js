const USERS_KEY = 'memoaUsers';
const USER_STORAGE_KEY = 'memoaUser';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (error) {
    console.error('Failed to parse stored users', error);
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const saveUserSession = (user) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const createSessionFromUser = (user) => {
  saveUserSession({
    id: user.id,
    name: user.name,
    email: user.email,
  });
  window.location.href = './hello.html';
};

const initRegisterForm = () => {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');

    if (!name || !email || !password) {
      alert('Please fill all fields.');
      return;
    }

    // Client-side password rules: minimum 8 characters and at least one special character
    try {
      const passwordStr = String(password);
      const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/;
      if (passwordStr.length < 8 || !specialCharRegex.test(passwordStr)) {
        alert('Password must be at least 8 characters and include at least one special character (e.g. !@#$%^&*).');
        return;
      }
    } catch (err) {
      console.error('Password validation error', err);
      alert('Invalid password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Registration failed.');
        return;
      }

      // Save user session from backend response
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      window.location.href = './hello.html';
    } catch (err) {
      console.error('Registration error:', err);
      alert('Registration failed. Make sure the server is running at http://localhost:5000');
    }
  });
};

const initLoginForm = () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');

    if (!email || !password) {
      alert('Please fill all fields.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Invalid email or password. Try again.');
        return;
      }

      // Save user session from backend response
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      window.location.href = './hello.html';
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Make sure the server is running at http://localhost:5000');
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
});

