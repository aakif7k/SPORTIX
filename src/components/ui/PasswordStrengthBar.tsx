import type { PasswordStrength } from '@/lib/validation';

export function PasswordStrengthBar({
  strength
}: { strength: PasswordStrength }) {
  return (
    <div style={{ marginTop: '6px' }}>
      {/* Segmented bar */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '6px',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1,
            height: '4px',
            borderRadius: '2px',
            background: i < strength.score + 1
              ? strength.color
              : 'var(--border-default, #2A2A2A)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          color: strength.color,
          fontWeight: 500,
        }}>
          {strength.score > 0 ? strength.label : ''}
        </span>

        {/* Remaining requirements */}
        {strength.errors.length > 0 && (
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '11px',
            color: 'var(--text-muted, #666)',
          }}>
            Needs: {strength.errors.slice(0, 2).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
