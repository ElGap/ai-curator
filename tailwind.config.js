module.exports = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./composables/**/*.{js,ts}",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        sidebar: {
          DEFAULT: "#f8fafc", // slate-50 - main sidebar background
          foreground: "#475569", // slate-600 - nav links text
          border: "#e2e8f0", // slate-200 - sidebar borders
          card: "#ffffff", // white - elevated cards on sidebar
          hover: "#ffffff", // white - hover state
          active: "#ffffff", // white - active nav background
        },
        content: {
          foreground: "#4b5563", // gray-600 - main body text
          heading: "#111827", // gray-900 - headings
          muted: "#6b7280", // gray-500 - secondary text
        },
      },
    },
  },
  plugins: [],
};
