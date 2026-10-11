'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { isLugemiApiKey, loadCreativeApiKey, resolveCreativeToken } from '@/lib/creative-auth';
import { CreativeApiKeyField } from '@/components/creative/creative-api-key-field';

type Voice = { id: string; name: string; gender?: string; languages?: string[] };

type Turn = { speaker: string; text: string; voice: string; language?: string };

const DEFAULT_TURNS: Turn[] = [
  {
    speaker: 'Host',
    text: 'Welcome to the Accra product desk — tell me what you need in Twi or English.',
    voice: 'own:en-gh-female',
    language: 'en',
  },
  {
    speaker: 'Guest',
    text: 'Me pɛ sɛ me nya voice pack a ɛyɛ professional ma me brand.',
    voice: 'own:ak-gh-female',
    language: 'ak',
  },
];

export function CreativeDialogueClient() {
  if (!isClerkConfigured()) {
    return <CreativeDialogueInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeDialogueAuthed />;
}

function CreativeDialogueAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeDialogueInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeDialogueInner({
  getToken,
  isLoaded,
}: {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
}) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [turns, setTurns] = useState<Turn[]>(DEFAULT_TURNS);
  const [apiKey, setApiKey] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const resolveToken = useCallback(async () => {
    return resolveCreativeToken(() => getToken(), apiKey || loadCreativeApiKey());
  }, [apiKey, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await resolveToken();
        if (!token) return;
        const res = await apiFetch<{ data: Voice[] }>('/v1/tts/voices', { token });
        setVoices(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load voices');
      }
    })();
  }, [isLoaded, resolveToken]);

  function updateTurn(index: number, patch: Partial<Turn>) {
    setTurns((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTurn() {
    if (turns.length >= 24) return;
    const fallback = voices[0]?.id || 'alloy';
    setTurns((prev) => [
      ...prev,
      { speaker: `Speaker ${prev.length + 1}`, text: '', voice: fallback, language: 'en' },
    ]);
  }

  function removeTurn(index: number) {
    setTurns((prev) => prev.filter((_, i) => i !== index));
  }

  async function generate() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const token = await resolveToken();
      if (!token) throw new Error('Sign in or paste a lg_test_ / lg_live_ API key.');
      const res = await fetch(`${API_URL}/v1/dialogue/synthesize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ turns }),
      });
      if (!res.ok) throw new Error((await res.text()) || `Dialogue failed (${res.status})`);
      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
      setNote(`Multi-speaker dialogue · ${turns.length} turns · Lugemi Echo`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dialogue failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreativeShell banner breadcrumb="Dialogue">
      <div className="lg-creative-page-head">
        <div>
          <h1>Dialogue</h1>
          <p>Multi-speaker scenes with distinct Lugemi Echo voices per turn — podcasts, ads, game NPCs.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/text-to-speech" className="lg-creative-btn">
            Single-voice TTS
          </Link>
          <button type="button" className="lg-creative-btn primary" disabled={busy} onClick={() => void generate()}>
            <CreativeIcon name="play" />
            {busy ? 'Rendering…' : 'Generate dialogue'}
          </button>
        </div>
      </div>

      <div className="lg-creative-split">
        <div>
          <CreativeApiKeyField onChange={setApiKey} />
          <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
            {turns.map((turn, i) => (
              <article
                key={i}
                style={{
                  border: '1px solid var(--lc-line)',
                  borderRadius: 14,
                  padding: '0.9rem 1rem',
                  background: 'var(--lc-panel, #fff)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
                  <input
                    value={turn.speaker}
                    onChange={(e) => updateTurn(i, { speaker: e.target.value })}
                    aria-label={`Speaker ${i + 1}`}
                    placeholder="Speaker"
                    style={{ width: 120, padding: '0.4rem 0.55rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
                  />
                  <select
                    value={turn.voice}
                    onChange={(e) => updateTurn(i, { voice: e.target.value })}
                    aria-label={`Voice ${i + 1}`}
                    style={{ flex: 1, minWidth: 160, padding: '0.4rem 0.55rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
                  >
                    {(voices.length ? voices : [{ id: turn.voice, name: turn.voice }]).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={turn.language || ''}
                    onChange={(e) => updateTurn(i, { language: e.target.value })}
                    aria-label={`Language ${i + 1}`}
                    placeholder="lang"
                    style={{ width: 72, padding: '0.4rem 0.55rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
                  />
                  <button type="button" className="lg-creative-btn" onClick={() => removeTurn(i)} disabled={turns.length <= 1}>
                    Remove
                  </button>
                </div>
                <textarea
                  value={turn.text}
                  onChange={(e) => updateTurn(i, { text: e.target.value })}
                  rows={3}
                  aria-label={`Text ${i + 1}`}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 10,
                    border: '1px solid var(--lc-line)',
                    font: 'inherit',
                  }}
                />
              </article>
            ))}
          </div>
          <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button type="button" className="lg-creative-btn" onClick={addTurn} disabled={turns.length >= 24}>
              <CreativeIcon name="plus" /> Add turn
            </button>
            <Link href="/creative/captions" className="lg-creative-btn">
              Align captions
            </Link>
          </div>
          {error ? <p style={{ color: '#b42318', marginTop: '0.85rem' }}>{error}</p> : null}
          {note ? <p style={{ color: 'var(--lc-muted)', marginTop: '0.85rem' }}>{note}</p> : null}
          {audioUrl ? (
            <div style={{ marginTop: '1rem' }}>
              <AudioPreviewBar src={audioUrl} label="Dialogue mix" />
            </div>
          ) : null}
        </div>
        <AnamorphicPanel variant="speech" size="md" label="Dialogue plane" />
      </div>
    </CreativeShell>
  );
}
