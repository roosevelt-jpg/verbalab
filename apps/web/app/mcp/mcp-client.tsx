'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';
import { API_URL } from '@/lib/api';

const TOOLS = [
  { name: 'lugemi_translate', body: 'Baobab MT — dubbing scripts, captions, localization' },
  { name: 'lugemi_tts_synthesize', body: 'Echo Voice TTS — own:* / clone:{id}' },
  { name: 'lugemi_transcribe', body: 'Echo Listen STT — audioBase64 or filePath' },
  { name: 'lugemi_mix_transcribe_translate', body: 'Mix — STT → translate with switch spans' },
  { name: 'lugemi_video_voice_line', body: 'Translate then synthesize in one call' },
  { name: 'lugemi_voices_list', body: 'Catalog of first-party own:* voices' },
  { name: 'lugemi_voice_clones_list', body: 'Workspace clone:{id} refs' },
  { name: 'lugemi_languages_list', body: 'Registry languages for speech + translate' },
  { name: 'lugemi_accents_list', body: 'Spoken accent profiles' },
  { name: 'lugemi_accent_identity_list', body: 'Tribe/culture identity packs' },
  { name: 'lugemi_accent_identity_play', body: 'Play metadata + optional synthesize' },
  { name: 'lugemi_models_list', body: 'Baobab · Echo · Atlas live matrix' },
] as const;

const cursorHttp = `{
  "mcpServers": {
    "lugemi": {
      "url": "https://api.lugemi.com/v1/mcp",
      "headers": {
        "Authorization": "Bearer lg_live_..."
      }
    }
  }
}`;

const cursorStdio = `{
  "mcpServers": {
    "lugemi": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"],
      "env": {
        "LUGEMI_API_KEY": "lg_live_...",
        "LUGEMI_BASE_URL": "https://api.lugemi.com"
      }
    }
  }
}`;

const claudeDesktop = `{
  "mcpServers": {
    "lugemi": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.lugemi.com/v1/mcp", "--header", "Authorization: Bearer lg_live_..."]
    }
  }
}`;

const claudeCode = `claude mcp add --transport http lugemi https://api.lugemi.com/v1/mcp \\
  --header "Authorization: Bearer lg_live_..."`;

export function McpPageClient() {
  const [toolCount, setToolCount] = useState<number | null>(null);

  useEffect(() => {
    void fetch(`${API_URL}/v1/mcp`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { tools?: unknown[] } | null) => {
        if (d?.tools) setToolCount(d.tools.length);
      })
      .catch(() => setToolCount(null));
  }, []);

  return (
    <div className="lg-mcp-page">
      <header className="lg-mcp-top">
        <BrandMark href="/" />
        <nav className="lg-mcp-top-links" aria-label="MCP page">
          <Link href="/docs">Docs</Link>
          <Link href="/developers">Developers</Link>
          <Link href="/keys">API keys</Link>
          <Link href="/models">Models</Link>
          <Link href="/sign-up" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            Get API key
          </Link>
        </nav>
      </header>

      <section className="lg-mcp-hero" aria-labelledby="mcp-hero-title">
        <div className="lg-mcp-hero-copy">
          <p className="lg-mcp-eyebrow">Lugemi Studio · MCP</p>
          <h1 id="mcp-hero-title">Lugemi MCP</h1>
          <p className="lg-mcp-lede">
            Bring Baobab translate, Echo speech, and Atlas models into the agent IDEs you already use —
            Cursor, Claude Desktop, and Claude Code.
          </p>
          <div className="lg-mcp-cta">
            <a href="#install" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
              Install
            </a>
            <Link href="/keys" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Create lg_live_ key
            </Link>
          </div>
        </div>
        <div className="lg-mcp-hero-visual" aria-hidden="true">
          <div className="lg-mcp-orbit">
            <span>Baobab</span>
            <span>Echo</span>
            <span>Atlas</span>
          </div>
        </div>
      </section>

      <section className="lg-mcp-section" id="install" aria-labelledby="install-title">
        <h2 id="install-title">Install in your assistant</h2>
        <p className="lg-mcp-section-lede">
          Auth with <code className="vl-code">Authorization: Bearer lg_live_…</code> (or{' '}
          <code className="vl-code">lg_test_…</code>). Hosted endpoint:{' '}
          <code className="vl-code">POST {API_URL}/v1/mcp</code>
          {toolCount != null ? ` · ${toolCount} tools live` : ''}.
        </p>

        <h3 className="lg-mcp-h3">Cursor</h3>
        <p className="lg-mcp-hint">
          Add to <code className="vl-code">~/.cursor/mcp.json</code> or project{' '}
          <code className="vl-code">.cursor/mcp.json</code>.
        </p>
        <CodePanel label="Cursor · Streamable HTTP" code={cursorHttp} />
        <CodePanel label="Cursor · stdio (local monorepo)" code={cursorStdio} />

        <h3 className="lg-mcp-h3">Claude Code</h3>
        <CodePanel label="claude mcp add" code={claudeCode} />

        <h3 className="lg-mcp-h3">Claude Desktop</h3>
        <p className="lg-mcp-hint">
          Native transport is stdio — bridge remote HTTP with <code className="vl-code">mcp-remote</code>, or
          run <code className="vl-code">@lugemi/mcp</code> locally.
        </p>
        <CodePanel label="claude_desktop_config.json" code={claudeDesktop} />
      </section>

      <section className="lg-mcp-section" aria-labelledby="tools-title">
        <h2 id="tools-title">What your assistant can call</h2>
        <p className="lg-mcp-section-lede">
          First-party Lugemi surfaces only — no third-party speech wrappers in the product path.
        </p>
        <ul className="lg-mcp-tools">
          {TOOLS.map((t) => (
            <li key={t.name}>
              <code>{t.name}</code>
              <span>{t.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="lg-mcp-section lg-mcp-section--tight" aria-labelledby="more-title">
        <h2 id="more-title">Next steps</h2>
        <div className="lg-mcp-links">
          <Link href="/docs">API docs</Link>
          <Link href="/docs/mcp">MCP guide</Link>
          <Link href="/playground">Playground</Link>
          <Link href="/developers">Developers hub</Link>
          <a href={`${API_URL}/v1/mcp`}>Discovery JSON</a>
        </div>
      </section>
    </div>
  );
}
