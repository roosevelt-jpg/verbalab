'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  isBareLocalDevHost,
  isLiveClerkPublishableKey,
  liveClerkLocalUrl,
} from '@/lib/live-clerk-local-origin';

/**
 * With pk_live_, Clerk JS FAPI rejects Origin http://127.0.0.1 / localhost.
 * Delay mounting children (ClerkProvider) until we are on https://local.lugemi.com,
 * and hard-redirect bare local hosts so Next never surfaces a Clerk _baseFetch overlay.
 */
export function LiveKeyOriginGate({
  children,
  blockClerk = false,
}: {
  children: ReactNode;
  /** Server-computed: live keys + bare localhost Host header. */
  blockClerk?: boolean;
}) {
  const [allowClerk, setAllowClerk] = useState(() => {
    if (blockClerk) return false;
    if (typeof window === 'undefined') return true;
    const live = isLiveClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    return !(live && isBareLocalDevHost(window.location.hostname));
  });

  useEffect(() => {
    const live = isLiveClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    if (!live || !isBareLocalDevHost(window.location.hostname)) {
      setAllowClerk(true);
      return;
    }
    setAllowClerk(false);
    const dest = liveClerkLocalUrl(`${window.location.pathname}${window.location.search}`);
    window.location.replace(dest);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const text = args
        .map((a) => {
          if (typeof a === 'string') return a;
          if (a instanceof Error) return `${a.message}\n${a.stack ?? ''}`;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(' ');
      // Non-fatal while redirecting off a rejected Origin; login path uses local.lugemi.com.
      if (
        text.includes('clerk.lugemi.com') &&
        (text.includes('origin_invalid') ||
          text.includes('_baseFetch') ||
          text.includes('Invalid HTTP Origin'))
      ) {
        return;
      }
      originalError.apply(console, args as []);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  if (!allowClerk) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          fontFamily: 'var(--font-noto), system-ui, sans-serif',
          background: '#f7f4ef',
          color: '#1c1917',
        }}
      >
        <p style={{ margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          Live Clerk keys require{' '}
          <a href={liveClerkLocalUrl('/dev-login')} style={{ color: '#0f766e', fontWeight: 700 }}>
            https://local.lugemi.com
          </a>
          . Redirecting…
        </p>
      </main>
    );
  }

  return children;
}
