import { Suspense } from 'react';
import { PolicyRuntimeClient } from './policy-runtime-client';

export default function PolicyRuntimePage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading…</div>}>
      <PolicyRuntimeClient />
    </Suspense>
  );
}
