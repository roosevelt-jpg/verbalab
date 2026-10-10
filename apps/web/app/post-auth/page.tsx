import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PostAuthClient } from './post-auth-client';

export const metadata: Metadata = {
  title: 'Signing in',
  robots: { index: false, follow: false },
};

export default function PostAuthPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Signing you in…</p>
        </main>
      }
    >
      <PostAuthClient />
    </Suspense>
  );
}
