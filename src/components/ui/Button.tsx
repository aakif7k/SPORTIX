import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'ghost' | 'danger' | 'icon' | 'orange';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'bg-hot text-white hover:shadow-glow-hot active:shadow-glow-hot',
  orange: 'bg-hot/10 border border-hot/30 text-hot hover:border-hot hover:shadow-glow-hot hover:bg-hot/15',
  icon: 'bg-elevated border border-border-muted text-white hover:border-accent/40 hover:text-accent neuo',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, fullWidth, children, className = '', disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center font-label transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} /> : icon}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
