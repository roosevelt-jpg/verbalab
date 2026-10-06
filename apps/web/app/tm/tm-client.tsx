'use client';

import { FormEvent, useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Language = { code: string; name: string };
type Entry = {
  id: string;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  targetText: string;
  hitCount: number;
  scope?: string;
  projectKey?: string;
  version?: number;
};

type Overview = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null }>;
};

type SearchHit = {
  id: string;
  sourceText: string;
  targetText: string;
  score: number;
  scope: string;
  version: number;
};

export function TmClient() {
  const { getToken, isLoaded } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('sw');
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [scope, setScope] = useState('workspace');
  const [projectKey, setProjectKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(token: string) {
    const data = await apiFetch<Entry[]>('/v1/tm/entries', { token });
    setEntries(data);
  }

  const loadCatalog = useCallback(async () => {
    setOverview(await apiFetch<Overview>('/v1/tm'));
  }, []);

  useEffect(() => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => setLanguages(res.data))
      .catch(() => undefined);
    void loadCatalog().catch(() => undefined);
  }, [loadCatalog]);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Not signed in');
        await load(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load TM');
      }
    })();
  }, [getToken, isLoaded]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/tm/entries', {
        method: 'POST',
        token,
        body: JSON.stringify({
          sourceLang,
          targetLang,
          sourceText,
          targetText,
          scope,
          ...(scope === 'project' ? { projectKey } : {}),
        }),
      });
      setSourceText('');
      setTargetText('');
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/tm/entries/${id}`, { method: 'DELETE', token });
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ results: SearchHit[] }>('/v1/tm/search', {
        method: 'POST',
        token,
        body: JSON.stringify({
          text: searchQuery,
          sourceLang,
          targetLang,
          mode: 'lexical',
          ...(scope === 'project' && projectKey ? { projectKey } : {}),
        }),
      });
      setSearchHits(res.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
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
      <h1 style={titleStyle}>Enterprise Translation Memory</h1>
      <p style={ledeStyle}>
        {overview?.note ??
          'Scoped TM with exact reuse on translate, lexical similarity search, and versioning.'}
      </p>

      {overview ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0', display: 'grid', gap: '0.25rem' }}>
          {overview.capabilities.slice(0, 6).map((c) => (
            <li key={c.id} style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              {c.name}
            </li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={onSave}
        className="vl-panel"
        style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1.5rem' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="vl-label">
            Source lang
            <select className="vl-field" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.code}
                </option>
              ))}
            </select>
          </label>
          <label className="vl-label">
            Target lang
            <select className="vl-field" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.code}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="vl-label">
            Scope
            <select className="vl-field" value={scope} onChange={(e) => setScope(e.target.value)}>
              {['workspace', 'enterprise', 'shared', 'project'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {scope === 'project' ? (
            <label className="vl-label">
              Project key
              <input
                className="vl-field"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                required
              />
            </label>
          ) : (
            <div />
          )}
        </div>
        <label className="vl-label">
          Source text
          <textarea
            className="vl-field"
            rows={3}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            required
          />
        </label>
        <label className="vl-label">
          Approved translation
          <textarea
            className="vl-field"
            rows={3}
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Saving…' : 'Save approved segment'}
        </button>
      </form>

      <form
        onSubmit={onSearch}
        className="vl-panel"
        style={{ display: 'grid', gap: '0.75rem', padding: '1.35rem', marginTop: '1.25rem' }}
      >
        <label className="vl-label">
          Similarity search
          <input
            className="vl-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find similar source segments"
            required
          />
        </label>
        <button type="submit" className="vl-btn vl-btn-secondary">
          Search TM
        </button>
        {searchHits.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
            {searchHits.map((hit) => (
              <li key={hit.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.5rem' }}>
                <strong>{hit.score.toFixed(2)}</strong> · {hit.scope} v{hit.version}
                <div>{hit.sourceText}</div>
                <div style={{ color: 'var(--muted)' }}>{hit.targetText}</div>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
        {entries.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No TM entries yet.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="vl-panel"
              style={{
                padding: '1rem 1.2rem',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>{entry.sourceText}</div>
                <div style={{ marginTop: '0.35rem' }}>{entry.targetText}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  {entry.sourceLang} → {entry.targetLang} · {entry.scope ?? 'workspace'} · v
                  {entry.version ?? 1} · hits {entry.hitCount}
                </div>
              </div>
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void onDelete(entry.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
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
