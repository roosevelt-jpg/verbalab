import { Suspense } from 'react';
import { CreativeTtsClient } from './tts-client';

export default function CreativeTtsPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading Text to Speech…</p>}>
      <CreativeTtsClient />
    </Suspense>
  );
}
