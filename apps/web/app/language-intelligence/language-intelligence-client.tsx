'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch, API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Overview = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null; notes: string }>;
};

type AnalyzeResult = {
  language: string;
  languageConfidence: number;
  intent: { label: string; confidence: number };
  sentiment: { label: string; score: number; confidence: number };
  emotion: { label: string; confidence: number };
  readability: { score: number; level: string };
  complexity: { score: number; level: string };
  dialect: { code: string | null; confidence: number } | null;
  note: string;
};

export function LanguageIntelligenceClient() {
  const { getToken, isLoaded } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [text, setText] = useState('Thank you! Can you please translate this into Swahili?');
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOverview(await apiFetch<Overview>('/v1/language-intelligence/engine'));
  }, []);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function runAnalyze() {
    setError(null);
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setResult(
      await apiFetch<AnalyzeResult>('/v1/language-intelligence/analyze', {
        method: 'POST',
        token,
        body: JSON.stringify({ text, includeDialect: true }),
      }),
    );
  }

  async function runStream() {
    setError(null);
    setStreamLog([]);
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const res = await fetch(`${API_URL}/v1/language-intelligence/analyze/stream`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ text, includeDialect: true }),
    });
    if (!res.ok || !res.body) throw new Error(`Stream failed (${res.status})`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const lines: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const event = part.match(/^event: (.+)$/m)?.[1] ?? 'message';
        const data = part.match(/^data: (.+)$/m)?.[1] ?? '';
        lines.push(`${event}: ${data}`);
      }
      setStreamLog([...lines]);
    }
  }

  return (
    <AppShell>
      <h1 style={h1}>Language Intelligence</h1>
      <p style={{ color: 'var(--muted)', maxWidth: '44rem', margin: '0 0 1.25rem' }}>
        {overview?.note ?? 'Detect + NLP signals façade.'}{' '}
        <Link href="/language">Language</Link> · <Link href="/dialects">Dialects</Link> ·{' '}
        <Link href="/accents">Accents</Link>
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {overview ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'grid', gap: '0.35rem' }}>
          {overview.capabilities.map((c) => (
            <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.35rem', fontSize: '0.92rem' }}>
              <strong>{c.name}</strong>
              {c.api ? ` · ${c.api}` : ''}
            </li>
          ))}
        </ul>
      ) : null}

      <label className="vl-label" style={{ display: 'grid', marginBottom: '0.75rem' }}>
        Text
        <textarea className="vl-field" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          type="button"
          className="vl-button"
          disabled={!isLoaded}
          onClick={() => void runAnalyze().catch((e: Error) => setError(e.message))}
        >
          Analyze
        </button>
        <button
          type="button"
          className="vl-button"
          disabled={!isLoaded}
          onClick={() => void runStream().catch((e: Error) => setError(e.message))}
        >
          Realtime stream
        </button>
      </div>

      {result ? (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.35rem' }}>
            Language <strong>{result.language}</strong> ({result.languageConfidence}) · Intent{' '}
            {result.intent.label} · Sentiment {result.sentiment.label} · Emotion {result.emotion.label}
          </p>
          <p style={{ margin: '0 0 0.35rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Readability {result.readability.score} ({result.readability.level}) · Complexity{' '}
            {result.complexity.score} ({result.complexity.level})
            {result.dialect?.code ? ` · Dialect ${result.dialect.code}` : ''}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{result.note}</p>
        </div>
      ) : null}

      {streamLog.length > 0 ? (
        <pre style={pre}>{streamLog.join('\n')}</pre>
      ) : null}
    </AppShell>
  );
}

const h1: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.85rem',
  fontWeight: 720,
  letterSpacing: '-0.03em',
  margin: '0 0 0.35rem',
};

const pre: CSSProperties = {
  whiteSpace: 'pre-wrap',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  padding: '0.85rem 1rem',
  borderRadius: '0.5rem',
  fontSize: '0.85rem',
  maxHeight: '16rem',
  overflow: 'auto',
};
