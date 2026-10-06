'use client';

import { useEffect } from 'react';

/** Loads Sentry browser SDK only when NEXT_PUBLIC_SENTRY_DSN is set. */
export function SentryInit() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    void import('../sentry.client.config');
  }, []);
  return null;
}
