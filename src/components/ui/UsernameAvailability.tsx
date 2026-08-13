import type { AsyncValidationState } from '@/lib/asyncValidators';

export function UsernameAvailability({
  state
}: { state: AsyncValidationState }) {
  if (state === 'idle') return null;

  const configs = {
    checking: {
      icon: '⟳',
      text: 'Checking availability...',
      color: '#888',
    },
    available: {
      icon: '✓',
      text: 'Username available',
      color: '#4ADE80',
    },
    taken: {
      icon: '✕',
      text: 'Username already taken. Try another.',
      color: '#F87171',
    },
    error: {
      icon: '⚠',
      text: "Couldn't verify availability.",
      color: '#FBBF24',
    },
  };

  const cfg = configs[state];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '4px',
      }}
    >
      <span style={{
        color: cfg.color,
        fontSize: '13px',
        display: 'inline-block',
        animation: state === 'checking'
          ? 'spin 1s linear infinite' : 'none',
      }}>
        {cfg.icon}
      </span>
      <span style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
        color: cfg.color,
      }}>
        {cfg.text}
      </span>
    </div>
  );
}
