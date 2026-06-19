/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kala: {
          red: '#CC0000',
          'red-dark': '#A30000',
          'red-light': '#FF1A1A',
          dark: '#1C1C1C',
          gray: '#F5F5F5',
          border: '#E5E7EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        nav: '0 -2px 12px rgba(0,0,0,0.08)',
      },
      maxWidth: {
        '8xl': '88rem',
      }
    }
  },
  plugins: []
}
