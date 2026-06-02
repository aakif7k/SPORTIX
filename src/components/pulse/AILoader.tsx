import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAILoader } from '../../hooks/useAILoader';
import { Zap } from 'lucide-react';

interface AILoaderProps {
  messages?: string[];
  onComplete?: () => void;
}

export const AILoader: React.FC<AILoaderProps> = ({
  messages = [
    'Activating Pulse Engine...',
    'Scanning 1,284 athlete profiles...',
    'Analyzing Pulse Score compatibility...',
    'Checking team chemistry signals...',
    'Evaluating position balance...',
    'Optimizing tactical structure...',
    'Calculating role efficiency...',
    'Finalizing squad composition...'
  ],
  onComplete,
}) => {
  const { displayedMessages, currentIdx, progress } = useAILoader(
    messages,
    onComplete,
    750
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-8 font-mono text-[14px]">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-[#CCFF00] animate-pulse" size={16} fill="#CCFF00" />
          <span className="text-[#CCFF00] font-bold tracking-wider uppercase">PULSE ENGINE ONLINE</span>
        </div>
        <span className="text-text-secondary text-[11px]">SYS_REV_v3.42</span>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full space-y-3.5">
        <AnimatePresence>
          {displayedMessages.map((msg, idx) => {
            const isLatest = idx === currentIdx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                style={{ color: isLatest ? '#CCFF00' : '#3A3A3A' }}
                className="flex items-start gap-2.5"
              >
                <span className="select-none font-bold">&gt;</span>
                <span className="leading-relaxed">{msg}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom Progress Bar */}
      <div className="space-y-2 max-w-xl mx-auto w-full border-t border-white/5 pt-6">
        <div className="flex justify-between text-[11px] text-text-secondary">
          <span>MATCHMAKING ALGORITHM ACTIVE</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#CCFF00]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
