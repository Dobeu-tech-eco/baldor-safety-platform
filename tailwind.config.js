/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F3',
        'cream-panel': '#F1F0EC',
        ink: {
          DEFAULT: '#1E1B1D',
          true: '#182230',
          muted: '#344054',
          brand: '#20280B',
        },
        forest: '#064725',
        brand: {
          DEFAULT: '#007050',
          print: '#20491D',
          hover: '#08563F',
        },
        lime: '#B3CF44',
        alert: '#E00000',
        danger: '#E34430',
        gold: '#F2A813',
        sky: '#79B0C8',
        plum: '#5C4E71',
        navy: '#1F4E79',
        hair: '#E4E2DB',
      },
      fontFamily: {
        display: ['Oswald', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 4px 12px rgba(24, 34, 48, 0.08)',
        lift: '0 12px 32px rgba(24, 34, 48, 0.12)',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
