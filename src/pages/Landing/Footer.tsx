import React from 'react';
import { useNavigate } from 'react-router-dom';

const LINKS = {
  PLATFORM: ['Features', 'Pulse System', 'AutoSquad', 'Events'],
  ATHLETES: ['Join Now', 'Leaderboards', 'Squad Finder', 'Tournaments'],
  COMPANY:  ['About', 'Blog', 'Careers', 'Press'],
  SUPPORT:  ['Help Center', 'Privacy', 'Terms', 'Contact'],
};

const SocialIcon: React.FC<{ label: string; children: React.ReactNode }> = ({ children }) => (
  <div className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all"
    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(204,255,0,0.4)';
      (e.currentTarget as HTMLElement).style.background = 'rgba(204,255,0,0.06)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
    }}>
    {children}
  </div>
);

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="pt-16 pb-10" style={{ background: '#050505', borderTop: '1px solid #1A1A1A' }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Top row */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-12">
          {/* Logo + tagline */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#CCFF00" />
              </svg>
              <span className="font-['Bebas_Neue'] text-[28px] tracking-wider">
                <span className="text-white">SPORT</span><span style={{ color: '#CCFF00' }}>IX</span>
              </span>
            </div>
            <p className="font-mono text-[13px] text-[#555] leading-relaxed">
              The AI-powered sports ecosystem.
            </p>
          </div>

          {/* Links grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(LINKS).map(([category, links]) => (
              <div key={category}>
                <p className="font-mono text-[10px] text-[#444] uppercase tracking-[3px] mb-4">{category}</p>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link}>
                      <span
                        className="font-mono text-[13px] text-[#555] cursor-pointer transition-colors hover:text-[#CCFF00]"
                        onClick={() => link === 'Join Now' ? navigate('/signup') : undefined}>
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#1A1A1A', margin: '0 0 28px' }} />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[12px] text-[#444]">
            © 2025 SPORTiX. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2">
            {/* X/Twitter */}
            <SocialIcon label="X">
              <svg className="w-4 h-4" fill="#666" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </SocialIcon>
            {/* Instagram */}
            <SocialIcon label="Instagram">
              <svg className="w-4 h-4" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="#666" stroke="none"/>
              </svg>
            </SocialIcon>
            {/* Discord */}
            <SocialIcon label="Discord">
              <svg className="w-4 h-4" fill="#666" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </SocialIcon>
            {/* LinkedIn */}
            <SocialIcon label="LinkedIn">
              <svg className="w-4 h-4" fill="#666" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </SocialIcon>
          </div>
        </div>
      </div>
    </footer>
  );
};
