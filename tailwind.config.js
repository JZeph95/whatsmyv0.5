/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sunset: {
          start: '#FF8C42',
          middle: '#FF5F6D',
          end: '#FF4B6A',
        },
      },
      backgroundImage: {
        'sunset-gradient': 'linear-gradient(45deg, #FF8C42, #FF5F6D, #FF4B6A)',
      },
      textColor: {
        'sunset-text': '#FF8C42',
        'sunset-text-hover': '#FF5F6D',
      },
      borderColor: {
        'sunset-border': '#FF8C42',
      },
    },
  },
  safelist: [
    'bg-sunset-gradient',
    'text-sunset-text',
    'text-sunset-text-hover',
    'border-sunset-border',
    'from-sunset-start',
    'via-sunset-middle',
    'to-sunset-end',
  ],
  plugins: [],
};