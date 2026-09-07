/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111216',
        card: '#16181d',
        text: '#f1f1f1',
        muted: '#8e8e8e',
        primary: '#00e5ff',
        secondary: '#a020f0',
        success: '#00ff41',
        warning: '#ffc107',
        danger: '#ff3333'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
