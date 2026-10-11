'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { isLugemiApiKey, loadCreativeApiKey, resolveCreativeToken } from '@/lib/creative-auth';
import { CreativeApiKeyField } from '@/components/creative/creative-api-key-field';

type AlignResult = {
  product: string;
  language: string;
  durationMs: number;
  mode: string;
  words: Array<{ word: string; startMs: number; endMs: number; confidence: number }>;
  srt: string;
  vtt: string;
};

export function CreativeCaptionsClient() {
  if (!isClerkConfigured()) {
    return <CreativeCaptionsInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeCaptionsAuthed />;
}

function CreativeCaptionsAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeCaptionsInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeCaptionsInner({
  getToken,
}: {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
}) {
  const [text, setText] = useState(
    'Lugemi Echo turns scripts into timed captions for dubbing, LearnBack, and social cuts.',
  );
  const [language, setLanguage] = useState('en');
  const [durationMs, setDurationMs] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<AlignResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveToken = useCallback(async () => {
    return resolveCreativeToken(() => getToken(), apiKey || loadCreativeApiKey());
  }, [apiKey, getToken]);

  async function align() {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveToken();
      if (!token) throw new Error('Sign in or paste a lg_test_ / lg_live_ API key.');
      const body = {
        text: text.trim(),
        language: language.trim() || undefined,
        durationMs: durationMs ? Number(durationMs) : undefined,
      };
      const res = await apiFetch<AlignResult>('/v1/align', { token, method: 'POST', body });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Align failed');
    } finally {
      setBusy(false);
    }
  }

  function download(kind: 'srt' | 'vtt') {
    if (!result) return;
    const blob = new Blob([kind === 'srt' ? result.srt : result.vtt], {
      type: kind === 'srt' ? 'application/x-subrip' : 'text/vtt',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lugemi-captions.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <CreativeShell banner breadcrumb="Captions">
      <div className="lg-creative-page-head">
        <div>
          <h1>Forced alignment</h1>
          <p>Word timings, SRT, and VTT for dubbing QA, LearnBack, and social captions.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/dubbing" className="lg-creative-btn">
            Dubbing
          </Link>
          <button type="button" className="lg-creative-btn primary" disabled={busy} onClick={() => void align()}>
            <CreativeIcon name="stt" />
            {busy ? 'Aligning…' : 'Align text'}
          </button>
        </div>
      </div>

      <div className="lg-creative-split">
        <div>
          <CreativeApiKeyField onChange={setApiKey} />
          <label style={{ display: 'block', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--lc-muted)' }}>
            Script
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '0.75rem',
                borderRadius: 12,
                border: '1px solid var(--lc-line)',
                font: 'inherit',
              }}
            />
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--lc-muted)' }}>
              Language
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ display: 'block', marginTop: 4, padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
              />
            </label>
            <label style={{ fontSize: '0.85rem', color: 'var(--lc-muted)' }}>
              Audio duration (ms, optional)
              <input
                value={durationMs}
                onChange={(e) => setDurationMs(e.target.value)}
                placeholder="e.g. 12400"
                style={{ display: 'block', marginTop: 4, padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
              />
            </label>
          </div>
          {error ? <p style={{ color: '#b42318', marginTop: '0.85rem' }}>{error}</p> : null}
          {result ? (
            <section style={{ marginTop: '1.25rem' }}>
              <p style={{ color: 'var(--lc-muted)', fontSize: '0.9rem' }}>
                {result.words.length} words · {result.durationMs} ms · mode {result.mode}
              </p>
              <div style={{ display: 'flex', gap: '0.65rem', margin: '0.75rem 0' }}>
                <button type="button" className="lg-creative-btn primary" onClick={() => download('srt')}>
                  Download SRT
                </button>
                <button type="button" className="lg-creative-btn" onClick={() => download('vtt')}>
                  Download VTT
                </button>
              </div>
              <pre
                style={{
                  maxHeight: 280,
                  overflow: 'auto',
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  border: '1px solid var(--lc-line)',
                  background: 'rgba(16,38,77,0.04)',
                  fontSize: '0.8rem',
                }}
              >
                {result.srt}
              </pre>
            </section>
          ) : null}
        </div>
        <AnamorphicPanel variant="api" size="md" label="Caption plane" />
      </div>
    </CreativeShell>
  );
}
