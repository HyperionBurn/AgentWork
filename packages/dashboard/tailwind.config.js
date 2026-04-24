/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          purple: "#7C3AED",
          blue: "#3B82F6",
          dark: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
          elevated: "#253348",
        },
      },
    },
  },
  plugins: [],
};
