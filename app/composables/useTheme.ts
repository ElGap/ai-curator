import { ref, computed, onMounted } from "vue";

export const useTheme = () => {
  const colorMode = ref<"light" | "dark">("light");
  const isInitialized = ref(false);

  // Check if we're on client side
  const isClient = typeof window !== "undefined";

  // Initialize from system preference or localStorage
  const initTheme = () => {
    if (isClient) {
      // Check if there's a saved preference
      const savedTheme = localStorage.getItem("curator-theme");

      if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
        colorMode.value = savedTheme;
      } else {
        // Auto-detect from system
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        colorMode.value = prefersDark ? "dark" : "light";
      }

      // Apply theme to document
      applyTheme();
      isInitialized.value = true;
    }
  };

  // Apply theme to document element
  const applyTheme = () => {
    if (isClient) {
      if (colorMode.value === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    colorMode.value = colorMode.value === "dark" ? "light" : "dark";
    if (isClient) {
      localStorage.setItem("curator-theme", colorMode.value);
    }
    applyTheme();
  };

  // Set specific theme
  const setTheme = (theme: "light" | "dark") => {
    colorMode.value = theme;
    if (isClient) {
      localStorage.setItem("curator-theme", theme);
    }
    applyTheme();
  };

  // Computed property for isDark
  const isDark = computed(() => colorMode.value === "dark");

  // Initialize on mount
  onMounted(() => {
    if (!isInitialized.value) {
      initTheme();
    }
  });

  return {
    colorMode,
    isDark,
    initTheme,
    toggleTheme,
    setTheme,
  };
};
