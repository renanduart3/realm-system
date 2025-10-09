/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4A90E2',
        'brand-secondary': '#50E3C2',
        'neutral-light': '#F8F9FA',
        'neutral-medium': '#E9ECEF',
        'neutral-dark': '#343A40',
        'input-bg-light': '#FFFFFF',
        'input-border-light': '#CED4DA',
        'input-focus-light': '#80BDFF',
        'input-bg-dark': '#495057',
        'input-border-dark': '#6C757D',
        'input-focus-dark': '#4A90E2',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionProperty: {
        'width': 'width',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
};
