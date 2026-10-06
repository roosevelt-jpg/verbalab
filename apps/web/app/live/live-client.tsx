'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from '@/components/marketing/use-demo-player';

type LiveEvent = {
  event_id: string;
  segment_id: string;
  revision: number;
  type: string;
  text?: string;
  state?: string;
  replaces_segment_id: string | null;
};

export function LiveClient() {
  const [apiKey, setApiKey] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('ak');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { play, stop, playingId, loadingId } = useDemoPlayer();

  async function createSession() {
    setError(null);
    if (!apiKey.startsWith('lg_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ session_id: string }>('/v1/live/sessions', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({
          sampleRate: 16000,
          channels: 1,
          sourceLanguage,
          targetLanguage,
          transport: 'sse',
        }),
      });
      setSessionId(res.session_id);
      setEvents([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session failed');
    } finally {
      setLoading(false);
    }
  }

  async function pushAudio(endOfUtterance: boolean) {
    if (!sessionId || !apiKey) return;
    setError(null);
    try {
      const res = await apiFetch<{ events: LiveEvent[] }>(`/v1/live/sessions/${sessionId}/audio`, {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({
          textHint: 'Send five… fifty, tomorrow, not today.',
          endOfUtterance,
        }),
      });
      setEvents((prev) => [...prev, ...res.events]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio ingest failed');
    }
  }

  async function repairLastSpoken() {
    if (!sessionId || !apiKey) return;
    const spoken = [...events].reverse().find((e) => e.type === 'translation.spoken');
    if (!spoken) {
      setError('No spoken segment to repair');
      return;
    }
    try {
      const res = await apiFetch<{ events: LiveEvent[] }>(`/v1/live/sessions/${sessionId}/repair`, {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({
          segmentId: spoken.segment_id,
          correctedText: 'Send fifty tomorrow, not today.',
        }),
      });
      setEvents((prev) => [...prev, ...res.events]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Repair failed');
    }
  }

  const lastSpoken = [...events].reverse().find((e) => e.type === 'translation.spoken' || e.type === 'translation.repair');

  return (
    <PortfolioShell
      title="Lugemi Live"
      lede="Incremental interpretation with commitment and repair. Captions distinguish provisional and committed text. Already-spoken audio is immutable — repairs create new audible content. Source/target languages cover the full registry."
    >
      <div className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key</span>
          <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Source language</span>
            <input className="vl-field" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Target language</span>
            <input className="vl-field" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} />
          </label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button type="button" className="vl-btn" disabled={loading} onClick={() => void createSession()}>
            {loading ? 'Creating…' : 'Start session'}
          </button>
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            disabled={!sessionId}
            onClick={() => void pushAudio(false)}
          >
            Push provisional
          </button>
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            disabled={!sessionId}
            onClick={() => void pushAudio(true)}
          >
            Commit utterance
          </button>
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            disabled={!sessionId}
            onClick={() => void repairLastSpoken()}
          >
            Audible repair
          </button>
        </div>
        {sessionId ? (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Session {sessionId}</p>
        ) : null}
      </div>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      <div style={{ marginTop: '1rem', display: 'grid', gap: '0.45rem' }}>
        {events.map((e) => (
          <div
            key={e.event_id}
            className="vl-panel"
            style={{
              padding: '0.65rem 0.85rem',
              opacity: e.type.includes('provisional') ? 0.75 : 1,
              fontStyle: e.type.includes('provisional') ? 'italic' : 'normal',
              borderLeft:
                e.type === 'translation.repair'
                  ? '3px solid var(--brand-navy)'
                  : e.type.includes('committed') || e.type.includes('spoken')
                    ? '3px solid #2a7a4b'
                    : '3px solid transparent',
            }}
          >
            <code style={{ fontSize: '0.75rem' }}>
              {e.event_id} · {e.type} · rev {e.revision}
            </code>
            <div>{e.text}</div>
          </div>
        ))}
      </div>

      {lastSpoken?.text ? (
        <div style={{ marginTop: '1rem' }}>
          <DemoPlayStopButton
            active={playingId === 'live-spoken'}
            loading={loadingId === 'live-spoken'}
            variant="secondary"
            onPlay={() => void play({ id: 'live-spoken', text: lastSpoken.text!, lang: 'en' })}
            onStop={() => stop()}
            label="Play last spoken / repair"
          />
        </div>
      ) : null}
    </PortfolioShell>
  );
}
