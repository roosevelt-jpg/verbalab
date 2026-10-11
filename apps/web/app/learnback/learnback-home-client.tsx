'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader, FeaturePanel } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { LearnBackAuthGate, type LearnBackAuthBag } from '@/lib/learnback-auth';

type Catalog = {
  name?: string;
  headline?: string;
  description?: string;
  honesty?: string[];
  situations?: string[];
  corridors?: { id: string; label: string; note: string; situations: string[] }[];
};

type SessionRow = {
  id: string;
  corridorId: string;
  situation: string;
  state: string;
  fictionalMode: boolean;
  createdAt: string;
  scenarioPack?: { questionText: string; packKey: string };
};

export function LearnBackHomeClient() {
  return (
    <LearnBackAuthGate>{(auth) => <LearnBackHomeFlow auth={auth} />}</LearnBackAuthGate>
  );
}

function LearnBackHomeFlow({ auth }: { auth: LearnBackAuthBag }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [corridorId, setCorridorId] = useState('ak-en-interview');
  const [situation, setSituation] = useState('job_interview');
  const [fictionalMode, setFictionalMode] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (!auth.ready) {
        setCatalog({
          name: 'Lugemi LearnBack',
          headline: 'Practise real situations with feedback in your language.',
          description:
            'Sign in or paste an API key to start private spoken practice. LearnBack never submits job applications.',
          situations: ['job_interview', 'customer_service', 'school_meeting', 'workplace_conversation'],
          corridors: [
            {
              id: 'ak-en-interview',
              label: 'Twi/Akan explanations · English interview practice',
              note: '',
              situations: ['job_interview'],
            },
          ],
          honesty: [],
        });
        return;
      }
      const a = await auth.authHeaders();
      const headers = a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined;
      const cat = await apiFetch<Catalog>('/v1/learnback/catalog', { token: a.token, headers });
      setCatalog(cat);
      if (cat.corridors?.[0]) {
        setCorridorId((prev) =>
          cat.corridors!.some((c) => c.id === prev) ? prev : cat.corridors![0]!.id,
        );
      }
      const res = await apiFetch<{ sessions: SessionRow[] }>('/v1/learnback/sessions', {
        token: a.token,
        headers,
      });
      setSessions(res.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load LearnBack');
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  const corridor = catalog?.corridors?.find((c) => c.id === corridorId);
  const situations = corridor?.situations ?? catalog?.situations ?? ['job_interview'];

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<{ session: { id: string } }>('/v1/learnback/sessions', {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
        body: { corridorId, situation, fictionalMode },
      });
      window.location.href = `/learnback/sessions/${res.session.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create session');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="LearnBack"
          title={catalog?.name ?? 'LearnBack'}
          lede={
            catalog?.headline ?? 'Practise real situations with feedback in your language.'
          }
        >
          <div className="lg-page-header__actions">
            <Link href="/learnback/scenarios" className="vl-btn vl-btn-secondary">
              Scenarios
            </Link>
            <Link href="/learnback/phrasebook" className="vl-btn vl-btn-secondary">
              Phrasebook
            </Link>
            <Link href="/learnback/progress" className="vl-btn vl-btn-secondary">
              Progress
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        <FeaturePanel
          title="Spoken practice, meaning first"
          body={
            catalog?.description ??
            'Record or type an answer. Correct recognition mistakes before feedback. Pronunciation stays not assessed when no validated model exists.'
          }
        />

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <p className="lg-type-compact">Paste a Lugemi API key to use LearnBack without Clerk.</p>
            <input
              className="vl-field"
              placeholder="lg_live_… or lg_test_…"
              value={auth.apiKey}
              onChange={(e) => auth.setApiKey(e.target.value)}
            />
            <input
              className="vl-field"
              placeholder="Actor id"
              value={auth.actorId}
              onChange={(e) => auth.setActorId(e.target.value)}
            />
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Load
            </button>
          </section>
        ) : null}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        <section className="lg-page-section" aria-labelledby="lb-start">
          <div className="lg-page-section__head">
            <h2 id="lb-start" className="lg-type-section">
              Start a practice session
            </h2>
            <p className="lg-type-compact">
              Adult practice only. Feedback is descriptive and evidence-linked — not a hiring score.
            </p>
          </div>
          <form onSubmit={onCreate} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
            <label className="vl-field-label">
              Language corridor
              <select
                className="vl-field"
                value={corridorId}
                onChange={(e) => {
                  const next = e.target.value;
                  setCorridorId(next);
                  const c = catalog?.corridors?.find((x) => x.id === next);
                  if (c?.situations?.length && !c.situations.includes(situation)) {
                    setSituation(c.situations[0]!);
                  }
                }}
              >
                {(catalog?.corridors ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="vl-field-label">
              Situation
              <select
                className="vl-field"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
              >
                {situations.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="lg-type-compact" style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={fictionalMode}
                onChange={(e) => setFictionalMode(e.target.checked)}
              />
              Practise with fictional details (labeled clearly in the session)
            </label>
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy || !auth.ready}>
              {busy ? 'Starting…' : 'Open practice session'}
            </button>
          </form>
        </section>

        {catalog?.honesty?.length ? (
          <section className="lg-page-section">
            <h2 className="lg-type-section">How LearnBack stays honest</h2>
            <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
              {catalog.honesty.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="lg-page-section" aria-labelledby="lb-history">
          <div className="lg-page-section__head">
            <h2 id="lb-history" className="lg-type-section">
              Your recent sessions
            </h2>
          </div>
          {!sessions.length ? (
            <p className="lg-type-compact">No practice sessions yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link href={`/learnback/sessions/${s.id}`} className="lg-card" style={{ display: 'block' }}>
                    <strong>{s.scenarioPack?.questionText?.slice(0, 80) ?? s.situation}</strong>
                    <div className="lg-type-compact">
                      {s.corridorId} · {s.state}
                      {s.fictionalMode ? ' · fictional' : ''}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
