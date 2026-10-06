'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type LiveModel = {
  id: string;
  slug: string;
  displayName: string;
  kind: string;
  provider: string | null;
  baseModel: string;
  sourceLang: string | null;
  targetLang: string | null;
  configured: boolean;
  envKey: string | null;
  externalUrl: string | null;
  notes: string | null;
};

type FeatureBlock = {
  feature: string;
  hasConfiguredProvider: boolean;
  models: LiveModel[];
};

type LiveMatrix = {
  asOf: string;
  disclaimer: string;
  features: FeatureBlock[];
};

export function ModelsClient() {
  const { getToken, isLoaded } = useAuth();
  const [matrix, setMatrix] = useState<LiveMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        // Public live matrix — no token required
        const data = await apiFetch<LiveMatrix>('/v1/models/live');
        setMatrix(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model registry');
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded || !getToken) return;
    // Warm session; catalog list is optional for signed-in users
    void getToken().catch(() => undefined);
  }, [getToken, isLoaded]);

  return (
    <AppShell>
      <h1 style={titleStyle}>Model registry</h1>
      <p style={ledeStyle}>
        Which bought provider or fine-tuned adapter is marked ready per feature. Optional links to
        Weights &amp; Biases — not an in-house MLflow.
      </p>
      {matrix?.disclaimer ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
          {matrix.disclaimer}
        </p>
      ) : null}
      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      <div style={{ marginTop: '1.75rem', display: 'grid', gap: '1.25rem' }}>
        {!matrix ? (
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        ) : (
          matrix.features.map((block) => (
            <section key={block.feature}>
              <h2 style={sectionTitle}>
                {block.feature}{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.9rem' }}>
                  {block.hasConfiguredProvider ? '· credentials ok / artifact present' : '· needs credentials'}
                </span>
              </h2>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {block.models.length === 0 ? (
                  <p style={{ color: 'var(--muted)' }}>No ready models.</p>
                ) : (
                  block.models.map((m) => (
                    <div key={m.id} className="vl-panel" style={{ padding: '0.9rem 1.1rem' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>
                        {m.displayName}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {m.kind} · {m.provider ?? '—'} · {m.baseModel}
                        {m.sourceLang && m.targetLang
                          ? ` · ${m.sourceLang}→${m.targetLang}`
                          : ''}
                        {m.configured ? ' · ready to call' : ' · not configured'}
                      </div>
                      {m.notes ? (
                        <div style={{ color: '#555', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                          {m.notes}
                        </div>
                      ) : null}
                      {m.externalUrl ? (
                        <a
                          href={m.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.85rem' }}
                        >
                          External run / docs
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.03em',
  fontSize: '2rem',
};

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0.5rem 0 0',
  lineHeight: 1.55,
};

const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  margin: '0 0 0.65rem',
};
