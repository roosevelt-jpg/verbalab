import type { Metadata } from 'next';
import { buildCmsMetadata } from '@/lib/cms-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/docs', {
    fallbackTitle: 'Documentation',
    fallbackDescription:
      'Lugemi developer documentation — speech, translate, agents, authentication, and API guides.',
  });
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
