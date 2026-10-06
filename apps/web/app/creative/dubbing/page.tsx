'use client';

import { CreativeToolSurface } from '@/components/creative/creative-tool-surface';

export default function CreativeDubbingPage() {
  return (
    <CreativeToolSurface
      config={{
        title: 'Dubbing',
        lede: 'Localize spoken content across languages.',
        status: 'companion',
        honesty:
          'Dedicated end-to-end dubbing timelines are not a separate live SKU. Closest path: translate with Lugemi, synthesize with Echo TTS, and review in Studio / Interpreter flows.',
        icon: 'dub',
        primaryHref: '/translate',
        primaryLabel: 'Open Translate',
        secondaryHref: '/creative/text-to-speech',
        secondaryLabel: 'Text to Speech',
        bullets: [
          'Translate script → synthesize with regional voices',
          'Interpreter and Mix cover related live speech paths',
        ],
      }}
    />
  );
}
