/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          200: "#bcd2ff",
          300: "#8ab0ff",
          400: "#5a86f8",
          500: "#2f5ef0",
          600: "#1e40d8",
          700: "#1a34b0",
          800: "#182d8c",
          900: "#152452",
          950: "#0d1733",
        },
        accent: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
