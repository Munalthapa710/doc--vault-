/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#0f172a',
        saffron: '#d97706',
        lotus: '#be123c',
        leaf: '#047857'
      }
    }
  },
  plugins: []
};
