'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { LanguageLocaleSelect } from '@/components/language-locale-select';

type Language = { code: string; name: string; nativeName?: string | null };
type LocalePack = { languageCode: string; bcp47: string | null };

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null; notes: string }>;
};

type FormatResult = {
  format: string;
  content: string;
  segmentCount: number;
  provider: string;
  note?: string;
};

const FORMATS = ['html', 'markdown', 'xml', 'csv', 'srt'] as const;

export function TranslateFormatsClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [locales, setLocales] = useState<LocalePack[]>([]);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('html');
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('ak');
  const [content, setContent] = useState('<p>Hello <strong>world</strong></p>');
  const [result, setResult] = useState<FormatResult | null>(null);
  const [streamLog, setStreamLog] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadEngine = useCallback(async () => {
    setEngine(await apiFetch<Engine>('/v1/translate/engine'));
  }, []);

  useEffect(() => {
    void loadEngine().catch((err: Error) => setError(err.message));
    void Promise.all([
      apiFetch<{ data: Language[] }>('/v1/languages'),
      apiFetch<{ data: LocalePack[] }>('/v1/locales').catch(() => ({ data: [] as LocalePack[] })),
    ])
      .then(([langRes, locRes]) => {
        setLanguages(langRes.data);
        setLocales(locRes.data);
      })
      .catch((err: Error) => setError(err.message));
  }, [loadEngine]);

  async function runFormat() {
    setError(null);
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setResult(
      await apiFetch<FormatResult>('/v1/translate/formats', {
        method: 'POST',
        token,
        body: JSON.stringify({ format, content, source, target }),
      }),
    );
  }

  async function runStream() {
    setError(null);
    setStreamLog('');
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/v1/translate/stream`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ text: content.replace(/<[^>]+>/g, ' '), source, target }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Stream failed (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let out = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const line = part.split('\n').find((l) => l.startsWith('data:'));
        if (!line) continue;
        const ev = JSON.parse(line.slice(5).trim()) as { event: string; text?: string; index?: number };
        if (ev.event === 'chunk' && ev.text) out += (out ? '\n\n' : '') + ev.text;
        if (ev.event === 'done' && ev.text) out = ev.text;
      }
      setStreamLog(out);
    }
  }

  return (
    <AppShell>
      <h1 style={h1}>Translate formats</h1>
      <p style={{ color: 'var(--muted)', maxWidth: '44rem', margin: '0 0 1.25rem' }}>
        {engine?.note ?? 'HTML, Markdown, XML, CSV, and SRT over the translation engine.'}{' '}
        <Link href="/translate">Plain text</Link> · <Link href="/documents">Documents</Link> ·{' '}
        <Link href="/localize">JSON/YAML</Link>
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {engine ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'grid', gap: '0.35rem' }}>
          {engine.capabilities
            .filter((c) => c.status !== 'deferred')
            .slice(0, 12)
            .map((c) => (
              <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.35rem', fontSize: '0.92rem' }}>
                <strong>{c.name}</strong>
                {c.api ? ` · ${c.api}` : ''}
              </li>
            ))}
        </ul>
      ) : null}

      <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem', marginBottom: '1rem' }}>
        <label className="vl-label">
          Format
          <select className="vl-field" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label className="vl-label" style={{ flex: 1 }}>
            Source
            <LanguageLocaleSelect value={source} onChange={setSource} languages={languages} locales={locales} className="vl-field" />
          </label>
          <label className="vl-label" style={{ flex: 1 }}>
            Target
            <LanguageLocaleSelect value={target} onChange={setTarget} languages={languages} locales={locales} className="vl-field" />
          </label>
        </div>
        <label className="vl-label">
          Content
          <textarea className="vl-field" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="vl-button" disabled={!isLoaded} onClick={() => void runFormat().catch((e: Error) => setError(e.message))}>
            Translate format
          </button>
          <button type="button" className="vl-button" disabled={!isLoaded} onClick={() => void runStream().catch((e: Error) => setError(e.message))}>
            Stream plain extract
          </button>
        </div>
      </div>

      {result ? (
        <section>
          <h2 style={h2}>
            Result · {result.format} · {result.segmentCount} segments · {result.provider}
          </h2>
          <pre style={pre}>{result.content}</pre>
          {result.note ? <p style={{ color: 'var(--muted)' }}>{result.note}</p> : null}
        </section>
      ) : null}

      {streamLog ? (
        <section style={{ marginTop: '1.25rem' }}>
          <h2 style={h2}>Stream</h2>
          <pre style={pre}>{streamLog}</pre>
        </section>
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

const h2: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  fontWeight: 650,
  margin: '0 0 0.5rem',
};

const pre: CSSProperties = {
  margin: 0,
  padding: '0.85rem 0',
  borderTop: '1px solid var(--line)',
  whiteSpace: 'pre-wrap',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.9rem',
};
