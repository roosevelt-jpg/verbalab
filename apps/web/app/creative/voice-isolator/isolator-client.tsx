'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import { useCreativeCredits } from '@/hooks/use-creative-credits';
import { blobFromBase64, formatCredits, startRecordingSession, type RecordingSession } from '@/lib/creative-audio';
import {
  HISTORY_KEYS,
  formatDuration,
  loadCreativeHistory,
  pushCreativeHistory,
  relativeTime,
  type CreativeHistoryItem,
} from '@/lib/creative-tool-history';

type IsolateResult = {
  audioBase64: string;
  mimeType?: string;
  speechRatio?: number;
  note?: string;
  durationSeconds?: number;
};


export function CreativeVoiceIsolatorClient() {
  if (!isClerkConfigured()) {
    return <CreativeVoiceIsolatorClientInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeVoiceIsolatorClientAuthed />;
}

function CreativeVoiceIsolatorClientAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeVoiceIsolatorClientInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeVoiceIsolatorClientInner({ getToken, isLoaded }: { getToken: () => Promise<string | null>; isLoaded: boolean }) {
  // auth via props: getToken, isLoaded
  const credits = useCreativeCredits();
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<RecordingSession | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<CreativeHistoryItem[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setHistory(loadCreativeHistory(HISTORY_KEYS.isolator));
  }, []);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    setError(null);
    setNote(null);
  }, []);

  async function toggleRecord() {
    setError(null);
    if (recording && sessionRef.current) {
      try {
        const f = await sessionRef.current.stop();
        sessionRef.current = null;
        setRecording(false);
        onFile(f);
        setNote(`Recorded ${f.name}`);
      } catch (err) {
        setRecording(false);
        sessionRef.current = null;
        setError(err instanceof Error ? err.message : 'Recording failed');
      }
      return;
    }
    try {
      sessionRef.current = startRecordingSession();
      setRecording(true);
      setNote('Recording… click mic again to stop.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone unavailable');
    }
  }

  async function isolate() {
    if (!file) {
      setError('Drop or upload an audio/video file first.');
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to isolate speech with Audio Intelligence.');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/v1/audio-intelligence/isolate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = (await res.json()) as IsolateResult & { error?: { message: string } };
      if (!res.ok) throw new Error(body.error?.message ?? `Isolate failed (${res.status})`);
      const blob = blobFromBase64(body.audioBase64, body.mimeType || 'audio/wav');
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      const ratio =
        body.speechRatio != null ? ` · speech ${(body.speechRatio * 100).toFixed(0)}%` : '';
      setNote(`Isolated via energy VAD${ratio}. ${body.note ?? ''}`.trim());
      setHistory(
        pushCreativeHistory(HISTORY_KEYS.isolator, {
          name: file.name.replace(/\.[^.]+$/, '') || 'Isolated voice',
          kind: 'isolator',
          format: 'wav',
          durationLabel: formatDuration(body.durationSeconds),
          meta: body.speechRatio != null ? `${(body.speechRatio * 100).toFixed(0)}% speech` : 'Isolated',
          previewUrl: url,
        }),
      );
      await credits.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Isolate failed');
    } finally {
      setBusy(false);
    }
  }

  const filtered = history.filter((h) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return h.name.toLowerCase().includes(q) || (h.meta ?? '').toLowerCase().includes(q);
  });

  return (
    <CreativeShell banner breadcrumb="Voice Isolator">
      <div className="lg-creative-page-head">
        <div>
          <h1>Voice Isolator</h1>
          <p>Isolate speech energy from noisy recordings with Lugemi Audio Intelligence.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/audio-intelligence" className="lg-creative-btn">
            Full console
          </Link>
          <button type="button" className="lg-creative-btn primary" disabled={busy || !file} onClick={() => void isolate()}>
            {busy ? 'Isolating…' : 'Isolate'}
          </button>
        </div>
      </div>

      <div
        className={`lg-creative-drop${drag ? ' is-drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0] ?? null;
          if (f) onFile(f);
        }}
      >
        <div
          className="lg-creative-drop-zone"
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          <strong>{file ? file.name : 'Drop files here.'}</strong>
          <span>
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB · ready to isolate`
              : 'Audio or video the browser can decode. Energy VAD isolation — not neural stem separation.'}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*,.wav,.mp3,.m4a,.ogg,.webm,.mp4"
          hidden
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <div className="lg-creative-drop-bar">
          <div className="lg-creative-drop-bar-left">
            <button type="button" className="lg-creative-icon-btn" aria-label="Upload" onClick={() => inputRef.current?.click()}>
              <CreativeIcon name="upload" />
            </button>
            <button
              type="button"
              className="lg-creative-icon-btn"
              aria-label={recording ? 'Stop recording' : 'Record'}
              onClick={() => void toggleRecord()}
              style={recording ? { color: 'var(--lc-action)', background: 'rgba(0,184,174,0.12)' } : undefined}
            >
              <CreativeIcon name="mic" />
            </button>
          </div>
          <span className="lg-creative-credits">
            <strong>
              {credits.loading ? '…' : formatCredits(credits.used)} credits
            </strong>
            {' / '}
            {formatCredits(credits.quota)} credits
          </span>
          <button
            type="button"
            className="lg-creative-send"
            aria-label="Submit isolate"
            disabled={busy || !file || !isLoaded}
            onClick={() => void isolate()}
          >
            <CreativeIcon name="send" width={16} height={16} />
          </button>
        </div>
      </div>

      {resultUrl ? (
        <div style={{ marginTop: '1rem' }}>
          <AudioPreviewBar src={resultUrl} label="Isolated audio" />
          <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href={resultUrl} download="lugemi-isolated.wav" className="lg-creative-btn">
              Download WAV
            </a>
            <Link href="/creative/voice-creation" className="lg-creative-btn primary">
              Use as clone sample
            </Link>
          </div>
        </div>
      ) : null}
      {error ? <p className="lg-creative-error">{error}</p> : null}
      {note ? <p className="lg-creative-note">{note}</p> : null}

      <div style={{ marginTop: '1.75rem' }}>
        <div className="lg-creative-toolbar">
          <label className="lg-creative-field">
            <CreativeIcon name="search" width={16} height={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history."
              aria-label="Search history"
            />
          </label>
        </div>
        {filtered.length === 0 ? (
          <div className="lg-creative-empty">
            <strong>No isolation history yet</strong>
            Run isolate to build a local history list on this device.
          </div>
        ) : (
          filtered.map((h) => (
            <div key={h.id} className="lg-creative-history-row">
              <span className="lg-creative-icon-btn" aria-hidden>
                <CreativeIcon name="isolator" />
              </span>
              <div>
                <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{h.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--lc-muted)' }}>{relativeTime(h.createdAt)}</div>
              </div>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>{h.durationLabel ?? '—'}</span>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>{h.format ?? 'wav'}</span>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.8rem' }}>{h.meta}</span>
              {h.previewUrl ? (
                <a href={h.previewUrl} download={`${h.name}.wav`} className="lg-creative-icon-btn" aria-label="Download">
                  <CreativeIcon name="download" />
                </a>
              ) : (
                <span className="lg-creative-icon-btn" aria-hidden>
                  <CreativeIcon name="download" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </CreativeShell>
  );
}
