/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          dark: '#0e1015',
          panel: '#181b22',
          accent: '#e10600',
          green: '#00d2be',
          yellow: '#ff1801',
        }
      }
    },
  },
  plugins: [],
}
