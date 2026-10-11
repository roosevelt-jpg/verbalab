'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { useMeetingBridgeAuth } from '@/components/meetingbridge/use-meetingbridge-auth';
import { apiFetch } from '@/lib/api';

type MicCheckResult = {
  ok: boolean;
  note: string;
  levelPeak: number;
  media?: { mode: string; provisioned: boolean; note: string };
  mediaToken?: { token: string; mode: string } | null;
};

export function MeetingBridgeLobbyClient({ meetingId }: { meetingId: string }) {
  const auth = useMeetingBridgeAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState(0);
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
  const [result, setResult] = useState<MicCheckResult | null>(null);
  const [listening, setListening] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startLocalMic() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const track = stream.getAudioTracks()[0];
      setDeviceLabel(track?.label ?? 'Microphone');
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      setListening(true);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i]! - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.sqrt(sum / data.length));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone permission denied');
    }
  }

  async function submitCheck() {
    if (!auth.ready) {
      setError('Sign in or paste an API key');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<MicCheckResult>(`/v1/meetingbridge/meetings/${meetingId}/lobby/mic-check`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: {
          deviceLabel: deviceLabel ?? undefined,
          levelPeak: level,
          muted: level < 0.01,
          sampleRate: 48000,
        },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mic check failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="MeetingBridge"
          title="Lobby mic check"
          lede="Confirm your microphone before entering the room. Silence is never agreement."
        >
          <div className="lg-page-header__actions">
            <Link href={`/meetingbridge/meetings/${meetingId}`} className="vl-btn vl-btn-secondary">
              Back to room
            </Link>
          </div>
        </PageHeader>

        {!auth.signedIn && (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              className="vl-field"
              placeholder="API key (lg_…)"
              value={auth.apiKey}
              onChange={(e) => auth.setApiKey(e.target.value)}
            />
            <input
              className="vl-field"
              placeholder="Actor id"
              value={auth.actorId}
              onChange={(e) => auth.setActorId(e.target.value)}
            />
          </section>
        )}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        <section className="lg-page-section" aria-labelledby="mb-mic">
          <div className="lg-page-section__head">
            <h2 id="mb-mic" className="lg-type-section">
              Microphone
            </h2>
            <p className="lg-type-compact">
              Browser mesh WebRTC works without an SFU URL. Speak briefly so the level meter moves.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void startLocalMic()}>
              {listening ? 'Mic listening' : 'Allow microphone'}
            </button>
            <button
              type="button"
              className="vl-btn vl-btn-primary"
              disabled={busy || !auth.ready}
              onClick={() => void submitCheck()}
            >
              Submit mic check
            </button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div
              aria-label="Microphone level"
              style={{
                height: 12,
                borderRadius: 6,
                background: 'color-mix(in srgb, var(--fg, #111) 12%, transparent)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.round(level * 400))}%`,
                  height: '100%',
                  background: 'var(--accent, #0f766e)',
                  transition: 'width 80ms linear',
                }}
              />
            </div>
            <p className="lg-type-compact" style={{ marginTop: '0.5rem' }}>
              {deviceLabel ?? 'No device selected'} · peak {level.toFixed(3)}
            </p>
          </div>
          {result ? (
            <div className="lg-card" style={{ marginTop: '1rem' }}>
              <strong>{result.ok ? 'Ready' : 'Not ready'}</strong>
              <p style={{ margin: '0.35rem 0' }}>{result.note}</p>
              <p className="lg-type-compact">{result.media?.note}</p>
              {result.ok ? (
                <Link href={`/meetingbridge/meetings/${meetingId}`} className="vl-btn vl-btn-primary">
                  Enter room
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
