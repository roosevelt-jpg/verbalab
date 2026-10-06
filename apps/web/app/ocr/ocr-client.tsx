'use client';

import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Language = { code: string; name: string };
type OcrResult = {
  text: string;
  pages: number;
  provider: string;
  characters: number;
  translatedText: string | null;
  translateProvider: string | null;
};

export function OcrClient {
  const [apiKey, setApiKey] = useState('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [languageHint, setLanguageHint] = useState('');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect( => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => setLanguages(res.data))
      .catch( => undefined);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault;
    setError(null);
    setResult(null);
    if (!file) {
      setError('Choose an image');
      return;
    }
    if (!apiKey.startsWith('lg_live_')) {
      setError('Paste a lg_live_ API key');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData;
      form.append('file', file);
      if (languageHint) form.append('languageHint', languageHint);
      if (source) form.append('source', source);
      if (target) form.append('target', target);
      const res = await fetch(`${API_URL}/v1/ocr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      const body = (await res.json) as OcrResult & { error?: { message: string } };
      if (!res.ok) {
        throw new Error(body.error?.message ?? `OCR failed (${res.status})`);
      }
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>OCR</h1>
      <p style={ledeStyle}>
        Extract text from scanned images (Google Vision). Optionally translate with the same request.
      </p>

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
        <label className="vl-label">
          Image
          <input
            className="vl-field"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        <label className="vl-label">
          Language hint (optional)
          <input
            className="vl-field"
            value={languageHint}
            onChange={(e) => setLanguageHint(e.target.value)}
            placeholder="sw"
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="vl-label">
            Translate from (optional)
            <select className="vl-field" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">—</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </label>
          <label className="vl-label">
            Translate to (optional)
            <select className="vl-field" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">—</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Extracting…' : 'Run OCR'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      {result ? (
        <div className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.35rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            {result.provider} · {result.pages} page(s) · {result.characters} chars
          </p>
          <pre className="vl-code" style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
            {result.text || '(no text detected)'}
          </pre>
          {result.translatedText ? (
            <>
              <p style={{ color: 'var(--muted)', marginTop: '1rem', marginBottom: 0 }}>
                Translated ({result.translateProvider})
              </p>
              <pre className="vl-code" style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                {result.translatedText}
              </pre>
            </>
          ) : null}
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
