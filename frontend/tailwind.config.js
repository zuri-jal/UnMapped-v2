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
        // Plan Page Dark Mode Tokens
        'plan-primary':    '#C9916E',
        'plan-primary-hover': '#D4A574',
        'plan-primary-dim': '#8B5E3C',
        'plan-bg-base':    '#080810',
        'plan-surface-1':  '#10101C',
        'plan-surface-2':  '#181828',
        'plan-surface-3':  '#1E1E30',
        'plan-border-subtle': '#252538',
        'plan-border-accent': '#2E2E48',
        'plan-text-primary': '#F0EDF8',
        'plan-text-secondary': '#8B8BA0',
        'plan-text-muted': '#5A5A72',
        'plan-success':    '#4ECDC4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
