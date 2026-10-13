/** Prefer Firebase when configured — skips Clerk JS/middleware (faster Studio nav). */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}

export function isClerkConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function isAuthConfigured(): boolean {
  return isFirebaseConfigured() || isClerkConfigured();
}

export type AuthBackend = 'firebase' | 'clerk' | 'none';

export function authBackend(): AuthBackend {
  if (isFirebaseConfigured()) return 'firebase';
  if (isClerkConfigured()) return 'clerk';
  return 'none';
}

export function isFirebaseGoogleOAuthEnabled(): boolean {
  const envVal = process.env.NEXT_PUBLIC_FIREBASE_GOOGLE_OAUTH_ENABLED;
  // Opt-in: Google provider must be enabled in Firebase Console (OAuth client required).
  // Default off so we never show a broken "Continue with Google" button.
  if (!envVal || envVal === 'false' || envVal === '0') return false;
  return isFirebaseConfigured();
}

export const LUGEMI_SESSION_COOKIE = 'lugemi_session';
