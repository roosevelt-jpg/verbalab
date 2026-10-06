'use client';

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';
import {
  ActivityBoard,
  HeatList,
  PipelineStrip,
  StatusRing,
  LivePulse,
} from '@/components/stats/activity-visuals';
import '@/components/stats/stat-charts.css';

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
  const searchParams = useSearchParams();
  const catalog = useLocaleCatalog();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [source, setSource] = useState(() => searchParams.get('source') || DEFAULT_SOURCE);
  const [target, setTarget] = useState(() => searchParams.get('target') || DEFAULT_TARGET);
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [characters, setCharacters] = useState<number | null>(null);
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiFetch<Engine>('/v1/translate/engine')
      .then((eng) => setEngine(eng))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (catalog.loading) return;
    if (catalog.languages.some((l) => l.code === 'ak')) {
      setTarget((prev) => (prev === DEFAULT_TARGET || prev === 'ak' ? 'ak' : prev));
    }
    if (!catalog.languages.length) {
      setError('No languages in the registry yet. Check /v1/languages.');
    }
  }, [catalog.loading, catalog.languages]);

  const targetHint = useMemo(() => {
    if (target.includes('-') || target.includes('_')) return `Locale ${target}`;
    const pack = catalog.locales.find((l) => l.languageCode === target);
    if (pack?.bcp47) return `Locale ${pack.bcp47}`;
    return null;
  }, [catalog.locales, target]);

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
      <p className="lg-workspace-kicker">Language Intelligence</p>
      <h1 style={titleStyle}>Translate</h1>
      <p style={ledeStyle}>
        Default pair is English → Twi (Akan, Ghana / <code className="vl-code">ak</code> ·{' '}\n        <code className="vl-code">ak-GH</code>). Pick any language or BCP-47 locale from the dropdowns —
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
                {c.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ActivityBoard kicker="Translate overview" title="Baobab path & locale coverage">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'start' }}>
          <PipelineStrip
            title="Live translate path"
            stages={[
              { id: 'source', label: 'Source', state: text.trim() ? 'ready' : 'idle' },
              {
                id: 'detect',
                label: 'Detect',
                state: detectedSource ? 'ready' : source === 'auto' ? 'active' : 'idle',
              },
              { id: 'mt', label: 'Baobab', state: loading ? 'active' : result ? 'ready' : 'idle' },
              { id: 'out', label: 'Output', state: result ? 'ready' : error ? 'error' : 'idle' },
            ]}
          />
          <LivePulse label={loading ? 'Translating' : catalog.loading ? 'Loading catalog' : 'Ready'} />
        </div>
        <div className="lg-studio-overview">
          <StatusRing
            status={catalog.loading ? 'idle' : catalog.languages.length ? 'ok' : 'bad'}
            label="Language catalog"
            detail={
              catalog.loading
                ? 'Loading…'
                : `${catalog.languages.length} languages · ${catalog.locales.length} locale packs`
            }
          />
          <StatusRing
            status={engine ? 'ok' : 'idle'}
            label="Engine"
            detail={engine?.product ?? 'Waiting for engine metadata'}
          />
          <StatusRing
            status={result ? 'ok' : loading ? 'warn' : 'idle'}
            label="Last job"
            detail={
              characters != null
                ? `${characters.toLocaleString()} characters`
                : loading
                  ? 'In flight'
                  : 'No result yet'
            }
          />
        </div>
        <HeatList
          title="Locale coverage (catalog heat)"
          empty="No languages loaded"
          items={catalog.languages.slice(0, 10).map((l, i) => ({
            id: l.code,
            label: `${l.code} · ${l.name}`,
            value: Math.max(1, 14 - i),
            hint: l.nativeName || l.code,
          }))}
        />
      </ActivityBoard>

      {catalog.loading ? (
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
            <LocaleSelect
              value={source}
              onChange={setSource}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
              allowAuto
              className="vl-field"
            />
          </label>
          <label className="vl-label">
            Target
            {targetHint ? (
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {targetHint}</span>
            ) : null}
            <LocaleSelect
              value={target}
              onChange={setTarget}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
              className="vl-field"
            />
          </label>
        </div>
        {!catalog.loading && catalog.languages.length === 0 ? (
          <p style={{ color: 'var(--bad)', margin: 0 }}>Language registry is empty.</p>
        ) : null}
        <label className="vl-label">
          Text
          <textarea className="vl-field" rows={6} value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        <button type="submit" className="vl-btn" disabled={loading || catalog.loading || catalog.languages.length === 0}>
          {loading ? 'Translating…' : 'Translate'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}
      {result ? (
        <div className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.2rem' }}>
          <div style={{ fontWeight: 650, marginBottom: '0.5rem' }}>Result</div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result}</p>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {characters != null ? `${characters} characters` : null}
            {detectedSource ? ` · detected ${detectedSource}` : null}
          </p>
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

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0.5rem 0 0',
  lineHeight: 1.55,
};
