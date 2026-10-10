export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

/**
 * Check whether Google OAuth is enabled in Clerk.
 * In production Clerk environments, Social Connections (Google) are configured in the
 * Clerk Dashboard using Google Cloud OAuth Client ID & Secret.
 *
 * Requirements: Hide Google if NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED=false or unconfigured.
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
