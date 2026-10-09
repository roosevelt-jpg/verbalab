/**
 * Post-Clerk destinations. Auth is Clerk-only; product setup lives at /onboarding.
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
