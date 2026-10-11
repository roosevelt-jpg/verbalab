'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { useMeetingBridgeAuth } from '@/components/meetingbridge/use-meetingbridge-auth';
import { apiFetch } from '@/lib/api';

type InboxItem = {
  id: string;
  kind: string;
  state: string;
  wording: string;
  revisionNumber: number;
  dueDate: string | null;
  presentation: { id: string; language: string; wording: string } | null;
};

type InboxView = {
  pendingCount: number;
  items: InboxItem[];
  notice: string;
};

export function MeetingBridgeInboxClient({ meetingId }: { meetingId: string }) {
  const auth = useMeetingBridgeAuth();
  const [view, setView] = useState<InboxView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!auth.ready) return;
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<InboxView>(`/v1/meetingbridge/meetings/${meetingId}/inbox`, {
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
      });
      setView(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
    }
  }, [auth, meetingId]);

  useEffect(() => {
    if (auth.ready) void refresh();
  }, [auth.ready, refresh]);

  async function act(itemId: string, action: 'confirm' | 'change_request' | 'decline') {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/meetingbridge/items/${itemId}/confirmations`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: {
          meetingId,
          action,
          idempotencyKey: `inbox-${action}-${itemId}-${Date.now()}`,
        },
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="MeetingBridge"
          title="Confirmation inbox"
          lede={view ? `${view.pendingCount} item(s) waiting for your explicit decision` : 'Loading…'}
        >
          <div className="lg-page-header__actions">
            <Link href={`/meetingbridge/meetings/${meetingId}`} className="vl-btn vl-btn-secondary">
              Room
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void refresh()}>
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

        <section className="lg-page-section">
          <p className="lg-type-compact">{view?.notice}</p>
          <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, display: 'grid', gap: '0.75rem' }}>
            {!view || view.items.length === 0 ? (
              <li className="lg-type-compact">No pending confirmations for you.</li>
            ) : (
              view.items.map((item) => (
                <li key={item.id} className="lg-card">
                  <strong>
                    {item.kind} · {item.state}
                  </strong>
                  <p style={{ margin: '0.35rem 0' }}>{item.presentation?.wording ?? item.wording}</p>
                  <div className="lg-type-compact">
                    rev {item.revisionNumber}
                    {item.dueDate ? ` · due ${item.dueDate}` : ''}
                    {item.presentation ? ` · shown in ${item.presentation.language}` : ''}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="vl-btn vl-btn-primary"
                      disabled={busy}
                      onClick={() => void act(item.id, 'confirm')}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      disabled={busy}
                      onClick={() => void act(item.id, 'change_request')}
                    >
                      Request change
                    </button>
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      disabled={busy}
                      onClick={() => void act(item.id, 'decline')}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
