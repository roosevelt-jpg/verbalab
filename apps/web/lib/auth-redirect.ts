/**
 * Post-Clerk destinations. Auth is Clerk-only; product setup lives at /onboarding.
 * After sign-in/up we land on /post-auth, which checks platform admin first
 * (ADMIN_EMAILS) and routes to /admin without painting the onboarding wizard.
 * Regular users continue to /onboarding (or their workspace if already done).
 */

export const ONBOARDING_PATH = '/onboarding';

export const ONBOARDING_SKIP_PATH = '/onboarding?skipOnboarding=1';

/** Neutral gate after Clerk — resolves admin vs onboarding before UI. */
export const POST_AUTH_PATH = '/post-auth';

/** After sign-up or sign-in — resolve destination without flashing onboarding. */
export function afterClerkAuthPath(): string {
  return process.env.NEXT_PUBLIC_SKIP_ONBOARDING === '1'
    ? ONBOARDING_SKIP_PATH
    : POST_AUTH_PATH;
}
