'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
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

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string }>;
};

const VERTICALS = [
  {
    id: 'voice',
    title: 'Echo Voice',
    body: 'Lugemi Echo — proprietary TTS/ASR for African accents and complex speaking agents (own:*).',
    href: '/audio',
  },
  {
    id: 'video',
    title: 'Fusion Video',
    body: 'Lugemi Fusion — MCP/CLI voice for dubbing and content pipelines.',
    href: '/developers',
  },
  {
    id: 'chat',
    title: 'Atlas Reason',
    body: 'Lugemi Atlas — multilingual reasoning for complex dialect, culture, and vertical tasks.',
    href: '/chat',
  },
  {
    id: 'translate',
    title: 'Baobab Translate',
    body: 'Lugemi Baobab — Africa-first MT for long-context and dialect-aware pairs (default en→Twi).',
    href: '/translate',
  },
  {
    id: 'law',
    title: 'Lex',
    body: 'Lugemi Lex — legal language packs, jurisdiction glossaries, provenance for filings.',
    href: '/p/legal-integrity',
  },
  {
    id: 'government',
    title: 'Civic',
    body: 'Lugemi Civic — citizen-service bilingual notices and public-sector forms.',
    href: '/p/legal-integrity',
  },
  {
    id: 'insurance',
    title: 'Cover',
    body: 'Lugemi Cover — claims and policy language across African markets.',
    href: '/models',
  },
  {
    id: 'compliance',
    title: 'Accord',
    body: 'Lugemi Accord — KYC, AML, and disclosure localization with audit-friendly wording.',
    href: '/models',
  },
  {
    id: 'security',
    title: 'Sentinel',
    body: 'Lugemi Sentinel — threat and policy language understanding across locales.',
    href: '/models',
  },
];

export function ModelsClient() {
  const { getToken, isLoaded } = useAuth();
  const [matrix, setMatrix] = useState<LiveMatrix | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [data, eng] = await Promise.all([
          apiFetch<LiveMatrix>('/v1/models/live'),
          apiFetch<Engine>('/v1/models/engine').catch(() => null),
        ]);
        setMatrix(data);
        if (eng) setEngine(eng);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model registry');
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded || !getToken) return;
    void getToken().catch(() => undefined);
  }, [getToken, isLoaded]);

  return (
    <AppShell>
      <h1 style={titleStyle}>{engine?.product ?? 'Lugemi models'}</h1>
      <p style={ledeStyle}>
        {engine?.note ??
          'Proprietary Lugemi model families — Atlas, Baobab, Echo, Vector, Lex, Civic, Cover, Accord, Sentinel, Fusion — for complex multilingual reasoning, dialect, and vertical tasks. Lugemi-owned intelligence, not third-party wrappers.'}
      </p>
      <p style={{ margin: '0.65rem 0 0', fontSize: '0.9rem' }}>
        <Link href="/translate">Translate (English → Twi)</Link>
        {' · '}
        <Link href="/language-intelligence">Language Intelligence</Link>
        {' · '}
        <Link href="/docs">API docs</Link>
        {' · '}
        <Link href="/developers">Developers</Link>
      </p>

      <section style={{ marginTop: '1.5rem' }} aria-labelledby="li-verticals">
        <h2 id="li-verticals" style={sectionTitle}>
          Language Intelligence families
        </h2>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
          }}
        >
          {VERTICALS.map((v) => (
            <li key={v.id} className="vl-panel" style={{ padding: '0.9rem 1rem' }}>
              <Link href={v.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontWeight: 650, color: 'var(--brand-navy)' }}>{v.title}</div>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.45 }}>
                  {v.body}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {matrix?.disclaimer ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '1.25rem' }}>
          {matrix.disclaimer}
        </p>
      ) : null}
      {error ? (
        <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>
          {error}{' '}
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            style={{ marginLeft: '0.5rem', minHeight: 32, padding: '0.25rem 0.65rem' }}
            onClick={() => {
              setError(null);
              setMatrix(null);
              void apiFetch<LiveMatrix>('/v1/models/live')
                .then(setMatrix)
                .catch((err: Error) => setError(err.message));
            }}
          >
            Retry
          </button>
        </p>
      ) : null}

      <div style={{ marginTop: '1.75rem', display: 'grid', gap: '1.25rem' }}>
        {!matrix && !error ? (
          <p style={{ color: 'var(--muted)' }}>Loading registry…</p>
        ) : !matrix ? (
          <p style={{ color: 'var(--muted)' }}>Registry unavailable.</p>
        ) : (
          matrix.features.map((block) => (
            <section key={block.feature}>
              <h2 style={sectionTitle}>
                {block.feature}{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.9rem' }}>
                  {block.hasConfiguredProvider ? '· ready' : '· needs credentials'}
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
                        {m.kind === 'lugemi' ? (
                          <span className="vl-tag" style={{ marginLeft: '0.5rem' }}>
                            Lugemi
                          </span>
                        ) : null}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {m.kind} · {m.provider ?? '—'} · {m.baseModel}
                        {m.sourceLang && m.targetLang ? ` · ${m.sourceLang}→${m.targetLang}` : ''}
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
  fontSize: '1.85rem',
  fontWeight: 720,
  letterSpacing: '-0.03em',
  color: 'var(--brand-navy)',
};

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0.45rem 0 0',
  maxWidth: '44rem',
  lineHeight: 1.55,
};

const sectionTitle: CSSProperties = {
  fontSize: '1.05rem',
  margin: '0 0 0.55rem',
  color: 'var(--brand-navy)',
};
