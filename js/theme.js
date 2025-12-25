// Theme management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;

function setTheme(theme) {
  html.classList.remove('light', 'dark');
  html.classList.add(theme);
  localStorage.setItem('theme', theme);
  themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const newTheme = html.classList.contains('dark') ? 'light' : 'dark';
  setTheme(newTheme);
});
