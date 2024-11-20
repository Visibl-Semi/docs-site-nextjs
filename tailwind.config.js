module.exports = {
  theme: {
    extend: {
      animation: {
        'gradient-x': 'gradient-x 4s ease-in-out infinite',
        gradient: 'gradient 12s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 100%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 100%',
            'background-position': 'right center'
          },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        dot1: {
          '0%, 100%': { opacity: '0' },
          '25%': { opacity: '1' },
        },
        dot2: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
        dot3: {
          '0%, 100%': { opacity: '0' },
          '75%': { opacity: '1' },
        }
      },
      backgroundImage: {
        'thinking-gradient': 'linear-gradient(to right, #60a5fa 0%, #e879f9 46%, #60a5fa 100%)',
      }
    }
  }
}
