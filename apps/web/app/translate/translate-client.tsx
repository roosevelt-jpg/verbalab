'use client';

import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Language = { code: string; name: string; tier: string };

export function TranslateClient() {
  const { getToken, isLoaded } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('sw');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [characters, setCharacters] = useState<number | null>(null);
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => setLanguages(res.data))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{
        text: string;
        characters: number;
        source: string;
        detection?: { language: string; confidence: number; provider: string } | null;
      }>('/v1/translate', {
        method: 'POST',
        token,
        body: JSON.stringify({ text, source, target }),
      });
      setResult(res.text);
      setCharacters(res.characters);
      setDetectedSource(source === 'auto' ? res.source : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translate failed');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <AppShell>
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Translate</h1>
      <p style={ledeStyle}>Paste text, pick a pair, get a metered translation.</p>

      <form onSubmit={onSubmit} className="vl-panel" style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="vl-label">
            Source
            <select value={source} onChange={(e) => setSource(e.target.value)} className="vl-field">
              <option value="auto">Auto-detect</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </label>
          <label className="vl-label">
            Target
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="vl-field">
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </label>
        </div>
        <textarea
          data-testid="translate-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder="Enter text to translate"
          className="vl-field"
          style={{ resize: 'vertical' }}
          required
        />
        <button
          type="submit"
          data-testid="translate-submit"
          disabled={loading}
          className="vl-btn vl-btn-primary"
          style={{ justifySelf: 'start' }}
        >
          {loading ? 'Translating…' : 'Translate'}
        </button>
      </form>

      {error ? (
        <p data-testid="translate-error" style={{ color: 'var(--bad)' }}>
          {error}
        </p>
      ) : null}
      {result ? (
        <div
          data-testid="translate-result"
          className="vl-panel"
          style={{ marginTop: '1.25rem', padding: '1.2rem', background: 'var(--bg-soft)', border: 'none' }}
        >
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.55rem' }}>
            Result {characters != null ? `· ${characters} characters` : ''}
            {detectedSource ? ` · detected ${detectedSource}` : ''}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: '1.05rem' }}>{result}</div>
        </div>
      ) : null}
    </AppShell>
  );
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.03em',
  fontSize: '2rem',
};

const ledeStyle: CSSProperties = { color: 'var(--muted)', margin: '0.5rem 0 0' };
