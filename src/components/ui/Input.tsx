import React, { useEffect, useRef, useState } from 'react';

// ─── INPUT ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full bg-elevated border rounded-lg font-mono text-sm text-white placeholder-text-muted',
              'transition-all duration-200 outline-none',
              'border-border-muted focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)]',
              icon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              'py-3',
              error ? 'border-hot/50 focus:border-hot focus:shadow-[0_0_0_3px_rgba(255,59,0,0.08)]' : '',
              className,
            ].join(' ')}
            {...props}
          />
          {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">{rightIcon}</span>}
        </div>
        {error && <p className="mt-1.5 text-xs text-hot font-label">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── TEXTAREA ─────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">{label}</label>}
        <textarea
          ref={ref} id={inputId}
          className={['w-full bg-elevated border border-border-muted rounded-lg font-mono text-sm text-white placeholder-text-muted px-4 py-3 resize-none transition-all duration-200 outline-none focus:border-volt/50 focus:shadow-[0_0_0_3px_rgba(204,255,0,0.08)]', className].join(' ')}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-hot font-label">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── SELECT ────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-xs font-label font-medium text-text-secondary uppercase tracking-widest mb-2">{label}</label>}
      <select
        id={inputId}
        className={['w-full bg-elevated border border-border-muted rounded-lg font-mono text-sm text-white px-4 py-3 outline-none transition-all duration-200 focus:border-volt/50', className].join(' ')}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value} className="bg-elevated">{o.label}</option>)}
      </select>
      {error && <p className="mt-1.5 text-xs text-hot font-label">{error}</p>}
    </div>
  );
};

// ─── ANIMATED PLACEHOLDER INPUT ────────────────────────────────────────────
interface AnimatedPlaceholderInputProps extends Omit<InputProps, 'placeholder'> {
  placeholders: string[];
}
export const AnimatedPlaceholderInput: React.FC<AnimatedPlaceholderInputProps> = ({ placeholders, ...props }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % placeholders.length), 2500);
    return () => clearInterval(t);
  }, [placeholders.length]);
  return <Input placeholder={placeholders[idx]} {...props} />;
};
