'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';

type PublicEmbed = {
  id: string;
  title: string;
  text: string;
  voice: string;
  language: string | null;
  characters: number;
};

export function EmbedPlayerClient({ id }: { id: string }) {
  const [data, setData] = useState<PublicEmbed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/v1/speech-embed/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`Embed not found (${res.status})`);
        const body = (await res.json()) as PublicEmbed;
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load embed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '2rem 1.25rem',
        background:
          'radial-gradient(1200px 600px at 10% -10%, rgba(0,184,174,0.18), transparent), linear-gradient(165deg, #f4faf9 0%, #e8f1f4 45%, #f7f3ee 100%)',
        fontFamily: 'var(--font-sans, "Segoe UI", sans-serif)',
        color: '#10264d',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <AnamorphicPanel variant="speech" size="sm" label="Lugemi Speech Player" />
        <h1 style={{ margin: '1.25rem 0 0.35rem', fontSize: '1.65rem', letterSpacing: '-0.02em' }}>
          {data?.title || 'Lugemi Speech Player'}
        </h1>
        <p style={{ margin: 0, color: '#5a6b7d', fontSize: '0.95rem' }}>
          {loading
            ? 'Loading narration…'
            : error
              ? error
              : `${data?.characters ?? 0} characters · voice ${data?.voice ?? '—'}${
                  data?.language ? ` · ${data.language}` : ''
                }`}
        </p>
        {data ? (
          <article
            style={{
              marginTop: '1.25rem',
              padding: '1.15rem 1.25rem',
              borderRadius: 16,
              border: '1px solid rgba(16,38,77,0.12)',
              background: 'rgba(255,255,255,0.72)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}
          >
            {data.text}
          </article>
        ) : null}
        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#5a6b7d' }}>
          Powered by Lugemi Echo ·{' '}
          <a href="https://lugemi.ai" style={{ color: '#007c78' }}>
            lugemi.ai
          </a>
        </p>
      </div>
    </main>
  );
}
