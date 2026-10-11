import { Suspense } from 'react';
import { CreativeCaptionsClient } from './captions-client';

export default function CreativeCaptionsPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading Captions…</p>}>
      <CreativeCaptionsClient />
    </Suspense>
  );
}
