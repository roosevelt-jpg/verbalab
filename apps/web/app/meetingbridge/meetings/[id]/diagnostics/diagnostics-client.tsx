'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { useMeetingBridgeAuth } from '@/components/meetingbridge/use-meetingbridge-auth';
import { apiFetch } from '@/lib/api';

type Diagnostics = {
  meeting: {
    id: string;
    state: string;
    corridor: string;
    mediaMode: string;
    interpretationMode: string;
    sequence: number;
    maxParticipants: number;
  };
  counts: {
    activeMembers: number;
    utterances: number;
    itemsByState: Record<string, number>;
  };
  media: { mode: string; provisioned: boolean; simultaneousInterpretation: boolean; note: string };
  integrations: Record<string, { available: boolean; note: string }>;
  ghanaVoices: Array<{
    code: string;
    name: string;
    echoVoiceId: string;
    asr: boolean;
    tts: boolean;
    neuralClaim: boolean;
    note: string;
  }>;
  recentEvents: Array<{ sequence: number; type: string; actorId: string | null; createdAt: string }>;
  envFlags: Record<string, boolean>;
};

export function MeetingBridgeDiagnosticsClient({ meetingId }: { meetingId: string }) {
  const auth = useMeetingBridgeAuth();
  const [data, setData] = useState<Diagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!auth.ready) return;
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<Diagnostics>(`/v1/meetingbridge/meetings/${meetingId}/diagnostics`, {
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diagnostics');
    }
  }, [auth, meetingId]);

  useEffect(() => {
    if (auth.ready) void refresh();
  }, [auth.ready, refresh]);

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="MeetingBridge"
          title="Admin diagnostics"
          lede="Organizer-only media, integration, and Ghana voice pack status."
        >
          <div className="lg-page-header__actions">
            <Link href={`/meetingbridge/meetings/${meetingId}`} className="vl-btn vl-btn-secondary">
              Room
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void refresh()}>
              Refresh
            </button>
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

        {data ? (
          <>
            <section className="lg-page-section">
              <h2 className="lg-type-section">Meeting</h2>
              <p className="lg-type-compact">
                {data.meeting.state} · {data.meeting.corridor} · media {data.meeting.mediaMode} · seq{' '}
                {data.meeting.sequence}
              </p>
              <p className="lg-type-compact">
                Members {data.counts.activeMembers}/{data.meeting.maxParticipants} · utterances{' '}
                {data.counts.utterances}
              </p>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Media</h2>
              <p>{data.media.note}</p>
              <p className="lg-type-compact">
                mode {data.media.mode} · provisioned {String(data.media.provisioned)} · simultaneous{' '}
                {String(data.media.simultaneousInterpretation)}
              </p>
              <pre className="lg-card" style={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(data.envFlags, null, 2)}
              </pre>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Integrations</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                {Object.entries(data.integrations).map(([key, value]) => (
                  <li key={key} className="lg-card">
                    <strong>
                      {key} · {value.available ? 'available' : 'unavailable'}
                    </strong>
                    <div className="lg-type-compact">{value.note}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Ghana Echo pack</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.4rem' }}>
                {data.ghanaVoices.map((v) => (
                  <li key={v.code} className="lg-type-compact">
                    <strong>{v.code}</strong> {v.name} · {v.echoVoiceId} · ASR {v.asr ? 'on' : 'gated'} · TTS{' '}
                    {v.tts ? 'on' : 'off'}
                    {v.neuralClaim ? ' · neural' : ''} — {v.note}
                  </li>
                ))}
              </ul>
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Recent events</h2>
              <ul className="lg-type-compact" style={{ margin: 0 }}>
                {data.recentEvents.map((e) => (
                  <li key={`${e.sequence}-${e.type}`}>
                    #{e.sequence} {e.type}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
