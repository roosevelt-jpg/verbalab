'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { isLugemiApiKey, loadCreativeApiKey } from '@/lib/creative-auth';
import { CreativeApiKeyField } from '@/components/creative/creative-api-key-field';

type Voice = { id: string; name: string };

type EmbedResult = {
  product: string;
  playerUrl: string;
  snippet: string;
  project: { id: string; title: string; voice: string };
};

export function CreativeSpeechEmbedClient() {
  if (!isClerkConfigured()) {
    return <CreativeSpeechEmbedInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeSpeechEmbedAuthed />;
}

function CreativeSpeechEmbedAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeSpeechEmbedInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeSpeechEmbedInner({
  getToken,
  isLoaded,
}: {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
}) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [title, setTitle] = useState('Product launch article');
  const [text, setText] = useState(
    'Lugemi turns blog posts and help centers into listen-able experiences — readers press play and hear Echo narration in their corridor.',
  );
  const [voice, setVoice] = useState('own:en-gh-female');
  const [language, setLanguage] = useState('en');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<EmbedResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resolveToken = useCallback(async () => {
    const session = await getToken();
    if (session) return session;
    const key = apiKey || loadCreativeApiKey();
    if (isLugemiApiKey(key)) return key;
    return null;
  }, [apiKey, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await resolveToken();
        if (!token) return;
        const res = await apiFetch<{ data: Voice[] }>('/v1/tts/voices', { token });
        setVoices(res.data);
        if (res.data[0] && !res.data.some((v) => v.id === voice)) setVoice(res.data[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load voices');
      }
    })();
  }, [isLoaded, resolveToken, voice]);

  async function create() {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const token = await resolveToken();
      if (!token) throw new Error('Sign in or paste a lg_test_ / lg_live_ API key.');
      const res = await apiFetch<EmbedResult>('/v1/speech-embed', {
        token,
        method: 'POST',
        body: { title: title.trim(), text: text.trim(), voice, language: language || undefined },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Embed create failed');
    } finally {
      setBusy(false);
    }
  }

  async function copySnippet() {
    if (!result?.snippet) return;
    await navigator.clipboard.writeText(result.snippet);
    setCopied(true);
  }

  return (
    <CreativeShell banner breadcrumb="Speech Player">
      <div className="lg-creative-page-head">
        <div>
          <h1>Speech Player</h1>
          <p>Drop a Lugemi player on articles, docs, and help centers — readers listen in Echo voices.</p>
        </div>
        <div className="lg-creative-actions">
          <button type="button" className="lg-creative-btn primary" disabled={busy} onClick={() => void create()}>
            <CreativeIcon name="media" />
            {busy ? 'Creating…' : 'Create embed'}
          </button>
        </div>
      </div>

      <div className="lg-creative-split">
        <div>
          <CreativeApiKeyField onChange={setApiKey} />
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--lc-muted)' }}>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.55rem 0.7rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
              />
            </label>
            <label style={{ fontSize: '0.85rem', color: 'var(--lc-muted)' }}>
              Narration text
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.75rem', borderRadius: 12, border: '1px solid var(--lc-line)', font: 'inherit' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, minWidth: 180, fontSize: '0.85rem', color: 'var(--lc-muted)' }}>
                Voice
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
                >
                  {(voices.length ? voices : [{ id: voice, name: voice }]).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ width: 100, fontSize: '0.85rem', color: 'var(--lc-muted)' }}>
                Language
                <input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
                />
              </label>
            </div>
          </div>
          {error ? <p style={{ color: '#b42318', marginTop: '0.85rem' }}>{error}</p> : null}
          {result ? (
            <section style={{ marginTop: '1.25rem' }}>
              <p style={{ color: 'var(--lc-muted)', fontSize: '0.9rem' }}>
                Project <code>{result.project.id}</code> ·{' '}
                <Link href={result.playerUrl} target="_blank" rel="noreferrer">
                  Open player
                </Link>
              </p>
              <pre
                style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  border: '1px solid var(--lc-line)',
                  background: 'rgba(16,38,77,0.04)',
                  fontSize: '0.78rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {result.snippet}
              </pre>
              <button type="button" className="lg-creative-btn primary" style={{ marginTop: '0.75rem' }} onClick={() => void copySnippet()}>
                {copied ? 'Copied' : 'Copy snippet'}
              </button>
            </section>
          ) : null}
        </div>
        <AnamorphicPanel variant="agents" size="md" label="Player plane" />
      </div>
    </CreativeShell>
  );
}
