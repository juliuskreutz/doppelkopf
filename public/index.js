var theme = localStorage.getItem("theme");
if (theme) {
  document.documentElement.style.colorScheme = theme;
}
