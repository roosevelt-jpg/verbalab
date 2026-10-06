'use client';

import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type DialectRow = {
  code: string;
  languageCode: string;
  nameEn: string;
  region: string | null;
  cueTerms: string[];
};

type DetectResult = {
  language: string;
  dialect: string | null;
  dialectName: string | null;
  confidence: number;
  provider: string;
  candidates: { code: string; nameEn: string; score: number; matchedCues: string[] }[];
  note: string;
};

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string }>;
};

export function DialectsClient() {
  const { getToken, isLoaded } = useAuth();
  const [dialects, setDialects] = useState<DialectRow[]>([]);
  const [registryQuery, setRegistryQuery] = useState('');
  const [engine, setEngine] = useState<Engine | null>(null);
  const [text, setText] = useState('Sasa bro, uko aje? Poa sana.');
  const [language, setLanguage] = useState('');
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const attempt = async () => {
      const [res, eng] = await Promise.all([
        apiFetch<{ data: DialectRow[] }>('/v1/dialects'),
        apiFetch<Engine>('/v1/dialects/engine').catch(() => null),
      ]);
      setDialects(res.data);
      if (eng) setEngine(eng);
    };
    try {
      await attempt();
    } catch (first) {
      // Nest --watch restarts briefly drop :3001; one retry recovers Studio registry load.
      await new Promise((r) => setTimeout(r, 600));
      try {
        await attempt();
      } catch {
        throw first instanceof Error ? first : new Error(String(first));
      }
    }
  }, []);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  const filteredDialects = useMemo(() => {
    const q = registryQuery.trim().toLowerCase();
    if (!q) return dialects;
    return dialects.filter((d) => {
      const hay = [d.code, d.nameEn, d.languageCode, d.region ?? ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [dialects, registryQuery]);

  async function onDetect(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body: { text: string; language?: string } = { text };
      if (language.trim()) body.language = language.trim();
      const res = await apiFetch<DetectResult>('/v1/dialects/detect', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
      setResult(res);
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
        {engine?.product ?? 'Dialect detection'}
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '40rem' }}>
        {engine?.note ??
          'Full language/locale dialect registry with lexical cue scoring — not speech accent detection or acoustic phonetics.'}
      </p>

      {!isLoaded ? <p style={{ color: 'var(--muted)' }}>Loading auth…</p> : null}

      <form onSubmit={onDetect} style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.75rem' }}>
        <label className="vl-label">
          Text
          <textarea className="vl-field" rows={4} value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        <label className="vl-label">
          Language hint (optional)
          <input
            className="vl-field"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. sw — leave blank to auto-detect"
          />
        </label>
        <button type="submit" className="vl-btn vl-btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>
          {busy ? 'Detecting…' : 'Detect dialect'}
        </button>
      </form>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {result ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={label}>Result</h2>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Language {result.language} · Dialect {result.dialectName ?? 'none'} ({result.dialect ?? '—'}) ·{' '}
            {(result.confidence * 100).toFixed(0)}% · {result.provider}
          </p>
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
        <h2 style={label}>
          Registry ({filteredDialects.length}
          {registryQuery.trim() ? ` of ${dialects.length}` : ''})
        </h2>
        <label className="vl-label" style={{ marginBottom: '0.85rem', display: 'grid' }}>
          Search registry
          <input
            className="vl-field"
            value={registryQuery}
            onChange={(e) => setRegistryQuery(e.target.value)}
            placeholder="Filter by code, name, language, country…"
          />
        </label>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
          {filteredDialects.map((d) => (
            <li key={d.code} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
              <strong>{d.code}</strong> · {d.nameEn} · {d.languageCode}
              {d.region ? ` · ${d.region}` : ''}
            </li>
          ))}
        </ul>
        {filteredDialects.length === 0 ? (
          <p style={{ color: 'var(--muted)', marginTop: '0.75rem' }}>No dialects match that search.</p>
        ) : null}
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
