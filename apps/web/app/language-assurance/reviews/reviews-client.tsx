'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';

type Assignment = {
  id: string;
  runId: string;
  sourceText: string;
  targetText: string;
  sourceTextHash: string;
  targetTextHash: string;
  audioSha256: string | null;
  disposition: string | null;
  findings: Array<{ category: string; severity: string; sourceEvidence: string | null }>;
};

export function AssuranceReviewsClient() {
  const { getToken, isSignedIn } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('native-reviewer');
  const [busy, setBusy] = useState(false);
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

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const a = await authHeaders();
      const res = await apiFetch<{ assignments: Assignment[] }>('/v1/language-assurance/reviews/queue', {
        token: a.token,
        headers: a.actor ? { 'X-LanguageAssurance-Actor-Id': a.actor } : undefined,
      });
      setItems(res.assignments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    }
  }, [authHeaders]);

  useEffect(() => {
    if (signedIn || apiKey.startsWith('lg_')) void refresh();
  }, [signedIn, apiKey, refresh]);

  async function judge(item: Assignment, judgment: 'approve' | 'request_changes' | 'reject' | 'uncertain') {
    setBusy(true);
    setError(null);
    try {
      const a = await authHeaders();
      await apiFetch(`/v1/language-assurance/reviews/${item.id}/submit`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-LanguageAssurance-Actor-Id': a.actor } : undefined,
        body: {
          judgment,
          sourceTextHash: item.sourceTextHash,
          targetTextHash: item.targetTextHash,
          audioSha256: item.audioSha256 ?? undefined,
          meaningOk: judgment === 'approve',
          notes: `UI judgment: ${judgment}`,
        },
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Language Assurance"
          title="Native review queue"
          lede="Machine findings support you — they do not replace your judgment."
        >
          <div className="lg-page-header__actions">
            <Link href="/language-assurance" className="vl-btn vl-btn-secondary">
              Runs
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void refresh()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        {!signedIn && (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <input className="vl-field" placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <input className="vl-field" placeholder="Reviewer actor id" value={actorId} onChange={(e) => setActorId(e.target.value)} />
          </section>
        )}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {items.length === 0 ? (
            <li className="lg-type-compact">No open assignments for this actor.</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="lg-card">
                <Link href={`/language-assurance/runs/${item.runId}`}>Run {item.runId.slice(0, 10)}…</Link>
                <p>
                  <strong>Source</strong> {item.sourceText}
                </p>
                <p>
                  <strong>Target</strong> {item.targetText}
                </p>
                <div className="lg-type-compact">
                  Findings:{' '}
                  {item.findings.map((f) => `${f.severity}:${f.category}`).join(' · ') || 'none'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void judge(item, 'approve')}>
                    Approve
                  </button>
                  <button
                    type="button"
                    className="vl-btn vl-btn-secondary"
                    disabled={busy}
                    onClick={() => void judge(item, 'request_changes')}
                  >
                    Request changes
                  </button>
                  <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void judge(item, 'reject')}>
                    Reject
                  </button>
                  <button
                    type="button"
                    className="vl-btn vl-btn-secondary"
                    disabled={busy}
                    onClick={() => void judge(item, 'uncertain')}
                  >
                    Uncertain
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </AppShell>
  );
}