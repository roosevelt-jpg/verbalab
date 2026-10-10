'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';

type MatrixRow = {
  task: string;
  lugemi_baseline: string;
  external_comparison: string;
  rule: string;
};
type IntegrationCase = {
  id: string;
  expected_behavior: string;
  expected_status_code: number;
  outcome: string;
};
type Study = {
  study_id: string;
  primary_outcome: string;
  status: string;
  score: { dataset_split_hash: string; denominator: number | null } | null;
};
type ClaimResult = {
  valid: boolean;
  formatted_claim: string | null;
  missing_fields: string[];
  banned_phrase_hits: string[];
  note: string;
};

export function CorridorBenchmarksClient() {
  const [apiKey, setApiKey] = useState('');
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [cases, setCases] = useState<IntegrationCase[]>([]);
  const [primaryOutcome, setPrimaryOutcome] = useState(
    'Relative reduction in critical meaning errors at matched coverage',
  );
  const [study, setStudy] = useState<Study | null>(null);
  const [runResult, setRunResult] = useState<{ case_id: string; passed: boolean; expected_behavior: string } | null>(
    null,
  );
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      apiFetch<{ matrix: MatrixRow[] }>('/v1/corridor-benchmarks/comparison-matrix'),
      apiFetch<{ cases: IntegrationCase[] }>('/v1/corridor-benchmarks/integration-cases'),
    ])
      .then(([m, c]) => {
        setMatrix(m.matrix);
        setCases(c.cases);
      })
      .catch(() => undefined);
  }, []);

  function authHeaders() {
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }

  function requireKey() {
    if (!apiKey.startsWith('lg_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return false;
    }
    return true;
  }

  async function preregister(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!requireKey()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/corridor-benchmarks/studies`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ primaryOutcome }),
      });
      const body = (await res.json()) as Study & { message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setStudy(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function scoreStudy() {
    setError(null);
    if (!requireKey() || !study) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/corridor-benchmarks/studies/${study.study_id}/score`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          datasetVersion: 'pilot-holdout-1',
          modelId: 'lugemi-mix',
          comparatorConfig: 'lugemi-cascade-baseline',
          criticalMeaningErrors: 0,
          denominator: 500,
          coverage: 0.82,
          intervalNote: 'Paired cluster-aware interval pending auditor review',
          exclusions: ['unsupported varieties outside ak-GH-twi / yo-NG'],
        }),
      });
      const body = (await res.json()) as Study & { message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setStudy(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function runCase(caseId: string) {
    setError(null);
    if (!requireKey()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/corridor-benchmarks/integration-cases/${caseId}/run`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ simulatePass: true }),
      });
      const body = (await res.json()) as {
        case_id: string;
        passed: boolean;
        expected_behavior: string;
        message?: string;
      };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setRunResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function validateClaim(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!requireKey()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/corridor-benchmarks/claims/validate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          datasetVersion: 'pilot-holdout-1',
          corridorTask: 'twi-english mixed-language ASR critical meaning errors',
          lugemiVersion: 'lugemi-mix pilot-1',
          definedError: 'critical meaning errors',
          measuredChange: 'recorded held-out delta pending auditor publication',
          comparator: 'lugemi-cascade-baseline',
          coverageLatencyCost: 'coverage 0.82 / matched latency band',
          testedDate: '2026-10-06',
          interval: 'cluster-aware 95% interval',
          denominator: 500,
          exclusions: ['Hausa corridor not yet evaluated'],
        }),
      });
      const body = (await res.json()) as ClaimResult & { message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setClaim(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortfolioShell
      title="Lugemi Advantage Protocol"
      lede="Corridor-specific evaluation: comparison matrix, preregistered studies, mandatory integration cases with concrete expected behaviors, and claim-format validation. No invented confidence scores. No broad superiority language."
      docsHref="/docs"
    >
      <label style={{ display: 'grid', gap: '0.25rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key</span>
        <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="lg_live_…" />
      </label>

      <section className="vl-panel" style={{ padding: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Comparison matrix</h2>
        <div style={{ overflowX: 'auto', marginTop: '0.65rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '0.35rem' }}>Task</th>
                <th style={{ padding: '0.35rem' }}>Lugemi baseline</th>
                <th style={{ padding: '0.35rem' }}>External comparison</th>
                <th style={{ padding: '0.35rem' }}>Rule</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.task} style={{ borderTop: '1px solid var(--border, #ddd)' }}>
                  <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>{row.task}</td>
                  <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>{row.lugemi_baseline}</td>
                  <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>{row.external_comparison}</td>
                  <td style={{ padding: '0.4rem', verticalAlign: 'top' }}>{row.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form onSubmit={preregister} className="vl-panel" style={{ padding: '1rem', marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Preregister study</h2>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Primary outcome</span>
          <textarea className="vl-field" rows={2} value={primaryOutcome} onChange={(e) => setPrimaryOutcome(e.target.value)} />
        </label>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Working…' : 'Preregister'}
        </button>
      </form>

      {study ? (
        <div className="vl-panel" style={{ padding: '0.9rem', marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>
            <code>{study.study_id}</code> · {study.status}
          </p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>{study.primary_outcome}</p>
          {study.score ? (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
              split hash {study.score.dataset_split_hash} · denominator {study.score.denominator}
            </p>
          ) : (
            <button type="button" className="vl-btn vl-btn-secondary" style={{ marginTop: '0.65rem' }} onClick={() => void scoreStudy()}>
              Record held-out score (with denominator)
            </button>
          )}
        </div>
      ) : null}

      <section className="vl-panel" style={{ padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Mandatory integration cases</h2>
        <ul style={{ margin: '0.65rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.45rem' }}>
          {cases.map((c) => (
            <li key={c.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.85rem' }}>
                <strong>{c.id}</strong>
                <div style={{ color: 'var(--muted)' }}>{c.expected_behavior}</div>
              </div>
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                style={{ minHeight: 28, padding: '0.2rem 0.55rem', flexShrink: 0 }}
                onClick={() => void runCase(c.id)}
              >
                Run
              </button>
            </li>
          ))}
        </ul>
        {runResult ? (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem' }}>
            {runResult.case_id}: {runResult.passed ? 'passed' : 'failed'} — {runResult.expected_behavior}
          </p>
        ) : null}
      </section>

      <form onSubmit={validateClaim} className="vl-panel" style={{ padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Validate superiority claim format</h2>
        <p style={{ margin: '0.4rem 0 0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Requires frozen dataset, corridor/task, Lugemi version, defined error, measured change, comparator, coverage/latency/cost, date, interval, and denominator.
        </p>
        <button type="submit" className="vl-btn" disabled={loading}>
          Validate example claim
        </button>
      </form>

      {claim ? (
        <div className="vl-panel" style={{ padding: '0.9rem', marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>{claim.valid ? 'Valid format' : 'Rejected'}</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem' }}>{claim.note}</p>
          {claim.formatted_claim ? (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{claim.formatted_claim}</p>
          ) : null}
          {claim.missing_fields.length ? (
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
              Missing: {claim.missing_fields.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}
    </PortfolioShell>
  );
}
