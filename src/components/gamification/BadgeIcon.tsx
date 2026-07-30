import React from 'react';
import { motion } from 'framer-motion';
import { getBadgeTierInfo } from './badgeTiers';

interface BadgeIconProps {
  level: number;
  size?: number;
  animate?: boolean;
  glow?: boolean;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({
  level,
  size = 48,
  animate = true,
  glow = true,
}) => {
  const info = getBadgeTierInfo(level);
  
  // Custom futuristic esports layouts based on the level tier
  const renderBadgeGeometry = () => {
    switch (info.tier) {
      case 'rookie':
        return (
          // Green neon shield badge with minimal glowing edge
          <g>
            <polygon points="25,5 45,15 40,40 25,48 10,40 5,15" fill="#111" stroke={info.color} strokeWidth="2" />
            <polygon points="25,10 40,18 36,36 25,42 14,36 10,18" fill="url(#darkChrome)" opacity="0.8" />
            <line x1="25" y1="5" x2="25" y2="48" stroke={info.color} strokeWidth="1" opacity="0.3" />
          </g>
        );
      case 'challenger':
        // Futuristic silver badge with double wings
        return (
          <g>
            <polygon points="25,2 48,16 40,42 25,49 10,42 2,16" fill="#151618" stroke={info.color} strokeWidth="2.5" />
            <polygon points="25,8 42,20 35,38 25,44 15,38 8,20" fill="url(#silverChrome)" />
            <path d="M5,16 L15,16 M45,16 L35,16" stroke={info.color} strokeWidth="1.5" />
          </g>
        );
      case 'contender':
        // Metallic layered badge with sharp wings
        return (
          <g>
            <polygon points="25,2 48,12 42,32 25,48 8,32 2,12" fill="#0C151B" stroke="#00475A" strokeWidth="2" />
            <polygon points="25,6 44,15 39,30 25,43 11,30 6,15" fill="url(#darkChrome)" />
            {/* Layered inserts */}
            <polygon points="25,12 36,18 33,28 25,36 17,28 14,18" fill={info.color} opacity="0.9" />
          </g>
        );
      case 'striker':
        // Cyberpunk green crystal emblem
        return (
          <g>
            <polygon points="25,2 43,10 48,28 25,49 2,28 7,10" fill="#0B1C15" stroke={info.color} strokeWidth="2.5" />
            <polygon points="25,8 38,14 42,26 25,43 8,26 12,14" fill="url(#greenCrystal)" />
            <polygon points="25,14 32,18 34,24 25,34 16,24 18,18" fill="#111" stroke={info.color} strokeWidth="1.5" />
          </g>
        );
      case 'elite':
        // Dark chrome esports badge with floating hologram lines
        return (
          <g>
            <polygon points="25,2 46,10 42,38 25,49 8,38 4,10" fill="#1F162D" stroke={info.color} strokeWidth="3" />
            <polygon points="25,7 41,14 38,34 25,43 12,34 9,14" fill="url(#darkChrome)" />
            {/* Holographic V-wing */}
            <path d="M12,18 L25,32 L38,18" fill="none" stroke="#CCFF00" strokeWidth="2" opacity="0.8" />
          </g>
        );
      case 'dominator':
        // Aggressive angular elite badge
        return (
          <g>
            <polygon points="25,2 47,8 48,26 40,44 25,50 10,44 2,26 3,8" fill="#201008" stroke={info.color} strokeWidth="3" />
            <polygon points="25,8 42,13 43,24 36,38 25,43 14,38 7,24 8,13" fill="url(#darkChrome)" />
            <polygon points="25,12 34,22 25,32 16,22" fill={info.color} />
          </g>
        );
      case 'champion':
        // Futuristic trophy-inspired emblem
        return (
          <g>
            <polygon points="25,2 45,8 40,28 47,40 25,49 3,40 10,28 5,8" fill="#1E0A0A" stroke={info.color} strokeWidth="3" />
            <polygon points="25,7 39,12 35,27 41,36 25,43 9,36 15,27 11,12" fill="url(#goldChrome)" />
            <circle cx="25" cy="22" r="6" fill="#111" stroke={info.color} strokeWidth="2" />
          </g>
        );
      case 'titan':
        // Heavy armored badge style with wings
        return (
          <g>
            <polygon points="25,2 49,8 46,30 38,46 25,50 12,46 4,30 1,8" fill="#1D0E22" stroke={info.color} strokeWidth="3.5" />
            <polygon points="25,8 43,13 41,27 34,39 25,43 16,39 9,27 7,13" fill="url(#darkChrome)" />
            {/* Center core */}
            <rect x="20" y="16" width="10" height="15" rx="2" fill="none" stroke={info.color} strokeWidth="2" />
            <line x1="25" y1="16" x2="25" y2="31" stroke={info.color} strokeWidth="1" />
          </g>
        );
      case 'apex':
        // Premium esports-style rank emblem
        return (
          <g>
            <polygon points="25,2 48,15 48,35 25,50 2,35 2,15" fill="#0A182F" stroke={info.color} strokeWidth="3.5" />
            <polygon points="25,7 43,18 43,31 25,43 7,31 7,18" fill="url(#darkChrome)" />
            <polygon points="25,12 36,20 25,28 14,20" fill="none" stroke={info.color} strokeWidth="2.5" />
            <polygon points="25,18 31,22 25,26 19,22" fill={info.color} />
          </g>
        );
      case 'legend':
      case 'grandmaster':
      case 'hypernova':
      case 'phantom':
      case 'immortal':
      case 'supreme':
        // Legendary holographic badges with premium outer frames
        return (
          <g>
            {/* Outer halo */}
            <polygon points="25,0 50,14 50,36 25,50 0,36 0,14" fill="none" stroke={info.color} strokeWidth="1" opacity="0.5" strokeDasharray="3,3" />
            {/* Main body */}
            <polygon points="25,4 46,16 46,34 25,46 4,34 4,16" fill="#111" stroke="url(#prestigeGrad)" strokeWidth="3.5" />
            {/* Infill */}
            <polygon points="25,9 41,18 41,32 25,41 9,32 9,18" fill="url(#darkChrome)" />
            {/* Holographic core */}
            <polygon points="25,14 36,22 36,28 25,36 14,28 14,22" fill={info.color} opacity="0.85" style={{ filter: 'drop-shadow(0 0 4px #CCFF00)' }} />
            {/* Crown points for apex elite */}
            {info.tier === 'supreme' && (
              <polygon points="20,-2 25,2 30,-2 27,2 23,2" fill={info.color} />
            )}
          </g>
        );
    }
  };

  const glowStyles = glow ? {
    filter: `drop-shadow(0 0 10px ${info.glowColor})`,
  } : {};

  // Framer Motion prestige effect
  const motionProps = animate ? {
    animate: {
      y: [0, -3, 0],
      rotate: level > 100 ? [0, 1, -1, 0] : 0,
    },
    transition: {
      duration: level > 100 ? 3.5 : 4,
      repeat: Infinity,
      ease: 'easeInOut' as any,
    }
  } : {};

  return (
    <motion.div
      {...motionProps}
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, ...glowStyles }}
    >
      <svg
        viewBox="0 0 50 50"
        width="100%"
        height="100%"
        className="select-none overflow-visible"
      >
        <defs>
          {/* Custom SVG Shaders/Gradients */}
          <linearGradient id="darkChrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2A2D34" />
            <stop offset="50%" stopColor="#111317" />
            <stop offset="100%" stopColor="#080809" />
          </linearGradient>
          <linearGradient id="silverChrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="goldChrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="greenCrystal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
          <linearGradient id="prestigeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={info.color} />
            <stop offset="50%" stopColor={info.borderColor} />
            <stop offset="100%" stopColor={info.color} />
          </linearGradient>
        </defs>
        
        {renderBadgeGeometry()}
      </svg>
    </motion.div>
  );
};
