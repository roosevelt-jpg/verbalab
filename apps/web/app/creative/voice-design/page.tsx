import { Suspense } from 'react';
import { CreativeVoiceDesignClient } from './voice-design-client';

export default function CreativeVoiceDesignPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading Voice Design…</p>}>
      <CreativeVoiceDesignClient />
    </Suspense>
  );
}
