'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Overview = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null; notes: string }>;
};

type DetectResult = {
  detectedTone: string;
  confidence: number;
  suggestedProfile: string;
  note: string;
};

type TransferResult = {
  sourceTone: string;
  sourceConfidence: number;
  targetProfile: string;
  rewritten: string;
  changed: boolean;
  changeCount: number;
  disclaimer?: string | null;
  note: string;
};

const PROFILES = [
  'formal',
  'professional',
  'academic',
  'business',
  'marketing',
  'technical',
  'medical',
  'legal',
  'government',
  'casual',
];

export function StyleIntelligenceClient() {
  const { getToken, isLoaded } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [text, setText] = useState("I'm gonna ship this ASAP — unlock conversion now!");
  const [target, setTarget] = useState('professional');
  const [detect, setDetect] = useState<DetectResult | null>(null);
  const [transfer, setTransfer] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOverview(await apiFetch<Overview>('/v1/style/intelligence'));
  }, []);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function runDetect() {
    setError(null);
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setDetect(
      await apiFetch<DetectResult>('/v1/style/detect', {
        method: 'POST',
        token,
        body: JSON.stringify({ text }),
      }),
    );
  }

  async function runTransfer() {
    setError(null);
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setTransfer(
      await apiFetch<TransferResult>('/v1/style/transfer', {
        method: 'POST',
        token,
        body: JSON.stringify({ text, targetProfile: target }),
      }),
    );
  }

  return (
    <AppShell>
      <h1 style={h1}>Style Intelligence</h1>
      <p style={{ color: 'var(--muted)', maxWidth: '44rem', margin: '0 0 1.25rem' }}>
        {overview?.note ?? 'Tone detect, transform, and transfer.'}{' '}
        <Link href="/style">Style</Link> · <Link href="/grammar-intelligence">Grammar AI</Link>
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
      <label className="vl-label" style={{ display: 'grid', maxWidth: '16rem', marginBottom: '0.75rem' }}>
        Target profile
        <select className="vl-field" value={target} onChange={(e) => setTarget(e.target.value)}>
          {PROFILES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          type="button"
          className="vl-button"
          disabled={!isLoaded}
          onClick={() => void runDetect().catch((e: Error) => setError(e.message))}
        >
          Detect tone
        </button>
        <button
          type="button"
          className="vl-button"
          disabled={!isLoaded}
          onClick={() => void runTransfer().catch((e: Error) => setError(e.message))}
        >
          Transfer style
        </button>
      </div>

      {detect ? (
        <p style={{ marginBottom: '1rem' }}>
          Detected <strong>{detect.detectedTone}</strong> (confidence {detect.confidence}) → suggest{' '}
          {detect.suggestedProfile}
        </p>
      ) : null}

      {transfer ? (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            {transfer.sourceTone} → {transfer.targetProfile} · {transfer.changeCount} changes
          </p>
          <pre style={pre}>{transfer.rewritten}</pre>
          {transfer.disclaimer ? <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{transfer.disclaimer}</p> : null}
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{transfer.note}</p>
        </div>
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
  margin: '0 0 0.75rem',
};
