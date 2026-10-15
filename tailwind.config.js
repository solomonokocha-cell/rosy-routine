module.exports = {
  content: ['./online/index.html', './online/main.js'],
  theme: {
    extend: {
      colors: {
        rosy: {
          50: '#fff5f8',
          100: '#ffe7ee',
          200: '#ffcbd9',
          300: '#f5a5bc',
          400: '#e86c8d',
          500: '#cf4f76',
          600: '#ae385f',
          700: '#832b4a',
          ink: '#3b2730',
          muted: '#947882'
        }
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Fraunces', 'serif'],
        mono: ['DM Mono', 'monospace']
      },
      boxShadow: {
        rosy: '0 18px 45px rgba(183, 99, 126, .12)'
      }
    }
  },
  plugins: []
};