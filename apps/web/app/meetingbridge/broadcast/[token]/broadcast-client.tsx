'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';

type BroadcastView = {
  meetingId: string;
  title: string;
  state: string;
  corridor: string;
  note: string;
  captions: Array<{
    turnId: string;
    language: string | null;
    text: string;
    translations: Array<{ language: string; text: string }>;
  }>;
};

export function MeetingBridgeBroadcastClient({ token }: { token: string }) {
  const [view, setView] = useState<BroadcastView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch<BroadcastView>(`/v1/meetingbridge/public/broadcast/${token}`);
      setView(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Broadcast unavailable');
    }
  }, [token]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="MeetingBridge"
          title={view?.title ?? 'Caption broadcast'}
          lede={view ? `${view.state} · ${view.corridor} · captions only` : 'Loading broadcast…'}
        />
        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}
        <p className="lg-type-compact">{view?.note}</p>
        <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, display: 'grid', gap: '0.65rem' }}>
          {(view?.captions ?? []).length === 0 ? (
            <li className="lg-type-compact">Waiting for committed captions…</li>
          ) : (
            view!.captions.map((c) => (
              <li key={c.turnId} className="lg-card">
                <div className="lg-type-compact">
                  {c.language ?? '—'} · {c.turnId}
                </div>
                <div>{c.text}</div>
                {c.translations.map((t) => (
                  <div key={t.language} className="lg-type-compact">
                    → ({t.language}) {t.text}
                  </div>
                ))}
              </li>
            ))
          )}
        </ul>
      </div>
    </AppShell>
  );
}