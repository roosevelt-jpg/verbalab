import { LUGEMI_SESSION_COOKIE } from './config';

export type SessionCookieSyncResult = { ok: boolean; status?: number };

/**
 * Sync a lightweight session marker for Next middleware route protection.
 * Returns whether the server accepted the token (callers that gate navigation
 * should check `ok` after sign-in).
 */
export async function syncAuthSessionCookie(
  idToken: string | null,
): Promise<SessionCookieSyncResult> {
  if (typeof window === 'undefined') return { ok: false };
  try {
    if (idToken) {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        credentials: 'same-origin',
      });
      return { ok: res.ok, status: res.status };
    }
    const res = await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    return { ok: res.ok, status: res.status };
  } catch {
    /* middleware cookie is best-effort; API still uses Bearer */
    return { ok: false };
  }
}

export function clearAuthSessionCookieClient(): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LUGEMI_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
