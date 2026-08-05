/**
 * Reading a message off an unknown thrown value.
 *
 * `catch (e: any)` was used in a dozen places so that `e.message` would compile.
 * That is the wrong trade: `any` disables checking on everything downstream of the
 * catch, and a thrown value genuinely can be anything — a string, a number, an
 * object with no message, or an ApiError with a useful one.
 */
import { ApiError } from '@/lib/api';

/** The most useful message available, without assuming a shape. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string') return error || fallback;
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

/** The API error code, when the thrown value is one. */
export function errorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

/** The HTTP status, when the thrown value carries one. */
export function errorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  if (error && typeof error === 'object') {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}
