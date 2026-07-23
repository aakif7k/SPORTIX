/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core mapped to CSS vars for backwards compatibility & consistency
        volt:        'var(--accent)',
        'volt-dim':  'var(--accent-surface)',
        'volt-glow': 'var(--accent-glow)',
        
        // Status Colors mapped from CSS vars
        success: 'var(--success)',
        'success-dim': 'var(--success-dim)',
        warning: 'var(--warning)',
        'warning-dim': 'var(--warning-dim)',
        danger:  'var(--danger)',
        'danger-dim': 'var(--danger-dim)',
        info:    'var(--info)',
        'info-dim': 'var(--info-dim)',
        
        // Backgrounds
        base:      'var(--bg-base)',
        surface:   'var(--bg-surface)',
        elevated:  'var(--bg-elevated)',
        panel:     'var(--bg-elevated)', // mapped for backward compatibility
        
        // Borders
        'border-muted':  'var(--border)',
        'border-glow':   'var(--accent-border)',
        
        // Text
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        'text-dim':       'var(--text-disabled)',
        
        // Accent
        accent:           'var(--accent)',
        'accent-surface': 'var(--accent-surface)',
        'accent-text':    'var(--accent-text)',

        // Custom cyber/neon theme variables
        cyan:             'var(--cyan)',
        'cyan-dim':       'var(--cyan-dim)',
        'cyan-text':      'var(--cyan-text)',
        plasma:           'var(--plasma)',
        'plasma-dim':     'var(--plasma-dim)',
        hot:              'var(--hot)',
        'hot-dim':        'var(--hot-dim)',
        'volt-text':      'var(--volt-text)',
      },
      fontFamily: {
        sans:      ['"Urbanist"', 'sans-serif'],
        label:     ['"Urbanist"', 'sans-serif'],
        condensed: ['"Urbanist"', 'sans-serif'],
        body:      ['"Urbanist"', 'sans-serif'],
        display:   ['"Urbanist"', 'sans-serif'],
        mono:      ['"Urbanist"', 'sans-serif'],
      },
      boxShadow: {
        // Strip green glows -> map to neutral elevation system
        'glow-volt-xs': 'var(--shadow-card)',
        'glow-volt-sm': 'var(--shadow-card)',
        'glow-volt':    'var(--shadow-hover)',
        'glow-volt-lg': 'var(--shadow-hover)',
        // Card
        card:         'var(--shadow-card)',
        hover:        'var(--shadow-hover)',
        'card-float': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-hover)',
        'neuo':       'inset 2px 2px 5px rgba(0,0,0,0.05), inset -1px -1px 4px rgba(255,255,255,0.5)',
        'neuo-out':   'var(--shadow-card)',
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
        'lg': '12px',
        'xl': '14px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
        'full': '999px',
      },
    },
  },
  plugins: [],
};
