/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B30000',
          hover: '#E60000',
        },
        secondary: '#E60000',
        tertiary: '#0038F7',
        neutral: '#8B716D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // giữ nguyên CSS nền của Ant Design
  },
}