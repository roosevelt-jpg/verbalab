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
  marketCount?: number;
  corridorCount?: number;
  markets?: {
    code: string;
    nameEn: string;
    region: string;
    englishAccent?: { nameEn: string; bcp47: string };
  }[];
  corridors?: {
    id: string;
    label: string;
    note: string;
    marketCode?: string;
    marketName?: string;
    englishAccent?: { nameEn: string; bcp47: string };
  }[];
};

type SessionRow = {
  id: string;
  mode: string;
  corridor: string;
  state: string;
  createdAt: string;
  documents?: { id: string; originalName: string; status: string }[];
};

export function EverydayHomeClient() {
  return (
    <EverydayAuthGate>{(auth) => <EverydayHomeFlow auth={auth} />}</EverydayAuthGate>
  );
}

function EverydayHomeFlow({ auth }: { auth: EverydayAuthBag }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('read_this_to_me');
  const [corridor, setCorridor] = useState('en-ak');
  const [marketCode, setMarketCode] = useState('GH');

  const load = useCallback(async () => {
    setError(null);
    try {
      if (!auth.ready) {
        setCatalog({
          name: 'Lugemi Everyday',
          headline: 'Read notices, ask grounded questions, and approve replies in your language.',
          description:
            'Sign in or paste an API key to start a private session. Everyday never sends messages for you.',
          modes: [
            { id: 'read_this_to_me', label: 'Read this to me' },
            { id: 'help_me_reply', label: 'Help me reply' },
            { id: 'explain_this_word', label: 'Explain this word' },
          ],
          corridors: [
            {
              id: 'en-ak',
              label: 'Ghanaian English → Akan/Twi (Ghana)',
              note: '',
              marketCode: 'GH',
              englishAccent: { nameEn: 'Ghanaian English', bcp47: 'en-GH' },
            },
          ],
          markets: [
            {
              code: 'GH',
              nameEn: 'Ghana',
              region: 'West Africa',
              englishAccent: { nameEn: 'Ghanaian English', bcp47: 'en-GH' },
            },
          ],
          honesty: [],
        });
        return;
      }
      const a = await auth.authHeaders();
      const headers = a.actor ? { 'X-Everyday-Actor-Id': a.actor } : undefined;
      const cat = await apiFetch<Catalog>('/v1/everyday/catalog', { token: a.token, headers });
      setCatalog(cat);
      if (cat.corridors?.length) {
        setCorridor((prev) =>
          cat.corridors!.some((c) => c.id === prev) ? prev : cat.corridors![0]!.id,
        );
        const selected = cat.corridors.find((c) => c.id === corridor) ?? cat.corridors[0];
        if (selected?.marketCode && selected.marketCode !== 'XX') {
          setMarketCode(selected.marketCode);
        }
      }
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
          lede={catalog?.headline ?? 'Read notices, ask grounded questions, and approve replies.'}
        >
          <div className="lg-page-header__actions">
            <Link href="/everyday/history" className="vl-btn vl-btn-secondary">
              History
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        <FeaturePanel
          title="Private document help"
          body={
            catalog?.description ??
            'Photograph or upload a notice or bill. Faithful translation and plain-language explanation stay separate. No automatic external send.'
          }
        />

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <p className="lg-type-compact">Paste a Lugemi API key to use Everyday without signing in.</p>
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

        <section className="lg-page-section" aria-labelledby="ed-start">
          <div className="lg-page-section__head">
            <h2 id="ed-start" className="lg-type-section">
              Start a private session
            </h2>
            <p className="lg-type-compact">
              Processing stays in your organization. Training consent is off unless you opt in at create
              time.
            </p>
          </div>
          <form onSubmit={onCreate} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
            <p className="lg-type-compact">
              {catalog?.marketCount ?? 0} markets (Africa · LATAM · SEA · Middle East · Anglosphere) ·{' '}
              {catalog?.corridorCount ?? 0} wired corridors · country English + local dialects
            </p>
            <label className="vl-field-label">
              Mode
              <select className="vl-field" value={mode} onChange={(e) => setMode(e.target.value)}>
                {(catalog?.modes ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="vl-field-label">
              Market
              <select
                className="vl-field"
                value={marketCode}
                onChange={(e) => {
                  const next = e.target.value;
                  setMarketCode(next);
                  const first = (catalog?.corridors ?? []).find(
                    (c) => c.marketCode === next || (next === 'XX' && c.marketCode === 'XX'),
                  );
                  if (first) setCorridor(first.id);
                }}
              >
                <option value="XX">Pan-African / administrative</option>
                {(catalog?.markets ?? []).map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.nameEn}
                    {m.englishAccent ? ` · ${m.englishAccent.nameEn}` : ''} ({m.region})
                  </option>
                ))}
              </select>
            </label>
            <label className="vl-field-label">
              Language corridor
              <select
                className="vl-field"
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
              >
                {(catalog?.corridors ?? [])
                  .filter((c) => c.marketCode === marketCode || (!c.marketCode && marketCode === 'XX'))
                  .map((c) => (
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
        </section>

        {catalog?.honesty?.length ? (
          <section className="lg-page-section">
            <h2 className="lg-type-section">How Everyday stays honest</h2>
            <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
              {catalog.honesty.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="lg-page-section" aria-labelledby="ed-sessions">
          <h2 id="ed-sessions" className="lg-type-section">
            Your sessions
          </h2>
          {!sessions.length ? (
            <p className="lg-type-compact">No sessions yet.</p>
          ) : (
            <ul style={{ display: 'grid', gap: '0.5rem' }}>
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link href={`/everyday/sessions/${s.id}`}>
                    {s.mode.replaceAll('_', ' ')} · {s.corridor} · {s.state}
                  </Link>
                  <span className="lg-type-compact" style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                    {s.documents?.[0]?.originalName ?? 'No document'} ·{' '}
                    {new Date(s.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
