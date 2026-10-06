'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Product = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

type Overview = {
  registry: {
    languages: number;
    rtlLanguages: number;
    strategicAfrican: number;
    localePacks: number;
  };
  workspace: { glossaryTerms: number; tmEntries: number; qualityReviews: number };
  coverage: { asOf: string | null; focusPairs: number };
  products: Product[];
  architecture: { graphql: boolean; cqrs: boolean; terraform: boolean; kubernetes: boolean };
  deferred: Record<string, boolean>;
  links: Record<string, string>;
};

export function LanguageClient {
  const { getToken, isLoaded } = useAuth;
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/language/overview', { token }));
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

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
        Language Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Parent hub for Translate, detection, glossary, TM, quality, localization, and locale packs.
        Language Cloud deferred queue is complete (dialect through AWS EKS). Enterprise Language Registry is at{' '}
        <Link href="/registry">/registry</Link>. Fly remains the default PaaS; EKS is optional.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <section>
            <h2 style={label}>Registry</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {data.registry.languages} languages · {data.registry.strategicAfrican} strategic African ·{' '}
              {data.registry.rtlLanguages} RTL · {data.registry.localePacks} locale packs
            </p>
          </section>

          <section>
            <h2 style={label}>This workspace</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {data.workspace.glossaryTerms} glossary terms · {data.workspace.tmEntries} TM entries ·{' '}
              {data.workspace.qualityReviews} reviews
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Coverage focus pairs: {data.coverage.focusPairs}
              {data.coverage.asOf ? ` · last eval ${data.coverage.asOf}` : ''}
            </p>
          </section>

          <section>
            <h2 style={label}>Products</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
              {data.products.map((p) => (
                <li key={p.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {p.name}{' '}
                        <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: '0.85rem' }}>
                          · {p.status}
                        </span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        {p.notes}
                      </div>
                    </div>
                    {p.console && p.status === 'shipped' ? (
                      <Link href={p.console} style={{ color: 'var(--accent)', fontWeight: 550, fontSize: '0.9rem' }}>
                        Open →
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href={data.links.translate} style={primary}>
              Translate
            </Link>
            <Link href={data.links.dialects} style={secondary}>
              Dialects
            </Link>
            <Link href={data.links.accents} style={secondary}>
              Accents
            </Link>
            <Link href={data.links.grammar} style={secondary}>
              Grammar
            </Link>
            <Link href={data.links.style} style={secondary}>
              Style
            </Link>
            <Link href={data.links.countries} style={secondary}>
              Countries
            </Link>
            <Link href={data.links.registry ?? '/registry'} style={secondary}>
              Registry
            </Link>
            <Link href={data.links.graphql} style={secondary}>
              GraphQL
            </Link>
            <Link href={data.links.glossary} style={secondary}>
              Glossary
            </Link>
            <Link href={data.links.tm} style={secondary}>
              TM
            </Link>
            <Link href={data.links.coverage} style={secondary}>
              Coverage
            </Link>
            <Link href={data.links.analytics} style={secondary}>
              Analytics
            </Link>
          </section>

          <section>
            <h2 style={label}>Architecture honesty</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              GraphQL {data.architecture.graphql ? 'yes' : 'no'} · CQRS{' '}
              {data.architecture.cqrs ? 'yes (Language Cloud)' : 'no'} · Terraform{' '}
              {data.architecture.terraform ? 'yes (AWS)' : 'no'} · Kubernetes{' '}
              {data.architecture.kubernetes ? 'yes (EKS af-south-1)' : 'no'}
            </p>
          </section>
        </div>
      ) : null}
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
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
};

const secondary: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--ink)',
};
