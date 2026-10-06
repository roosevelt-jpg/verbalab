import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LugemiCreative',
  description:
    'LugemiCreative workspace — speech, voices, studio, flows, chat, and assets for region-aware creative work.',
};

export default function CreativeLayout({ children }: { children: ReactNode }) {
  return children;
}
