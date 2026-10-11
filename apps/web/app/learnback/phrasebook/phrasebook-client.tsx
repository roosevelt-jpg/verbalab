'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { LearnBackAuthGate, type LearnBackAuthBag } from '@/lib/learnback-auth';

type Entry = {
  id: string;
  phrase: string;
  intendedMeaning: string;
  context?: string | null;
  practiceLanguage: string;
  explanationLanguage: string;
  reviewStatus: string;
  revisionNumber: number;
};

export function LearnBackPhrasebookClient() {
  return (
    <LearnBackAuthGate>{(auth) => <PhrasebookFlow auth={auth} />}</LearnBackAuthGate>
  );
}

function PhrasebookFlow({ auth }: { auth: LearnBackAuthBag }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [meaning, setMeaning] = useState('');
  const [context, setContext] = useState('');
  const [revealId, setRevealId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth.ready) return;
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<{ entries: Entry[] }>('/v1/learnback/phrasebook', {
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
      });
      setEntries(res.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load phrasebook');
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch('/v1/learnback/phrasebook', {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
        body: { phrase, intendedMeaning: meaning, context: context || undefined },
      });
      setPhrase('');
      setMeaning('');
      setContext('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setBusy(true);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/learnback/phrasebook/${id}`, {
        method: 'DELETE',
        token: a.token,
        headers: a.actor ? { 'X-LearnBack-Actor-Id': a.actor } : undefined,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="LearnBack"
          title="Personal phrasebook"
          lede="Save useful phrases with intended meaning. Retrieval practice is optional — not a guaranteed learning claim."
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

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        <form onSubmit={onSave} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
          <label className="vl-field-label">
            Phrase
            <input className="vl-field" value={phrase} onChange={(e) => setPhrase(e.target.value)} required />
          </label>
          <label className="vl-field-label">
            Intended meaning
            <input className="vl-field" value={meaning} onChange={(e) => setMeaning(e.target.value)} required />
          </label>
          <label className="vl-field-label">
            Context (optional)
            <input className="vl-field" value={context} onChange={(e) => setContext(e.target.value)} />
          </label>
          <button type="submit" className="vl-btn vl-btn-primary" disabled={busy || !auth.ready}>
            Save phrase
          </button>
        </form>

        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          {entries.map((entry) => (
            <li key={entry.id} className="lg-card" style={{ display: 'grid', gap: '0.35rem' }}>
              <p className="lg-type-compact">Cue: {entry.intendedMeaning}</p>
              {revealId === entry.id ? (
                <>
                  <strong>{entry.phrase}</strong>
                  <p className="lg-type-compact">
                    {entry.context ?? 'No extra context'} · {entry.reviewStatus} · rev{' '}
                    {entry.revisionNumber}
                  </p>
                </>
              ) : (
                <p className="lg-type-compact">Attempt the phrase, then reveal.</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  onClick={() => setRevealId(revealId === entry.id ? null : entry.id)}
                >
                  {revealId === entry.id ? 'Hide' : 'Reveal'}
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy}
                  onClick={() => void onDelete(entry.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
