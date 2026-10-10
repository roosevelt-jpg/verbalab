'use client';

import { CSSProperties, FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';

type Profile = { id: string; name: string; description: string };

type RewriteResult = {
  profile: string;
  profileName: string;
  original: string;
  rewritten: string;
  changed: boolean;
  changes: { type: string; message: string; original?: string; suggestion?: string }[];
  changeCount: number;
  provider: string;
  model: string | null;
  note: string;
};

export function StyleClient() {
  const { getToken, isLoaded } = useAuth();
  const catalog = useLocaleCatalog();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [text, setText] = useState("I'm gonna really just finish this ASAP, yeah?");
  const [profile, setProfile] = useState('professional');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<{ data: Profile[] }>('/v1/style/profiles');
    setProfiles(res.data);
    if (res.data[0] && !res.data.some((p) => p.id === profile)) {
      setProfile(res.data[0].id);
    }
  }, [profile]);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function onRewrite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body: { text: string; profile: string; language?: string } = { text, profile };
      if (language.trim()) body.language = language.trim();
      setResult(
        await apiFetch<RewriteResult>('/v1/style/rewrite', {
          method: 'POST',
          token,
          body: JSON.stringify(body),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rewrite failed');
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
        Writing style
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '42rem' }}>
        Bounded profiles with deterministic transforms and optional LLM rewrite. Domain tones include disclaimers — not legal, medical, or marketing writing products.{' '}
        <Link href="/style-intelligence">Style Intelligence</Link> adds tone detect and transfer.
      </p>

      {!isLoaded ? <p style={{ color: 'var(--muted)' }}>Loading auth…</p> : null}

      <form onSubmit={onRewrite} style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.75rem' }}>
        <label className="vl-label">
          Text
          <textarea className="vl-field" rows={5} value={text} onChange={(e) => setText(e.target.value)} required />
        </label>
        <label className="vl-label">
          Profile
          <select className="vl-field" value={profile} onChange={(e) => setProfile(e.target.value)}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="vl-label">
          Language hint (optional)
          <LocaleSelect
              className="vl-field"
              value={language}
              onChange={setLanguage}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
              allowEmpty
              emptyLabel="—"
            />
        </label>
        <button type="submit" className="vl-btn vl-btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>
          {busy ? 'Rewriting…' : 'Rewrite'}
        </button>
      </form>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {result ? (
        <section style={{ display: 'grid', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={label}>Rewritten ({result.profileName})</h2>
            <p style={{ margin: 0, fontWeight: 600, whiteSpace: 'pre-wrap' }}>{result.rewritten}</p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {result.provider}
              {result.model ? ` · ${result.model}` : ''} · {result.changeCount} changes ·{' '}
              {result.changed ? 'changed' : 'unchanged'}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>{result.note}</p>
          </div>
          {result.changes.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.45rem' }}>
              {result.changes.map((c, idx) => (
                <li key={`${c.type}-${idx}`} style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  {c.type} · {c.message}
                  {c.suggestion !== undefined ? ` → ${c.suggestion || '(removed)'}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 style={label}>Profiles</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
          {profiles.map((p) => (
            <li key={p.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
              <strong>{p.name}</strong> · {p.description}
            </li>
          ))}
        </ul>
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
