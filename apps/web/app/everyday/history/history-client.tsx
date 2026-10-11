'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AppShell } from '@/components/app-shell';
import { PageHeader, FeaturePanel } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';

type SessionRow = {
  id: string;
  mode: string;
  corridor: string;
  state: string;
  createdAt: string;
};

export function EverydayHistoryClient() {
  const { getToken, isSignedIn } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('everyday-local');
  const signedIn = Boolean(isClerkConfigured() && isSignedIn);

  const load = useCallback(async () => {
    setError(null);
    try {
      let token = '';
      let actor: string | undefined;
      if (signedIn) {
        token = (await getToken()) ?? '';
      } else if (apiKey.startsWith('lg_')) {
        token = apiKey;
        actor = actorId;
      } else {
        setError('Sign in or paste an API key');
        return;
      }
      const res = await apiFetch<{ sessions: SessionRow[] }>('/v1/everyday/sessions', {
        token,
        headers: actor ? { 'X-Everyday-Actor-Id': actor } : undefined,
      });
      setSessions(res.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }, [apiKey, actorId, getToken, signedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Everyday"
          title="Private history"
          description="Only your sessions. Delete from each session page to remove media and derivatives."
          actions={
            <Link href="/everyday" className="vl-btn vl-btn-secondary">
              Back
            </Link>
          }
        />
        {!signedIn ? (
          <FeaturePanel title="Connect">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="vl-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="lg_…"
              />
              <input
                className="vl-input"
                value={actorId}
                onChange={(e) => setActorId(e.target.value)}
                placeholder="Actor id"
              />
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
                Load
              </button>
            </div>
          </FeaturePanel>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <FeaturePanel title="Sessions">
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link href={`/everyday/sessions/${s.id}`} className="underline">
                  {s.mode} · {s.corridor} · {s.state}
                </Link>
              </li>
            ))}
          </ul>
        </FeaturePanel>
      </div>
    </AppShell>
  );
}
