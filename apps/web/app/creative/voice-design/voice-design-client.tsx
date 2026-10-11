'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import { isLugemiApiKey, loadCreativeApiKey } from '@/lib/creative-auth';
import { CreativeApiKeyField } from '@/components/creative/creative-api-key-field';

type Match = {
  id: string;
  name: string;
  gender: string;
  languages: string[];
  accent?: string | null;
  personality?: string | null;
  score: number;
  rationale: string[];
};

type DesignResult = {
  product: string;
  prompt: string;
  matches: Match[];
};

export function CreativeVoiceDesignClient() {
  if (!isClerkConfigured()) {
    return <CreativeVoiceDesignInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeVoiceDesignAuthed />;
}

function CreativeVoiceDesignAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeVoiceDesignInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeVoiceDesignInner({
  getToken,
}: {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
}) {
  const [prompt, setPrompt] = useState(
    'Warm Ghanaian English female voice for customer support — calm, professional, Accra corridor.',
  );
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<DesignResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveToken = useCallback(async () => {
    const session = await getToken();
    if (session) return session;
    const key = apiKey || loadCreativeApiKey();
    if (isLugemiApiKey(key)) return key;
    return null;
  }, [apiKey, getToken]);

  async function design() {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveToken();
      if (!token) throw new Error('Sign in or paste a lg_test_ / lg_live_ API key.');
      const res = await apiFetch<DesignResult>('/v1/voice-design', {
        token,
        method: 'POST',
        body: { prompt: prompt.trim() },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice design failed');
    } finally {
      setBusy(false);
    }
  }

  async function preview(voiceId: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveToken();
      if (!token) throw new Error('Sign in or paste a lg_test_ / lg_live_ API key.');
      const res = await fetch(`${API_URL}/v1/tts/synthesize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Akwaaba — this is a Lugemi Echo preview for your designed voice.',
          voice: voiceId,
          format: 'mp3',
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || `Preview failed (${res.status})`);
      const blob = await res.blob();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreativeShell banner breadcrumb="Voice Design">
      <div className="lg-creative-page-head">
        <div>
          <h1>Voice Design</h1>
          <p>Describe age, accent corridor, and delivery — Lugemi maps your brief onto live Echo voices.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/voice-creation" className="lg-creative-btn">
            Clone instead
          </Link>
          <button type="button" className="lg-creative-btn primary" disabled={busy} onClick={() => void design()}>
            <CreativeIcon name="clone" />
            {busy ? 'Designing…' : 'Design voice'}
          </button>
        </div>
      </div>

      <div className="lg-creative-split">
        <div>
          <CreativeApiKeyField value={apiKey} onChange={setApiKey} />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            aria-label="Voice design prompt"
            style={{
              display: 'block',
              width: '100%',
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: 12,
              border: '1px solid var(--lc-line)',
              font: 'inherit',
            }}
          />
          {error ? <p style={{ color: '#b42318', marginTop: '0.85rem' }}>{error}</p> : null}
          {previewUrl ? (
            <div style={{ marginTop: '1rem' }}>
              <AudioPreviewBar src={previewUrl} label="Voice preview" />
            </div>
          ) : null}
          {result ? (
            <div className="lg-creative-voice-grid" style={{ marginTop: '1.25rem' }}>
              {result.matches.map((m) => (
                <article key={m.id} className="lg-creative-voice-card">
                  <div
                    className="lg-creative-voice-avatar"
                    style={{ background: 'rgba(0,184,174,0.15)', color: 'var(--lc-navy)' }}
                  >
                    {m.name.slice(0, 1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)' }}>
                      {m.gender} · score {m.score}
                      {m.accent ? ` · ${m.accent}` : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--lc-muted)', marginTop: 4 }}>
                      {m.rationale.slice(0, 4).join(' · ') || m.personality || m.id}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="lg-creative-btn" onClick={() => void preview(m.id)}>
                        Preview
                      </button>
                      <Link
                        href={`/creative/text-to-speech?voice=${encodeURIComponent(m.id)}`}
                        className="lg-creative-btn primary"
                      >
                        Use in TTS
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
        <AnamorphicPanel variant="voice" size="md" label="Design plane" />
      </div>
    </CreativeShell>
  );
}
