'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreativeToolSurface } from '@/components/creative/creative-tool-surface';

function MusicInner() {
  const search = useSearchParams();
  const q = search.get('q');
  return (
    <CreativeToolSurface
      config={{
        title: 'Music',
        lede: q ? `Prompt saved: “${q}”` : 'Music generation companion for intros and beds.',
        status: 'roadmap',
        icon: 'music',
        honesty:
          'Lugemi does not ship a metered music model yet. Save your intent, generate speech beds in Text to Speech, and bring external music stems into Assets / Studio.',
        primaryHref: '/creative/text-to-speech',
        primaryLabel: 'Make speech instead',
        secondaryHref: '/creative/assets',
        secondaryLabel: 'Upload stems',
        bullets: q ? [`Stored prompt: ${q}`] : undefined,
      }}
    />
  );
}

export default function CreativeMusicPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading Music…</p>}>
      <MusicInner />
    </Suspense>
  );
}
