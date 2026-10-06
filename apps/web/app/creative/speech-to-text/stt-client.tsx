'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
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

type Recognition = {
  text: string;
  language: string | null;
  durationSeconds: number;
  provider?: string;
  confidence: number | null;
};


export function CreativeSpeechToTextClient() {
  if (!isClerkConfigured()) {
    return <CreativeSpeechToTextClientInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeSpeechToTextClientAuthed />;
}

function CreativeSpeechToTextClientAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeSpeechToTextClientInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeSpeechToTextClientInner({ getToken, isLoaded }: { getToken: any; isLoaded: any }) {
  // auth via props: getToken, isLoaded
  const catalog = useLocaleCatalog();
  const credits = useCreativeCredits();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'transcriptions' | 'speakers'>('transcriptions');
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('auto');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<CreativeHistoryItem[]>([]);
  const [result, setResult] = useState<Recognition | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{ requests: number; minutes: number } | null>(null);

  const refreshUsage = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const usage = await apiFetch<{ stt: { requests: number; minutes: number } }>(
        '/v1/speech/engine/analytics',
        { token },
      );
      setAnalytics(usage.stt);
    } catch {
      /* optional */
    }
  }, [getToken]);

  useEffect(() => {
    setHistory(loadCreativeHistory(HISTORY_KEYS.stt));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void refreshUsage();
  }, [isLoaded, refreshUsage]);

  async function transcribe(selected?: File | null) {
    const source = selected ?? file;
    if (!source) {
      setError('Choose an audio or video file to transcribe.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to transcribe with Lugemi speech recognition.');
      const form = new FormData();
      form.append('file', source);
      if (language && language !== 'auto') form.append('language', language);
      const res = await fetch(`${API_URL}/v1/speech/recognize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      const rec = body as Recognition;
      setResult(rec);
      setHistory(
        pushCreativeHistory(HISTORY_KEYS.stt, {
          name: source.name.replace(/\.[^.]+$/, '') || 'Transcription',
          kind: 'stt',
          format: 'txt',
          durationLabel: formatDuration(rec.durationSeconds),
          meta: (rec.text || '').slice(0, 160),
          extra: { text: rec.text || '', language: rec.language || language },
        }),
      );
      await refreshUsage();
      await credits.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
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
    <CreativeShell banner breadcrumb="Speech to Text">
      <div className="lg-creative-page-head">
        <div>
          <h1>Speech to text</h1>
          <p>Transcribe audio and video files with Lugemi ASR — accents, dialects, and code-switching aware.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/speech-recognition" className="lg-creative-btn">
            Full console
          </Link>
          <button
            type="button"
            className="lg-creative-btn primary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <CreativeIcon name="upload" width={16} height={16} />
            {busy ? 'Transcribing…' : 'Transcribe files'}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*,.mp3,.wav,.m4a,.webm,.ogg,.flac,.mp4"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          if (f) void transcribe(f);
        }}
      />

      <div className="lg-creative-tabs">
        <button type="button" className={tab === 'transcriptions' ? 'is-active' : undefined} onClick={() => setTab('transcriptions')}>
          Transcriptions
        </button>
        <button type="button" className={tab === 'speakers' ? 'is-active' : undefined} onClick={() => setTab('speakers')}>
          Speakers
        </button>
      </div>

      <div
        style={{
          marginBottom: '1rem',
          padding: '0.85rem 1rem',
          borderRadius: 12,
          background: 'rgba(0,184,174,0.1)',
          border: '1px solid rgba(0,184,174,0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.9rem', color: 'var(--lc-navy)' }}>
          Echo Listen ASR — batch recognize with vocabulary packs on the full Speech Recognition console.
        </span>
        <Link href="/speech" className="lg-creative-btn primary">
          Speech Cloud
        </Link>
      </div>

      <div className="lg-creative-toolbar">
        <label className="lg-creative-field" style={{ maxWidth: '16rem' }}>
          Language
          <div style={{ flex: 1, minWidth: 0 }}>
            <LocaleSelect
              value={language}
              onChange={setLanguage}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
              allowAuto
            />
          </div>
        </label>
        <label className="lg-creative-field">
          <CreativeIcon name="search" width={16} height={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcripts…"
            aria-label="Search transcripts"
          />
        </label>
        <span className="lg-creative-credits">
          {analytics
            ? `${analytics.requests} STT · ${analytics.minutes} min`
            : `${formatCredits(credits.remaining)} credits`}
        </span>
      </div>

      {error ? <p className="lg-creative-error">{error}</p> : null}
      {result ? (
        <div className="lg-creative-note" style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
          <strong style={{ display: 'block', marginBottom: 6, color: 'var(--lc-navy)' }}>
            Latest · {formatDuration(result.durationSeconds)}
            {result.language ? ` · ${result.language}` : ''}
          </strong>
          {result.text}
        </div>
      ) : null}

      {tab === 'speakers' ? (
        <div className="lg-creative-empty">
          <strong>Speaker labels</strong>
          Diarization speaker packs are not a separate Creative SKU yet — use Speech Recognition segments for timed text.
        </div>
      ) : filtered.length === 0 ? (
        <div className="lg-creative-empty">
          <strong>No transcripts yet</strong>
          Upload a file to run `/v1/speech/recognize` and build local history.
        </div>
      ) : (
        <table className="lg-creative-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Created at</th>
              <th>Duration</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id}>
                <td>
                  <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{h.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)', maxWidth: '28rem' }}>{h.meta}</div>
                </td>
                <td style={{ color: 'var(--lc-muted)' }}>{relativeTime(h.createdAt)}</td>
                <td style={{ color: 'var(--lc-muted)' }}>{h.durationLabel ?? '—'}</td>
                <td>
                  <button
                    type="button"
                    className="lg-creative-icon-btn"
                    aria-label="Copy transcript"
                    onClick={() => {
                      const text = h.extra?.text ?? h.meta ?? '';
                      void navigator.clipboard.writeText(text);
                    }}
                  >
                    <CreativeIcon name="more" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CreativeShell>
  );
}
