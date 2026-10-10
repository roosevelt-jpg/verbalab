import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { buildCmsMetadata } from '@/lib/cms-seo';
import { DevelopersClient } from './developers-client';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/developers', {
    fallbackTitle: 'Developers',
    fallbackDescription:
      'Build with Lugemi — SDKs, API keys, OpenAPI, and first-party speech and translate endpoints.',
  });
}

export default function DevelopersPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <DevelopersClient />;
}
