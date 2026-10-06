'use client';

import { CSSProperties, FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type AccentRow = {
  code: string;
  languageCode: string;
  nameEn: string;
  region: string | null;
  relatedDialectCode: string | null;
};

type DetectResult = {
  language: string;
  accent: string | null;
  accentName: string | null;
  confidence: number;
  provider: string;
  inputMode: string;
  transcript?: string;
  note: string;
  candidates: { code: string; nameEn: string; score: number; matchedCues: string[] }[];
};

export function AccentsClient() {
  const { getToken, isLoaded } = useAuth();
  const [accents, setAccents] = useState<AccentRow[]>([]);
  const [text, setText] = useState('How far, abi you dey come? Wetin happen sef?');
  const [language, setLanguage] = useState('en');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<{ data: AccentRow[] }>('/v1/accents');
    setAccents(res.data);
  }, []);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function onDetect(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');

      if (file) {
        const form = new FormData();
        form.append('file', file);
        if (text.trim()) form.append('text', text.trim());
        if (language.trim()) form.append('language', language.trim());
        const res = await apiFetch<DetectResult>('/v1/accents/detect', {
          method: 'POST',
          token,
          body: form,
        });
        setResult(res);
      } else {
        const body: { text: string; language?: string } = { text };
        if (language.trim()) body.language = language.trim();
        const res = await apiFetch<DetectResult>('/v1/accents/detect', {
          method: 'POST',
          token,
          body: JSON.stringify(body),
        });
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detect failed');
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
        Accent detection
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '42rem' }}>
        Spoken accent profiles from transcript or text cues (optional audio → STT). This is not a dedicated
        acoustic phonetics classifier and not unlimited coverage.
      </p>

      {!isLoaded ? <p style={{ color: 'var(--muted)' }}>Loading auth…</p> : null}

      <form onSubmit={onDetect} style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.75rem' }}>
        <label className="vl-label">
          Text / transcript
          <textarea className="vl-field" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="vl-label">
          Audio (optional)
          <input
            className="vl-field"
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
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
          {busy ? 'Detecting…' : 'Detect accent profile'}
        </button>
      </form>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {result ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={label}>Result</h2>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Language {result.language} · Accent {result.accentName ?? 'none'} ({result.accent ?? '—'}) ·{' '}
            {(result.confidence * 100).toFixed(0)}% · {result.provider} · {result.inputMode}
          </p>
          {result.transcript ? (
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Transcript: {result.transcript}
            </p>
          ) : null}
          <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>{result.note}</p>
          {result.candidates.length > 0 ? (
            <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.4rem' }}>
              {result.candidates.map((c) => (
                <li key={c.code} style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  {c.code} · {c.nameEn} · score {c.score.toFixed(2)}
                  {c.matchedCues.length ? ` · cues: ${c.matchedCues.join(', ')}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 style={label}>Registry ({accents.length})</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
          {accents.map((a) => (
            <li key={a.code} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
              <strong>{a.code}</strong> · {a.nameEn} · {a.languageCode}
              {a.region ? ` · ${a.region}` : ''}
              {a.relatedDialectCode ? ` · dialect ${a.relatedDialectCode}` : ''}
            </li>
          ))}
        </ul>
      </section>
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
