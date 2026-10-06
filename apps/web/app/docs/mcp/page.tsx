'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';
import { API_URL } from '@/lib/api';

export default function DocsMcpPage() {
  const remoteUrl = `${API_URL}/v1/mcp`;
  const cursorSnippet = `{
  "mcpServers": {
    "lugemi": {
      "url": "${remoteUrl}",
      "headers": {
        "Authorization": "Bearer lg_live_..."
      }
    }
  }
}`;

  return (
    <div className="vl-api-public vl-fade-up">
      <div className="vl-api-public-header">
        <BrandMark href="/" />
        <div className="vl-api-public-links">
          <Link href="/mcp">Lugemi MCP</Link>
          <Link href="/docs">API docs</Link>
          <Link href="/developers">Developers</Link>
          <Link href="/keys">API keys</Link>
        </div>
      </div>

      <p className="vl-tag" style={{ margin: '1.5rem 0 0' }}>
        Developer guide
      </p>
      <h1
        style={{
          margin: '0.65rem 0 0',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.03em',
          fontSize: '2.1rem',
          color: 'var(--brand-navy)',
        }}
      >
        Lugemi MCP
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '40rem' }}>
        Model Context Protocol server for agent IDEs. Call Baobab translate, Echo TTS/STT, Mix,
        accents, voice clones, and the Atlas/Baobab/Echo model matrix with a Bearer{' '}
        <code className="vl-code">lg_live_…</code> key.
      </p>

      <div className="vl-endpoint-card" style={{ marginTop: '1.35rem' }}>
        <div style={{ marginBottom: '0.65rem' }}>
          <span className="vl-endpoint-method">POST</span>
          <span className="vl-endpoint-path">/v1/mcp</span>
        </div>
        <p style={{ color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 1rem' }}>
          Streamable HTTP JSON-RPC. Discovery at <code className="vl-code">GET /v1/mcp</code>.
        </p>
        <CodePanel label="Cursor mcp.json" code={cursorSnippet} />
      </div>

      <p style={{ marginTop: '1.25rem', color: 'var(--muted)', lineHeight: 1.55 }}>
        Full install matrix (Cursor, Claude Desktop, Claude Code, stdio package): see{' '}
        <Link href="/mcp">/mcp</Link> and <code className="vl-code">docs/mcp.md</code> in the repo.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '1rem' }}>
        <Link href="/mcp" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
          Open /mcp
        </Link>
        <a href={remoteUrl} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
          Discovery JSON
        </a>
      </div>
    </div>
  );
}
