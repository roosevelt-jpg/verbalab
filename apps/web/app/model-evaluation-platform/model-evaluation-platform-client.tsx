'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Suite = {
  id: string;
  name: string;
  status: string;
  runnable: boolean;
  notes: string;
};

type Run = {
  id: string;
  suite: string;
  label: string;
  status: string;
  score: number | null;
};

type Engine = {
  product: string;
  note: string;
  honesty: {
    globalLeaderboardOs: boolean;
    mmluOs: boolean;
    sotaClaimsForbidden: boolean;
    regeneratesVl100: boolean;
  };
  suites: Suite[];
};

export function ModelEvaluationPlatformClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/model-evaluation-platform/engine', { token }),
      apiFetch<{ runs: Run[] }>('/v1/model-evaluation-platform/runs', { token }),
    ]);
    setEngine(eng);
    setRuns(list.runs);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const runSafety = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/model-evaluation-platform/runs', {
        token,
        method: 'POST',
        body: JSON.stringify({ suite: 'safety', label: 'console-safety' }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Model Evaluation Platform
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Translation goldens via VL-100 plus sandbox bias/safety/latency — not a global LLM
        leaderboard.{' '}
        <Link href="/coverage">Coverage</Link> ·{' '}
        <Link href="/foundation-model-cloud">Foundation Model Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section
            style={{
              borderLeft: '3px solid #b45309',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Honesty</h2>
            <ul style={{ margin: 0, color: 'var(--muted)' }}>
              <li>sotaClaimsForbidden: {String(engine.honesty.sotaClaimsForbidden)}</li>
              <li>globalLeaderboardOs: {String(engine.honesty.globalLeaderboardOs)}</li>
              <li>mmluOs: {String(engine.honesty.mmluOs)}</li>
              <li>regeneratesVl100: {String(engine.honesty.regeneratesVl100)}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Actions</h2>
            <button type="button" onClick={() => void runSafety()} disabled={busy} style={btn}>
              {busy ? 'Running…' : 'Run sandbox safety suite'}
            </button>
          </section>

          <section>
            <h2 style={label}>Suites</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {engine.suites.map((s) => (
                <li key={s.id}>
                  <strong>{s.name}</strong> ({s.status}
                  {s.runnable ? ' · runnable' : ''}) — {s.notes}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Runs</h2>
            {runs.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>No evaluation runs yet.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
                {runs.map((r) => (
                  <li key={r.id}>
                    <strong>{r.label}</strong> — {r.suite} · {r.status}
                    {r.score !== null ? ` · score ${r.score}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 0.5rem',
  color: 'var(--muted)',
};

const btn: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  border: '1px solid var(--border, #ddd)',
  borderRadius: 4,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '0.9rem',
};
