const STORAGE_KEY = 'memoaTheme';
const THEME_ATTR = 'data-theme';
const THEMES = { LIGHT: 'light', DARK: 'dark' };

const normalize = (t) => (t === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT);

const updateToggles = (theme) => {
  document.querySelectorAll('.theme-toggle, [data-theme-toggle]').forEach((toggle) => {
    toggle.textContent = theme === THEMES.DARK ? '☀︎' : '☾';
    toggle.setAttribute(
      'aria-label',
      theme === THEMES.DARK ? 'Switch to light theme' : 'Switch to dark theme'
    );
  });
};

const setTheme = (theme) => {
  const t = normalize(theme);
  document.documentElement.setAttribute(THEME_ATTR, t);
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch (e) {
    // ignore storage errors (e.g. private mode)
  }
  updateToggles(t);
  // Debug log to help diagnose issues when users report problems
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[theme-toggle] theme set -> ${t}`);
  }
};

const initTheme = () => {
  const savedRaw = localStorage.getItem(STORAGE_KEY);
  // If user hasn't chosen, respect system preference
  const systemPrefDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const chosen = savedRaw == null ? (systemPrefDark ? THEMES.DARK : THEMES.LIGHT) : savedRaw;
  const saved = normalize(chosen);
  setTheme(saved);

  // Use delegation to support multiple toggle elements and dynamically added ones
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-toggle, [data-theme-toggle]');
    if (!btn) return;
    const current = document.documentElement.getAttribute(THEME_ATTR) || THEMES.LIGHT;
    const next = current === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(next);
  });

  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[theme-toggle] initialized (saved=${savedRaw}) systemPrefDark=${systemPrefDark}`);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}

