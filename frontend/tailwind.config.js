/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Natural Agricultural Palette
        brand: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#1B4332", // Deep Agricultural Forest Green
          950: "#0E281E",
        },
        // Backgrounds & Surfaces (Warm Natural Light by default)
        surface: {
          DEFAULT: "#FBFBFA", // Warm Off-White / Crisp natural field tone
          subtle: "#F4F5F2",  // Warm Sand / Stone
          card: "#FFFFFF",    // Pure clean white surface for cards
          muted: "#EAECE7",   // Natural divider / inactive fill
          dark: "#14211A",    // Deep earthy forest for dark mode accents
          darkcard: "#1B2C23",
        },
        // Text & Hierarchy
        content: {
          DEFAULT: "#191C1D", // Charcoal high contrast
          muted: "#5A625D",   // Calm readable secondary text
          subtle: "#7E8781",  // Meta info / timestamps
          inverse: "#FFFFFF",
        },
        // Earthy Accents
        earth: {
          amber: "#D97706",
          ochre: "#B45309",
          sand: "#E5DECF",
          clay: "#9A3412",
        },
        // Semantic
        success: {
          DEFAULT: "#15803D",
          light: "#E8F5E9",
          border: "#C8E6C9",
        },
        warning: {
          DEFAULT: "#B45309",
          light: "#FFF8E1",
          border: "#FFE082",
        },
        alert: {
          DEFAULT: "#B91C1C",
          light: "#FEE2E2",
          border: "#FECACA",
        },
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm: "0.5rem",
        md: "0.875rem",
        lg: "1.125rem",
        xl: "1.5rem",
        "2xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 2px 8px -1px rgba(25, 28, 29, 0.06), 0 1px 3px -1px rgba(25, 28, 29, 0.04)",
        dropdown: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        button: "0 2px 4px 0 rgba(27, 67, 50, 0.15)",
      },
      fontFamily: {
        sans: ["Open Sans", "Noto Sans", "system-ui", "-apple-system", "sans-serif"],
        display: ["Open Sans", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
