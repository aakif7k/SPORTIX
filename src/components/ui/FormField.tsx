import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  success?: string;
  children: ReactNode;
  required?: boolean;
  id: string;
}

export function FormField({
  label, error, hint, success,
  children, required, id
}: FormFieldProps) {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          color: error ? '#F87171' :
                 success ? '#4ADE80' :
                 'var(--text-muted, #888)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {label}
        {required && <span style={{ color: '#F87171' }}>*</span>}
      </label>

      {children}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            marginTop: '2px',
          }}
        >
          {/* Error icon (not just color) */}
          <span style={{ color: '#F87171', fontSize: '13px', flexShrink: 0 }}>✕</span>
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '12px',
            color: '#F87171',
            lineHeight: '1.4',
          }}>{error}</span>
        </div>
      )}

      {/* Success state */}
      {!error && success && (
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '6px', marginTop: '2px',
        }}>
          <span style={{ color: '#4ADE80', fontSize: '13px' }}>✓</span>
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '12px',
            color: '#4ADE80',
          }}>{success}</span>
        </div>
      )}

      {/* Hint (no error state) */}
      {!error && !success && hint && (
        <span style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          color: 'var(--text-muted, #666)',
          marginTop: '2px',
        }}>{hint}</span>
      )}
    </div>
  );
}
