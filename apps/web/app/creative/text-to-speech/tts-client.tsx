'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_URL, apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import { loadTtsHistory, pushTtsHistory, type TtsHistoryItem } from '@/lib/creative-tts-history';

type Voice = {
  id: string;
  name: string;
  gender?: string;
  languages?: string[];
  personality?: string;
  accent?: string | null;
  category?: string;
};

const SUGGESTIONS = [
  'Command the room',
  'Laugh uncontrollably',
  'Narrate a mystery',
  'Warm product welcome',
];

export function CreativeTtsClient() {
  const { getToken, isLoaded } = useAuth();
  const search = useSearchParams();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState('alloy');
  const [text, setText] = useState(
    () => search.get('text') || 'Type your text with audio tags like [laughs] to turn into expressive speech...',
  );
  const [stability, setStability] = useState(0.45);
  const [similarity, setSimilarity] = useState(0.75);
  const [sideTab, setSideTab] = useState<'settings' | 'history'>('settings');
  const [history, setHistory] = useState<TtsHistoryItem[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const selected = useMemo(() => voices.find((v) => v.id === voiceId) ?? null, [voices, voiceId]);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to generate speech with Echo TTS.');
    const res = await apiFetch<{ data: Voice[] }>('/v1/tts/voices', { token });
    setVoices(res.data);
    if (res.data[0] && !res.data.some((v) => v.id === voiceId)) {
      setVoiceId(res.data[0].id);
    }
  }, [getToken, voiceId]);

  useEffect(() => {
    setHistory(loadTtsHistory());
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  useEffect(() => {
    const seeded = search.get('text');
    if (seeded) setText(seeded);
  }, [search]);

  async function generate() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to generate speech.');
      const body = {
        text: text.trim(),
        voice: voiceId,
        format: 'mp3',
        // Stability / similarity are creative controls; forwarded when the Echo gateway accepts them.
        stability,
        similarity_boost: similarity,
      };
      const res = await fetch(`${API_URL}/v1/tts/synthesize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `TTS failed (${res.status})`);
      }
      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const item: TtsHistoryItem = {
        id: `tts_${Date.now()}`,
        text: text.trim().slice(0, 240),
        voiceId,
        voiceName: selected?.name ?? voiceId,
        stability,
        similarity,
        createdAt: new Date().toISOString(),
        audioUrl: url,
      };
      setHistory(pushTtsHistory(item));
      setNote('Generated with Lugemi Echo TTS (/v1/tts/synthesize).');
      setSideTab('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreativeShell banner breadcrumb="Text to Speech">
      <div className="lg-creative-page-head">
        <div>
          <h1>Text to Speech</h1>
          <p>Write expressive scripts, pick a voice, tune stability and similarity, then generate with Echo.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/neural-tts" className="lg-creative-btn">
            Full Neural TTS console
          </Link>
          <button type="button" className="lg-creative-btn primary" disabled={busy || !text.trim()} onClick={() => void generate()}>
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="lg-creative-tts">
        <div className="lg-creative-tts-main">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.7rem',
                borderRadius: 999,
                background: 'rgba(0,184,174,0.12)',
                color: 'var(--lc-navy)',
                fontSize: '0.85rem',
                fontWeight: 650,
              }}
            >
              <CreativeIcon name="play" width={12} height={12} />
              {selected ? `${selected.name}${selected.personality ? ` — ${selected.personality}` : ''}` : 'Select a voice'}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Speech script"
          />
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.8rem', color: 'var(--lc-muted)', fontWeight: 650 }}>
              Get started with
            </p>
            <div className="lg-creative-chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setText(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {audioUrl ? (
            <div style={{ marginTop: '1rem' }}>
              <AudioPreviewBar src={audioUrl} label="Generated speech" />
            </div>
          ) : null}
          {error ? <p className="lg-creative-error">{error}</p> : null}
          {note ? <p className="lg-creative-note">{note}</p> : null}
        </div>

        <aside className="lg-creative-tts-side">
          <div className="lg-creative-tabs" style={{ marginBottom: 0 }}>
            <button type="button" className={sideTab === 'settings' ? 'is-active' : undefined} onClick={() => setSideTab('settings')}>
              Settings
            </button>
            <button type="button" className={sideTab === 'history' ? 'is-active' : undefined} onClick={() => setSideTab('history')}>
              History
            </button>
          </div>

          {sideTab === 'settings' ? (
            <>
              <label>
                Voice
                <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
                  {voices.length === 0 ? <option value={voiceId}>{voiceId}</option> : null}
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.languages?.[0] ? ` · ${v.languages[0]}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Model
                <select defaultValue="echo">
                  <option value="echo">Lugemi Echo</option>
                  <option value="echo-expressive">Echo Expressive</option>
                </select>
              </label>
              <label>
                Stability — Creative ↔ Robust ({stability.toFixed(2)})
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={stability}
                  onChange={(e) => setStability(Number(e.target.value))}
                />
              </label>
              <label>
                Similarity — Low ↔ High ({similarity.toFixed(2)})
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={similarity}
                  onChange={(e) => setSimilarity(Number(e.target.value))}
                />
              </label>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--lc-muted)', lineHeight: 1.45 }}>
                Controls are saved with history. Echo applies them when the gateway supports expressive params; otherwise
                synthesis still runs with voice + text.
              </p>
            </>
          ) : history.length === 0 ? (
            <div className="lg-creative-empty" style={{ padding: '1.5rem 0.5rem' }}>
              <strong>No history yet</strong>
              Generate speech to build a local history list.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.55rem' }}>
              {history.map((h) => (
                <li
                  key={h.id}
                  style={{
                    padding: '0.65rem 0.7rem',
                    borderRadius: 10,
                    background: 'var(--lc-bg)',
                    border: '1px solid var(--lc-line)',
                  }}
                >
                  <div style={{ fontWeight: 650, fontSize: '0.85rem', color: 'var(--lc-navy)' }}>{h.voiceName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)', marginTop: 2 }}>{h.text}</div>
                  <button
                    type="button"
                    className="lg-creative-ghost"
                    style={{ padding: '0.25rem 0', marginTop: 4 }}
                    onClick={() => {
                      setText(h.text);
                      setVoiceId(h.voiceId);
                      setStability(h.stability);
                      setSimilarity(h.similarity);
                      setSideTab('settings');
                    }}
                  >
                    Reuse
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </CreativeShell>
  );
}
