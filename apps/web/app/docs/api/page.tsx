import type { Metadata } from 'next';
import { buildCmsMetadata } from '@/lib/cms-seo';
import { ApiReference } from './api-reference';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/docs/api', {
    fallbackTitle: 'API reference',
    fallbackDescription:
      'Every Lugemi API endpoint — parameters, request bodies, responses, authentication, curl examples, and a live Try it console — generated from the live OpenAPI document.',
  });
}

export default function ApiReferencePage() {
  return <ApiReference />;
}
