/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        resort: {
          blue: '#1e3a5f',
          gold: '#d4af37',
          cream: '#f5f5dc',
          white: '#ffffff'
        },
        thief: {
          dark: '#0a0a0a',
          gray: '#1a1a1a',
          neon: '#00ff88',
          red: '#ff3333'
        }
      },
      fontFamily: {
        'serif': ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace']
      }
    }
  },
  plugins: [],
}
