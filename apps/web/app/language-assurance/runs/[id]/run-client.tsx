'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useStudioApiKeyField } from '@/hooks/use-studio-api-key';

type RunView = {
  run: {
    id: string;
    executionState: string;
    disposition: string | null;
    calibrationVersion: string;
    unavailableChecks: string[];
    stageStates: Record<string, string>;
    reportHash: string | null;
  };
  bundle: {
    sourceText: string;
    targetText: string;
    sourceTextHash: string;
    targetTextHash: string;
    audioSha256: string | null;
    bundleHash: string;
    corridor: string;
    product: string;
  };
  policy: { version: string; requireNativeReview: boolean; requiredStages: string[] };
  findings: Array<{
    id: string;
    stage: string;
    category: string;
    severity: string;
    sourceEvidence: string | null;
    targetEvidence: string | null;
    reasonCode: string | null;
  }>;
  assignments: Array<{ id: string; reviewerUserId: string; status: string }>;
  reviews: Array<{ id: string; judgment: string; reviewerUserId: string }>;
  releases: Array<{ id: string; evidenceHash: string; disposition: string }>;
};

export function AssuranceRunClient({ runId }: { runId: string }) {
  const { getToken, isSignedIn } = useAuth();
  const [view, setView] = useState<RunView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('producer-local');
  const [reviewerId, setReviewerId] = useState('native-reviewer');
  const [report, setReport] = useState<string | null>(null);
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
      const res = await apiFetch<RunView>(`/v1/language-assurance/runs/${runId}`, {
        token: a.token,
        headers: a.actor ? { 'X-LanguageAssurance-Actor-Id': a.actor } : undefined,
      });
      setView(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run');
    }
  }, [authHeaders, runId]);

  useEffect(() => {
    if (signedIn || apiKey.startsWith('lg_')) void refresh();
  }, [signedIn, apiKey, refresh]);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Language Assurance"
          title="Verification run"
          lede={
            view
              ? `${view.run.disposition ?? view.run.executionState} · ${view.bundle.corridor} · policy ${view.policy.version}`
              : 'Loading…'
          }
        >
          <div className="lg-page-header__actions">
            <Link href="/language-assurance" className="vl-btn vl-btn-secondary">
              All runs
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void refresh()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        {!signedIn && (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <input className="vl-field" placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <input className="vl-field" placeholder="Actor id" value={actorId} onChange={(e) => setActorId(e.target.value)} />
          </section>
        )}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        {view ? (
          <>
            <section className="lg-page-section">
              <h2 className="lg-type-section">Artifacts</h2>
              <p className="lg-type-compact">Bundle {view.bundle.bundleHash.slice(0, 16)}…</p>
              <div className="lg-card">
                <strong>Source</strong>
                <p>{view.bundle.sourceText}</p>
                <strong>Target</strong>
                <p>{view.bundle.targetText}</p>
              </div>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Stages</h2>
              <ul className="lg-type-compact">
                {Object.entries(view.run.stageStates ?? {}).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
              </ul>
              {(view.run.unavailableChecks?.length ?? 0) > 0 ? (
                <p className="lg-type-compact">Unavailable: {view.run.unavailableChecks.join(' · ')}</p>
              ) : null}
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Findings</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                {view.findings.length === 0 ? (
                  <li className="lg-type-compact">No automated findings.</li>
                ) : (
                  view.findings.map((f) => (
                    <li key={f.id} className="lg-card">
                      <strong>
                        {f.severity} · {f.category}
                      </strong>
                      <div className="lg-type-compact">
                        {f.stage} · {f.reasonCode}
                      </div>
                      <div className="lg-type-compact">
                        “{f.sourceEvidence}” → “{f.targetEvidence}”
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Native review &amp; release</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  className="vl-field"
                  style={{ maxWidth: 220 }}
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  placeholder="Reviewer user id"
                />
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy}
                  onClick={() =>
                    void withBusy(async () => {
                      const a = await authHeaders();
                      await apiFetch(`/v1/language-assurance/runs/${runId}/assignments`, {
                        method: 'POST',
                        token: a.token,
                        headers: a.actor ? { 'X-LanguageAssurance-Actor-Id': a.actor } : undefined,
                        body: { reviewerUserId: reviewerId },
                      });
                    })
                  }
                >
                  Assign reviewer
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy}
                  onClick={() =>
                    void withBusy(async () => {
                      const a = await authHeaders();
                      const res = await apiFetch<{ body?: unknown; reportHash?: string }>(
                        `/v1/language-assurance/runs/${runId}/report?format=markdown`,
                        {
                          token: a.token,
                          headers: a.actor ? { 'X-LanguageAssurance-Actor-Id': a.actor } : undefined,
                        },
                      );
                      setReport(typeof res.body === 'string' ? res.body : JSON.stringify(res.body, null, 2));
                    })
                  }
                >
                  Load report
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy}
                  onClick={() =>
                    void withBusy(async () => {
                      const a = await authHeaders();
                      await apiFetch(`/v1/language-assurance/runs/${runId}/release-evidence`, {
                        method: 'POST',
                        token: a.token,
                        headers: a.actor ? { 'X-LanguageAssurance-Actor-Id': a.actor } : undefined,
                        body: {},
                      });
                    })
                  }
                >
                  Pin release evidence
                </button>
              </div>
              <ul className="lg-type-compact" style={{ marginTop: '0.75rem' }}>
                {view.assignments.map((a) => (
                  <li key={a.id}>
                    Assignment {a.id.slice(0, 8)}… → {a.reviewerUserId} ({a.status})
                  </li>
                ))}
                {view.reviews.map((r) => (
                  <li key={r.id}>
                    Review {r.judgment} by {r.reviewerUserId}
                  </li>
                ))}
                {view.releases.map((r) => (
                  <li key={r.id}>
                    Release {r.disposition} · {r.evidenceHash.slice(0, 12)}…
                  </li>
                ))}
              </ul>
              {report ? (
                <pre className="lg-card" style={{ whiteSpace: 'pre-wrap', marginTop: '0.75rem' }}>
                  {report}
                </pre>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
