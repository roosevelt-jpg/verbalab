/** User-facing messages for Firebase Auth client errors. */
export function firebaseAuthErrorMessage(
  err: unknown,
  opts: { action?: 'sign-in' | 'sign-up' } = {},
): string {
  const action = opts.action ?? 'sign-in';
  const code =
    typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
  const raw =
    err instanceof Error && err.message
      ? err.message
      : typeof err === 'object' && err && 'message' in err
        ? String((err as { message: unknown }).message)
        : '';

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Invalid email or password. If you previously used Clerk, create a new account here — accounts do not carry over.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Enter a valid email address.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Try again in a few minutes.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return action === 'sign-up' ? 'Google sign-up was cancelled.' : 'Google sign-in was cancelled.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Pop-up blocked. Allow pop-ups for lugemi.com and try again.';
  }
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return 'This sign-in method is not enabled in Firebase. Use email and password, or ask an admin to enable the provider in Firebase Authentication.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Firebase sign-in. Add it under Firebase Authentication → Settings → Authorized domains.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error talking to Firebase. Check your connection and try again.';
  }
  // Misconfigured Google OAuth client (placeholder / missing client) often surfaces as internal-error.
  if (
    code === 'auth/internal-error' ||
    /invalid_client|OAuth client was not found|configuration/i.test(raw)
  ) {
    return 'Google sign-in is misconfigured (OAuth client). Use email and password for now, or ask an admin to connect a real Google OAuth client in Firebase Authentication → Sign-in method → Google.';
  }
  if (raw) return raw;
  return action === 'sign-up' ? 'Sign-up failed. Please try again.' : 'Sign-in failed. Please try again.';
}
