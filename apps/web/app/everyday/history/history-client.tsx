'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { EverydayAuthGate, type EverydayAuthBag } from '@/lib/everyday-auth';

type SessionRow = {
  id: string;
  mode: string;
  corridor: string;
  state: string;
  createdAt: string;
};

export function EverydayHistoryClient() {
  return (
    <EverydayAuthGate>{(auth) => <EverydayHistoryFlow auth={auth} />}</EverydayAuthGate>
  );
}

function EverydayHistoryFlow({ auth }: { auth: EverydayAuthBag }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (!auth.ready) {
        setError('Sign in or paste an API key');
        return;
      }
      const a = await auth.authHeaders();
      const res = await apiFetch<{ sessions: SessionRow[] }>('/v1/everyday/sessions', {
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
      });
      setSessions(res.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Everyday"
          title="Private history"
          lede="Only your sessions. Delete from each session page to remove media and derivatives."
        >
          <div className="lg-page-header__actions">
            <Link href="/everyday" className="vl-btn vl-btn-secondary">
              Back
            </Link>
          </div>
        </PageHeader>

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              className="vl-field"
              value={auth.apiKey}
              onChange={(e) => auth.setApiKey(e.target.value)}
              placeholder="lg_…"
            />
            <input
              className="vl-field"
              value={auth.actorId}
              onChange={(e) => auth.setActorId(e.target.value)}
              placeholder="Actor id"
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

        <section className="lg-page-section">
          <h2 className="lg-type-section">Sessions</h2>
          <ul style={{ display: 'grid', gap: '0.5rem' }}>
            {sessions.map((s) => (
              <li key={s.id}>
                <Link href={`/everyday/sessions/${s.id}`}>
                  {s.mode} · {s.corridor} · {s.state}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
