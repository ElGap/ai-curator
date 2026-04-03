// This plugin runs only on client side (see .client.ts extension)
export default defineNuxtPlugin(() => {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem("curator-theme");

  if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
    // Apply saved theme
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } else {
    // Auto-detect from system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }
});
