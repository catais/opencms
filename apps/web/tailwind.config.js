/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Blue 600
          dark: '#1D4ED8',    // Blue 700
        },
        success: '#16A34A',   // Green 600
        warning: '#F59E0B',   // Amber 500
        danger: '#DC2626',    // Red 600
        info: '#0284C7',      // Sky 700
      },
    },
  },
  plugins: [],
}
