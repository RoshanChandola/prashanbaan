/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Mono"', 'monospace'],
      },
      colors: {
        'neon-cyan':  '#00f5ff',
        'neon-pink':  '#ff006e',
        'neon-yellow':'#ffbe00',
        'neon-green': '#39ff14',
        'dark': {
          900: '#050508', 800: '#0d0d14', 700: '#141420',
          600: '#1a1a2e', 500: '#252540',
        }
      },
      boxShadow: {
        'neon-cyan':   '0 0 20px rgba(0,245,255,0.5)',
        'neon-pink':   '0 0 20px rgba(255,0,110,0.5)',
        'neon-yellow': '0 0 20px rgba(255,190,0,0.5)',
        'neon-green':  '0 0 20px rgba(57,255,20,0.5)',
      },
      animation: {
        'spin-slow':    'spin 12s linear infinite',
        'spin-reverse': 'spinReverse 10s linear infinite',
        'flicker':      'flicker 3s ease-in-out infinite',
        'buzz-in':      'buzzIn 0.4s cubic-bezier(0.36,0.07,0.19,0.97)',
        'slide-up':     'slideUp 0.5s ease forwards',
        'slide-left':   'slideLeft 0.4s ease forwards',
        'score-up':     'scoreUp 0.6s ease forwards',
        'countdown':    'countdownPulse 0.9s ease-in-out',
        'shake':        'shake 0.4s ease',
        'typewriter':   'typewriter 0.05s steps(1) forwards',
        'ping-slow':    'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'rank-up':      'rankUp 0.6s ease forwards',
        'rank-down':    'rankDown 0.6s ease forwards',
      },
      keyframes: {
        spinReverse:    { from: { transform: 'rotate(360deg)' }, to: { transform: 'rotate(0deg)' } },
        flicker:        { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.7 }, '75%': { opacity: 0.9 } },
        buzzIn:         { '0%': { transform: 'scale(0.3)', opacity: 0 }, '50%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        slideUp:        { from: { transform: 'translateY(24px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideLeft:      { from: { transform: 'translateX(24px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        scoreUp:        { '0%': { transform: 'translateY(0)', opacity: 1 }, '100%': { transform: 'translateY(-60px)', opacity: 0 } },
        countdownPulse: { '0%': { transform: 'scale(2)', opacity: 0 }, '50%': { transform: 'scale(1)', opacity: 1 }, '100%': { transform: 'scale(0.8)', opacity: 0 } },
        shake:          { '0%,100%': { transform: 'translateX(0)' }, '20%,60%': { transform: 'translateX(-6px)' }, '40%,80%': { transform: 'translateX(6px)' } },
        rankUp:         { from: { transform: 'translateY(20px)', opacity: 0, color: '#39ff14' }, to: { transform: 'translateY(0)', opacity: 1 } },
        rankDown:       { from: { transform: 'translateY(-20px)', opacity: 0, color: '#ff006e' }, to: { transform: 'translateY(0)', opacity: 1 } },
      }
    }
  },
  plugins: []
};
