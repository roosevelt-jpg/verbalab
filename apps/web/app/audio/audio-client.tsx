'use client';

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Transcript = {
  text: string;
  language: string | null;
  durationSeconds: number;
  durationMinutes: number;
  provider: string;
};

type Voice = { id: string; name: string; gender: string; provider?: string; languages?: string[] };

type VoiceClone = {
  id: string;
  voice: string;
  name: string;
  status: string;
  usable: boolean;
  watermarkRequired: boolean;
  consentNotes: string;
};

const LANG_PRESETS: { code: string; label: string; sample: string }[] = [
  { code: 'en', label: 'English', sample: 'Hello, welcome to Lugemi.' },
  { code: 'sw', label: 'Swahili', sample: 'Habari, karibu Lugemi.' },
  { code: 'yo', label: 'Yoruba', sample: 'Ẹ n lẹ, ẹ káàbọ̀ sí Lugemi.' },
  { code: 'am', label: 'Amharic', sample: 'ሰላም፣ ወደ ቬርባላብ እንኳን በደህና መጡ።' },
  { code: 'fr', label: 'French', sample: 'Bonjour, bienvenue chez Lugemi.' },
];

function statusBadge(status: string): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
    textTransform: 'capitalize',
  };
  if (status === 'approved') return { ...base, background: 'var(--bg-soft)', color: 'var(--ink)' };
  if (status === 'pending_review') return { ...base, background: '#f5e6c8', color: '#5c4500' };
  if (status === 'rejected' || status === 'disabled')
    return { ...base, background: '#f5d4d4', color: 'var(--bad)' };
  return { ...base, background: 'var(--bg-soft)', color: 'var(--muted)' };
}

export function AudioClient {
  const { getToken, isLoaded } = useAuth;
  const [apiKey, setApiKey] = useState('');
  const [tab, setTab] = useState<'tts' | 'clone' | 'stt'>('tts');

  const [language, setLanguage] = useState('sw');
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);

  const [voices, setVoices] = useState<Voice[]>([]);
  const [voice, setVoice] = useState('alloy');
  const [speechText, setSpeechText] = useState(LANG_PRESETS[1]!.sample);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [watermarkApplied, setWatermarkApplied] = useState(false);

  const [clones, setClones] = useState<VoiceClone[]>([]);
  const [cloneName, setCloneName] = useState('');
  const [consentNotes, setConsentNotes] = useState('');
  const [consentAttested, setConsentAttested] = useState(false);
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);
  const [samplePreviewUrls, setSamplePreviewUrls] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const usableClones = useMemo( => clones.filter((c) => c.usable), [clones]);
  const stockVoices = useMemo(
     =>
      voices.filter(
        (v) =>
          !v.id.startsWith('own:') &&
          v.provider !== 'own_tts' &&
          v.provider !== 'own_tts_fixture',
      ),
    [voices],
  );
  const ownVoices = useMemo(
     =>
      voices.filter(
        (v) =>
          v.id.startsWith('own:') || v.provider === 'own_tts' || v.provider === 'own_tts_fixture',
      ),
    [voices],
  );

  async function authHeader: Promise<string> {
    const token = await getToken;
    if (token) return `Bearer ${token}`;
    if (apiKey.startsWith('lg_live_')) return `Bearer ${apiKey}`;
    throw new Error('Sign in with Clerk, or paste a lg_live_ API key');
  }

  async function refreshClones(token: string) {
    setClones(await apiFetch<VoiceClone[]>('/v1/voice-clones', { token }));
  }

  useEffect( => {
    void apiFetch<{ data: Voice[] }>('/v1/audio/voices')
      .then((res) => {
        setVoices(res.data);
        if (res.data[0]) setVoice(res.data[0].id);
      })
      .catch( => undefined);
  }, []);

  useEffect( => {
    if (!isLoaded) return;
    void (async  => {
      try {
        const token = await getToken;
        if (token) await refreshClones(token);
      } catch {
        // optional when signed out
      }
    });
  }, [getToken, isLoaded]);

  useEffect( => {
    return  => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect( => {
    return  => {
      for (const url of samplePreviewUrls) URL.revokeObjectURL(url);
    };
  }, [samplePreviewUrls]);

  function applyLangPreset(code: string) {
    const preset = LANG_PRESETS.find((p) => p.code === code) ?? LANG_PRESETS[0]!;
    setLanguage(preset.code);
    setSpeechText(preset.sample);
  }

  function onSampleFilesChange(list: FileList | null) {
    for (const url of samplePreviewUrls) URL.revokeObjectURL(url);
    const files = list ? Array.from(list).slice(0, 5) : [];
    setSampleFiles(files);
    setSamplePreviewUrls(files.map((f) => URL.createObjectURL(f)));
  }

  async function onTranscribe(event: FormEvent) {
    event.preventDefault;
    setError(null);
    setTranscript(null);
    if (!file) {
      setError('Choose an audio file');
      return;
    }
    setLoading(true);
    try {
      const authorization = await authHeader;
      const form = new FormData;
      form.append('file', file);
      if (language) form.append('language', language);
      const res = await fetch(`${API_URL}/v1/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: authorization },
        body: form,
      });
      const body = (await res.json) as Transcript & { error?: { message: string } };
      if (!res.ok) {
        throw new Error(body.error?.message ?? `Transcription failed (${res.status})`);
      }
      setTranscript(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
    } finally {
      setLoading(false);
    }
  }

  async function speak(text: string, voiceId: string, lang: string) {
    setError(null);
    setWatermarkApplied(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setLoading(true);
    try {
      const authorization = await authHeader;
      const res = await fetch(`${API_URL}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice: voiceId, language: lang }),
      });
      if (!res.ok) {
        const body = (await res.json.catch( => ({}))) as { error?: { message: string } };
        throw new Error(body.error?.message ?? `Speech failed (${res.status})`);
      }
      setWatermarkApplied(res.headers.get('x-lugemi-watermark') === 'required');
      const blob = await res.blob;
      setAudioUrl(URL.createObjectURL(blob));
      setTab('tts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech failed');
    } finally {
      setLoading(false);
    }
  }

  async function onSpeak(event: FormEvent) {
    event.preventDefault;
    await speak(speechText, voice, language);
  }

  async function onPreview {
    await speak(speechText, voice, language);
  }

  async function onCreateClone(event: FormEvent) {
    event.preventDefault;
    setError(null);
    setMessage(null);
    if (sampleFiles.length === 0) {
      setError('Choose 1–5 consent sample recordings');
      return;
    }
    setLoading(true);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const form = new FormData;
      form.append('name', cloneName);
      form.append('consentNotes', consentNotes);
      form.append('consentAttested', consentAttested ? 'true' : 'false');
      for (const sample of sampleFiles) {
        form.append('samples', sample);
      }
      const res = await fetch(`${API_URL}/v1/voice-clones`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = (await res.json) as VoiceClone & { error?: { message: string } };
      if (!res.ok) throw new Error(body.error?.message ?? 'Create failed (Pro + consent required)');
      setMessage(`Clone “${body.name}” submitted for abuse review (pending).`);
      setCloneName('');
      setConsentNotes('');
      setConsentAttested(false);
      onSampleFilesChange(null);
      await refreshClones(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone create failed');
    } finally {
      setLoading(false);
    }
  }

  async function reviewClone(id: string, decision: 'approved' | 'rejected') {
    setError(null);
    setMessage(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/voice-clones/${id}/review`, {
        method: 'POST',
        token,
        body: JSON.stringify({ decision }),
      });
      setMessage(decision === 'approved' ? 'Approved — usable as clone:{id} voice.' : 'Rejected.');
      await refreshClones(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
    }
  }

  async function disableClone(id: string) {
    setError(null);
    setMessage(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/voice-clones/${id}/disable`, {
        method: 'POST',
        token,
        body: JSON.stringify({ reason: 'Disabled from Voice Studio' }),
      });
      setMessage('Clone disabled — removed from usable picker.');
      if (voice === `clone:${id}`) setVoice(voices[0]?.id ?? 'alloy');
      await refreshClones(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disable failed');
    }
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Voice Studio</h1>
      <p style={ledeStyle}>
        African-language TTS demos, stock OpenAI voices, rented own-TTS (`own:*`), and consent-gated clones.
        Vendors + optional rented open-weight under the hood — no in-house clone training. Clones always
        require watermarking and abuse review.
      </p>

      <label className="vl-label" style={{ display: 'block', marginTop: '1.5rem' }}>
        API key (optional if signed in)
        <input
          className="vl-field vl-code"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="lg_live_... (fallback when not signed in)"
        />
      </label>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        {(
          [
            ['tts', 'Speak'],
            ['clone', 'Clones'],
            ['stt', 'Transcribe'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'vl-btn' : 'vl-btn vl-btn-secondary'}
            onClick={ => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'tts' ? (
        <form
          onSubmit={onSpeak}
          className="vl-panel"
          style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1rem' }}
        >
          <div>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.45rem' }}>Language preset</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {LANG_PRESETS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  className={language === p.code ? 'vl-btn' : 'vl-btn vl-btn-secondary'}
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem' }}
                  onClick={ => applyLangPreset(p.code)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label className="vl-label">
            Voice
            <select className="vl-field" value={voice} onChange={(e) => setVoice(e.target.value)}>
              <optgroup label="Stock (OpenAI)">
                {(stockVoices.length
                  ? stockVoices
                  : [{ id: 'alloy', name: 'Alloy', gender: 'neutral' }]
                ).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.id})
                  </option>
                ))}
              </optgroup>
              {ownVoices.length > 0 ? (
                <optgroup label="Own TTS (rented / African)">
                  {ownVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {usableClones.length > 0 ? (
                <optgroup label="Approved clones">
                  {usableClones.map((c) => (
                    <option key={c.id} value={c.voice}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </label>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.8rem' }}>
            Own TTS voices (`own:*`) need <code className="vl-code">OWN_TTS_URL</code> (Modal/open-weight) or fixture
            mode. OpenAI remains the default stock path.
          </p>

          <label className="vl-label">
            Text
            <textarea
              className="vl-field"
              rows={4}
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              required
            />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="vl-btn vl-btn-secondary" disabled={loading} onClick={ => void onPreview}>
              {loading ? 'Working…' : 'Preview'}
            </button>
            <button type="submit" className="vl-btn" disabled={loading}>
              {loading ? 'Synthesizing…' : 'Generate speech'}
            </button>
          </div>
        </form>
      ) : null}

      {tab === 'stt' ? (
        <form
          onSubmit={onTranscribe}
          className="vl-panel"
          style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1rem' }}
        >
          <label className="vl-label">
            Language hint
            <input className="vl-field" value={language} onChange={(e) => setLanguage(e.target.value)} />
          </label>
          <label className="vl-label">
            Audio file
            <input
              className="vl-field"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>
          <button type="submit" className="vl-btn" disabled={loading}>
            {loading ? 'Transcribing…' : 'Transcribe'}
          </button>
        </form>
      ) : null}

      {tab === 'clone' ? (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
          <form
            onSubmit={onCreateClone}
            className="vl-panel"
            style={{ display: 'grid', gap: '1rem', padding: '1.35rem' }}
          >
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
              Requires Pro, speaker consent attestation, and an abuse review before the clone can
              speak. Watermarking is always required on clone speech.
            </p>
            <label className="vl-label">
              Display name
              <input
                className="vl-field"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                required
              />
            </label>
            <label className="vl-label">
              Consent notes
              <textarea
                className="vl-field"
                rows={3}
                value={consentNotes}
                onChange={(e) => setConsentNotes(e.target.value)}
                placeholder="e.g. Signed talent release TR-42 on file"
                required
              />
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={consentAttested}
                onChange={(e) => setConsentAttested(e.target.checked)}
              />
              I attest I have rights and informed consent from the speaker
            </label>
            <label className="vl-label">
              Consent samples (1–5)
              <input
                className="vl-field"
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac"
                multiple
                onChange={(e) => onSampleFilesChange(e.target.files)}
                required={sampleFiles.length === 0}
              />
            </label>
            {samplePreviewUrls.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {samplePreviewUrls.map((url, i) => (
                  <audio key={url} controls src={url} style={{ width: '100%' }} />
                ))}
              </div>
            ) : null}
            <button type="submit" className="vl-btn" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit for review (Pro)'}
            </button>
          </form>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {clones.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No voice clones yet.</p>
            ) : (
              clones.map((c) => (
                <div
                  key={c.id}
                  className="vl-panel"
                  style={{
                    padding: '0.9rem 1.1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>
                      {c.name}{' '}
                      <span style={statusBadge(c.status)}>{c.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {c.voice}
                      {c.watermarkRequired ? ' · watermark required' : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {c.status === 'pending_review' ? (
                      <>
                        <button
                          type="button"
                          className="vl-btn"
                          onClick={ => void reviewClone(c.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="vl-btn vl-btn-secondary"
                          onClick={ => void reviewClone(c.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {c.usable ? (
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        disabled={loading}
                        onClick={ => {
                          setVoice(c.voice);
                          void speak(speechText || LANG_PRESETS[1]!.sample, c.voice, language);
                        }}
                      >
                        Try clone
                      </button>
                    ) : null}
                    {c.status !== 'disabled' && c.status !== 'rejected' ? (
                      <button
                        type="button"
                        className="vl-btn vl-btn-danger"
                        onClick={ => void disableClone(c.id)}
                      >
                        Disable
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--good, #0a7a3e)', marginTop: '1rem' }}>{message}</p> : null}

      {transcript && tab === 'stt' ? (
        <div className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.35rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            {transcript.provider} · {transcript.durationSeconds}s ({transcript.durationMinutes} min)
            {transcript.language ? ` · ${transcript.language}` : ''}
          </p>
          <pre className="vl-code" style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
            {transcript.text}
          </pre>
        </div>
      ) : null}

      {audioUrl ? (
        <div className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.35rem' }}>
          {watermarkApplied ? (
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
              Watermark required on this clone speech (`X-Lugemi-Watermark`).
            </p>
          ) : null}
          <audio controls src={audioUrl} style={{ width: '100%' }} />
          <a
            href={audioUrl}
            download="lugemi-speech.mp3"
            className="vl-btn vl-btn-secondary"
            style={{ display: 'inline-block', marginTop: '0.75rem', textDecoration: 'none' }}
          >
            Download
          </a>
        </div>
      ) : null}
    </AppShell>
  );
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.03em',
  fontSize: '2rem',
};

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0.5rem 0 0',
  lineHeight: 1.55,
};
