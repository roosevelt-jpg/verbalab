'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Prompt = { id: string; text: string; category: string };

type Session = {
  speaker: { name: string; dialect: string; dialectName: string; consented: boolean; withdrawn: boolean };
  consent: { version: string; paragraphs: string[] };
  progress: { recorded: number; skipped: number; totalPrompts: number; recordedMs: number };
  prompts: Prompt[];
};

type Take = { blob: Blob; url: string; durationMs: number };

const MAX_TAKE_MS = 30_000;

/** Raw microphone: browser "voice clean-up" changes how a person sounds, which ruins training data. */
const RAW_AUDIO: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1,
};

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) =>
    MediaRecorder.isTypeSupported(t),
  );
}

function minutes(ms: number): string {
  return `${(ms / 60_000).toFixed(1)} min`;
}

const page: React.CSSProperties = { maxWidth: 720, margin: '0 auto', padding: '2rem 1rem 4rem' };
const card: React.CSSProperties = { padding: '1.5rem', marginTop: '1.25rem' };
const muted: React.CSSProperties = { color: 'var(--muted)' };

export function RecorderClient({ token }: { token: string }) {
  const base = `/v1/voice-data/session/${encodeURIComponent(token)}`;
  const [session, setSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<Prompt[]>([]);

  const [fullName, setFullName] = useState('');
  const [adult, setAdult] = useState(false);
  const [nativeSpeaker, setNativeSpeaker] = useState(false);
  const [agree, setAgree] = useState(false);

  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [take, setTake] = useState<Take | null>(null);
  const [flagging, setFlagging] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await apiFetch<Session>(base, { workspaceId: null, organizationId: null });
      setSession(s);
      setQueue(s.prompts);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'This recording link could not be opened');
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close();
    },
    [],
  );

  useEffect(() => () => {
    if (take) URL.revokeObjectURL(take.url);
  }, [take]);

  const prompt = queue[0];

  async function signConsent() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`${base}/consent`, {
        method: 'POST',
        workspaceId: null,
        organizationId: null,
        body: JSON.stringify({ fullName, adult, nativeSpeaker, agree }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save consent');
    } finally {
      setBusy(false);
    }
  }

  async function ensureStream(): Promise<MediaStream> {
    if (streamRef.current) return streamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: RAW_AUDIO });
    streamRef.current = stream;
    return stream;
  }

  function meter(stream: MediaStream) {
    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let peak = 0;
      for (const v of buf) peak = Math.max(peak, Math.abs(v));
      setLevel(peak);
      setElapsedMs(Date.now() - startedAtRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  async function startRecording() {
    setError(null);
    if (take) {
      URL.revokeObjectURL(take.url);
      setTake(null);
    }
    try {
      const stream = await ensureStream();
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 128_000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        const durationMs = Date.now() - startedAtRef.current;
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
        setRecording(false);
        setLevel(0);
        setTake({ blob, url: URL.createObjectURL(blob), durationMs });
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      recorder.start();
      setRecording(true);
      meter(stream);
      stopTimerRef.current = setTimeout(() => recorder.state === 'recording' && recorder.stop(), MAX_TAKE_MS);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow the microphone for lugemi.com in your browser settings and try again.'
          : err instanceof Error
            ? err.message
            : 'Could not start the microphone',
      );
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  async function advance() {
    const rest = queue.slice(1);
    setQueue(rest);
    setTake(null);
    setFlagging(false);
    setSuggestion('');
    if (rest.length === 0) await load();
  }

  async function saveTake() {
    if (!take || !prompt) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      const ext = take.blob.type.includes('mp4') ? 'm4a' : take.blob.type.includes('ogg') ? 'ogg' : 'webm';
      form.append('audio', take.blob, `take.${ext}`);
      form.append('promptId', prompt.id);
      form.append('durationMs', String(take.durationMs));
      await apiFetch(`${base}/recordings`, { method: 'POST', workspaceId: null, organizationId: null, body: form });
      setSession((s) =>
        s
          ? {
              ...s,
              progress: {
                ...s.progress,
                recorded: s.progress.recorded + 1,
                recordedMs: s.progress.recordedMs + take.durationMs,
              },
            }
          : s,
      );
      await advance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — please try again');
    } finally {
      setBusy(false);
    }
  }

  async function sendFeedback() {
    if (!prompt) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`${base}/feedback`, {
        method: 'POST',
        workspaceId: null,
        organizationId: null,
        body: JSON.stringify({ promptId: prompt.id, suggestion }),
      });
      setSession((s) => (s ? { ...s, progress: { ...s.progress, skipped: s.progress.skipped + 1 } } : s));
      await advance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your note');
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!window.confirm('Withdraw from Lugemi voice recording? No more recordings will be accepted from this link.')) {
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`${base}/withdraw`, { method: 'POST', workspaceId: null, organizationId: null });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <main style={page}>
        <h1>Lugemi voice recording</h1>
        <p className="vl-panel" style={{ ...card, color: 'var(--bad)' }}>{loadError}</p>
      </main>
    );
  }
  if (!session) {
    return (
      <main style={page}>
        <p style={muted}>Opening your recording session…</p>
      </main>
    );
  }

  const { speaker, progress } = session;
  const handled = progress.recorded + progress.skipped;
  const pct = progress.totalPrompts ? Math.min(100, Math.round((handled / progress.totalPrompts) * 100)) : 0;

  return (
    <main style={page}>
      <p style={{ ...muted, margin: 0 }}>Lugemi native voices</p>
      <h1 style={{ margin: '0.25rem 0 0.5rem' }}>Welcome, {speaker.name}</h1>
      <p style={muted}>
        You are recording <strong>{speaker.dialectName}</strong>. Read each sentence the way you would say it to
        family and friends at home — your natural voice is exactly what we need.
      </p>

      {error ? <p className="vl-panel" style={{ ...card, color: 'var(--bad)' }}>{error}</p> : null}

      {speaker.withdrawn ? (
        <section className="vl-panel" style={card}>
          <h2 style={{ marginTop: 0 }}>You have withdrawn</h2>
          <p style={muted}>
            Thank you for your time. No more recordings are accepted from this link. To have your existing recordings
            deleted, contact Lugemi and mention this link.
          </p>
        </section>
      ) : !speaker.consented ? (
        <section className="vl-panel" style={card}>
          <h2 style={{ marginTop: 0 }}>Before you start: your consent</h2>
          {session.consent.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <label style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
            I am 18 years or older.
          </label>
          <label style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={nativeSpeaker} onChange={(e) => setNativeSpeaker(e.target.checked)} />
            I grew up speaking {speaker.dialectName}, and the voice in my recordings is my own.
          </label>
          <label style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            I agree that Lugemi may use my recordings as described above.
          </label>
          <label style={{ display: 'block', marginTop: 16 }}>
            Type your full name to sign
            <input
              className="vl-input"
              style={{ display: 'block', width: '100%', marginTop: 6 }}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <button
            type="button"
            className="vl-btn vl-btn-primary"
            style={{ marginTop: 16 }}
            disabled={busy || !adult || !nativeSpeaker || !agree || !fullName.trim()}
            onClick={() => void signConsent()}
          >
            Sign and start recording
          </button>
          <p style={{ ...muted, fontSize: '0.85rem', marginBottom: 0 }}>Consent version {session.consent.version}</p>
        </section>
      ) : (
        <>
          <section className="vl-panel" style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', ...muted }}>
              <span>
                {progress.recorded} recorded · {minutes(progress.recordedMs)}
                {progress.skipped ? ` · ${progress.skipped} corrected` : ''}
              </span>
              <span>
                {handled} / {progress.totalPrompts} sentences
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--border, #e5e7eb)', borderRadius: 3, marginTop: 8 }}>
              <div style={{ width: `${pct}%`, height: 6, background: 'var(--accent)', borderRadius: 3 }} />
            </div>
          </section>

          {!prompt ? (
            <section className="vl-panel" style={card}>
              <h2 style={{ marginTop: 0 }}>All done for now — thank you!</h2>
              <p style={muted}>
                You have read every sentence we have for {speaker.dialectName} at the moment. Keep this link: when we add
                more sentences you can continue from here.
              </p>
            </section>
          ) : (
            <section className="vl-panel" style={card}>
              <p style={{ ...muted, margin: 0, fontSize: '0.85rem', textTransform: 'capitalize' }}>{prompt.category}</p>
              <p lang={speaker.dialect} style={{ fontSize: '1.6rem', lineHeight: 1.4, margin: '0.5rem 0 1.25rem' }}>
                {prompt.text}
              </p>

              {flagging ? (
                <div>
                  <label style={{ display: 'block' }}>
                    How would you naturally say this in {speaker.dialectName}?
                    <textarea
                      className="vl-input"
                      lang={speaker.dialect}
                      rows={3}
                      style={{ display: 'block', width: '100%', marginTop: 6 }}
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      className="vl-btn vl-btn-primary"
                      disabled={busy || !suggestion.trim()}
                      onClick={() => void sendFeedback()}
                    >
                      Send and skip
                    </button>
                    <button type="button" className="vl-btn" onClick={() => setFlagging(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {recording ? (
                      <button
                        type="button"
                        className="vl-btn"
                        style={{ background: 'var(--bad)', color: '#fff', border: 'none' }}
                        onClick={stopRecording}
                      >
                        Stop · {(elapsedMs / 1000).toFixed(1)}s
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="vl-btn vl-btn-primary"
                        disabled={busy}
                        onClick={() => void startRecording()}
                      >
                        {take ? 'Record again' : 'Record'}
                      </button>
                    )}
                    {take && !recording ? (
                      <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void saveTake()}>
                        {busy ? 'Saving…' : 'Save and next'}
                      </button>
                    ) : null}
                  </div>
                  {recording ? (
                    <div style={{ height: 8, background: 'var(--border, #e5e7eb)', borderRadius: 4, marginTop: 12 }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.round(level * 100))}%`,
                          height: 8,
                          borderRadius: 4,
                          background: level > 0.95 ? 'var(--bad)' : 'var(--accent)',
                        }}
                      />
                    </div>
                  ) : null}
                  {take && !recording ? (
                    <audio controls src={take.url} style={{ display: 'block', width: '100%', marginTop: 12 }} />
                  ) : null}
                  <button
                    type="button"
                    className="vl-btn"
                    style={{ marginTop: 14, fontSize: '0.85rem' }}
                    onClick={() => setFlagging(true)}
                  >
                    We don’t say it like this
                  </button>
                </>
              )}
            </section>
          )}

          <section className="vl-panel" style={card}>
            <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Tips for a great recording</h2>
            <ul style={{ ...muted, margin: 0, paddingLeft: '1.2rem' }}>
              <li>Find a quiet room — no TV, radio, fans or traffic.</li>
              <li>Hold your phone about a hand-span from your mouth and keep the distance the same.</li>
              <li>Speak at your normal pace and tone, like you are talking to someone from home.</li>
              <li>Listen back. If you stumbled or there was noise, press Record again.</li>
              <li>If a sentence sounds unnatural, tap “We don’t say it like this” and tell us how you would say it.</li>
            </ul>
          </section>

          <p style={{ ...muted, fontSize: '0.85rem', marginTop: '1.5rem' }}>
            Changed your mind?{' '}
            <button type="button" className="vl-btn" style={{ fontSize: '0.85rem' }} disabled={busy} onClick={() => void withdraw()}>
              Withdraw from recording
            </button>
          </p>
        </>
      )}
    </main>
  );
}
