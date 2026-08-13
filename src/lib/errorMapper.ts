import { AppwriteException } from 'appwrite';

export interface MappedError {
  code: string;
  title: string;
  message: string;
  action?: {
    label: string;
    route?: string;
    callback?: string;
  };
  field?: string;        // for inline field errors
  severity: 'error' | 'warning' | 'info';
}

// Map Appwrite error codes to SPORTiX messages
const APPWRITE_ERROR_MAP: Record<string, MappedError> = {
  // Auth errors
  'user_already_exists': {
    code: 'EMAIL_REGISTERED',
    title: 'Email already registered',
    message: 'An account already exists with this email. Try logging in instead.',
    action: { label: 'Go to Login', route: '/login' },
    field: 'email',
    severity: 'error',
  },
  'user_invalid_credentials': {
    code: 'INVALID_CREDENTIALS',
    title: 'Incorrect details',
    message: 'Email or password is incorrect.',
    severity: 'error',
  },
  'user_not_found': {
    code: 'INVALID_CREDENTIALS',
    title: 'Incorrect details',
    // Security: don't reveal account existence
    message: 'Email or password is incorrect.',
    severity: 'error',
  },
  'user_session_not_found': {
    code: 'SESSION_EXPIRED',
    title: 'Session expired',
    message: 'Your session has expired. Please log in again.',
    action: { label: 'Log In', route: '/login' },
    severity: 'warning',
  },
  'user_invalid_token': {
    code: 'INVALID_TOKEN',
    title: 'Invalid token',
    message: 'Your reset link has expired. Request a new one.',
    severity: 'error',
  },
  'user_unauthorized': {
    code: 'UNAUTHORIZED',
    title: 'Access denied',
    message: "You don't have permission to do that.",
    severity: 'error',
  },
  'rate_limit_exceeded': {
    code: 'RATE_LIMITED',
    title: 'Too many attempts',
    message: 'Too many requests. Please wait a moment and try again.',
    severity: 'warning',
  },
  'document_not_found': {
    code: 'NOT_FOUND',
    title: 'Not found',
    message: 'This item no longer exists.',
    severity: 'error',
  },
  'document_already_exists': {
    code: 'DUPLICATE',
    title: 'Already exists',
    message: 'This record already exists.',
    severity: 'error',
  },
  'document_invalid_structure': {
    code: 'VALIDATION_ERROR',
    title: 'Something went wrong',
    message: 'Please check your information and try again.',
    severity: 'error',
  },
  'storage_file_type_unsupported': {
    code: 'INVALID_FILE_TYPE',
    title: 'File type not supported',
    message: 'Please upload a JPG, PNG, or WebP image.',
    severity: 'error',
  },
  'storage_file_size_exceeded': {
    code: 'FILE_TOO_LARGE',
    title: 'File too large',
    message: 'Image must be under 10MB.',
    severity: 'error',
  },
  'network_general_error': {
    code: 'NETWORK_ERROR',
    title: 'Connection failed',
    message: "Couldn't connect to SPORTiX. Check your internet.",
    action: { label: 'Try Again', callback: 'retry' },
    severity: 'error',
  },
  'service_unavailable': {
    code: 'SERVICE_DOWN',
    title: 'SPORTiX unavailable',
    message: 'SPORTiX is temporarily down. Please try again shortly.',
    severity: 'error',
  },
};

// Google OAuth specific errors
const GOOGLE_ERROR_MAP: Record<string, MappedError> = {
  'popup_closed_by_user': {
    code: 'GOOGLE_CANCELLED',
    title: 'Sign-in cancelled',
    message: 'Google sign-in was cancelled.',
    severity: 'info',
  },
  'access_denied': {
    code: 'GOOGLE_DENIED',
    title: 'Access denied',
    message: 'Google sign-in permission was denied.',
    severity: 'error',
  },
  'network_error': {
    code: 'GOOGLE_NETWORK',
    title: 'Connection failed',
    message: 'Check your internet connection and try again.',
    action: { label: 'Try Again', callback: 'retry' },
    severity: 'error',
  },
};

export function mapAppwriteError(
  error: unknown,
  _context?: string
): MappedError {
  // Check for Appwrite exception or string/object error representation
  if (error instanceof AppwriteException) {
    const mapped = APPWRITE_ERROR_MAP[error.type];
    if (mapped) return mapped;

    // Network/connectivity errors
    if (error.code === 0 || error.message.toLowerCase().includes('network')) {
      return APPWRITE_ERROR_MAP['network_general_error'];
    }
    if (error.code === 503 || error.code === 502) {
      return APPWRITE_ERROR_MAP['service_unavailable'];
    }
    if (error.code === 401 || error.code === 403) {
      return APPWRITE_ERROR_MAP['user_unauthorized'];
    }
    if (error.code === 409) {
      return APPWRITE_ERROR_MAP['user_already_exists'];
    }
  } else if (error && typeof error === 'object') {
    const errObj = error as Record<string, any>;
    const type = errObj.type || errObj.code;
    if (type && APPWRITE_ERROR_MAP[type]) {
      return APPWRITE_ERROR_MAP[type];
    }
    if (errObj.message && typeof errObj.message === 'string') {
      const msg = errObj.message.toLowerCase();
      if (msg.includes('already exists') || msg.includes('already registered')) {
        return APPWRITE_ERROR_MAP['user_already_exists'];
      }
      if (msg.includes('invalid credentials') || msg.includes('invalid email or password')) {
        return APPWRITE_ERROR_MAP['user_invalid_credentials'];
      }
      if (msg.includes('network') || msg.includes('failed to fetch')) {
        return APPWRITE_ERROR_MAP['network_general_error'];
      }
    }
  }

  // Unhandled errors — never expose internals
  console.error('[ErrorMapper] Unmapped error:', error);
  return {
    code: 'UNKNOWN_ERROR',
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    action: { label: 'Try Again', callback: 'retry' },
    severity: 'error',
  };
}

export function mapGoogleError(error: unknown): MappedError {
  if (error instanceof Error) {
    const mapped = Object.entries(GOOGLE_ERROR_MAP).find(
      ([key]) => error.message.toLowerCase().includes(key)
    );
    if (mapped) return mapped[1];
  }
  return {
    code: 'GOOGLE_FAILED',
    title: 'Google sign-in failed',
    message: "Couldn't complete Google sign-in. Please try again.",
    severity: 'error',
  };
}

export function mapUploadError(error: unknown): MappedError {
  if (error instanceof AppwriteException) {
    if (error.type === 'storage_file_type_unsupported') {
      return APPWRITE_ERROR_MAP['storage_file_type_unsupported'];
    }
    if (error.type === 'storage_file_size_exceeded') {
      return APPWRITE_ERROR_MAP['storage_file_size_exceeded'];
    }
  }
  return {
    code: 'UPLOAD_FAILED',
    title: 'Upload failed',
    message: "Couldn't upload your photo. Tap to try again.",
    action: {
      label: 'Try Again',
      callback: 'retry'
    },
    severity: 'error',
  };
}
