'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
  modalities: Array<{ id: string; name: string; status: string; notes: string }>;
  honesty: { trainsEmbeddingModels: boolean; multimodalOs: boolean };
};
type Models = {
  models: Array<{ id: string; provider: string; dimensions: number; default: boolean; status: string }>;
};
type Analytics = {
  requests: number;
  tokens: number;
  byModality: Array<{ modality: string; count: number }>;
  note: string;
};

export function EmbeddingCloudClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [models, setModels] = useState<Models | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [input, setInput] = useState('Habari dunia');
  const [modality, setModality] = useState('text');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, mods, an] = await Promise.all([
      apiFetch<Engine>('/v1/embedding-cloud/engine', { token }),
      apiFetch<Models>('/v1/embedding-cloud/models', { token }),
      apiFetch<Analytics>('/v1/embedding-cloud/analytics', { token }),
    ]);
    setEngine(eng);
    setModels(mods);
    setAnalytics(an);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function embed() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{
        modality: string;
        data: Array<{ embedding: number[] }>;
        model: string;
        usage: { total_tokens: number };
      }>('/v1/embedding-cloud/embed', {
        token,
        method: 'POST',
        body: { input, modality },
      });
      setResult(
        JSON.stringify(
          {
            modality: body.modality,
            model: body.model,
            dimensions: body.data[0]?.embedding.length ?? 0,
            tokens: body.usage.total_tokens,
            preview: body.data[0]?.embedding.slice(0, 8),
          },
          null,
          2,
        ),
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Embed failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Embedding Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Text/document/code embeddings over the AI Gateway. Speech/image/video modalities are not on this surface.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> ·{' '}
        <Link href="/knowledge">Knowledge / RAG</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.requests} requests · {analytics.tokens} tokens this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Try embed</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.65rem',
              border: '1px solid var(--line)',
              borderRadius: '0.4rem',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.65rem', alignItems: 'center' }}>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid var(--line)' }}
            >
              <option value="text">text</option>
              <option value="document">document</option>
              <option value="code">code</option>
            </select>
            <button type="button" disabled={loading} style={primary} onClick={() => void embed()}>
              Embed
            </button>
          </div>
          {result ? <pre style={pre}>{result}</pre> : null}
        </section>

        {models ? (
          <section>
            <h2 style={label}>Models</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {models.models.map((m) => (
                <li key={m.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  <strong>{m.id}</strong>
                  {m.default ? ' · default' : ''} · {m.dimensions}d · {m.provider}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {engine ? (
          <section>
            <h2 style={label}>Modalities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {engine.note}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.modalities.map((m) => (
                <li key={m.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  <strong>{m.name}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{m.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const primary: React.CSSProperties = {
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const pre: React.CSSProperties = {
  margin: '0.75rem 0 0',
  padding: '0.85rem',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
};
