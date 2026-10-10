/**
 * Post-Clerk destinations. Auth is Clerk-only; product setup lives at /onboarding.
 * Platform admins who land on /onboarding are automatically routed to /admin via
 * GET /v1/admin/status (ADMIN_EMAILS allowlist) without forcing the plan wizard.
 * Returning users who already finished onboarding are sent onward by the
 * onboarding client (localStorage + GET /v1/onboarding).
 */

export const ONBOARDING_PATH = '/onboarding';

export const ONBOARDING_SKIP_PATH = '/onboarding?skipOnboarding=1';

/** After sign-up or sign-in — always enter Lugemi onboarding gate first. */
export function afterClerkAuthPath(): string {
  return process.env.NEXT_PUBLIC_SKIP_ONBOARDING === '1'
    ? ONBOARDING_SKIP_PATH
    : ONBOARDING_PATH;
}
