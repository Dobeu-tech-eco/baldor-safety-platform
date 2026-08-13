/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        baldor: {
          primary: '#006838',
          'primary-hover': '#00532d',
          lime: '#8DC63F',
          purple: '#7B2D8E',
          ink: '#0f1419',
          cream: '#F1EFEC',
          navy: '#1F4E79',
          alert: '#C0392B',
        },
      },
      fontFamily: {
        sans: ["'Inter'", 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
