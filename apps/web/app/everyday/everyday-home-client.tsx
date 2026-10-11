'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader, FeaturePanel } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { EverydayAuthGate, type EverydayAuthBag } from '@/lib/everyday-auth';

type Catalog = {
  name?: string;
  headline?: string;
  description?: string;
  honesty?: string[];
  modes?: { id: string; label: string }[];
  corridors?: { id: string; label: string; note: string }[];
  limitations?: string[];
};

type SessionRow = {
  id: string;
  mode: string;
  corridor: string;
  state: string;
  preferredVariety: string;
  createdAt: string;
  documents?: { id: string; originalName: string; status: string }[];
};

export function EverydayHomeClient() {
  return (
    <EverydayAuthGate>
      {(auth) => <EverydayHomeFlow auth={auth} />}
    </EverydayAuthGate>
  );
}

function EverydayHomeFlow({ auth }: { auth: EverydayAuthBag }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('read_this_to_me');
  const [corridor, setCorridor] = useState('en-ak');

  const load = useCallback(async () => {
    setError(null);
    try {
      if (!auth.ready) {
        setCatalog({
          name: 'Lugemi Everyday',
          headline: 'Read notices, ask grounded questions, and approve replies in your language.',
          description:
            'Sign in or paste an API key to start a private session. Your documents stay in your organization — Everyday never sends messages for you.',
          modes: [
            { id: 'read_this_to_me', label: 'Read this to me' },
            { id: 'help_me_reply', label: 'Help me reply' },
            { id: 'explain_this_word', label: 'Explain this word' },
          ],
          corridors: [{ id: 'en-ak', label: 'English → Akan/Twi', note: '' }],
          honesty: [],
        });
        return;
      }
      const a = await auth.authHeaders();
      const headers = a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined;
      const cat = await apiFetch<Catalog>('/v1/everyday/catalog', { token: a.token, headers });
      setCatalog(cat);
      const res = await apiFetch<{ sessions: SessionRow[] }>('/v1/everyday/sessions', {
        token: a.token,
        headers,
      });
      setSessions(res.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load Everyday');
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<{ session: { id: string } }>('/v1/everyday/sessions', {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined,
        body: { mode, corridor },
      });
      window.location.href = `/everyday/sessions/${res.session.id}`;
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
          eyebrow="Everyday"
          title={catalog?.name ?? 'Everyday'}
          description={catalog?.headline ?? ''}
          actions={
            <Link href="/everyday/history" className="vl-btn vl-btn-secondary">
              History
            </Link>
          }
        />

        {!auth.signedIn ? (
          <FeaturePanel title="Connect">
            <p className="text-sm opacity-80 mb-3">
              Paste a Lugemi API key to use Everyday without Clerk in this browser.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="vl-input"
                placeholder="lg_live_… or lg_test_…"
                value={auth.apiKey}
                onChange={(e) => auth.setApiKey(e.target.value)}
              />
              <input
                className="vl-input"
                placeholder="Actor id"
                value={auth.actorId}
                onChange={(e) => auth.setActorId(e.target.value)}
              />
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
                Load
              </button>
            </div>
          </FeaturePanel>
        ) : null}

        {error ? <p className="text-sm text-red-700 mt-3">{error}</p> : null}

        <FeaturePanel title="Start">
          <p className="text-sm opacity-80 mb-4">
            {catalog?.description ??
              'Photograph or upload a document. Processing is private to your organization.'}
          </p>
          <form onSubmit={onCreate} className="flex flex-col gap-3 max-w-xl">
            <label className="text-sm">
              Mode
              <select className="vl-input mt-1" value={mode} onChange={(e) => setMode(e.target.value)}>
                {(catalog?.modes ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Language corridor
              <select
                className="vl-input mt-1"
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
              >
                {(catalog?.corridors ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
              {busy ? 'Starting…' : 'Open private session'}
            </button>
          </form>
        </FeaturePanel>

        {catalog?.honesty?.length ? (
          <FeaturePanel title="How Everyday stays honest">
            <ul className="list-disc pl-5 text-sm space-y-1">
              {catalog.honesty.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </FeaturePanel>
        ) : null}

        <FeaturePanel title="Your sessions">
          {!sessions.length ? (
            <p className="text-sm opacity-70">No sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/everyday/sessions/${s.id}`} className="underline">
                    {s.mode.replaceAll('_', ' ')} · {s.corridor} · {s.state}
                  </Link>
                  <span className="text-xs opacity-60">
                    {s.documents?.[0]?.originalName ?? 'No document'} ·{' '}
                    {new Date(s.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </FeaturePanel>
      </div>
    </AppShell>
  );
}
