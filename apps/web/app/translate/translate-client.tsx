'use client';

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { LanguageLocaleSelect } from '@/components/language-locale-select';

type Language = { code: string; name: string; nativeName?: string | null; tier: string };
type LocalePack = { languageCode: string; bcp47: string | null };

/** Default Translation Panel pair: English → Twi (Akan / Ghana). */
const DEFAULT_SOURCE = 'en';
const DEFAULT_TARGET = 'ak';

export function TranslateClient() {
  const { getToken, isLoaded } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [locales, setLocales] = useState<LocalePack[]>([]);
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [characters, setCharacters] = useState<number | null>(null);
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      apiFetch<{ data: Language[] }>('/v1/languages'),
      apiFetch<{ data: LocalePack[] }>('/v1/locales').catch(() => ({ data: [] as LocalePack[] })),
    ])
      .then(([langRes, locRes]) => {
        setLanguages(langRes.data);
        setLocales(locRes.data);
        const hasAk = langRes.data.some((l) => l.code === 'ak');
        if (hasAk) setTarget('ak');
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const targetHint = useMemo(() => {
    const pack = locales.find((l) => l.languageCode === target);
    if (pack?.bcp47) return `Locale ${pack.bcp47}`;
    return null;
  }, [locales, target]);

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
      <p style={ledeStyle}>
        Default pair is English → Twi (Akan, Ghana). Pick any supported language or locale code from the
        dropdowns — Lugemi Language Intelligence, not a generic vendor panel.
      </p>

      <form onSubmit={onSubmit} className="vl-panel" style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="vl-label">
            Source
            <LanguageLocaleSelect
              value={source}
              onChange={setSource}
              languages={languages}
              locales={locales}
              allowAuto
              className="vl-field"
            />
          </label>
          <label className="vl-label">
            Target{targetHint ? <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {targetHint}</span> : null}
            <LanguageLocaleSelect
              value={target}
              onChange={setTarget}
              languages={languages}
              locales={locales}
              className="vl-field"
            />
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
          style={{ marginTop: '1.25rem', padding: '1.1rem 1.25rem' }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
            Result
            {characters != null ? ` · ${characters} characters` : ''}
            {detectedSource ? ` · detected ${detectedSource}` : ''}
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{result}</p>
        </div>
      ) : null}
    </AppShell>
  );
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '1.85rem',
  fontWeight: 720,
  letterSpacing: '-0.03em',
  color: 'var(--brand-navy)',
};

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0.45rem 0 0',
  maxWidth: '42rem',
  lineHeight: 1.55,
};
