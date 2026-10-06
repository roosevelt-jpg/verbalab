'use client';

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { LanguageLocaleSelect } from '@/components/language-locale-select';

type Language = { code: string; name: string; nativeName?: string | null; tier: string };
type LocalePack = { languageCode: string; bcp47: string | null };
type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null; notes: string }>;
};

/** Default Translation Panel pair: English → Twi (Akan / Ghana). */
const DEFAULT_SOURCE = 'en';
const DEFAULT_TARGET = 'ak';

export function TranslateClient() {
  const { getToken, isLoaded } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [locales, setLocales] = useState<LocalePack[]>([]);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [characters, setCharacters] = useState<number | null>(null);
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCatalogLoading(true);
    void Promise.all([
      apiFetch<{ data: Language[] }>('/v1/languages'),
      apiFetch<{ data: LocalePack[] }>('/v1/locales').catch(() => ({ data: [] as LocalePack[] })),
      apiFetch<Engine>('/v1/translate/engine').catch(() => null),
    ])
      .then(([langRes, locRes, eng]) => {
        setLanguages(langRes.data);
        setLocales(locRes.data);
        if (eng) setEngine(eng);
        const hasAk = langRes.data.some((l) => l.code === 'ak');
        if (hasAk) setTarget('ak');
        if (!langRes.data.length) {
          setError('No languages in the registry yet. Check /v1/languages.');
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setCatalogLoading(false));
  }, []);

  const targetHint = useMemo(() => {
    if (target.includes('-') || target.includes('_')) return `Locale ${target}`;
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
        Default pair is English → Twi (Akan, Ghana / <code className="vl-code">ak</code> ·{' '}
        <code className="vl-code">ak-GH</code>). Pick any language or BCP-47 locale from the dropdowns —
        Lugemi Language Intelligence infrastructure, not a generic vendor panel.
      </p>
      <p style={{ margin: '0.65rem 0 0', fontSize: '0.9rem' }}>
        <Link href="/models">Lugemi models</Link>
        {' · '}
        <Link href="/locales">Locale packs</Link>
        {' · '}
        <Link href="/docs">API docs</Link>
        {' · '}
        <Link href="/translate/formats">Formats</Link>
      </p>

      {engine ? (
        <div className="vl-panel" style={{ marginTop: '1.15rem', padding: '0.9rem 1.1rem' }}>
          <div style={{ fontWeight: 650, color: 'var(--brand-navy)' }}>{engine.product}</div>
          <p style={{ margin: '0.35rem 0 0.65rem', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.45 }}>
            {engine.note}
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
            }}
          >
            {engine.capabilities.slice(0, 8).map((c) => (
              <li key={c.id} className="vl-tag" style={{ opacity: c.status === 'deferred' ? 0.55 : 1 }}>
                {c.name} · {c.status}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {catalogLoading ? (
        <p style={{ color: 'var(--muted)', marginTop: '1.25rem' }}>Loading languages and locales…</p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="vl-panel"
        style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1.5rem' }}
      >
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
            Target
            {targetHint ? (
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {targetHint}</span>
            ) : null}
            <LanguageLocaleSelect
              value={target}
              onChange={setTarget}
              languages={languages}
              locales={locales}
              className="vl-field"
            />
          </label>
        </div>
        {!catalogLoading && languages.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            No languages available. Retry after the API finishes seeding.
          </p>
        ) : null}
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
          disabled={loading || catalogLoading || languages.length === 0}
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
