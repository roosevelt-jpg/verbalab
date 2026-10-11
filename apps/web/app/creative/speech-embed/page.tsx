import { Suspense } from 'react';
import { CreativeSpeechEmbedClient } from './speech-embed-client';

export default function CreativeSpeechEmbedPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading Speech Player…</p>}>
      <CreativeSpeechEmbedClient />
    </Suspense>
  );
}
