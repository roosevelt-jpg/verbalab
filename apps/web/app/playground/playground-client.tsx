'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';

type Language = { code: string; name: string };
type Mode = 'translate' | 'detect' | 'languages';

function isApiKey(value: string) {
  return value.startsWith('vl_live_') || value.startsWith('vl_test_');
}

export function PlaygroundClient() {
  const [mode, setMode] = useState<Mode>('translate');
  const [apiKey, setApiKey] = useState('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('sw');
  const [text, setText] = useState('Hello, world');
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => setLanguages(res.data))
      .catch(() => undefined);
  }, []);

  const curl =
    mode === 'languages'
      ? `curl "${API_URL}/v1/languages"`
      : mode === 'detect'
        ? `curl -X POST "${API_URL}/v1/detect" \\
  -H "Authorization: Bearer ${apiKey || 'vl_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":${JSON.stringify(text)}}'`
        : `curl -X POST "${API_URL}/v1/translate" \\
  -H "Authorization: Bearer ${apiKey || 'vl_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":${JSON.stringify(text)},"source":"${source}","target":"${target}"}'`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setResponse('');
    try {
      if (mode === 'languages') {
        const res = await apiFetch<unknown>('/v1/languages');
        setResponse(JSON.stringify(res, null, 2));
        return;
      }
      if (!isApiKey(apiKey)) {
        throw new Error('Paste a vl_live_ or vl_test_ API key from the console');
      }
      if (mode === 'detect') {
        const res = await apiFetch<unknown>('/v1/detect', {
          method: 'POST',
          token: apiKey,
          body: JSON.stringify({ text }),
        });
        setResponse(JSON.stringify(res, null, 2));
        return;
      }
      const res = await apiFetch<unknown>('/v1/translate', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({ text, source, target }),
      });
      setResponse(JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vl-api-public vl-fade-up">
      <PublicHeader />
      <p className="vl-tag" style={{ margin: '1.35rem 0 0' }}>
        Lugemi API
      </p>
      <h1 style={{ margin: '0.55rem 0 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem', color: 'var(--brand-navy)' }}>
        API playground
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', maxWidth: '38rem', lineHeight: 1.6 }}>
        Try translate, detect, and languages against the Lugemi API. No Clerk session required for API-key calls.
      </p>

      <div className="vl-player-bar" style={{ marginTop: '1.25rem' }}>
        {(['translate', 'detect', 'languages'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`vl-mode-tab${mode === m ? ' is-active' : ''}`}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="vl-panel" style={{ marginTop: '1rem', padding: '1.35rem', display: 'grid', gap: '1rem' }}>
        <div style={{ marginBottom: '-0.25rem' }}>
          <span className="vl-endpoint-method">
            {mode === 'languages' ? 'GET' : 'POST'}
          </span>
          <span className="vl-endpoint-path">
            {mode === 'languages' ? '/v1/languages' : mode === 'detect' ? '/v1/detect' : '/v1/translate'}
          </span>
        </div>

        {mode !== 'languages' ? (
          <label className="vl-label">
            API key
            <input
              className="vl-field vl-code"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="vl_live_... or vl_test_..."
              required
            />
          </label>
        ) : null}

        {mode === 'translate' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="vl-label">
              Source
              <select className="vl-field" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="auto">Auto-detect</option>
                {(languages.length ? languages : [{ code: 'en', name: 'English' }, { code: 'sw', name: 'Swahili' }]).map(
                  (lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="vl-label">
              Target
              <select className="vl-field" value={target} onChange={(e) => setTarget(e.target.value)}>
                {(languages.length ? languages : [{ code: 'en', name: 'English' }, { code: 'sw', name: 'Swahili' }]).map(
                  (lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
        ) : null}

        {mode !== 'languages' ? (
          <label className="vl-label">
            Text
            <textarea className="vl-field" rows={5} value={text} onChange={(e) => setText(e.target.value)} required />
          </label>
        ) : (
          <p style={{ margin: 0, color: 'var(--muted)' }}>Public language registry — no API key required.</p>
        )}

        <div className="vl-player-bar" style={{ border: 'none', padding: 0, background: 'transparent' }}>
          <button type="submit" className="vl-btn vl-btn-primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </form>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.25rem' }}>
        <CodePanel code={curl} label="cURL" />
        {response ? <CodePanel code={response} label="Response" /> : null}
      </div>
    </div>
  );
}

function PublicHeader() {
  return (
    <div className="vl-api-public-header">
      <BrandMark href="/" />
      <div className="vl-api-public-links">
        <Link href="/docs">Docs</Link>
        <Link href="/developers">Developers</Link>
        <Link href="/dashboard" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none', padding: '0.45rem 0.9rem', minHeight: 40 }}>
          Console
        </Link>
      </div>
    </div>
  );
}
