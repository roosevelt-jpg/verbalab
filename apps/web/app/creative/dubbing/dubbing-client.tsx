'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';
import { useCreativeCredits } from '@/hooks/use-creative-credits';
import { formatCredits } from '@/lib/creative-audio';
import {
  HISTORY_KEYS,
  formatDuration,
  loadCreativeHistory,
  pushCreativeHistory,
  relativeTime,
  type CreativeHistoryItem,
} from '@/lib/creative-tool-history';

type Voice = { id: string; name: string };

export function CreativeDubbingClient() {
  const { getToken, isLoaded } = useAuth();
  const catalog = useLocaleCatalog();
  const credits = useCreativeCredits();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [voiceId, setVoiceId] = useState('alloy');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<CreativeHistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadCreativeHistory(HISTORY_KEYS.dubbing));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      const token = await getToken();
      if (!token) return;
      const res = await apiFetch<{ data: Voice[] }>('/v1/tts/voices', { token });
      setVoices(res.data);
      if (res.data[0]) setVoiceId(res.data[0].id);
    })().catch(() => undefined);
  }, [isLoaded, getToken]);

  async function dub() {
    if (!file) {
      setError('Select or drop a file to dub.');
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    setScript(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to run dubbing.');

      // 1) Transcribe source
      const sttForm = new FormData();
      sttForm.append('file', file);
      if (sourceLang && sourceLang !== 'auto') sttForm.append('language', sourceLang);
      const sttRes = await fetch(`${API_URL}/v1/speech/recognize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: sttForm,
      });
      const sttBody = await sttRes.json();
      if (!sttRes.ok) throw new Error(sttBody?.error?.message ?? `STT failed (${sttRes.status})`);
      const original = String(sttBody.text || '').trim();
      if (!original) throw new Error('Transcription was empty.');

      // 2) Translate to target
      const detected = (sttBody.language as string) || (sourceLang !== 'auto' ? sourceLang : 'en');
      const mt = await apiFetch<{ text: string }>('/v1/translate', {
        method: 'POST',
        token,
        body: JSON.stringify({
          text: original,
          source: detected,
          target: targetLang,
        }),
      });
      const translated = (mt.text || '').trim();
      if (!translated) throw new Error('Translation was empty.');
      setScript(translated);

      // 3) Synthesize with Echo
      const ttsRes = await fetch(`${API_URL}/v1/tts/synthesize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: translated, voice: voiceId, format: 'mp3' }),
      });
      if (!ttsRes.ok) {
        const msg = await ttsRes.text();
        throw new Error(msg || `TTS failed (${ttsRes.status})`);
      }
      const blob = await ttsRes.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setNote(`Dubbed ${detected} → ${targetLang} via STT · Translate · Echo TTS.`);
      setHistory(
        pushCreativeHistory(HISTORY_KEYS.dubbing, {
          name: file.name.replace(/\.[^.]+$/, '') || 'Dub',
          kind: 'dubbing',
          format: 'mp3',
          durationLabel: formatDuration(sttBody.durationSeconds),
          meta: `${targetLang} · ${translated.slice(0, 100)}`,
          previewUrl: url,
          extra: { target: targetLang, text: translated },
        }),
      );
      await credits.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dubbing failed');
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
    <CreativeShell banner breadcrumb="Dubbing">
      <div className="lg-creative-page-head">
        <div>
          <h1>Dubbing</h1>
          <p>Localize spoken content: transcribe, translate with LocaleSelect, then synthesize with Echo.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/translate" className="lg-creative-btn">
            Translate console
          </Link>
          <Link href="/mix" className="lg-creative-btn">
            Mix
          </Link>
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
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
      >
        <div className="lg-creative-drop-zone" onClick={() => inputRef.current?.click()} role="button" tabIndex={0}>
          <strong>{file ? file.name : 'Select files'}</strong>
          <span>{file ? 'Ready to dub' : 'or drop them here'}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.webm"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="lg-creative-drop-bar">
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <label style={{ display: 'grid', gap: 4, fontSize: '0.75rem', color: 'var(--lc-muted)', fontWeight: 650, minWidth: '10rem' }}>
              Source
              <LocaleSelect
                value={sourceLang}
                onChange={setSourceLang}
                languages={catalog.languages}
                locales={catalog.locales}
                dialects={catalog.dialects}
                accents={catalog.accents}
                allowAuto
              />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: '0.75rem', color: 'var(--lc-muted)', fontWeight: 650, minWidth: '10rem' }}>
              Target language
              <LocaleSelect
                value={targetLang}
                onChange={setTargetLang}
                languages={catalog.languages}
                locales={catalog.locales}
                dialects={catalog.dialects}
                accents={catalog.accents}
              />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: '0.75rem', color: 'var(--lc-muted)', fontWeight: 650 }}>
              Voice
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                style={{ padding: '0.45rem 0.55rem', borderRadius: 8, border: '1px solid var(--lc-line)' }}
              >
                {voices.length === 0 ? <option value={voiceId}>{voiceId}</option> : null}
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <span className="lg-creative-credits">{formatCredits(credits.remaining)} credits</span>
          <button
            type="button"
            className="lg-creative-send"
            aria-label="Submit dub"
            disabled={busy || !file}
            onClick={() => void dub()}
          >
            <CreativeIcon name="send" width={16} height={16} />
          </button>
        </div>
      </div>

      {script ? <p className="lg-creative-note">Dub script: {script}</p> : null}
      {audioUrl ? (
        <div style={{ marginTop: '0.85rem' }}>
          <AudioPreviewBar src={audioUrl} label="Dubbed audio" />
        </div>
      ) : null}
      {error ? <p className="lg-creative-error">{error}</p> : null}
      {note ? <p className="lg-creative-note">{note}</p> : null}
      {busy ? <p className="lg-creative-note">Running STT → translate → TTS…</p> : null}

      <div style={{ marginTop: '1.5rem' }}>
        <div className="lg-creative-toolbar">
          <label className="lg-creative-field">
            <CreativeIcon name="search" width={16} height={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your previous dubs…"
              aria-label="Search dubs"
            />
          </label>
        </div>
        {filtered.length === 0 ? (
          <div className="lg-creative-empty">
            <strong>No dubs yet</strong>
            Upload media and choose languages to build history.
          </div>
        ) : (
          filtered.map((h) => (
            <div key={h.id} className="lg-creative-history-row">
              <span className="lg-creative-icon-btn" aria-hidden>
                <CreativeIcon name="dub" />
              </span>
              <div>
                <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{h.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--lc-muted)' }}>{relativeTime(h.createdAt)}</div>
              </div>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>{h.extra?.target ?? '—'}</span>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>{h.durationLabel ?? '—'}</span>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>.{h.format ?? 'mp3'}</span>
              {h.previewUrl ? (
                <a href={h.previewUrl} download={`${h.name}.mp3`} className="lg-creative-icon-btn" aria-label="Download">
                  <CreativeIcon name="download" />
                </a>
              ) : (
                <span className="lg-creative-icon-btn" aria-hidden>
                  <CreativeIcon name="more" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </CreativeShell>
  );
}
