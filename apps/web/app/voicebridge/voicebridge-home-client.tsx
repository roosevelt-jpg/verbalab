'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { VoiceBridgeAuthGate, type VoiceBridgeAuth } from '@/lib/voicebridge-auth';

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
  const { getToken, isSignedIn, clerkReady } = auth;
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('vb-creator-1');

  const tokenFn = useCallback(async () => {
    if (clerkReady && isSignedIn) {
      return (await getToken()) ?? undefined;
    }
    return apiKey.trim() || undefined;
  }, [apiKey, clerkReady, getToken, isSignedIn]);

  const headers = useCallback(() => {
    const h: Record<string, string> = {};
    if (!clerkReady || !isSignedIn) {
      h['X-VoiceBridge-Actor-Id'] = actorId;
    }
    return h;
  }, [actorId, clerkReady, isSignedIn]);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const token = await tokenFn();
      const data = await apiFetch<{ threads: ThreadRow[] }>('/v1/voicebridge/threads', {
        token,
        headers: headers(),
      });
      setThreads(data.threads ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load threads');
    }
  }, [headers, tokenFn]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFn();
      const created = await apiFetch<{ thread: { id: string } }>('/v1/voicebridge/threads', {
        method: 'POST',
        token,
        headers: headers(),
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

      {!clerkReady || !isSignedIn ? (
        <div className="vl-panel" style={{ padding: '1rem', marginTop: '1.25rem', display: 'grid', gap: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
            Local/dev: use an API key and actor id (set <code>VOICEBRIDGE_OPEN=1</code> and fixture ASR/MT/TTS as needed).
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
        <button className="vl-btn vl-btn-primary" type="submit" disabled={busy}>
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
