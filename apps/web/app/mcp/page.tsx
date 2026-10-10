import type { Metadata } from 'next';
import { buildCmsMetadata } from '@/lib/cms-seo';
import { McpPageClient } from './mcp-client';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/mcp', {
    fallbackTitle: 'Lugemi MCP',
    fallbackDescription:
      'Connect Lugemi to your agent IDE — Baobab translate, Echo speech, Atlas models via Model Context Protocol.',
  });
}

export default function McpPage() {
  return <McpPageClient />;
}
