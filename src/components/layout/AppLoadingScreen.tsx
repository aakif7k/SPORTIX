import React from 'react';
import { motion } from 'framer-motion';

export const AppLoadingScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#080808] flex flex-col items-center justify-center gap-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-glow-volt">
          <img src="/logo.png" alt="SportiX" className="w-full h-full object-cover" />
        </div>
        <span className="font-display text-4xl text-volt tracking-widest">SPORTIX</span>
      </div>
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-volt rounded-full absolute left-0"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </motion.div>
  );
};
