/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0F172A", light: "#1E293B", xl: "#334155" },
        teal: { DEFAULT: "#0891B2", dark: "#0E7490", light: "#06B6D4" },
        amber: { DEFAULT: "#F59E0B", light: "#FCD34D" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        popover: "0 12px 32px -8px rgba(15,23,42,0.25), 0 4px 12px -4px rgba(15,23,42,0.15)",
        "glow-teal": "0 8px 24px -4px rgba(8,145,178,0.35)",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { opacity: 0, transform: "scale(0.96) translateY(4px)" }, to: { opacity: 1, transform: "scale(1) translateY(0)" } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideInLeft: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      animation: {
        fadeIn: "fadeIn 0.15s ease-out",
        scaleIn: "scaleIn 0.18s cubic-bezier(0.16,1,0.3,1)",
        slideUp: "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)",
        slideInLeft: "slideInLeft 0.25s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};
