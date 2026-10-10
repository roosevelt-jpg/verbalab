'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

/** Platform-admin status is per user — cache across navigations within the tab. */
const adminStatusCache = new Map<string, boolean>();

/**
 * True when the signed-in user is on the platform admin allowlist.
 * Platform admins hold full features and must never see Upgrade CTAs.
 */
export function usePlatformAdmin(
  userId: string | null | undefined,
  getToken: () => Promise<string | null>,
): boolean {
  const [isAdmin, setIsAdmin] = useState<boolean>(() =>
    userId ? (adminStatusCache.get(userId) ?? false) : false,
  );

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const cached = adminStatusCache.get(userId);
    if (cached !== undefined) {
      setIsAdmin(cached);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const status = await apiFetch<{ admin: boolean }>('/v1/admin/status', { token });
        adminStatusCache.set(userId, Boolean(status.admin));
        if (typeof document !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `lugemi_platform_admin=${status.admin ? '1' : '0'}; Path=/; Max-Age=${60 * 60 * 24 * 400}; SameSite=Lax${secure}`;
        }
        if (!cancelled) setIsAdmin(Boolean(status.admin));
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, getToken]);

  return isAdmin;
}
