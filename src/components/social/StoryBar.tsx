import React, { useRef, useState } from 'react';
import { Plus, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DbStoryGroup } from '../../services/socialService';

// ─── Initials Avatar ──────────────────────────────────────────────────────────
const StoryAvatar: React.FC<{ url: string | null; name: string; size?: number }> = ({ url, name, size = 58 }) => {
  const [err, setErr] = useState(false);
  const initial = (name || '?').charAt(0).toUpperCase();

  if (url && !err) {
    return (
      <img
        src={url}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setErr(true)}
      />
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-[#1A2200]"
      style={{ fontSize: size * 0.38 }}
    >
      <span className="text-[#CCFF00] font-bold leading-none">{initial}</span>
    </div>
  );
};

// ─── Props ─────────────────────────────────────────────────────────────────────
interface StoryBarProps {
  currentUserName: string;
  currentUserAvatar: string | null;
  myGroup: DbStoryGroup | null;
  othersGroups: DbStoryGroup[];
  onOpenViewer: (group: DbStoryGroup) => void;
  onOpenCreator: () => void;
}

export const StoryBar: React.FC<StoryBarProps> = ({
  currentUserName,
  currentUserAvatar,
  myGroup,
  othersGroups,
  onOpenViewer,
  onOpenCreator,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Your Story bubble */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
          onClick={() => myGroup ? onOpenViewer(myGroup) : onOpenCreator()}
        >
          <div className="relative">
            {/* Ring — lime gradient if has stories, dashed if not */}
            <div
              className={`w-[62px] h-[62px] rounded-full flex items-center justify-center
                ${myGroup
                  ? 'bg-gradient-to-tr from-[#CCFF00] to-[#88ff44] p-[2px]'
                  : 'border-2 border-dashed border-border-muted'
                }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-elevated">
                <StoryAvatar url={currentUserAvatar} name={currentUserName} size={58} />
              </div>
            </div>

            {/* Plus badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#CCFF00] flex items-center justify-center border-2 border-background">
              <Plus size={10} className="text-black" strokeWidth={3} />
            </div>
          </div>
          <span className="text-[10px] text-text-secondary font-medium truncate max-w-[62px] text-center">
            Your Story
          </span>
        </motion.div>

        {/* Others' story bubbles */}
        {othersGroups.map((group) => (
          <motion.div
            key={group.author_id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
            onClick={() => onOpenViewer(group)}
          >
            <div className="relative">
              {/* Gradient ring: colored = unseen, gray = all seen */}
              <div
                className={`w-[62px] h-[62px] rounded-full p-[2.5px]
                  ${group.has_unseen
                    ? 'bg-gradient-to-tr from-[#CCFF00] via-[#00d4ff] to-[#ff6b35]'
                    : 'bg-border-muted'
                  }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                  <StoryAvatar url={group.author_avatar} name={group.author_name} size={56} />
                </div>
              </div>

              {/* Video indicator */}
              {group.stories.some(s => s.media_type === 'video') && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center border border-border-muted">
                  <Play size={8} className="text-white fill-white" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-text-secondary font-medium truncate max-w-[62px] text-center">
              {group.author_name.split(' ')[0]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Fade edges */}
      <div className="absolute right-0 top-0 h-[calc(100%-8px)] w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};
