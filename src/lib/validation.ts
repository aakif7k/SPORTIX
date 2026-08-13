export interface ValidationResult {
  valid: boolean;
  error?: string;
  hint?: string;
}

// Reserved usernames (never allowed)
const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'support', 'sportix',
  'official', 'system', 'moderator', 'help', 'info',
  'contact', 'security', 'team', 'staff', 'bot',
  'root', 'null', 'undefined', 'api', 'static',
  'www', 'mail', 'email', 'test', 'demo',
]);

export function validateFullName(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return {
    valid: false,
    error: 'Full name is required.'
  };
  if (trimmed.length < 2) return {
    valid: false,
    error: 'Name must be at least 2 characters.'
  };
  if (trimmed.length > 60) return {
    valid: false,
    error: 'Name must be under 60 characters.'
  };
  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) return {
    valid: false,
    error: 'Name can only contain letters, spaces, and hyphens.'
  };
  return { valid: true };
}

export function validateUsername(value: string): ValidationResult {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) return {
    valid: false,
    error: 'Username is required.'
  };
  if (trimmed.length < 3) return {
    valid: false,
    error: 'Username must be at least 3 characters.',
    hint: `${3 - trimmed.length} more character${
      3 - trimmed.length === 1 ? '' : 's'
    } needed.`
  };
  if (trimmed.length > 20) return {
    valid: false,
    error: 'Username must be 20 characters or less.'
  };
  if (/\s/.test(trimmed)) return {
    valid: false,
    error: 'Username cannot contain spaces.'
  };
  if (!/^[a-z0-9_\.]+$/.test(trimmed)) return {
    valid: false,
    error: 'Only letters, numbers, underscores, and dots allowed.'
  };
  if (/^[_\.]/.test(trimmed) || /[_\.]$/.test(trimmed)) return {
    valid: false,
    error: 'Username cannot start or end with _ or .'
  };
  if (/[_\.]{2,}/.test(trimmed)) return {
    valid: false,
    error: 'Cannot have consecutive . or _ characters.'
  };
  if (RESERVED_USERNAMES.has(trimmed)) return {
    valid: false,
    error: 'This username is reserved. Choose another.'
  };
  return { valid: true };
}

export function validateEmail(value: string): ValidationResult {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return {
    valid: false,
    error: 'Email address is required.'
  };
  // RFC 5322 compliant pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return {
    valid: false,
    error: 'Enter a valid email address.'
  };
  return { valid: true };
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3;
  label: 'Weak' | 'Fair' | 'Strong';
  color: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  errors: string[];
}

export function validatePassword(value: string): {
  result: ValidationResult;
  strength: PasswordStrength;
} {
  const checks = {
    minLength: value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasLowercase: /[a-z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
  };

  const errors: string[] = [];
  if (!checks.minLength) errors.push('At least 8 characters');
  if (!checks.hasUppercase) errors.push('One uppercase letter');
  if (!checks.hasLowercase) errors.push('One lowercase letter');
  if (!checks.hasNumber) errors.push('One number');

  const passedCount = Object.values(checks).filter(Boolean).length;

  const score: 0 | 1 | 2 | 3 =
    passedCount <= 2 ? 0 :
    passedCount === 3 ? 1 :
    passedCount === 4 ? 2 : 3;

  const strength: PasswordStrength = {
    score,
    label: score <= 1 ? 'Weak' :
           score === 2 ? 'Fair' : 'Strong',
    color: score <= 1 ? '#F87171' :
           score === 2 ? '#FBBF24' : '#4ADE80',
    checks,
    errors,
  };

  const isValid = checks.minLength &&
                  checks.hasUppercase &&
                  checks.hasLowercase &&
                  checks.hasNumber;

  return {
    result: {
      valid: isValid,
      error: isValid ? undefined :
        'Password needs: ' + errors.slice(0, 2).join(', '),
    },
    strength,
  };
}

export function validateConfirmPassword(
  password: string,
  confirm: string
): ValidationResult {
  if (!confirm) return {
    valid: false,
    error: 'Please confirm your password.'
  };
  if (password !== confirm) return {
    valid: false,
    error: "Passwords don't match."
  };
  return { valid: true };
}
