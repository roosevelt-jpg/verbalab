'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
  honesty: { enterpriseBrms: boolean; lightRules: boolean };
};
type Analytics = { decisions: number; note: string };
type DecideResult = {
  kind: string;
  decision: string;
  confidence: number;
  reasons: string[];
};

export function DecisionEngineClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [kind, setKind] = useState('routing');
  const [query, setQuery] = useState('translate FAQ to Swahili');
  const [result, setResult] = useState<DecideResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, an] = await Promise.all([
      apiFetch<Engine>('/v1/decision-engine/engine', { token }),
      apiFetch<Analytics>('/v1/decision-engine/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(an);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function decide() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<DecideResult>('/v1/decision-engine/decide', {
        token,
        method: 'POST',
        body: {
          kind,
          query,
          family: kind === 'model_selection' || kind === 'cost' ? 'chat' : undefined,
        },
      });
      setResult(body);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decide failed');
    } finally {
      setLoading(false);
    }
  }

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
        AI Decision Engine
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Bounded policy/routing helpers — not an enterprise BRMS.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> ·{' '}
        <Link href="/enterprise">Enterprise</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.decisions} decisions this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Decide</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid var(--line)' }}
            >
              <option value="routing">routing</option>
              <option value="model_selection">model_selection</option>
              <option value="fallback">fallback</option>
              <option value="policy">policy</option>
              <option value="safety">safety</option>
              <option value="risk">risk</option>
              <option value="tool_selection">tool_selection</option>
              <option value="workflow">workflow</option>
              <option value="cost">cost</option>
              <option value="confidence">confidence</option>
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: '1 1 14rem',
                padding: '0.45rem 0.65rem',
                borderRadius: '0.35rem',
                border: '1px solid var(--line)',
              }}
            />
            <button type="button" onClick={() => void decide()} disabled={loading} style={btn}>
              Decide
            </button>
          </div>
        </section>

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong>{result.decision}</strong> · confidence {result.confidence} · {result.kind}
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)' }}>
              {result.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {engine ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id}>
                  {c.name} — {c.status}
                </li>
              ))}
            </ul>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
              enterpriseBrms={String(engine.honesty.enterpriseBrms)} · lightRules=
              {String(engine.honesty.lightRules)}
            </p>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const btn: React.CSSProperties = {
  padding: '0.45rem 0.9rem',
  borderRadius: '0.35rem',
  border: '1px solid var(--line)',
  background: 'var(--fg)',
  color: 'var(--bg)',
  fontWeight: 600,
  cursor: 'pointer',
};
