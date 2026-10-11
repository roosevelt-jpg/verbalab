import { Suspense } from 'react';
import { CreativeDialogueClient } from './dialogue-client';

export default function CreativeDialoguePage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading Dialogue…</p>}>
      <CreativeDialogueClient />
    </Suspense>
  );
}
