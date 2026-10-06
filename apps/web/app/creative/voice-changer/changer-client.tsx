'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import { useCreativeCredits } from '@/hooks/use-creative-credits';
import { blobFromBase64, formatCredits, startRecordingSession, type RecordingSession } from '@/lib/creative-audio';
import {
  HISTORY_KEYS,
  loadCreativeHistory,
  pushCreativeHistory,
  type CreativeHistoryItem,
} from '@/lib/creative-tool-history';

type Voice = {
  id: string;
  name: string;
  gender?: string;
  languages?: string[];
  personality?: string;
};

export function CreativeVoiceChangerClient() {
  const { getToken, isLoaded } = useAuth();
  const credits = useCreativeCredits();
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<RecordingSession | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState('alloy');
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [styleEx, setStyleEx] = useState(0.2);
  const [removeNoise, setRemoveNoise] = useState(true);
  const [sideTab, setSideTab] = useState<'settings' | 'history'>('settings');
  const [history, setHistory] = useState<CreativeHistoryItem[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const selected = useMemo(() => voices.find((v) => v.id === voiceId) ?? null, [voices, voiceId]);

  const loadVoices = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await apiFetch<{ data: Voice[] }>('/v1/tts/voices', { token });
    setVoices(res.data);
    if (res.data[0] && !res.data.some((v) => v.id === voiceId)) setVoiceId(res.data[0].id);
  }, [getToken, voiceId]);

  useEffect(() => {
    setHistory(loadCreativeHistory(HISTORY_KEYS.changer));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void loadVoices().catch((err: Error) => setError(err.message));
  }, [isLoaded, loadVoices]);

  async function toggleRecord() {
    setError(null);
    if (recording && sessionRef.current) {
      try {
        const f = await sessionRef.current.stop();
        sessionRef.current = null;
        setRecording(false);
        setFile(f);
      } catch (err) {
        setRecording(false);
        sessionRef.current = null;
        setError(err instanceof Error ? err.message : 'Recording failed');
      }
      return;
    }
    sessionRef.current = startRecordingSession();
    setRecording(true);
  }

  async function generate() {
    if (!file) {
      setError('Upload or record audio to convert.');
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    setTranscript(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to run voice conversion.');

      let working = file;
      if (removeNoise) {
        const form = new FormData();
        form.append('file', working);
        form.append('profile', 'podcast_cleanup');
        const enh = await fetch(`${API_URL}/v1/voice-enhancement/enhance`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const enhBody = await enh.json();
        if (enh.ok && typeof enhBody.audioBase64 === 'string') {
          const blob = blobFromBase64(enhBody.audioBase64, enhBody.mimeType || 'audio/wav');
          working = new File([blob], `enhanced-${Date.now()}.wav`, { type: blob.type });
        }
      }

      const sttForm = new FormData();
      sttForm.append('file', working);
      const sttRes = await fetch(`${API_URL}/v1/speech/recognize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: sttForm,
      });
      const sttBody = await sttRes.json();
      if (!sttRes.ok) throw new Error(sttBody?.error?.message ?? `STT failed (${sttRes.status})`);
      const text = String(sttBody.text || '').trim();
      if (!text) throw new Error('Transcription was empty — try a clearer recording.');
      setTranscript(text);

      const ttsRes = await fetch(`${API_URL}/v1/tts/synthesize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: voiceId,
          format: 'mp3',
          stability,
          similarity_boost: similarity,
          style: styleEx,
        }),
      });
      if (!ttsRes.ok) {
        const msg = await ttsRes.text();
        throw new Error(msg || `TTS failed (${ttsRes.status})`);
      }
      const blob = await ttsRes.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setNote(
        `Converted via STT → Echo TTS (${selected?.name ?? voiceId})${removeNoise ? ' with noise cleanup' : ''}.`,
      );
      setHistory(
        pushCreativeHistory(HISTORY_KEYS.changer, {
          name: `${selected?.name ?? voiceId} · ${file.name}`,
          kind: 'changer',
          format: 'mp3',
          meta: text.slice(0, 120),
          previewUrl: url,
          extra: { voiceId, text: text.slice(0, 500) },
        }),
      );
      setSideTab('history');
      await credits.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreativeShell banner breadcrumb="Voice Changer">
      <div className="lg-creative-page-head">
        <div>
          <h1>Voice Changer</h1>
          <p>Upload speech, optionally clean noise, then re-speak with an Echo voice (STT → TTS).</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/voice-enhancement" className="lg-creative-btn">
            Enhancement console
          </Link>
        </div>
      </div>

      <div className="lg-creative-tts">
        <div className="lg-creative-tts-main">
          <div
            className="lg-creative-drop-zone"
            style={{ margin: 0, minHeight: '12rem', border: '1.5px dashed var(--lc-line)' }}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
          >
            <strong>{file ? file.name : 'Click to upload, or drag and drop.'}</strong>
            <span>Audio or video files up to 50MB each.</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,video/*,.wav,.mp3,.m4a,.webm"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div style={{ margin: '0.85rem 0', textAlign: 'center', color: 'var(--lc-muted)', fontSize: '0.85rem' }}>
            or
          </div>
          <button type="button" className="lg-creative-btn" onClick={() => void toggleRecord()} style={{ alignSelf: 'center' }}>
            <CreativeIcon name="mic" width={16} height={16} />
            {recording ? 'Stop recording' : 'Record audio'}
          </button>

          {transcript ? (
            <p className="lg-creative-note" style={{ marginTop: '1rem' }}>
              Transcript: {transcript}
            </p>
          ) : null}
          {audioUrl ? (
            <div style={{ marginTop: '1rem' }}>
              <AudioPreviewBar src={audioUrl} label="Converted speech" />
            </div>
          ) : null}
          {error ? <p className="lg-creative-error">{error}</p> : null}
          {note ? <p className="lg-creative-note">{note}</p> : null}

          <div
            style={{
              marginTop: 'auto',
              paddingTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              borderTop: '1px solid var(--lc-line)',
            }}
          >
            <span className="lg-creative-credits">
              <strong>{credits.loading ? '…' : formatCredits(credits.remaining)}</strong> credits remaining
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--lc-muted)' }}>
              {file ? file.name : '0:00 total duration'}
            </span>
            <button
              type="button"
              className="lg-creative-btn primary"
              disabled={busy || !file}
              onClick={() => void generate()}
            >
              {busy ? 'Generating…' : 'Generate speech'}
            </button>
          </div>
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
                      {v.personality ? ` — ${v.personality}` : ''}
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
                Stability — More variable ↔ More stable ({stability.toFixed(2)})
                <input type="range" min={0} max={1} step={0.01} value={stability} onChange={(e) => setStability(Number(e.target.value))} />
              </label>
              <label>
                Similarity — Low ↔ High ({similarity.toFixed(2)})
                <input type="range" min={0} max={1} step={0.01} value={similarity} onChange={(e) => setSimilarity(Number(e.target.value))} />
              </label>
              <label>
                Style exaggeration — None ↔ Exaggerated ({styleEx.toFixed(2)})
                <input type="range" min={0} max={1} step={0.01} value={styleEx} onChange={(e) => setStyleEx(Number(e.target.value))} />
              </label>
              <label className="lg-creative-switch">
                Remove background noise
                <input type="checkbox" checked={removeNoise} onChange={(e) => setRemoveNoise(e.target.checked)} />
              </label>
            </>
          ) : history.length === 0 ? (
            <div className="lg-creative-empty" style={{ padding: '1.5rem 0.5rem' }}>
              <strong>No history yet</strong>
              Generate a conversion to save local history.
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
                  <div style={{ fontWeight: 650, fontSize: '0.85rem', color: 'var(--lc-navy)' }}>{h.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)', marginTop: 2 }}>{h.meta}</div>
                  {h.previewUrl ? <AudioPreviewBar src={h.previewUrl} label="Preview" /> : null}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </CreativeShell>
  );
}
