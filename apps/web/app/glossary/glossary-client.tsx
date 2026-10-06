'use client';

import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Language = { code: string; name: string };
type Term = {
  id: string;
  sourceLang: string;
  targetLang: string;
  sourceTerm: string;
  targetTerm: string;
  caseSensitive: boolean;
  wholeWord: boolean;
};

type VerticalPack = {
  id: string;
  vertical: string;
  title: string;
  description: string;
  sourceLang: string;
  targetLang: string;
  termCount: number;
  preview: Array<{ sourceTerm: string; targetTerm: string }>;
  installed: boolean;
};

export function GlossaryClient() {
  const { getToken, isLoaded } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [packs, setPacks] = useState<VerticalPack[]>([]);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('sw');
  const [sourceTerm, setSourceTerm] = useState('');
  const [targetTerm, setTargetTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadTerms(token: string) {
    const data = await apiFetch<Term[]>('/v1/glossary/terms', { token });
    setTerms(data);
  }

  async function loadPacks(token: string) {
    setPacks(await apiFetch<VerticalPack[]>('/v1/vertical-glossaries', { token }));
  }

  useEffect(() => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => setLanguages(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Not signed in');
        await Promise.all([loadTerms(token), loadPacks(token)]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load glossary');
      }
    })();
  }, [getToken, isLoaded]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/glossary/terms', {
        method: 'POST',
        token,
        body: JSON.stringify({ sourceLang, targetLang, sourceTerm, targetTerm }),
      });
      setSourceTerm('');
      setTargetTerm('');
      await loadTerms(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/glossary/terms/${id}`, { method: 'DELETE', token });
      await loadTerms(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function installPack(id: string) {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const result = await apiFetch<{ termsInstalled: number }>(
        `/v1/vertical-glossaries/${id}/install`,
        { method: 'POST', token },
      );
      setMessage(`Installed ${result.termsInstalled} starter terms into this workspace.`);
      await Promise.all([loadTerms(token), loadPacks(token)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Install failed (Pro plan required)');
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
      <h1 style={titleStyle}>Glossary</h1>
      <p style={ledeStyle}>
        Lock preferred terminology per language pair. Terms are applied automatically on translate.
        Starter vertical packs (public sector, healthcare, banking) can be installed on Pro.
      </p>

      <section style={{ marginTop: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: '0 0 0.75rem' }}>
          Starter packs
        </h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="vl-panel"
              style={{ padding: '1rem 1.2rem', display: 'grid', gap: '0.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>{pack.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {pack.termCount} terms · {pack.sourceLang}→{pack.targetLang} · {pack.vertical}
                  </div>
                </div>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={loading || pack.installed}
                  onClick={() => void installPack(pack.id)}
                >
                  {pack.installed ? 'Installed' : 'Install (Pro)'}
                </button>
              </div>
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>{pack.description}</p>
              <div style={{ color: '#555', fontSize: '0.85rem' }}>
                Preview:{' '}
                {pack.preview
                  .slice(0, 6)
                  .map((t) => `${t.sourceTerm}→${t.targetTerm}`)
                  .join(' · ')}
                {pack.termCount > 6 ? ' …' : ''}
              </div>
            </div>
          ))}
        </div>
      </section>

      <form
        onSubmit={onCreate}
        className="vl-panel"
        style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1.75rem' }}
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
            Source term
            <input className="vl-field" value={sourceTerm} onChange={(e) => setSourceTerm(e.target.value)} required />
          </label>
          <label className="vl-label">
            Target term
            <input className="vl-field" value={targetTerm} onChange={(e) => setTargetTerm(e.target.value)} required />
          </label>
        </div>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Saving…' : 'Add term'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--good, #0a7a3e)', marginTop: '1rem' }}>{message}</p> : null}

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
        {terms.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No terms yet.</p>
        ) : (
          terms.map((term) => (
            <div
              key={term.id}
              className="vl-panel"
              style={{
                padding: '1rem 1.2rem',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>
                  {term.sourceTerm} → {term.targetTerm}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {term.sourceLang} → {term.targetLang}
                </div>
              </div>
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void onDelete(term.id)}>
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
