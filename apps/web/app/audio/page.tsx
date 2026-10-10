import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AudioClient } from './audio-client';

export default function AudioPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return (
    <Suspense fallback={<p style={{ padding: '2rem', color: 'var(--muted)' }}>Loading Voice Studio…</p>}>
      <AudioClient />
    </Suspense>
  );
}
