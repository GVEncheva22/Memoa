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

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');

    if (!name || !email || !password) {
      alert('Please fill all fields.');
      return;
    }

    const users = getUsers();
    const emailExists = users.some((user) => user.email === email);
    if (emailExists) {
      alert('This email is already registered. Try logging in.');
      return;
    }

    const newUser = {
      id: generateId(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);
    createSessionFromUser(newUser);
  });
};

const initLoginForm = () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');

    if (!email || !password) {
      alert('Please fill all fields.');
      return;
    }

    const users = getUsers();
    const user = users.find((entry) => entry.email === email && entry.password === password);

    if (!user) {
      alert('Invalid email or password. Try again.');
      return;
    }

    createSessionFromUser(user);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
});

