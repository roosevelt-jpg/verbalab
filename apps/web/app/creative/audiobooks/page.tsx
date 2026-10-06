'use client';

import { CreativeToolSurface } from '@/components/creative/creative-tool-surface';

export default function CreativeAudiobooksPage() {
  return (
    <CreativeToolSurface
      config={{
        title: 'Audiobooks',
        lede: 'Long-form narration with Echo voices.',
        status: 'companion',
        icon: 'book',
        honesty:
          'There is no separate audiobook production suite yet. Use Text to Speech for chapter narration, Assets for chapter audio, and Flows for batch transcribe/translate pipelines.',
        primaryHref: '/creative/text-to-speech',
        primaryLabel: 'Narrate with TTS',
        secondaryHref: '/creative/flows',
        secondaryLabel: 'Batch with Flows',
      }}
    />
  );
}
