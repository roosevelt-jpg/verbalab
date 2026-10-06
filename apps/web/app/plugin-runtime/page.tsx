import { Suspense } from 'react';
import { PluginRuntimeClient } from './plugin-runtime-client';

export default function PluginRuntimePage {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading…</div>}>
      <PluginRuntimeClient />
    </Suspense>
  );
}
