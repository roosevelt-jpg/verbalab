'use client';

import { CreativeToolSurface } from '@/components/creative/creative-tool-surface';

export default function CreativeSttPage() {
  return (
    <CreativeToolSurface
      config={{
        title: 'Speech to Text',
        lede: 'Transcribe audio with Lugemi speech recognition.',
        status: 'live',
        icon: 'stt',
        honesty:
          'Speech recognition and streaming STT are available on the Speech Recognition console and Speech Cloud hub.',
        primaryHref: '/speech-recognition',
        primaryLabel: 'Open Speech Recognition',
        secondaryHref: '/speech',
        secondaryLabel: 'Speech Cloud',
      }}
    />
  );
}
