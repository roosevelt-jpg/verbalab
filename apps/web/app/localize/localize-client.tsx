'use client';

import { FormEvent, useState, type CSSProperties } from 'react';
import { API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

export function LocalizeClient() {
  const [apiKey, setApiKey] = useState('');
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('sw');
  const [format, setFormat] = useState<'json' | 'yaml'>('json');
  const [input, setInput] = useState('{\n  "app": {\n    "title": "Welcome"\n  }\n}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setOutput('');
    if (!apiKey.startsWith('lg_live_')) {
      setError('Paste a lg_live_ API key');
      return;
    }
    setLoading(true);
    try {
      let content: unknown = input;
      if (format === 'json') {
        content = JSON.parse(input) as unknown;
      }
      const res = await fetch(`${API_URL}/v1/localize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format, source, target, content }),
      });
      const body = (await res.json()) as {
        serialized?: string;
        error?: { message: string };
      };
      if (!res.ok) throw new Error(body.error?.message ?? `Localize failed (${res.status})`);
      setOutput(body.serialized ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Localize failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Localize</h1>
      <p style={ledeStyle}>Translate JSON/YAML i18n files with keys preserved and ICU placeholders left intact.</p>

      <form
        onSubmit={onSubmit}
        className="vl-panel"
        style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1.5rem' }}
      >
        <label className="vl-label">
          API key
          <input
            className="vl-field vl-code"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="lg_live_..."
            required
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="vl-label">
            Format
            <select className="vl-field" value={format} onChange={(e) => setFormat(e.target.value as 'json' | 'yaml')}>
              <option value="json">json</option>
              <option value="yaml">yaml</option>
            </select>
          </label>
          <label className="vl-label">
            Source
            <input className="vl-field" value={source} onChange={(e) => setSource(e.target.value)} />
          </label>
          <label className="vl-label">
            Target
            <input className="vl-field" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
        </div>
        <label className="vl-label">
          Content
          <textarea className="vl-field vl-code" rows={10} value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Translating…' : 'Localize'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}
      {output ? (
        <pre className="vl-code" style={{ marginTop: '1.25rem', whiteSpace: 'pre-wrap', padding: '1rem' }}>
          {output}
        </pre>
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
