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
  honesty: { autoPromptResearchLab: boolean; extendsVersionedPrompts: boolean };
};
type Analytics = { events: number; note: string };
type EvalResult = {
  score: number;
  findings: Array<{ id: string; severity: string; message: string }>;
  chars: number;
  source: string;
};

export function PromptIntelligenceClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [key, setKey] = useState('chat');
  const [draft, setDraft] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, an] = await Promise.all([
      apiFetch<Engine>('/v1/prompt-intelligence/engine', { token }),
      apiFetch<Analytics>('/v1/prompt-intelligence/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(an);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function runPreview {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{ body: string }>('/v1/prompt-intelligence/preview', {
        token,
        method: 'POST',
        body: { key, ...(draft.trim ? { body: draft } : {}) },
      });
      setPreview(body.body);
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  }

  async function runEvaluate {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<EvalResult>('/v1/prompt-intelligence/evaluate', {
        token,
        method: 'POST',
        body: { key, ...(draft.trim ? { body: draft } : {}) },
      });
      setEvalResult(body);
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluate failed');
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
        Prompt Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Hub over versioned prompts — not an auto-prompt research lab.{' '}
        <Link href="/prompts">Manage prompts</Link> ·{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.events} prompt intelligence events this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Preview / evaluate</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid var(--line)' }}
            >
              <option value="chat">chat</option>
              <option value="rag">rag</option>
              <option value="voice_faq">voice_faq</option>
            </select>
            <button type="button" onClick={ => void runPreview} disabled={loading} style={btn}>
              Preview
            </button>
            <button type="button" onClick={ => void runEvaluate} disabled={loading} style={btn}>
              Evaluate
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Optional draft body (empty = active/fallback)"
            rows={5}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.65rem',
              borderRadius: '0.35rem',
              border: '1px solid var(--line)',
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: '0.85rem',
            }}
          />
        </section>

        {preview ? (
          <section>
            <h2 style={label}>Preview</h2>
            <pre style={pre}>{preview.slice(0, 2000)}</pre>
          </section>
        ) : null}

        {evalResult ? (
          <section>
            <h2 style={label}>Evaluation</h2>
            <p style={{ margin: '0 0 0.5rem' }}>
              Score {evalResult.score} · {evalResult.chars} chars · source {evalResult.source}
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {evalResult.findings.length === 0 ? (
                <li>No findings</li>
              ) : (
                evalResult.findings.map((f) => (
                  <li key={f.id}>
                    [{f.severity}] {f.message}
                  </li>
                ))
              )}
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
              autoPromptResearchLab={String(engine.honesty.autoPromptResearchLab)} ·
              extendsVersionedPrompts={String(engine.honesty.extendsVersionedPrompts)}
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

const pre: React.CSSProperties = {
  margin: 0,
  padding: '0.85rem',
  borderRadius: '0.35rem',
  border: '1px solid var(--line)',
  whiteSpace: 'pre-wrap',
  fontSize: '0.82rem',
  lineHeight: 1.45,
  maxHeight: '16rem',
  overflow: 'auto',
};
