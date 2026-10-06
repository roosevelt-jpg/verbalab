'use client';

import { CreativeToolSurface } from '@/components/creative/creative-tool-surface';

export default function CreativeImageVideoPage() {
  return (
    <CreativeToolSurface
      config={{
        title: 'Image & Video',
        lede: 'Visual generation companion for LugemiCreative projects.',
        status: 'roadmap',
        icon: 'media',
        honesty:
          'Lugemi’s primary surface is speech and language intelligence — not a general image/video generator. Use Assets to store media, Studio for project lists, and pair narration from Text to Speech.',
        primaryHref: '/creative/assets',
        primaryLabel: 'Open Assets',
        secondaryHref: '/creative/studio',
        secondaryLabel: 'Open Studio',
        bullets: [
          'Upload and organize images/video in Assets',
          'Generate voiceovers in Text to Speech',
          'Native image/video generation is planned, not live',
        ],
      }}
    />
  );
}
