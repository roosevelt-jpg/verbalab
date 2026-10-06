'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };
type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  honesty: { nonlinearDaw: boolean };
};
type Voice = { id: string; name: string; provider?: string };
type Lexeme = { id: string; grapheme: string; alias: string };
type Profile = { id: string; name: string; voice: string; language: string | null };

export function VoiceStudioClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [lexemes, setLexemes] = useState<Lexeme[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [text, setText] = useState('Welcome to VerbaLab Voice Studio.');
  const [ssml, setSsml] = useState(
    '<speak>Welcome to <prosody rate="slow">VerbaLab</prosody>. <break time="400ms"/>Voice Studio.</speak>',
  );
  const [voice, setVoice] = useState('alloy');
  const [compareVoice, setCompareVoice] = useState('nova');
  const [grapheme, setGrapheme] = useState('VerbaLab');
  const [alias, setAlias] = useState('Verba Lab');
  const [compiled, setCompiled] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [compareUrls, setCompareUrls] = useState<Array<{ voice: string; url: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, lib, pron, prof] = await Promise.all([
      apiFetch<Engine>('/v1/voice-studio/engine', { token }),
      apiFetch<{ voices: Voice[] }>('/v1/voice-studio/library', { token }),
      apiFetch<{ lexemes: Lexeme[] }>('/v1/voice-studio/pronunciation', { token }),
      apiFetch<{ profiles: Profile[] }>('/v1/voice-studio/profiles', { token }),
    ]);
    setEngine(eng);
    setVoices(lib.voices);
    setLexemes(pron.lexemes);
    setProfiles(prof.profiles);
    if (lib.voices[0] && !lib.voices.some((v) => v.id === voice)) {
      setVoice(lib.voices[0].id);
    }
  }, [getToken, voice]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function compileSsml() {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ plainText: string; unsupportedTags: string[]; note: string }>(
        '/v1/voice-studio/ssml/compile',
        { token, method: 'POST', body: JSON.stringify({ ssml }) },
      );
      setCompiled(`${res.plainText}${res.unsupportedTags.length ? ` (dropped: ${res.unsupportedTags.join(', ')})` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compile failed');
    }
  }

  async function addLexeme() {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/voice-studio/pronunciation', {
        token,
        method: 'POST',
        body: JSON.stringify({ grapheme, alias }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lexeme save failed');
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/voice-studio/profiles', {
        token,
        method: 'POST',
        body: JSON.stringify({ name: `Preset ${voice}`, voice }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile save failed');
    } finally {
      setBusy(false);
    }
  }

  async function preview(useSsml: boolean) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await fetch(`${API_URL}/v1/voice-studio/preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(useSsml ? { ssml, voice, format: 'mp3' } : { text, voice, format: 'mp3' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setBusy(false);
    }
  }

  async function compare() {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{
        clips: Array<{ voice: string; mimeType: string; audioBase64: string }>;
      }>('/v1/voice-studio/compare', {
        token,
        method: 'POST',
        body: JSON.stringify({ text, voices: [voice, compareVoice], format: 'mp3' }),
      });
      for (const c of compareUrls) URL.revokeObjectURL(c.url);
      setCompareUrls(
        res.clips.map((c) => {
          const bin = atob(c.audioBase64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return {
            voice: c.voice,
            url: URL.createObjectURL(new Blob([bytes], { type: c.mimeType })),
          };
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare failed');
    } finally {
      setBusy(false);
    }
  }

  async function renderTimeline() {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ audioBase64: string; mimeType: string; note: string }>(
        '/v1/voice-studio/timeline/render',
        {
          token,
          method: 'POST',
          body: JSON.stringify({
            defaultVoice: voice,
            clips: [
              { text: text.slice(0, Math.max(1, Math.floor(text.length / 2))) },
              { text: text.slice(Math.floor(text.length / 2)), pauseMsAfter: 200 },
            ],
          }),
        },
      );
      const bin = atob(res.audioBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(new Blob([bytes], { type: res.mimeType })));
      setCompiled(res.note);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Timeline render failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Voice Studio
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Professional dashboard for library, pronunciation, SSML lite, linear timeline, and voice
        comparison. Not a nonlinear DAW.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <section style={{ display: 'grid', gap: '0.75rem', maxWidth: '44rem', marginBottom: '1.75rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Text</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} style={input} />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>SSML lite</span>
          <textarea value={ssml} onChange={(e) => setSsml(e.target.value)} rows={3} style={input} />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Voice</span>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} style={input}>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.id})
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button type="button" disabled={busy} onClick={() => void compileSsml()} style={secondary}>
            Compile SSML
          </button>
          <button type="button" disabled={busy} onClick={() => void preview(false)} style={primary}>
            Preview text
          </button>
          <button type="button" disabled={busy} onClick={() => void preview(true)} style={secondary}>
            Preview SSML
          </button>
          <button type="button" disabled={busy} onClick={() => void renderTimeline()} style={secondary}>
            Render timeline
          </button>
          <button type="button" disabled={busy} onClick={() => void saveProfile()} style={secondary}>
            Save profile
          </button>
        </div>
        {compiled ? <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{compiled}</p> : null}
        {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : null}
      </section>

      <section style={{ marginBottom: '1.75rem', maxWidth: '44rem' }}>
        <h2 style={h2}>Pronunciation lexicon</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input value={grapheme} onChange={(e) => setGrapheme(e.target.value)} placeholder="Grapheme" style={input} />
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Spoken alias" style={input} />
          <button type="button" disabled={busy} onClick={() => void addLexeme()} style={primary}>
            Add
          </button>
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)' }}>
          {lexemes.map((l) => (
            <li key={l.id}>
              {l.grapheme} → {l.alias}
            </li>
          ))}
          {!lexemes.length ? <li>No lexemes yet</li> : null}
        </ul>
      </section>

      <section style={{ marginBottom: '1.75rem', maxWidth: '44rem' }}>
        <h2 style={h2}>Voice comparison</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <select value={compareVoice} onChange={(e) => setCompareVoice(e.target.value)} style={input}>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <button type="button" disabled={busy} onClick={() => void compare()} style={primary}>
            Compare
          </button>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {compareUrls.map((c) => (
            <div key={c.voice}>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{c.voice}</div>
              <audio controls src={c.url} style={{ width: '100%' }} />
            </div>
          ))}
        </div>
      </section>

      {profiles.length ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={h2}>Saved profiles</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)' }}>
            {profiles.map((p) => (
              <li key={p.id}>
                {p.name} · {p.voice}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {engine ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={h2}>Capabilities</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
          <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.35rem' }}>
                <strong>{c.name}</strong> · {c.status}
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        <Link href="/audio">African Voice Studio</Link>
        {' · '}
        <Link href="/neural-tts">Neural TTS</Link>
        {' · '}
        <Link href="/voice-cloud">Voice Cloud</Link>
      </p>
    </AppShell>
  );
}

const label: CSSProperties = { fontSize: '0.85rem', fontWeight: 550 };
const h2: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  fontWeight: 650,
  margin: '0 0 0.5rem',
};
const input: CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  font: 'inherit',
  background: '#fff',
};
const primary: CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  background: 'var(--ink)',
  color: '#fff',
  fontWeight: 550,
  cursor: 'pointer',
};
const secondary: CSSProperties = {
  ...primary,
  background: 'var(--bg-soft)',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
};
