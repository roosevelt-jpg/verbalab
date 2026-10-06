'use client';

import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type KnowledgeDoc = {
  id: string;
  filename: string;
  status: string;
  chunkCount: number;
  error?: string | null;
};

type Citation = {
  index: number;
  filename: string;
  snippet: string;
  score: number;
};

type QueryResult = {
  answer: string;
  citations: Citation[];
  provider?: string | null;
};

export function KnowledgeClient() {
  const [apiKey, setApiKey] = useState('');
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refreshDocs(token: string) {
    const res = await apiFetch<{ data: KnowledgeDoc[] }>('/v1/knowledge/documents', { token });
    setDocs(res.data);
  }

  useEffect(() => {
    if (!apiKey.startsWith('vl_live_')) return;
    void refreshDocs(apiKey).catch(() => undefined);
  }, [apiKey]);

  async function onUpload(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError('Choose a DOCX, PDF, or TXT file');
      return;
    }
    if (!apiKey.startsWith('vl_live_')) {
      setError('Paste a vl_live_ API key');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/v1/knowledge/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      const body = (await res.json()) as KnowledgeDoc & { error?: { message: string } };
      if (!res.ok) throw new Error(body.error?.message ?? `Upload failed (${res.status})`);
      setFile(null);
      await refreshDocs(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function onAsk(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    if (!apiKey.startsWith('vl_live_')) {
      setError('Paste a vl_live_ API key');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<QueryResult>('/v1/knowledge/query', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({ question }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!apiKey.startsWith('vl_live_')) return;
    setError(null);
    try {
      await apiFetch(`/v1/knowledge/documents/${id}`, { method: 'DELETE', token: apiKey });
      await refreshDocs(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Knowledge</h1>
      <p style={ledeStyle}>Upload a few documents, then ask questions with cited passages (RAG + pgvector).</p>

      <label className="vl-label" style={{ display: 'block', marginTop: '1.5rem' }}>
        API key
        <input
          className="vl-field vl-code"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="vl_live_..."
        />
      </label>

      <form onSubmit={onUpload} className="vl-panel" style={{ marginTop: '1rem', padding: '1.25rem', display: 'grid', gap: '0.85rem' }}>
        <label className="vl-label">
          Upload document
          <input
            className="vl-field"
            type="file"
            accept=".txt,.pdf,.docx,text/plain,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button type="submit" disabled={loading} className="vl-btn vl-btn-primary" style={{ justifySelf: 'start' }}>
          {loading ? 'Working…' : 'Upload & embed'}
        </button>
      </form>

      {docs.length > 0 ? (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.65rem' }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="vl-panel"
              style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{doc.filename}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {doc.status} · {doc.chunkCount} chunks
                  {doc.error ? ` · ${doc.error}` : ''}
                </div>
              </div>
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void onDelete(doc.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', margin: '1.25rem 0 0' }}>
          No documents yet. Upload a TXT, PDF, or DOCX above to embed chunks, then ask questions against this workspace.
        </p>
      )}

      <form onSubmit={onAsk} className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.25rem', display: 'grid', gap: '0.85rem' }}>
        <label className="vl-label">
          Ask
          <input
            className="vl-field"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Where is VerbaLab HQ?"
            required
          />
        </label>
        <button type="submit" disabled={loading} className="vl-btn vl-btn-primary" style={{ justifySelf: 'start' }}>
          {loading ? 'Searching…' : 'Ask knowledge base'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {result ? (
        <div className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--bg-soft)', border: 'none' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Answer{result.provider ? ` · ${result.provider}` : ''}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{result.answer}</div>
          {result.citations.length > 0 ? (
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.55rem' }}>
              {result.citations.map((c) => (
                <div key={`${c.index}-${c.filename}`} style={{ fontSize: '0.9rem' }}>
                  <strong>[{c.index}]</strong> {c.filename} · score {c.score}
                  <div style={{ color: 'var(--muted)', marginTop: '0.2rem' }}>{c.snippet}</div>
                </div>
              ))}
            </div>
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

const ledeStyle: CSSProperties = { color: 'var(--muted)', margin: '0.5rem 0 0' };
