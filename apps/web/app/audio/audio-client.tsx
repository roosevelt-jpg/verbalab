'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import {
  NativeAccentVoicePicker,
  type VoicePickerValue,
} from '@/components/console/native-accent-voice-picker';
import { extractAudioTrackClient } from '@/lib/extract-audio-track';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';

type StudioTab = 'tts' | 'clone' | 'extract' | 'stt' | 'projects';
const STUDIO_TABS = new Set<StudioTab>(['tts', 'clone', 'extract', 'stt', 'projects']);

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

type IsolateResult = {
  format: string;
  mimeType: string;
  audioBase64: string;
  bytes: number;
  speechRatio: number;
  note: string;
};

const LANG_PRESETS: { code: string; label: string; sample: string }[] = [
  { code: 'en', label: 'English', sample: 'Hello, welcome to Lugemi.' },
  { code: 'sw', label: 'Swahili', sample: 'Habari, karibu Lugemi.' },
  { code: 'yo', label: 'Yoruba', sample: 'Ẹ n lẹ, ẹ káàbọ̀ sí Lugemi.' },
  { code: 'am', label: 'Amharic', sample: 'ሰላም፣ ወደ ሉጌሚ እንኳን በደህና መጡ።' },
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

function base64ToWavFile(base64: string, name: string): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: 'audio/wav' });
}

export function AudioClient() {
  const catalog = useLocaleCatalog();
  const { getToken, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [apiKey, setApiKey] = useState('');
  const [tab, setTab] = useState<StudioTab>(
    initialTab && STUDIO_TABS.has(initialTab as StudioTab) ? (initialTab as StudioTab) : 'clone',
  );

  const [language, setLanguage] = useState('sw');
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);

  const [voices, setVoices] = useState<Voice[]>([]);
  const [voice, setVoice] = useState('own:sw-ke-female');
  const [picker, setPicker] = useState<VoicePickerValue>({
    voiceId: 'own:sw-ke-female',
    gender: 'any',
    language: 'any',
    accent: 'any',
    country: 'any',
    toneStyle: 'customer_support',
    emotionProfile: 'customer_support',
  });
  const [speechText, setSpeechText] = useState(LANG_PRESETS[1]!.sample);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [watermarkApplied, setWatermarkApplied] = useState(false);

  const [clones, setClones] = useState<VoiceClone[]>([]);
  const [cloneName, setCloneName] = useState('');
  const [consentNotes, setConsentNotes] = useState('');
  const [consentAttested, setConsentAttested] = useState(false);
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);
  const [samplePreviewUrls, setSamplePreviewUrls] = useState<string[]>([]);

  const [extractFile, setExtractFile] = useState<File | null>(null);
  const [extractNote, setExtractNote] = useState<string | null>(null);
  const [isolatedUrl, setIsolatedUrl] = useState<string | null>(null);
  const [isolatedFile, setIsolatedFile] = useState<File | null>(null);
  const [speechRatio, setSpeechRatio] = useState<number | null>(null);

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const usableClones = useMemo(() => clones.filter((c) => c.usable), [clones]);
  const stockVoices = useMemo(
    () =>
      voices.filter(
        (v) =>
          !v.id.startsWith('own:') &&
          v.provider !== 'own_tts' &&
          v.provider !== 'own_tts_fixture',
      ),
    [voices],
  );
  const ownVoices = useMemo(
    () =>
      voices.filter(
        (v) =>
          v.id.startsWith('own:') || v.provider === 'own_tts' || v.provider === 'own_tts_fixture',
      ),
    [voices],
  );

  async function authHeader(): Promise<string> {
    const token = await getToken();
    if (token) return `Bearer ${token}`;
    if (apiKey.startsWith('lg_live_')) return `Bearer ${apiKey}`;
    throw new Error('Sign in with Clerk, or paste a lg_live_ API key');
  }

  async function refreshClones(token: string) {
    setClones(await apiFetch<VoiceClone[]>('/v1/voice-clones', { token }));
  }

  useEffect(() => {
    void apiFetch<{ data: Voice[] }>('/v1/audio/voices')
      .then((res) => {
        setVoices(res.data);
        const preferred =
          res.data.find((v) => v.id === 'own:sw-ke-female') ??
          res.data.find((v) => v.id.startsWith('own:')) ??
          res.data[0];
        if (preferred) {
          setVoice(preferred.id);
          setPicker((p) => ({ ...p, voiceId: preferred.id }));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await getToken();
        if (token) await refreshClones(token);
      } catch {
        // optional when signed out
      }
    })();
  }, [getToken, isLoaded]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      for (const url of samplePreviewUrls) URL.revokeObjectURL(url);
    };
  }, [samplePreviewUrls]);

  useEffect(() => {
    return () => {
      if (isolatedUrl) URL.revokeObjectURL(isolatedUrl);
    };
  }, [isolatedUrl]);

  function applyLangPreset(code: string) {
    const preset = LANG_PRESETS.find((p) => p.code === code) ?? LANG_PRESETS[0]!;
    setLanguage(preset.code);
    setSpeechText(preset.sample);
  }

  function setSamples(files: File[]) {
    for (const url of samplePreviewUrls) URL.revokeObjectURL(url);
    const next = files.slice(0, 5);
    setSampleFiles(next);
    setSamplePreviewUrls(next.map((f) => URL.createObjectURL(f)));
  }

  function onSampleFilesChange(list: FileList | null) {
    setSamples(list ? Array.from(list) : []);
  }

  function addSampleFile(fileToAdd: File) {
    setSamples([...sampleFiles, fileToAdd].slice(0, 5));
    setMessage(`Added “${fileToAdd.name}” as a clone sample (${Math.min(sampleFiles.length + 1, 5)}/5).`);
    setTab('clone');
  }

  async function startRecording() {
    setError(null);
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone recording is not available in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recordChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const recorded = new File([blob], `lugemi-recorded-${Date.now()}.webm`, {
          type: blob.type || 'audio/webm',
        });
        addSampleFile(recorded);
        setRecording(false);
        mediaRecorderRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setMessage('Recording… speak a clear consent sample, then stop.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start microphone');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function onTranscribe(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setTranscript(null);
    if (!file) {
      setError('Choose an audio file');
      return;
    }
    setLoading(true);
    try {
      const authorization = await authHeader();
      const form = new FormData();
      form.append('file', file);
      if (language) form.append('language', language);
      const res = await fetch(`${API_URL}/v1/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: authorization },
        body: form,
      });
      const body = (await res.json()) as Transcript & { error?: { message: string } };
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
      const authorization = await authHeader();
      const res = await fetch(`${API_URL}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice: voiceId, language: lang }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message: string } };
        throw new Error(body.error?.message ?? `Speech failed (${res.status})`);
      }
      setWatermarkApplied(res.headers.get('x-lugemi-watermark') === 'required');
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
      setTab('tts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech failed');
    } finally {
      setLoading(false);
    }
  }

  async function onSpeak(event: FormEvent) {
    event.preventDefault();
    await speak(speechText, voice, language);
  }

  async function onPreview() {
    await speak(speechText, voice, language);
  }

  async function onCreateClone(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (sampleFiles.length === 0) {
      setError('Choose 1–5 consent sample recordings');
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const form = new FormData();
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
      const body = (await res.json()) as VoiceClone & { error?: { message: string } };
      if (!res.ok) throw new Error(body.error?.message ?? 'Create failed (Pro + consent required)');
      setMessage(
        `Instant clone “${body.name}” enrolled from short samples and submitted for abuse review (pending). Not live model training.`,
      );
      setCloneName('');
      setConsentNotes('');
      setConsentAttested(false);
      setSamples([]);
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
      const token = await getToken();
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
      const token = await getToken();
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

  async function onExtractClient() {
    setError(null);
    setMessage(null);
    setExtractNote(null);
    if (!extractFile) {
      setError('Choose a video or audio file to extract from');
      return;
    }
    setLoading(true);
    try {
      const extracted = await extractAudioTrackClient(extractFile);
      if (isolatedUrl) URL.revokeObjectURL(isolatedUrl);
      setIsolatedUrl(extracted.blobUrl);
      setIsolatedFile(extracted.file);
      setSpeechRatio(null);
      setExtractNote(extracted.note);
      setMessage(
        `Extracted ${extracted.durationSeconds.toFixed(1)}s mono WAV @ ${extracted.sampleRate} Hz. Add it as a clone sample or run Lugemi isolate next.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}. Try a WAV/MP3/M4A, or use Lugemi isolate on a supported audio file.`
          : 'Client extract failed',
      );
    } finally {
      setLoading(false);
    }
  }

  async function onIsolateServer() {
    setError(null);
    setMessage(null);
    setExtractNote(null);
    const source = isolatedFile ?? extractFile;
    if (!source) {
      setError('Choose a file (or extract a track first)');
      return;
    }
    setLoading(true);
    try {
      const authorization = await authHeader();
      const form = new FormData();
      form.append('file', source);
      const res = await fetch(`${API_URL}/v1/audio-intelligence/isolate`, {
        method: 'POST',
        headers: { Authorization: authorization },
        body: form,
      });
      const body = (await res.json()) as IsolateResult & { error?: { message: string } };
      if (!res.ok) throw new Error(body.error?.message ?? `Isolate failed (${res.status})`);
      const wavFile = base64ToWavFile(body.audioBase64, `lugemi-isolated-${Date.now()}.wav`);
      if (isolatedUrl) URL.revokeObjectURL(isolatedUrl);
      const url = URL.createObjectURL(wavFile);
      setIsolatedUrl(url);
      setIsolatedFile(wavFile);
      setSpeechRatio(body.speechRatio);
      setExtractNote(body.note);
      setMessage(
        `Voice isolation complete (speech ratio ${(body.speechRatio * 100).toFixed(0)}%). Energy VAD — not neural stem separation.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Isolate failed');
    } finally {
      setLoading(false);
    }
  }

  async function copyCloneVoice(voiceId: string) {
    try {
      await navigator.clipboard.writeText(voiceId);
      setCopiedId(voiceId);
      setMessage(`Copied ${voiceId} — use in POST /v1/audio/speech, Studio, Dubbing, MCP/CLI.`);
    } catch {
      setError('Could not copy to clipboard');
    }
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Voice Studio</h1>
      <p style={ledeStyle}>
        Instant Voice Cloning from short consent samples, TTS with <code className="vl-code">clone:{'{id}'}</code>,
        track extract / isolation, and project handoff for video & song workflows. Lugemi brand only — no live
        model training theater.
      </p>

      <section className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.2rem 1.35rem' }} aria-label="Product answers">
        <h2 style={{ ...sectionH, marginTop: 0 }}>What ships today</h2>
        <dl style={{ margin: 0, display: 'grid', gap: '0.85rem' }}>
          <div>
            <dt style={qStyle}>Realtime clone?</dt>
            <dd style={aStyle}>
              <strong>Instant clone</strong> from a short sample after consent — enroll, abuse review, then speak.
              Not live end-to-end model training over a stream. SSE enrollment progress exists; WebSocket live
              capture training does not.
            </dd>
          </div>
          <div>
            <dt style={qStyle}>Upload a recorded voice?</dt>
            <dd style={aStyle}>
              Yes — record in-browser or upload 1–5 audio samples with consent attestation (Pro). Approved clones
              speak as <code className="vl-code">clone:{'{id}'}</code> with watermark required.
            </dd>
          </div>
          <div>
            <dt style={qStyle}>Extract voice from uploaded files?</dt>
            <dd style={aStyle}>
              Available today: client-side audio-track extract from video/audio the browser can decode,
              plus Lugemi <code className="vl-code">POST /v1/audio-intelligence/isolate</code> (energy VAD).
              Neural stem-separation / entertainment isolator OS is not on this surface.
            </dd>
          </div>
        </dl>
      </section>

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
            ['clone', 'Instant clone'],
            ['extract', 'Extract / isolate'],
            ['tts', 'Speak'],
            ['projects', 'Use in projects'],
            ['stt', 'Transcribe'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'vl-btn' : 'vl-btn vl-btn-secondary'}
            onClick={() => setTab(id)}
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
                  onClick={() => applyLangPreset(p.code)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid var(--line)', borderRadius: '0.5rem', padding: '0.85rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.55rem' }}>
              Native accent voice picker
            </div>
            <NativeAccentVoicePicker
              value={picker}
              onChange={(next) => {
                setPicker(next);
                setVoice(next.voiceId);
              }}
              preferOwn
              showEmotionTone
            />
          </div>

          <label className="vl-label">
            Voice (advanced)
            <select
              className="vl-field"
              value={voice}
              onChange={(e) => {
                setVoice(e.target.value);
                setPicker((p) => ({ ...p, voiceId: e.target.value }));
              }}
            >
              <optgroup label="Stock">
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
                <optgroup label="Own TTS (Africa-first)">
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
            Prefer <code className="vl-code">own:*</code> region voices for native accent metadata. Approved clones
            use <code className="vl-code">clone:{'{id}'}</code>. Own TTS needs{' '}
            <code className="vl-code">OWN_TTS_URL</code> or fixture mode.
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
            <button type="button" className="vl-btn vl-btn-secondary" disabled={loading} onClick={() => void onPreview()}>
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
            <LocaleSelect
              className="vl-field"
              value={language}
              onChange={setLanguage}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
              allowEmpty
              emptyLabel="—"
            />
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

      {tab === 'extract' ? (
        <div className="vl-panel" style={{ display: 'grid', gap: '1rem', padding: '1.35rem', marginTop: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            Pull a voice track from an uploaded video/audio file, then optionally run Lugemi isolate (energy VAD)
            before cloning. Entertainment-grade neural stem separation is not on this surface.
          </p>
          <label className="vl-label">
            Video or audio file
            <input
              className="vl-field"
              type="file"
              accept="audio/*,video/*,.mp3,.wav,.m4a,.webm,.ogg,.flac,.mp4,.mov,.mkv"
              onChange={(e) => setExtractFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="vl-btn" disabled={loading || !extractFile} onClick={() => void onExtractClient()}>
              {loading ? 'Working…' : 'Extract audio track (client)'}
            </button>
            <button
              type="button"
              className="vl-btn vl-btn-secondary"
              disabled={loading || (!extractFile && !isolatedFile)}
              onClick={() => void onIsolateServer()}
            >
              {loading ? 'Working…' : 'Isolate voice (Lugemi API)'}
            </button>
            {isolatedFile ? (
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => addSampleFile(isolatedFile)}>
                Use as clone sample
              </button>
            ) : null}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Isolation path: energy VAD isolate + multi-band stems. Neural stem-separation removers are not
            offered here.
          </div>
          {extractNote ? <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{extractNote}</p> : null}
          {speechRatio != null ? (
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Speech ratio: {(speechRatio * 100).toFixed(0)}%</p>
          ) : null}
          {isolatedUrl ? (
            <div>
              <audio controls src={isolatedUrl} style={{ width: '100%' }} />
              <a
                href={isolatedUrl}
                download={isolatedFile?.name ?? 'lugemi-extracted.wav'}
                className="vl-btn vl-btn-secondary"
                style={{ display: 'inline-block', marginTop: '0.75rem', textDecoration: 'none' }}
              >
                Download WAV
              </a>
            </div>
          ) : null}
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            Also available in <Link href="/audio-intelligence">Audio Intelligence</Link> and{' '}
            <Link href="/voice-enhancement">Voice Enhancement</Link>.
          </p>
        </div>
      ) : null}

      {tab === 'projects' ? (
        <div className="vl-panel" style={{ display: 'grid', gap: '1.1rem', padding: '1.35rem', marginTop: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            After a clone is approved, drop <code className="vl-code">clone:{'{id}'}</code> into speech, dubbing,
            Studio, Chat Studio, and developer surfaces.
          </p>
          {!usableClones.length ? (
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              No approved clones yet — enroll under Instant clone, then approve in review.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
              {usableClones.map((c) => (
                <li
                  key={c.id}
                  style={{
                    borderTop: '1px solid var(--line)',
                    paddingTop: '0.65rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{c.voice}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void copyCloneVoice(c.voice)}>
                      {copiedId === c.voice ? 'Copied' : 'Copy voice id'}
                    </button>
                    <button
                      type="button"
                      className="vl-btn"
                      disabled={loading}
                      onClick={() => {
                        setVoice(c.voice);
                        void speak(speechText || LANG_PRESETS[1]!.sample, c.voice, language);
                      }}
                    >
                      Speak with clone
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link href="/voice-studio" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Voice Studio (SSML)
            </Link>
            <Link href="/chat" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Chat Studio
            </Link>
            <Link href="/p/dubbing" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Video dubbing path
            </Link>
            <Link href="/p/ai-music-generator" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Song / music path
            </Link>
            <Link href="/developers" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              MCP / CLI / SDKs
            </Link>
            <Link href="/docs" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              API docs
            </Link>
          </div>
          <pre className="vl-code" style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
            {`POST /v1/audio/speech
{ "text": "…", "voice": "clone:<id>", "language": "sw" }
→ header X-Lugemi-Watermark: required`}
          </pre>
        </div>
      ) : null}

      {tab === 'clone' ? (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
          <form
            onSubmit={onCreateClone}
            className="vl-panel"
            style={{ display: 'grid', gap: '1rem', padding: '1.35rem' }}
          >
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
              <strong>Instant Voice Cloning</strong> — short samples + consent, then abuse review. Pro required.
              Watermarking is always required on clone speech. This is not multi-hour professional model training.
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
              Upload recorded samples (1–5)
              <input
                className="vl-field"
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac"
                multiple
                onChange={(e) => onSampleFilesChange(e.target.files)}
                required={sampleFiles.length === 0}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!recording ? (
                <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void startRecording()}>
                  Record sample
                </button>
              ) : (
                <button type="button" className="vl-btn vl-btn-danger" onClick={stopRecording}>
                  Stop recording
                </button>
              )}
              <button type="button" className="vl-btn vl-btn-secondary" onClick={() => setTab('extract')}>
                Extract from video/audio…
              </button>
            </div>
            {samplePreviewUrls.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {samplePreviewUrls.map((url, i) => (
                  <div key={url}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                      {sampleFiles[i]?.name}
                    </div>
                    <audio controls src={url} style={{ width: '100%' }} />
                  </div>
                ))}
              </div>
            ) : null}
            <button type="submit" className="vl-btn" disabled={loading}>
              {loading ? 'Submitting…' : 'Enroll instant clone (Pro)'}
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
                          onClick={() => void reviewClone(c.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="vl-btn vl-btn-secondary"
                          onClick={() => void reviewClone(c.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {c.usable ? (
                      <>
                        <button
                          type="button"
                          className="vl-btn vl-btn-secondary"
                          disabled={loading}
                          onClick={() => {
                            setVoice(c.voice);
                            void speak(speechText || LANG_PRESETS[1]!.sample, c.voice, language);
                          }}
                        >
                          Try clone
                        </button>
                        <button type="button" className="vl-btn vl-btn-secondary" onClick={() => setTab('projects')}>
                          Use in project
                        </button>
                      </>
                    ) : null}
                    {c.status !== 'disabled' && c.status !== 'rejected' ? (
                      <button
                        type="button"
                        className="vl-btn vl-btn-danger"
                        onClick={() => void disableClone(c.id)}
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

const sectionH: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  fontWeight: 650,
  margin: '0 0 0.75rem',
};

const qStyle: CSSProperties = {
  fontWeight: 650,
  fontSize: '0.9rem',
  marginBottom: '0.2rem',
};

const aStyle: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  fontSize: '0.9rem',
  lineHeight: 1.5,
};
