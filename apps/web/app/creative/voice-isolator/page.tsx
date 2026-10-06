'use client';

import { CreativeToolSurface } from '@/components/creative/creative-tool-surface';

export default function CreativeVoiceIsolatorPage() {
  return (
    <CreativeToolSurface
      config={{
        title: 'Voice Isolator',
        lede: 'Isolate speech energy from noisy recordings.',
        status: 'live',
        icon: 'isolator',
        honesty:
          'Voice isolation runs through Lugemi Audio Intelligence (energy VAD / isolation). Echo cancellation and neural stem separation are not on this surface.',
        primaryHref: '/audio-intelligence',
        primaryLabel: 'Open Audio Intelligence',
        secondaryHref: '/audio?tab=extract',
        secondaryLabel: 'Voice Studio extract',
      }}
    />
  );
}
