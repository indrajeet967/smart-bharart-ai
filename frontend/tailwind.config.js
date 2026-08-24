/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff5eb',
          100: '#ffe8cc',
          500: '#FF9933', // Government Saffron
          600: '#e67e1a',
          700: '#cc6600',
        },
        navy: {
          50: '#f0f3fa',
          100: '#dce4f2',
          800: '#133B76', // Navy Blue
          900: '#000080', // Ashoka Chakra Navy Blue
          950: '#0b162c',
        },
        tricolor: {
          green: '#128807', // Government Green
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
