import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MappedError } from '@/lib/errorMapper';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;        // ms, 0 = persistent
  action?: ToastAction;
  onDismiss?: () => void;
}

// Global toast store (singleton pattern)
type ToastListener = (toasts: Toast[]) => void;
const toastListeners = new Set<ToastListener>();
let toastQueue: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(fn => fn([...toastQueue]));
}

export const toast = {
  show(config: Omit<Toast, 'id'>): string {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = {
      id,
      duration: config.duration ?? (config.type === 'error' ? 6000 : 3500),
      ...config,
    };
    toastQueue = [...toastQueue.slice(-3), t]; // max 4 visible
    notifyListeners();
    if (t.duration && t.duration > 0) {
      setTimeout(() => toast.dismiss(id), t.duration);
    }
    return id;
  },

  success(title: string, message?: string): string {
    return toast.show({ type: 'success', title, message });
  },

  error(title: string, message?: string, duration = 6000): string {
    return toast.show({ type: 'error', title, message, duration });
  },

  warning(title: string, message?: string): string {
    return toast.show({ type: 'warning', title, message });
  },

  info(title: string, message?: string): string {
    return toast.show({ type: 'info', title, message, duration: 3500 });
  },

  fromMappedError(err: MappedError): string {
    return toast.show({
      type: err.severity === 'warning' ? 'warning' :
            err.severity === 'info' ? 'info' : 'error',
      title: err.title,
      message: err.message,
      action: err.action?.callback ? undefined : err.action
        ? {
            label: err.action.label,
            onClick: () => {
              if (err.action?.route) {
                window.location.href = err.action.route;
              }
            },
          }
        : undefined,
    });
  },

  dismiss(id: string): void {
    toastQueue = toastQueue.filter(t => t.id !== id);
    notifyListeners();
  },

  dismissAll(): void {
    toastQueue = [];
    notifyListeners();
  },
};

// ICONS per type
const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="#4ADE80" strokeWidth="1.5"/>
      <path d="M6 10l3 3 5-5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="#F87171" strokeWidth="1.5"/>
      <path d="M10 6v5M10 14v.5" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3L18 17H2L10 3z" stroke="#FBBF24" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 8v4M10 14.5v.5" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="#60A5FA" strokeWidth="1.5"/>
      <path d="M10 9v5M10 7V6" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

const COLORS = {
  success: { border: '#4ADE80', bg: 'rgba(74,222,128,0.08)' },
  error:   { border: '#F87171', bg: 'rgba(248,113,113,0.08)' },
  warning: { border: '#FBBF24', bg: 'rgba(251,191,36,0.08)' },
  info:    { border: '#60A5FA', bg: 'rgba(96,165,250,0.08)' },
};

// Individual toast card
function ToastCard({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  const color = COLORS[t.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      role="alert"
      aria-live="polite"
      className="sportix-toast-card"
      style={{
        background: 'var(--bg-card, #181818)',
        border: `1px solid ${color.border}`,
        borderLeft: `3px solid ${color.border}`,
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: '360px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)',
        position: 'relative',
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: '1px' }}>
        {ICONS[t.type]}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600,
          fontSize: '15px',
          color: 'var(--text-primary, #fff)',
          marginBottom: t.message ? '2px' : 0,
          lineHeight: '1.3',
        }}>{t.title}</div>

        {t.message && (
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '12px',
            color: 'var(--text-muted, #888)',
            lineHeight: '1.5',
          }}>{t.message}</div>
        )}

        {t.action && (
          <button
            onClick={t.action.onClick}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 0 0',
              fontFamily: 'DM Mono, monospace',
              fontSize: '12px',
              color: color.border,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >{t.action.label}</button>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#888',
          cursor: 'pointer',
          padding: '2px',
          fontSize: '16px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >✕</button>
    </motion.div>
  );
}

// Toast container — mount ONCE in App.tsx
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: ToastListener = (t) => setToasts(t);
    toastListeners.add(listener);
    return () => { toastListeners.delete(listener); };
  }, []);

  return (
    <div
      aria-label="Notifications"
      className="sportix-toast-container fixed bottom-20 right-4 md:right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-32px)]"
    >
      <div className="flex flex-col gap-2 items-end w-full pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <ToastCard
              key={t.id}
              t={t}
              onDismiss={() => toast.dismiss(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
