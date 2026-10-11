import type { Metadata } from 'next';
import { buildCmsMetadata } from '@/lib/cms-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/docs', {
    fallbackTitle: 'Documentation — overview',
    fallbackDescription:
      'Lugemi docs overview: Echo speech, Baobab translate, Atlas chat, voices, agents, MCP, connectors, and the full OpenAPI surface — how Lugemi works, models, and browse by capability.',
  });
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
