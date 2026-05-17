import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  telemetry?: boolean;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, className = '', telemetry, hover = true, onClick, padding = 'md' }) => {
  const padMap = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-7' };
  return (
    <motion.div
      whileHover={hover ? { boxShadow: '0 0 20px rgba(204,255,0,0.12), 0 0 40px rgba(204,255,0,0.04)', borderColor: 'rgba(204,255,0,0.18)' } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={[
        telemetry ? 'telemetry-card' : 'glass',
        'rounded-xl transition-colors duration-200',
        hover ? 'cursor-pointer' : '',
        padMap[padding],
        className,
      ].join(' ')}
    >
      {children}
    </motion.div>
  );
};
