/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FCFBF9',
          100: '#F7F4F0',
          200: '#EFECE6',
          300: '#E5E0D6',
          DEFAULT: '#F7F4F0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#FFFFFF',
          sunken: '#FAF8F5',
          elevated: '#FFFFFF',
          border: '#DFD8CD',
          'border-subtle': '#EBE5DC',
        },
        espresso: {
          DEFAULT: '#2C2623',
          900: '#1F1A18',
          800: '#2C2623',
          700: '#3D3632',
          600: '#5A514B',
          muted: '#7A7067',
          light: '#9E948B',
        },
        taupe: {
          DEFAULT: '#DFD8CD',
          50: '#FAF8F5',
          100: '#F3EFE8',
          200: '#DFD8CD',
          300: '#CBC2B4',
          400: '#B0A595',
        },
        champagne: {
          DEFAULT: '#C5A880',
          50: '#FDFCF9',
          100: '#F7F2EA',
          200: '#EADBCA',
          300: '#D8C1A5',
          400: '#C5A880',
          500: '#B59468',
          hover: '#A98455',
          active: '#967243',
        },
        terracotta: {
          DEFAULT: '#B88B6E',
          100: '#F6EDE7',
          200: '#E5CDBC',
          300: '#CCA48D',
          400: '#B88B6E',
          500: '#A16F4F',
        },
        status: {
          safe: '#24593E',
          'safe-bg': '#EBF4EE',
          'safe-border': '#C2DFCE',
          review: '#8A5D19',
          'review-bg': '#FAF3E3',
          'review-border': '#EBD6B0',
          restrict: '#8C3535',
          'restrict-bg': '#FAEAEA',
          'restrict-border': '#E8C2C2',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'editorial': '0 2px 12px -2px rgba(44, 38, 35, 0.05), 0 1px 4px -1px rgba(44, 38, 35, 0.03)',
        'editorial-hover': '0 8px 24px -4px rgba(44, 38, 35, 0.08), 0 2px 8px -2px rgba(44, 38, 35, 0.03)',
        'champagne': '0 4px 16px -2px rgba(197, 168, 128, 0.45)',
        'inner-soft': 'inset 0 1px 2px 0 rgba(44, 38, 35, 0.03)',
      }
    },
  },
  plugins: [],
}
