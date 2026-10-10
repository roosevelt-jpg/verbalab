'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';
import { PLATFORM_CONNECTORS } from '@/lib/connectors-catalog';

type Guide = {
  id: string;
  name: string;
  category: string;
  integrationGuide: string;
  sdk?: { typescript?: string; python?: string };
  lugemiApis?: Array<{ method: string; path: string; summary: string }>;
};

export default function ConnectorDocsPage() {
  const [guides, setGuides] = useState<Record<string, Guide>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const entries = await Promise.all(
          PLATFORM_CONNECTORS.map(async (c) => {
            const res = await fetch(`${API_URL}/v1/connectors/platform/${c.id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status} for ${c.id}`);
            return [c.id, (await res.json()) as Guide] as const;
          }),
        );
        if (!cancelled) setGuides(Object.fromEntries(entries));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load guides');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [guides]);

  const coreApis = useMemo(
    () => [
      { method: 'POST', path: '/v1/translate', body: 'Dialect-aware text translation.' },
      { method: 'POST', path: '/v1/tts/synthesize', body: 'First-party TTS (legacy /v1/audio/speech).' },
      { method: 'POST', path: '/v1/speech/recognize', body: 'STT with timestamps.' },
      { method: 'GET', path: '/v1/voice-clones', body: 'Voice clone refs for voice=clone:{id}.' },
      { method: 'POST', path: '/v1/speech/stream', body: 'Realtime STT segments.' },
      { method: 'POST', path: '/v1/tts/stream', body: 'Chunked TTS for agents.' },
      { method: 'POST', path: '/v1/translate/stream', body: 'SSE translate for live captions.' },
    ],
    [],
  );

  return (
    <div className="vl-api-public vl-fade-up">
      <div className="vl-api-public-header">
        <BrandMark href="/" />
        <div className="vl-api-public-links">
          <Link href="/connectors">Connectors hub</Link>
          <Link href="/docs">API docs</Link>
          <Link href="/playground">Playground</Link>
          <a
            href={`${API_URL}/v1/connectors/platform`}
            className="vl-btn vl-btn-secondary"
            style={{ textDecoration: 'none', padding: '0.45rem 0.9rem', minHeight: 40 }}
          >
            platform JSON
          </a>
        </div>
      </div>

      <p className="vl-tag" style={{ margin: '1.5rem 0 0' }}>
        Platform connectors
      </p>
      <h1
        style={{
          margin: '0.65rem 0 0',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.03em',
          fontSize: '2.35rem',
          color: 'var(--brand-navy)',
        }}
      >
        Integration guides for Lugemi Studio Connectors
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '42rem' }}>
        Each platform installer maps to first-party Lugemi APIs: translate, TTS, STT, voice clone refs,
        and realtime segments. Soft-connect stores install state in Studio; production secrets stay in
        env. Demo hooks: <code className="vl-code">POST /v1/connectors/platform/:id/demo</code>.
      </p>

      <div className="vl-endpoint-card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
          Core Lugemi APIs
        </h2>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', lineHeight: 1.7 }}>
          {coreApis.map((api) => (
            <li key={api.path}>
              <code className="vl-code">
                {api.method} {api.path}
              </code>{' '}
              — {api.body}
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <p style={{ color: 'var(--bad)' }}>Could not load live guides ({error}). Showing catalog copy.</p>
      ) : null}

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        {PLATFORM_CONNECTORS.map((c) => {
          const guide = guides[c.id];
          return (
            <article key={c.id} id={c.id} className="vl-endpoint-card">
              <div style={{ marginBottom: '0.5rem' }}>
                <span className="vl-endpoint-method">{c.category}</span>
                <span className="vl-endpoint-path">{c.name}</span>
              </div>
              <p style={{ color: 'var(--muted)', lineHeight: 1.55 }}>{c.blurb}</p>
              <p style={{ lineHeight: 1.6 }}>{guide?.integrationGuide ?? c.integrationGuide}</p>
              {guide?.lugemiApis?.length ? (
                <ul style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                  {guide.lugemiApis.map((api) => (
                    <li key={api.path}>
                      <code className="vl-code">
                        {api.method} {api.path}
                      </code>{' '}
                      — {api.summary}
                    </li>
                  ))}
                </ul>
              ) : null}
              {guide?.sdk?.typescript ? (
                <CodePanel code={guide.sdk.typescript} label="TypeScript SDK" />
              ) : null}
              {guide?.sdk?.python ? <CodePanel code={guide.sdk.python} label="Python SDK" /> : null}
              <p style={{ marginBottom: 0 }}>
                <Link href={`/connectors#${c.id}`}>Open installer →</Link>
                {' · '}
                <Link href={c.demoHref}>{c.demoLabel}</Link>
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
