import { LUGEMI_SESSION_COOKIE } from './config';

/** Sync a lightweight session marker for Next middleware route protection. */
export async function syncAuthSessionCookie(idToken: string | null): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (idToken) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        credentials: 'same-origin',
      });
    } else {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
    }
  } catch {
    /* middleware cookie is best-effort; API still uses Bearer */
  }
}

export function clearAuthSessionCookieClient(): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LUGEMI_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
