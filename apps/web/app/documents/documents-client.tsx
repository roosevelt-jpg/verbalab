'use client';

import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { LanguageLocaleSelect } from '@/components/language-locale-select';

type Language = { code: string; name: string; nativeName?: string | null };
type LocalePack = { languageCode: string; bcp47: string | null };
type Job = {
  id: string;
  status: string;
  result?: {
    outputDocumentId?: string;
    downloadPath?: string;
    preview?: string;
    characters?: number;
  } | null;
  error?: string | null;
};

export function DocumentsClient() {
  const [apiKey, setApiKey] = useState('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [locales, setLocales] = useState<LocalePack[]>([]);
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('ak');
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<Job | null>(null);
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
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setJob(null);
    if (!file) {
      setError('Choose a DOCX or PDF file');
      return;
    }
    if (!apiKey.startsWith('lg_live_')) {
      setError('Paste a lg_live_ API key');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('source', source);
      form.append('target', target);
      const createRes = await fetch(`${API_URL}/v1/documents/translate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      const created = (await createRes.json()) as Job & { error?: { message: string } };
      if (!createRes.ok) {
        throw new Error(created.error?.message ?? `Upload failed (${createRes.status})`);
      }
      setJob(created);

      let current: Job = created;
      for (let i = 0; i < 60; i++) {
        if (current.status === 'succeeded' || current.status === 'failed') break;
        await new Promise((r) => setTimeout(r, 400));
        current = await apiFetch<Job>(`/v1/jobs/${created.id}`, { token: apiKey });
        setJob(current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document translate failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Documents</h1>
      <p style={ledeStyle}>Upload DOCX or PDF. We extract text, translate in a job, and return a downloadable file.</p>

      <form onSubmit={onSubmit} className="vl-panel" style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1.5rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="vl-label">
            Source
            <LanguageLocaleSelect value={source} onChange={setSource} languages={languages} locales={locales} className="vl-field" />
          </label>
          <label className="vl-label">
            Target
            <LanguageLocaleSelect value={target} onChange={setTarget} languages={languages} locales={locales} className="vl-field" />
          </label>
        </div>
        <label className="vl-label">
          File
          <input
            className="vl-field"
            type="file"
            accept=".docx,.pdf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Working…' : 'Translate document'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      {job ? (
        <div className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.35rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Job <code className="vl-code">{job.id}</code> — {job.status}
          </p>
          {job.error ? <p style={{ color: 'var(--bad)' }}>{job.error}</p> : null}
          {job.result?.preview ? (
            <pre className="vl-code" style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
              {job.result.preview}
            </pre>
          ) : null}
          {job.status === 'succeeded' && job.result?.downloadPath ? (
            <a
              className="vl-btn"
              style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}
              href={`${API_URL}${job.result.downloadPath}`}
              onClick={(e) => {
                e.preventDefault();
                void fetch(`${API_URL}${job.result!.downloadPath}`, {
                  headers: { Authorization: `Bearer ${apiKey}` },
                })
                  .then(async (res) => {
                    if (!res.ok) throw new Error(`Download failed (${res.status})`);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'translated';
                    a.click();
                    URL.revokeObjectURL(url);
                  })
                  .catch((err: Error) => setError(err.message));
              }}
            >
              Download result
            </a>
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
