export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

/**
 * Whether to show "Continue with Google" on /sign-up and /sign-in.
 * Clerk Dashboard must have Social Connections → Google enabled (custom GCP credentials
 * for lugemi.com). Production Fly builds set NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED=true.
 *
 * Hide the button with NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED=false (or 0), or
 * NEXT_PUBLIC_CLERK_ENABLE_GOOGLE=false.
 */
export function isClerkGoogleOAuthEnabled(): boolean {
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
