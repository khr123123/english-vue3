/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fbfbe8',
        paper: '#f5f5df',
        card: '#f0f1dd',
        textmain: '#1d1f12',
        sub: '#5a5e4a',
        blue: '#2B59C3',
        blueSoft: '#dbe4ff',
        line: '#d8dcc4',
        olive: '#76815b',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        paper: '0 10px 30px rgba(43, 89, 195, 0.06)',
      },
    },
  },
  plugins: [],
}
