/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core neon palette
        volt:        '#CCFF00',
        'volt-dim':  'rgba(204,255,0,0.08)',
        'volt-mid':  'rgba(204,255,0,0.25)',
        'volt-glow': 'rgba(204,255,0,0.6)',
        hot:         '#FF3B00',
        'hot-dim':   'rgba(255,59,0,0.12)',
        // New futuristic secondaries
        cyan:        '#00D4FF',
        'cyan-dim':  'rgba(0,212,255,0.1)',
        plasma:      '#BF5FFF',
        'plasma-dim':'rgba(191,95,255,0.1)',
        ember:       '#FF6B35',
        // Backgrounds
        base:      '#050508',
        surface:   '#0C0C12',
        elevated:  '#13131C',
        panel:     '#16161F',
        // Borders
        'border-muted':  '#1E1E2E',
        'border-glow':   'rgba(204,255,0,0.15)',
        'border-plasma': 'rgba(191,95,255,0.2)',
        'border-cyan':   'rgba(0,212,255,0.15)',
        // Text
        'text-muted':     '#333345',
        'text-secondary': '#6E6E8A',
        'text-dim':       '#9090AA',
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Barlow Condensed"', 'sans-serif'],
        mono:    ['"DM Mono"', '"IBM Plex Mono"', 'monospace'],
        label:   ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        // Volt
        'glow-volt-xs': '0 0 6px rgba(204,255,0,0.4)',
        'glow-volt-sm': '0 0 12px rgba(204,255,0,0.3), 0 0 24px rgba(204,255,0,0.08)',
        'glow-volt':    '0 0 20px rgba(204,255,0,0.25), 0 0 60px rgba(204,255,0,0.08)',
        'glow-volt-lg': '0 0 40px rgba(204,255,0,0.35), 0 0 100px rgba(204,255,0,0.1)',
        // Cyan
        'glow-cyan-sm': '0 0 12px rgba(0,212,255,0.35)',
        'glow-cyan':    '0 0 20px rgba(0,212,255,0.25), 0 0 60px rgba(0,212,255,0.08)',
        // Plasma
        'glow-plasma-sm': '0 0 12px rgba(191,95,255,0.35)',
        'glow-plasma':    '0 0 20px rgba(191,95,255,0.25), 0 0 60px rgba(191,95,255,0.08)',
        // Hot
        'glow-hot-sm': '0 0 12px rgba(255,59,0,0.4)',
        'glow-hot':    '0 0 20px rgba(255,59,0,0.3), 0 0 60px rgba(255,59,0,0.08)',
        // Card
        'card-float': '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        'card-hover': '0 16px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(204,255,0,0.05)',
        'neuo':       'inset 2px 2px 5px rgba(0,0,0,0.7), inset -1px -1px 4px rgba(255,255,255,0.02)',
        'neuo-out':   '4px 4px 12px rgba(0,0,0,0.8), -2px -2px 8px rgba(255,255,255,0.02)',
      },
      backgroundImage: {
        // Grids
        'grid-sm':    'linear-gradient(rgba(204,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.04) 1px, transparent 1px)',
        'grid-md':    'linear-gradient(rgba(204,255,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.06) 1px, transparent 1px)',
        'grid-dark':  'linear-gradient(rgba(30,30,46,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,46,0.8) 1px, transparent 1px)',
        // Gradients
        'volt-gradient':   'linear-gradient(135deg, #050508 0%, #0c0c12 50%, #0a0d04 100%)',
        'cyber-gradient':  'linear-gradient(135deg, #050508, #080814, #060812)',
        'hero-gradient':   'radial-gradient(ellipse at 20% 50%, rgba(204,255,0,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(0,212,255,0.04) 0%, transparent 60%)',
        // Neon lines
        'neon-line-volt':  'linear-gradient(90deg, transparent, #CCFF00, transparent)',
        'neon-line-cyan':  'linear-gradient(90deg, transparent, #00D4FF, transparent)',
        'neon-line-multi': 'linear-gradient(90deg, transparent, #CCFF00 30%, #00D4FF 70%, transparent)',
      },
      backgroundSize: {
        'grid-sm': '20px 20px',
        'grid-md': '40px 40px',
        'grid-lg': '80px 80px',
      },
      animation: {
        'pulse-volt':   'pulseVolt 3s ease-in-out infinite',
        'pulse-cyan':   'pulseCyan 3s ease-in-out infinite 1s',
        'pulse-plasma': 'pulsePlasma 3s ease-in-out infinite 2s',
        'blink-dot':    'blinkDot 1s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float 10s ease-in-out infinite',
        'ping-slow':    'ping 2.5s cubic-bezier(0,0,0.2,1) infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'scan':         'scan 8s linear infinite',
        'data-stream':  'dataStream 20s linear infinite',
        'border-flow':  'borderFlow 4s linear infinite',
        'orbit':        'orbit 8s linear infinite',
        'rise':         'rise 0.5s ease-out forwards',
        'glitch':       'glitch 4s steps(1) infinite',
        'hue-shift':    'hueShift 8s linear infinite',
        'spark':        'spark 1.5s ease-out forwards',
      },
      keyframes: {
        pulseVolt:   { '0%,100%': { opacity: '0.08' }, '50%': { opacity: '0.2' } },
        pulseCyan:   { '0%,100%': { opacity: '0.06' }, '50%': { opacity: '0.15' } },
        pulsePlasma: { '0%,100%': { opacity: '0.05' }, '50%': { opacity: '0.12' } },
        blinkDot:    { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.15' } },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        dataStream: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 400px' },
        },
        borderFlow: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(8px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(8px) rotate(-360deg)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glitch: {
          '0%,94%,100%': { transform: 'translate(0)' },
          '95%': { transform: 'translate(-2px, 1px)' },
          '96%': { transform: 'translate(2px, -1px)' },
          '97%': { transform: 'translate(-1px, 2px)' },
        },
        hueShift: {
          '0%':   { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        spark: {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(2.5)' },
        },
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
        '3xl': '64px',
      },
      spacing: {
        sidebar: '68px',
        'sidebar-expanded': '260px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
