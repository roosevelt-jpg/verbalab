'use client';

import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';

type Voice = { id: string; name: string };

type InterpretResult = {
  sourceText: string;
  targetText: string;
  source: string;
  target: string;
  durationSeconds: number;
  voice: string;
  mimeType: string;
  audioBase64: string;
  skippedMt: boolean;
  providers: { stt: string; mt: string | null; tts: string };
};

export function InterpretClient() {
  const catalog = useLocaleCatalog();
  const [apiKey, setApiKey] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [source, setSource] = useState('auto');
  const [target, setTarget] = useState('sw');
  const [voice, setVoice] = useState('alloy');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<InterpretResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiFetch<{ data: Voice[] }>('/v1/audio/voices')
      .then((res) => {
        setVoices(res.data);
        if (res.data[0]) setVoice(res.data[0].id);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (!file) {
      setError('Choose an audio file');
      return;
    }
    if (!apiKey.startsWith('lg_live_')) {
      setError('Paste a lg_live_ API key');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('target', target);
      form.append('voice', voice);
      if (source) form.append('source', source);
      const res = await fetch(`${API_URL}/v1/interpret`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      const body = (await res.json()) as InterpretResult & { error?: { message: string } };
      if (!res.ok) {
        throw new Error(body.error?.message ?? `Interpret failed (${res.status})`);
      }
      setResult(body);
      const bytes = Uint8Array.from(atob(body.audioBase64), (c) => c.charCodeAt(0));
      setAudioUrl(URL.createObjectURL(new Blob([bytes], { type: body.mimeType || 'audio/mpeg' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Interpret failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Interpreter</h1>
      <p style={ledeStyle}>Audio in → speech-to-text → translate → speech out. One sequential pipeline.</p>

      <form onSubmit={onSubmit} className="vl-panel" style={{ marginTop: '1.5rem', padding: '1.35rem', display: 'grid', gap: '1rem' }}>
        <label className="vl-label">
          API key
          <input
            className="vl-field vl-code"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="lg_live_..."
            required
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="vl-label">
            Source
            <LocaleSelect
              className="vl-field"
              value={source}
              onChange={setSource}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
              allowAuto
            />
          </label>
          <label className="vl-label">
            Target
            <LocaleSelect
              className="vl-field"
              value={target}
              onChange={setTarget}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
            />
          </label>
          <label className="vl-label">
            Voice
            <select className="vl-field" value={voice} onChange={(e) => setVoice(e.target.value)}>
              {(voices.length ? voices : [{ id: 'alloy', name: 'Alloy' }]).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="vl-label">
          Audio file
          <input
            className="vl-field"
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        <button type="submit" disabled={loading} className="vl-btn vl-btn-primary" style={{ justifySelf: 'start' }}>
          {loading ? 'Interpreting…' : 'Interpret'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {result ? (
        <div className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.25rem', display: 'grid', gap: '1rem', background: 'var(--bg-soft)', border: 'none' }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Source ({result.source}) · {result.durationSeconds}s · {result.providers.stt}
            </div>
            <div style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{result.sourceText}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Target ({result.target})
              {result.skippedMt ? ' · MT skipped' : ` · ${result.providers.mt}`}
              {' · '}
              {result.providers.tts}
            </div>
            <div style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{result.targetText}</div>
          </div>
          {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : null}
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

const ledeStyle: CSSProperties = { color: 'var(--muted)', margin: '0.5rem 0 0' };
