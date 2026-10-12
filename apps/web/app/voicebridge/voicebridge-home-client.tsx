'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  VoiceBridgeAuthGate,
  isMachineApiKey,
  type VoiceBridgeAuth,
} from '@/lib/voicebridge-auth';

type ThreadRow = {
  id: string;
  title: string;
  category: string | null;
  state: string;
  role: string;
  language: string;
  sequence: number;
  createdAt: string;
};

function VoiceBridgeHomeInner({ auth }: { auth: VoiceBridgeAuth }) {
  const { isSignedIn, isLoaded, resolveBearer } = auth;
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('vb-creator-1');
  const loadGen = useRef(0);

  const authRequest = useCallback(async () => {
    const token = await resolveBearer(apiKey);
    if (!token) {
      throw new Error(
        isSignedIn
          ? 'Session token unavailable — refresh and sign in again.'
          : 'Sign in or paste an API key to load threads.',
      );
    }
    const headers: Record<string, string> = {};
    if (isMachineApiKey(token)) headers['X-VoiceBridge-Actor-Id'] = actorId.trim() || 'vb-creator-1';
    return { token, headers };
  }, [actorId, apiKey, isSignedIn, resolveBearer]);

  const reload = useCallback(async () => {
    if (!isLoaded) return;
    const gen = ++loadGen.current;
    setError(null);
    try {
      const { token, headers } = await authRequest();
      if (gen !== loadGen.current) return;
      const data = await apiFetch<{ threads: ThreadRow[] }>('/v1/voicebridge/threads', {
        token,
        headers,
      });
      if (gen !== loadGen.current) return;
      setThreads(data.threads ?? []);
    } catch (e) {
      if (gen !== loadGen.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load threads');
    }
  }, [authRequest, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn && !apiKey.trim()) return;
    void reload();
  }, [apiKey, isLoaded, isSignedIn, reload]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { token, headers } = await authRequest();
      const created = await apiFetch<{ thread: { id: string } }>('/v1/voicebridge/threads', {
        method: 'POST',
        token,
        headers,
        body: JSON.stringify({ title, language, category: category || undefined }),
      });
      setTitle('');
      window.location.href = `/voicebridge/threads/${created.thread.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="vl-page" style={{ maxWidth: 840, margin: '0 auto', padding: '2rem 1.25rem' }}>
      <p className="vl-kicker" style={{ color: 'var(--action-primary)', fontWeight: 600, letterSpacing: '0.06em' }}>
        VOICEBRIDGE
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', margin: '0.35rem 0 0.5rem' }}>Speak once. Connect across languages.</h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.55, maxWidth: '40rem' }}>
        Private multilingual voice threads. Record once; each recipient gets text and spoken translation in their
        language. Corrections supersede outdated versions for every authorized member.
      </p>

      {!isLoaded ? <p style={{ color: 'var(--muted)' }}>Loading session…</p> : null}

      {isLoaded && !isSignedIn ? (
        <div className="vl-panel" style={{ padding: '1rem', marginTop: '1.25rem', display: 'grid', gap: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
            Local or demo: paste an API key and actor id to load threads without signing in.
          </p>
          <input className="vl-input" placeholder="lg_test_… API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          <input className="vl-input" placeholder="Actor user id" value={actorId} onChange={(e) => setActorId(e.target.value)} />
          <button type="button" className="vl-btn" onClick={() => void reload()}>
            Reload threads
          </button>
        </div>
      ) : null}

      <form className="vl-panel" onSubmit={onCreate} style={{ padding: '1.25rem', marginTop: '1.5rem', display: 'grid', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Start a thread</h2>
        <label>
          Title
          <input className="vl-input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="East Africa rice desk" />
        </label>
        <label>
          Your language (BCP-47 / registry code)
          <input className="vl-input" required value={language} onChange={(e) => setLanguage(e.target.value)} />
        </label>
        <label>
          Business category (optional)
          <input className="vl-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="wholesale_rice" />
        </label>
        <button className="vl-btn vl-btn-primary" type="submit" disabled={busy || !isLoaded}>
          {busy ? 'Creating…' : 'Create thread'}
        </button>
      </form>

      {error ? <p role="alert" style={{ color: 'crimson' }}>{error}</p> : null}

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem' }}>Your threads</h2>
        {threads.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No threads yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.65rem' }}>
            {threads.map((t) => (
              <li key={t.id} className="vl-panel" style={{ padding: '0.9rem 1rem' }}>
                <Link href={`/voicebridge/threads/${t.id}`} style={{ fontWeight: 600 }}>
                  {t.title}
                </Link>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
                  {t.role} · {t.language} · seq {t.sequence}
                  {t.category ? ` · ${t.category}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export function VoiceBridgeHomeClient() {
  return <VoiceBridgeAuthGate>{(auth) => <VoiceBridgeHomeInner auth={auth} />}</VoiceBridgeAuthGate>;
}
