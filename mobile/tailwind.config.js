/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand colors matching web
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4", // Main brand cyan
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        // Background
        background: "#FDFCF8", // Warm cream
        foreground: "#2F3E33", // Dark earth
        // Card
        card: "#FFFFFF",
        "card-foreground": "#2F3E33",
        // Muted
        muted: "#F5F3EE",
        "muted-foreground": "#6B7280",
        // Border
        border: "#E6E2D6", // Warm beige
        // Success/Error
        success: "#059669",
        error: "#DC2626",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
