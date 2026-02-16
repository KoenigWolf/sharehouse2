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
        // Brand colors - Cyan/Teal (immedio style)
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        // Core palette - Slate based (Modern theme)
        background: "#f8fafc",
        foreground: "#0f172a",
        // Card
        card: "#ffffff",
        "card-foreground": "#0f172a",
        // Primary
        primary: "#06b6d4",
        "primary-foreground": "#ffffff",
        // Secondary
        secondary: "#f1f5f9",
        "secondary-foreground": "#0f172a",
        // Muted
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        // Accent
        accent: "#06b6d4",
        "accent-foreground": "#ffffff",
        // Border / Input
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#06b6d4",
        // Status colors
        success: "#059669",
        "success-bg": "#ecfdf5",
        error: "#dc2626",
        "error-bg": "#fef2f2",
        warning: "#d97706",
        "warning-bg": "#fffbeb",
        destructive: "#dc2626",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        "card": "16px",
        "button": "9999px",
        "input": "12px",
        "badge": "6px",
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
      },
    },
  },
  plugins: [],
};
