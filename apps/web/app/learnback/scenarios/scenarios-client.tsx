'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { LearnBackAuthGate, type LearnBackAuthBag } from '@/lib/learnback-auth';

type Scenario = {
  id: string;
  packKey: string;
  revision: string;
  situation: string;
  corridorId: string;
  questionText: string;
  questionExplanation: string;
  levelLabel: string;
  reviewerNote: string;
};

export function LearnBackScenariosClient() {
  return (
    <LearnBackAuthGate>{(auth) => <ScenariosFlow auth={auth} />}</LearnBackAuthGate>
  );
}

function ScenariosFlow({ auth }: { auth: LearnBackAuthBag }) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [situation, setSituation] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!auth.ready) return;
    setError(null);
    try {
      const a = await auth.authHeaders();
      const q = situation ? `?situation=${encodeURIComponent(situation)}` : '';
      const res = await apiFetch<{ scenarios: Scenario[] }>(`/v1/learnback/scenarios${q}`, {
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
      });
      setScenarios(res.scenarios ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load scenarios');
    }
  }, [auth, situation]);

  useEffect(() => {
    void load();
  }, [load]);

  async function start(scenario: Scenario) {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<{ session: { id: string } }>('/v1/learnback/sessions', {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
        body: {
          corridorId: scenario.corridorId,
          situation: scenario.situation,
          scenarioPackId: scenario.id,
        },
      });
      window.location.href = `/learnback/sessions/${res.session.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start session');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="LearnBack"
          title="Reviewed scenarios"
          lede="Educator-reviewed prompts with rubrics. Practice only — not hiring advice."
        >
          <div className="lg-page-header__actions">
            <Link href="/learnback" className="vl-btn vl-btn-secondary">
              Back
            </Link>
          </div>
        </PageHeader>

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
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

        <label className="vl-field-label" style={{ maxWidth: '20rem' }}>
          Filter situation
          <select
            className="vl-field"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
          >
            <option value="">All</option>
            <option value="job_interview">job interview</option>
            <option value="customer_service">customer service</option>
            <option value="school_meeting">school meeting</option>
            <option value="workplace_conversation">workplace conversation</option>
          </select>
        </label>

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          {scenarios.map((s) => (
            <li key={s.id} className="lg-card" style={{ display: 'grid', gap: '0.4rem' }}>
              <strong>{s.questionText}</strong>
              <p className="lg-type-compact">{s.questionExplanation}</p>
              <p className="lg-type-compact">
                {s.corridorId} · {s.situation.replace(/_/g, ' ')} · {s.levelLabel}
              </p>
              <p className="lg-type-compact">{s.reviewerNote}</p>
              <button
                type="button"
                className="vl-btn vl-btn-primary"
                disabled={busy || !auth.ready}
                onClick={() => void start(s)}
              >
                Practise this
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
