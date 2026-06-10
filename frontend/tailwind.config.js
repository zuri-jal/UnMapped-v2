/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'rose-gold':       '#B07050',
        'rose-gold-light': '#C4896A',
        'rose-gold-dark':  '#8A5438',
        'warm-white':      '#FDFAF8',
        'warm-gray':       '#F5F0EE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
