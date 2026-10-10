/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'ui-sans-serif', 'system-ui'],
        display: ['Manrope', 'Noto Sans Telugu', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        ink: '#17201d',
        pine: '#203c32',
        moss: '#58725f',
        brass: '#c38b42',
        parchment: '#f5f0e7',
        cream: '#fffdf8',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,32,29,.05), 0 14px 40px rgba(23,32,29,.06)',
      },
    },
  },
  plugins: [],
}
