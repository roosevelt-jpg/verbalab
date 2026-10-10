/**
 * Cookie bridge so middleware can send incomplete setup back to /onboarding.
 * Clerk owns credentials; Lugemi owns product onboarding state.
 *
 * - `pending` — signed-in user has started (or must finish) /onboarding
 * - `done` — wizard finished or skipped; product routes allowed
 * - missing — legacy / first visit; do not force (local + API gate still apply)
 */

export const ONBOARDING_STATUS_COOKIE = 'lugemi_onboarding';
export const PLATFORM_ADMIN_COOKIE = 'lugemi_platform_admin';

export type OnboardingStatusCookie = 'pending' | 'done';

export function parseOnboardingStatusCookie(
  value: string | undefined | null,
): OnboardingStatusCookie | null {
  if (value === 'pending' || value === 'done') return value;
  return null;
}

/** Middleware: only `pending` forces /onboarding. */
export function shouldForceOnboardingFromCookie(
  value: string | undefined | null,
): boolean {
  return parseOnboardingStatusCookie(value) === 'pending';
}

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 400;

/** Client: sync status for Edge middleware on later navigations. */
export function setOnboardingStatusCookie(status: OnboardingStatusCookie): void {
  if (typeof document === 'undefined') return;
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie = `${ONBOARDING_STATUS_COOKIE}=${status}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function setPlatformAdminCookie(isAdmin: boolean): void {
  if (typeof document === 'undefined') return;
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  const value = isAdmin ? '1' : '0';
  document.cookie = `${PLATFORM_ADMIN_COOKIE}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function isPlatformAdminFromCookie(value: string | undefined | null): boolean {
  return value === '1' || value === 'true';
}
