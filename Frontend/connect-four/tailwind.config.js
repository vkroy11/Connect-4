/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s linear infinite',
        'drop': 'drop 0.5s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-slow': 'fadeIn 0.8s ease-out',
        'modal-pop': 'modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'modal-slow': 'modalSlow 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        'confetti-fall': 'confettiFall linear forwards',
        'win-pulse': 'winPulse 0.9s ease-in-out infinite',
      },
      keyframes: {
        drop: {
          '0%': { transform: 'translateY(-400px)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        modalPop: {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        modalSlow: {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(40px)' },
          '60%': { opacity: '0.85', transform: 'scale(1.02) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        confettiFall: {
          '0%': { transform: 'translate3d(0,-10vh,0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate3d(0,110vh,0) rotate(720deg)', opacity: '0' },
        },
        winPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.85)', transform: 'scale(1)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255,255,255,0)', transform: 'scale(1.08)' },
        },
      }
    },
  },
  plugins: [],
}
