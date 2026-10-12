import {
  isFirebaseConfigured,
  isFirebaseGoogleOAuthEnabled,
} from '@/lib/auth/config';

/**
 * True when console auth is available (Firebase preferred, else Clerk).
 * Kept under this name for back-compat across Studio gates.
 */
export function isClerkConfigured() {
  return (
    isFirebaseConfigured() || Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  );
}

/**
 * Whether to show "Continue with Google" on /sign-up and /sign-in.
 * Firebase: NEXT_PUBLIC_FIREBASE_GOOGLE_OAUTH_ENABLED (default on).
 * Clerk: NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED (production default true).
 */
export function isClerkGoogleOAuthEnabled(): boolean {
  if (isFirebaseConfigured()) {
    return isFirebaseGoogleOAuthEnabled();
  }

  const envVal = process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED;
  if (!envVal || envVal === 'false' || envVal === '0') {
    return false;
  }
  if (
    process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE === 'false' ||
    process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE === '0'
  ) {
    return false;
  }
  return true;
}
