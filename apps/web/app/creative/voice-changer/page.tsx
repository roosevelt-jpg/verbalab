'use client';

import { CreativeToolSurface } from '@/components/creative/creative-tool-surface';

export default function CreativeVoiceChangerPage() {
  return (
    <CreativeToolSurface
      config={{
        title: 'Voice Changer',
        lede: 'Transform delivery with enhancement and clone routing.',
        status: 'companion',
        icon: 'changer',
        honesty:
          'There is no real-time “voice changer” product SKU. Closest live paths: Voice Enhancement for cleanup, Instant Voice Clone for speaking as an enrolled voice, and Text to Speech for scripted delivery.',
        primaryHref: '/voice-enhancement',
        primaryLabel: 'Voice Enhancement',
        secondaryHref: '/creative/voice-creation',
        secondaryLabel: 'Voice Creation',
      }}
    />
  );
}
