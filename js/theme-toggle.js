const STORAGE_KEY = 'memoaTheme';
const THEME_ATTR = 'data-theme';

const setTheme = (theme) => {
  document.documentElement.setAttribute(THEME_ATTR, theme);
  localStorage.setItem(STORAGE_KEY, theme);
  document.querySelectorAll('#themeToggle').forEach((toggle) => {
    toggle.textContent = theme === 'dark' ? '☀︎' : '☾';
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  });
};

const initTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY) || 'light';
  setTheme(saved);

  document.querySelectorAll('#themeToggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute(THEME_ATTR) || 'light';
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  });
};

document.addEventListener('DOMContentLoaded', initTheme);

