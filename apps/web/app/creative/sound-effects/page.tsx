import { Suspense } from 'react';
import { CreativeSfxClient } from './sfx-client';

export default function CreativeSfxPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading Sound Effects…</p>}>
      <CreativeSfxClient />
    </Suspense>
  );
}
