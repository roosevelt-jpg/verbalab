'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Overview = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null; notes: string }>;
};

type SuggestResult = {
  grammarCorrected: string;
  styleRewritten: string;
  styleProfile: string;
  styleDisclaimer?: string | null;
  suggestionCount: number;
  note: string;
};

export function GrammarIntelligenceClient {
  const { getToken, isLoaded } = useAuth;
  const [overview, setOverview] = useState<Overview | null>(null);
  const [text, setText] = useState('teh goverment is gonna writting a report');
  const [profile, setProfile] = useState('professional');
  const [result, setResult] = useState<SuggestResult | null>(null);
  const [spell, setSpell] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    setOverview(await apiFetch<Overview>('/v1/grammar/intelligence'));
  }, []);

  useEffect( => {
    void load.catch((err: Error) => setError(err.message));
  }, [load]);

  async function runSuggest {
    setError(null);
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    setResult(
      await apiFetch<SuggestResult>('/v1/grammar/suggest', {
        method: 'POST',
        token,
        body: JSON.stringify({ text, styleProfile: profile }),
      }),
    );
  }

  async function runSpell {
    setError(null);
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const res = await apiFetch<{ corrected: string; issueCount: number }>('/v1/grammar/spell', {
      method: 'POST',
      token,
      body: JSON.stringify({ text }),
    });
    setSpell(`${res.corrected} (${res.issueCount} issues)`);
  }

  return (
    <AppShell>
      <h1 style={h1}>Grammar Intelligence</h1>
      <p style={{ color: 'var(--muted)', maxWidth: '44rem', margin: '0 0 1.25rem' }}>
        {overview?.note ?? 'Grammar, spell, and style assist.'}{' '}
        <Link href="/grammar">Grammar</Link> · <Link href="/style">Style</Link>
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {overview ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'grid', gap: '0.35rem' }}>
          {overview.capabilities.map((c) => (
            <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.35rem', fontSize: '0.92rem' }}>
              <strong>{c.name}</strong> · {c.status}
              {c.api ? ` · ${c.api}` : ''}
            </li>
          ))}
        </ul>
      ) : null}

      <label className="vl-label" style={{ display: 'grid', marginBottom: '0.75rem' }}>
        Text
        <textarea className="vl-field" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label className="vl-label" style={{ display: 'grid', maxWidth: '16rem', marginBottom: '0.75rem' }}>
        Style profile
        <select className="vl-field" value={profile} onChange={(e) => setProfile(e.target.value)}>
          {['professional', 'academic', 'plain', 'medical', 'legal', 'government', 'casual', 'concise'].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          type="button"
          className="vl-button"
          disabled={!isLoaded}
          onClick={ => void runSuggest.catch((e: Error) => setError(e.message))}
        >
          Suggest writing
        </button>
        <button
          type="button"
          className="vl-button"
          disabled={!isLoaded}
          onClick={ => void runSpell.catch((e: Error) => setError(e.message))}
        >
          Spell check
        </button>
      </div>

      {spell ? (
        <p style={{ color: 'var(--muted)' }}>
          Spell: <strong>{spell}</strong>
        </p>
      ) : null}

      {result ? (
        <section>
          <h2 style={h2}>Suggestions · {result.styleProfile} · {result.suggestionCount}</h2>
          {result.styleDisclaimer ? <p style={{ color: '#8a5a00' }}>{result.styleDisclaimer}</p> : null}
          <p style={{ margin: '0 0 0.5rem' }}>
            <strong>Grammar:</strong> {result.grammarCorrected}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Style:</strong> {result.styleRewritten}
          </p>
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
