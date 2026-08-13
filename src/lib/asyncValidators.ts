import { databases, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';

export type AsyncValidationState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'error';

// Check username availability against Appwrite profiles collection
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; state: AsyncValidationState }> {
  if (!username || username.trim().length < 3) {
    return { available: false, state: 'idle' };
  }

  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.equal('username', username.toLowerCase().trim())]
    );

    return {
      available: result.total === 0,
      state: result.total === 0 ? 'available' : 'taken',
    };
  } catch (error) {
    console.error('[AsyncValidators] Username check failed:', error);
    return { available: false, state: 'error' };
  }
}

// Check email — only called before signup attempt
// Uses Appwrite's account creation attempt (safest method)
// Returns false if already registered
export async function checkEmailRegistered(
  _email: string
): Promise<boolean> {
  // Strategy: deferred to actual signup attempt
  // and error mapped appropriately
  return false;
}
