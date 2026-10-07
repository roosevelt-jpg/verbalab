'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  LIVE_CLERK_LOCAL_ORIGIN,
  isBareLocalDevHost,
  isLiveClerkPublishableKey,
  liveClerkLocalUrl,
} from '@/lib/live-clerk-local-origin';

/**
 * With pk_live_, Clerk JS FAPI rejects Origin http://127.0.0.1 / localhost.
 * Do not hard-redirect to local.lugemi.com (that host only works inside the agent VM
 * with /etc/hosts + HTTPS :443 proxy). Serve the page on loopback and show how to log in.
 */
export function LiveKeyOriginGate({
  children,
  blockClerk = false,
}: {
  children: ReactNode;
  /** Server-computed: live keys + bare localhost Host header. */
  blockClerk?: boolean;
}) {
  const [bareLocalLive, setBareLocalLive] = useState(() => {
    if (blockClerk) return true;
    if (typeof window === 'undefined') return false;
    const live = isLiveClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    return live && isBareLocalDevHost(window.location.hostname);
  });

  useEffect(() => {
    const live = isLiveClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    setBareLocalLive(Boolean(live && isBareLocalDevHost(window.location.hostname)));
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

  if (!bareLocalLive) {
    return children;
  }

  return (
    <>
      <div
        role="status"
        style={{
          background: '#fffbeb',
          borderBottom: '1px solid #fcd34d',
          color: '#78350f',
          padding: '0.85rem 1.25rem',
          fontFamily: 'var(--font-noto), system-ui, sans-serif',
          fontSize: '0.92rem',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
          Until Fly DNS is connected, open{' '}
          <a href="http://127.0.0.1:43125" style={{ color: '#0f766e' }}>
            http://127.0.0.1:43125
          </a>{' '}
          (or Cursor’s port preview) — not https://lugemi.com
        </strong>
        <span style={{ display: 'block' }}>
          Live Clerk keys reject bare localhost Origin. Login options:{' '}
          <a href="/dev-login" style={{ color: '#0f766e', fontWeight: 700 }}>
            /dev-login
          </a>{' '}
          (hosted ticket), or{' '}
          <a href={liveClerkLocalUrl('/dev-login')} style={{ color: '#0f766e', fontWeight: 700 }}>
            {LIVE_CLERK_LOCAL_ORIGIN}
          </a>{' '}
          only inside this agent VM (hosts + HTTPS proxy), or connect Fly + DNS later for real
          lugemi.com. Your laptop will not resolve local.lugemi.com unless you add hosts and run the
          proxy yourself.
        </span>
      </div>
      {children}
    </>
  );
}
