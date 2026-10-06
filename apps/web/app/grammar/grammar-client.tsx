'use client';

import { CSSProperties, FormEvent, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Issue = {
  type: string;
  severity: string;
  message: string;
  original?: string;
  suggestion?: string;
};

type CheckResult = {
  language: string;
  original: string;
  corrected: string;
  changed: boolean;
  issues: Issue[];
  issueCount: number;
  provider: string;
  model: string | null;
  note: string;
};

export function GrammarClient() {
  const { getToken, isLoaded } = useAuth();
  const [text, setText] = useState('i has went to teh store store');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCheck(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body: { text: string; language?: string } = { text };
      if (language.trim()) body.language = language.trim();
      setResult(
        await apiFetch<CheckResult>('/v1/grammar/check', {
          method: 'POST',
          token,
          body: JSON.stringify(body),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setBusy(false);
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
        Grammar AI
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '42rem' }}>
        Deterministic English-leaning rules plus optional LLM assist. Not Grammarly parity, not medical/legal writing
        products.
      </p>

      {!isLoaded ? <p style={{ color: 'var(--muted)' }}>Loading auth…</p> : null}

      <form onSubmit={onCheck} style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.75rem' }}>
        <label className="vl-label">
          Text
          <textarea className="vl-field" rows={5} value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        <label className="vl-label">
          Language hint (optional)
          <input
            className="vl-field"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. en"
          />
        </label>
        <button type="submit" className="vl-btn vl-btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>
          {busy ? 'Checking…' : 'Check grammar'}
        </button>
      </form>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {result ? (
        <section style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <h2 style={label}>Corrected</h2>
            <p style={{ margin: 0, fontWeight: 600, whiteSpace: 'pre-wrap' }}>{result.corrected}</p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {result.provider}
              {result.model ? ` · ${result.model}` : ''} · {result.issueCount} issues ·{' '}
              {result.changed ? 'changed' : 'unchanged'}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>{result.note}</p>
          </div>
          {result.issues.length > 0 ? (
            <div>
              <h2 style={label}>Issues</h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
                {result.issues.map((issue, idx) => (
                  <li key={`${issue.type}-${idx}`} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                    <strong>
                      {issue.type}
                    </strong>{' '}
                    · {issue.severity} · {issue.message}
                    {issue.suggestion ? (
                      <span style={{ color: 'var(--muted)' }}>
                        {' '}
                        → {issue.suggestion}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </AppShell>
  );
}

const label: CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};
