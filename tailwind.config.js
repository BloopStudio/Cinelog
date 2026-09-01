/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0B0F14",
        surface: "#151B23",
        "surface-alt": "#1E2630",
        primary: "#E63946",
        accent: "#F4A340",
        "text-primary": "#F5F7FA",
        "text-secondary": "#9AA5B1",
        border: "#2A323D",
        success: "#3DDC97",
      },
    },
  },
  plugins: [],
};
