import type { Metadata } from 'next';
import { McpPageClient } from './mcp-client';

export const metadata: Metadata = {
  title: 'Lugemi MCP',
  description:
    'Connect Lugemi to your agent IDE — Baobab translate, Echo speech, Atlas models via Model Context Protocol.',
};

export default function McpPage() {
  return <McpPageClient />;
}
