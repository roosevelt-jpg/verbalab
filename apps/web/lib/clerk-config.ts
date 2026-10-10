export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

/**
 * Check whether Google OAuth is enabled in Clerk.
 * In production Clerk environments, Social Connections (Google) are configured in the
 * Clerk Dashboard using Google Cloud OAuth Client ID & Secret.
 *
 * If NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED is explicitly set to 'false' or '0',
 * or if NEXT_PUBLIC_CLERK_ENABLE_GOOGLE is set to 'false', social sign-in can be hidden
 * to prevent broken Google OAuth 400 invalid_request (missing client_id).
 */
export function isClerkGoogleOAuthEnabled(): boolean {
  if (
    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED === 'false' ||
    process.env.NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED === '0' ||
    process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE === 'false' ||
    process.env.NEXT_PUBLIC_CLERK_ENABLE_GOOGLE === '0'
  ) {
    return false;
  }
  return true;
}
