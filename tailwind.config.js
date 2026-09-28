/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0a0b0d",
        surface: "#121316",
        raised: "#17181c",
        border: {
          DEFAULT: "#232427",
          strong: "#33353a",
        },
        ink: {
          DEFAULT: "#e9eaec",
          dim: "#a5a7ad",
          faint: "#6b6d73",
        },
        accent: {
          DEFAULT: "#e2a136",
          dim: "#b98428",
          soft: "#3a2f18",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
      },
      maxWidth: {
        content: "1120px",
      },
    },
  },
  plugins: [],
};
