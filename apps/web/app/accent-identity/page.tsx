import type { Metadata } from 'next';
import { buildCmsMetadata } from '@/lib/cms-seo';
import { AccentIdentityClient } from './accent-identity-client';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/accent-identity', {
    fallbackTitle: 'Accent Identity',
    fallbackDescription:
      'Hear how tribe, culture, and region shape pronunciation — Lugemi Echo Voice identity packs.',
  });
}

export default function AccentIdentityPage() {
  return <AccentIdentityClient />;
}
