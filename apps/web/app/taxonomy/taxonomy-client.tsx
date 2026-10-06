'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  honesty: {
    enterpriseTaxonomyOs: boolean;
    mlAutoClassification: boolean;
    orgWorkspaceScoped: boolean;
    distinctFromOntology: boolean;
  };
};

type Analytics = {
  terms: number;
  categories: number;
  tags: number;
  assignments: number;
};

export function TaxonomyClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('category');
  const [created, setCreated] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ana] = await Promise.all([
      apiFetch<Engine>('/v1/taxonomy/engine', { token }),
      apiFetch<Analytics>('/v1/taxonomy/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const createTerm = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ name: string; slug: string }>('/v1/taxonomy/terms', {
        token,
        method: 'POST',
        body: JSON.stringify({ name, kind }),
      });
      setCreated(`${res.name} (${res.slug})`);
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }, [getToken, name, kind, load]);

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
        Taxonomy Platform
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Categories, tags, and knowledge trees for classifying Knowledge Base documents. Distinct
        from <Link href="/ontology">Ontology</Link>. Not an enterprise taxonomy / ML OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Term name"
          style={input}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={input}>
          <option value="category">category</option>
          <option value="tag">tag</option>
          <option value="content_type">content_type</option>
        </select>
        <button type="button" onClick={() => void createTerm()} disabled={!name.trim()} style={btn}>
          Create term
        </button>
      </div>
      {created ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Created: {created}</p>
      ) : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>
          Terms {analytics.terms} · Categories {analytics.categories} · Tags {analytics.tags} ·
          Assignments {analytics.assignments}
        </p>
      ) : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
          <section>
            <h2 style={label}>Honesty</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Org/workspace scoped {engine.honesty.orgWorkspaceScoped ? 'yes' : 'no'} · Distinct
              from ontology {engine.honesty.distinctFromOntology ? 'yes' : 'no'} · Enterprise
              taxonomy OS {engine.honesty.enterpriseTaxonomyOs ? 'yes' : 'no'} · ML auto-class{' '}
              {engine.honesty.mlAutoClassification ? 'yes' : 'no'}
            </p>
          </section>
          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href="/knowledge-base" style={secondary}>
                Knowledge Base
              </Link>
              <Link href="/ontology" style={secondary}>
                Ontology
              </Link>
              <Link href="/knowledge-cloud" style={secondary}>
                Knowledge Cloud
              </Link>
            </div>
          </section>
          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
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

const secondary: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.45rem 0.75rem',
  border: '1px solid var(--line)',
  borderRadius: '0.4rem',
  color: 'var(--ink)',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 600,
};

const input: React.CSSProperties = {
  padding: '0.55rem 0.75rem',
  border: '1px solid var(--line)',
  borderRadius: '0.4rem',
  fontSize: '0.95rem',
  background: 'transparent',
  color: 'var(--ink)',
};

const btn: React.CSSProperties = {
  padding: '0.55rem 0.9rem',
  border: '1px solid var(--ink)',
  borderRadius: '0.4rem',
  background: 'var(--ink)',
  color: 'var(--paper, #fff)',
  fontWeight: 600,
  cursor: 'pointer',
};
