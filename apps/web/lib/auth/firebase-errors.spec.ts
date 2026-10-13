import { describe, expect, it } from 'vitest';
import { firebaseAuthErrorMessage } from './firebase-errors';

describe('firebaseAuthErrorMessage', () => {
  it('explains Clerk → Firebase credential mismatch', () => {
    expect(firebaseAuthErrorMessage({ code: 'auth/invalid-credential' })).toMatch(/Clerk/);
  });

  it('flags Google OAuth misconfiguration', () => {
    expect(
      firebaseAuthErrorMessage({
        code: 'auth/internal-error',
        message: 'The OAuth client was not found.',
      }),
    ).toMatch(/OAuth client/);
  });

  it('distinguishes popup blocked vs cancelled', () => {
    expect(firebaseAuthErrorMessage({ code: 'auth/popup-blocked' })).toMatch(/Pop-up blocked/);
    expect(firebaseAuthErrorMessage({ code: 'auth/popup-closed-by-user' })).toMatch(/cancelled/);
  });
});
