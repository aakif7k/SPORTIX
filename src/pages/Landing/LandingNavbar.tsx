import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pulse System', href: '#pulse' },
  { label: 'AutoSquad', href: '#autosquad' },
  { label: 'Events', href: '#events' },
];

const LightningBoltIcon: React.FC = () => (
  <svg
    width="22"
    height="28"
    viewBox="0 0 22 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M13 2L2 16H11L9 26L20 12H11L13 2Z"
      fill="#CCFF00"
      stroke="#CCFF00"
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
  </svg>
);

const HamburgerIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <div className="relative w-6 h-5 flex flex-col justify-between cursor-pointer">
    <motion.span
      animate={open ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="block h-[2px] w-6 bg-white origin-center"
    />
    <motion.span
      animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.2 }}
      className="block h-[2px] w-6 bg-white origin-center"
    />
    <motion.span
      animate={open ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="block h-[2px] w-6 bg-white origin-center"
    />
  </div>
);

const LandingNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prevScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 80);
      prevScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navStyle: React.CSSProperties = scrolled
    ? {
        backgroundColor: 'rgba(8,8,8,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(204,255,0,0.06)',
      }
    : {
        backgroundColor: 'transparent',
      };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '72px',
          zIndex: 100,
          transition: 'background-color 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
          ...navStyle,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            height: '100%',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            aria-label="SPORTiX Home"
          >
            <LightningBoltIcon />
            <span
              style={{
                fontFamily: "'Urbanist', sans-serif",
                fontSize: '26px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                lineHeight: 1,
                color: '#FFFFFF',
                userSelect: 'none',
              }}
            >
              SPORT<span style={{ color: '#CCFF00' }}>IX</span>
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div
            className="hidden md:flex"
            style={{ gap: '36px', alignItems: 'center' }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.querySelector(link.href);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#888888',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#CCFF00')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex" style={{ gap: '12px', alignItems: 'center' }}>
            <SignInButton onClick={() => navigate('/login')} />
            <GetStartedButton onClick={() => navigate('/signup')} />
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="flex md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Down Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '72px',
              left: 0,
              right: 0,
              zIndex: 99,
              background: 'rgba(8,8,8,0.96)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderBottom: '1px solid rgba(204,255,0,0.08)',
              padding: '24px 24px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0px',
            }}
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.22 }}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  setTimeout(() => {
                    const el = document.querySelector(link.href);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 200);
                }}
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontWeight: 700,
                  fontSize: '20px',
                  color: '#888888',
                  textDecoration: 'none',
                  letterSpacing: '0.03em',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#CCFF00')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
              >
                {link.label}
              </motion.a>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              <SignInButton
                onClick={() => { setMobileOpen(false); navigate('/login'); }}
                fullWidth
              />
              <GetStartedButton
                onClick={() => { setMobileOpen(false); navigate('/signup'); }}
                fullWidth
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Sub-components ─────────────────────────────────────── */

interface ButtonProps {
  onClick: () => void;
  fullWidth?: boolean;
}

const SignInButton: React.FC<ButtonProps> = ({ onClick, fullWidth }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "'Urbanist', sans-serif",
        fontWeight: 700,
        fontSize: '14px',
        letterSpacing: '0.05em',
        color: '#FFFFFF',
        background: 'transparent',
        border: `1px solid ${hovered ? '#CCFF00' : '#2A2A2A'}`,
        borderRadius: '8px',
        padding: '9px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, color 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      Sign In
    </button>
  );
};

const GetStartedButton: React.FC<ButtonProps> = ({ onClick, fullWidth }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: '14px',
        letterSpacing: '0.05em',
        color: '#080808',
        background: '#CCFF00',
        border: '1px solid #CCFF00',
        borderRadius: '8px',
        padding: '9px 20px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        boxShadow: hovered
          ? '0 0 20px rgba(204,255,0,0.45), 0 0 8px rgba(204,255,0,0.25)'
          : '0 0 0px rgba(204,255,0,0)',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      Get Started →
    </button>
  );
};

export default LandingNavbar;
export { LandingNavbar };
