'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';
import { PageHeader, FeaturePanel } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useStudioApiKeyField } from '@/hooks/use-studio-api-key';

type Catalog = {
  name?: string;
  headline?: string;
  description?: string;
  honesty?: string[];
  corridors?: { id: string; label: string; note: string }[];
  limitations?: string[];
};

type RunRow = {
  id: string;
  disposition: string | null;
  executionState: string;
  corridor: string;
  product: string;
  policyVersion: string;
  createdAt: string;
};

export function LanguageAssuranceHomeClient() {
  const { getToken, isSignedIn } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('producer-local');
  const [sourceText, setSourceText] = useState('Dispatch 15 bags of rice by 2026-10-20. Do not ship early.');
  const [targetText, setTargetText] = useState('Fa bags 50 no rice so 2026-10-20. Ship early.');
  const [corridor, setCorridor] = useState('en-ak');
  const signedIn = Boolean(isClerkConfigured() && isSignedIn);

  const authHeaders = useCallback(async () => {
    if (signedIn) {
      const token = await getToken();
      if (!token) throw new Error('Missing session token');
      return { token, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId };
  }, [apiKey, actorId, getToken, signedIn]);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (!(signedIn || apiKey.startsWith('lg_'))) {
        setCatalog({
          name: 'Lugemi Language Assurance',
          headline: 'Check meaning and speech before release.',
          description:
            'Sign in or paste an API key to load the live catalog, create runs, and open the review queue.',
          corridors: [{ id: 'en-ak', label: 'English ↔ Akan/Twi (Ghana)', note: '' }],
          honesty: [],
        });
        return;
      }
      const a = await authHeaders();
      const headers = a.actor ? { 'X-LanguageAssurance-Actor-Id': a.actor } : undefined;
      const cat = await apiFetch<Catalog>('/v1/language-assurance/catalog', {
        token: a.token,
        headers,
      });
      setCatalog(cat);
      const res = await apiFetch<{ runs: RunRow[] }>('/v1/language-assurance/runs', {
        token: a.token,
        headers,
      });
      setRuns(res.runs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load Language Assurance');
    }
  }, [authHeaders, signedIn, apiKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await authHeaders();
      const res = await apiFetch<{ run: { id: string } }>('/v1/language-assurance/runs', {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-LanguageAssurance-Actor-Id': a.actor } : undefined,
        body: {
          product: 'voice_studio',
          contentCategory: 'business_announcement',
          corridor,
          sourceText,
          targetText,
          task: 'preview',
          policyVersion: 'preview_unreviewed_v1',
          idempotencyKey: `ui-${Date.now()}`,
        },
      });
      window.location.href = `/language-assurance/runs/${res.run.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Language Assurance"
          title={catalog?.name ?? 'Language Assurance'}
          lede={catalog?.headline ?? 'Check meaning and speech before release.'}
        >
          <div className="lg-page-header__actions">
            <Link href="/language-assurance/reviews" className="vl-btn vl-btn-secondary">
              Review queue
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        <FeaturePanel
          title="What this is"
          body={
            catalog?.description ??
            'Shared quality-control for source, translation, and speech. Evidence, not certification.'
          }
        />

        {!signedIn && (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              className="vl-field"
              placeholder="API key (lg_…)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <input
              className="vl-field"
              placeholder="Actor id"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            />
          </section>
        )}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        <section className="lg-page-section" aria-labelledby="la-create">
          <div className="lg-page-section__head">
            <h2 id="la-create" className="lg-type-section">
              New verification run
            </h2>
            <p className="lg-type-compact">
              Demo uses the preview policy (no native review). Business audio policy requires integrity +
              review.
            </p>
          </div>
          <form onSubmit={onCreate} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
            <label className="vl-field-label">
              Corridor
              <select className="vl-field" value={corridor} onChange={(e) => setCorridor(e.target.value)}>
                {(catalog?.corridors ?? [{ id: 'en-ak', label: 'en-ak' }]).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="vl-field-label">
              Source
              <textarea
                className="vl-field"
                rows={3}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                required
              />
            </label>
            <label className="vl-field-label">
              Target
              <textarea
                className="vl-field"
                rows={3}
                value={targetText}
                onChange={(e) => setTargetText(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
              Run checks
            </button>
          </form>
        </section>

        <section className="lg-page-section">
          <h2 className="lg-type-section">Recent runs</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
            {runs.length === 0 ? (
              <li className="lg-type-compact">No runs yet.</li>
            ) : (
              runs.map((r) => (
                <li key={r.id} className="lg-card">
                  <Link href={`/language-assurance/runs/${r.id}`}>
                    <strong>{r.disposition ?? r.executionState}</strong> · {r.corridor} · {r.policyVersion}
                  </Link>
                  <div className="lg-type-compact">
                    {r.product} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="lg-page-section">
          <h2 className="lg-type-section">Honesty</h2>
          <ul className="lg-type-compact">
            {(catalog?.honesty ?? []).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
