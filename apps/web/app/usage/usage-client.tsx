'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Summary = {
  periodStart: string;
  requests: number;
  characters: number;
  translate?: { requests: number; characters: number };
  stt?: { requests: number; seconds: number; minutes: number };
  tts?: { requests: number; characters: number };
  ocr?: { requests: number; pages: number };
  chat?: { requests: number; tokens: number };
  embeddings?: { requests: number; tokens: number };
};

export function UsageClient() {
  const { getToken, isLoaded } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Not signed in');
        const data = await apiFetch<Summary>('/v1/usage/summary', { token });
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage');
      }
    })();
  }, [getToken, isLoaded]);

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Usage
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Month-to-date translation, speech, OCR, and chat usage for your organization.
      </p>
      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {summary ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Stat label="Translate requests" value={String(summary.translate?.requests ?? summary.requests)} />
          <Stat label="Translate characters" value={String(summary.translate?.characters ?? summary.characters)} />
          <Stat label="STT requests" value={String(summary.stt?.requests ?? 0)} />
          <Stat label="STT minutes" value={String(summary.stt?.minutes ?? 0)} />
          <Stat label="TTS requests" value={String(summary.tts?.requests ?? 0)} />
          <Stat label="TTS characters" value={String(summary.tts?.characters ?? 0)} />
          <Stat label="OCR requests" value={String(summary.ocr?.requests ?? 0)} />
          <Stat label="OCR pages" value={String(summary.ocr?.pages ?? 0)} />
          <Stat label="Chat requests" value={String(summary.chat?.requests ?? 0)} />
          <Stat label="Chat tokens" value={String(summary.chat?.tokens ?? 0)} />
          <Stat label="Embeddings requests" value={String(summary.embeddings?.requests ?? 0)} />
          <Stat label="Embeddings tokens" value={String(summary.embeddings?.tokens ?? 0)} />
          <div style={{ gridColumn: '1 / -1', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Period start: {new Date(summary.periodStart).toUTCString()}
          </div>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="vl-panel" style={{ padding: '1.2rem', background: 'var(--bg-soft)', border: 'none' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
    </div>
  );
}
