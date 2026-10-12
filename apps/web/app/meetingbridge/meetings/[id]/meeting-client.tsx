'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useStudioApiKeyField } from '@/hooks/use-studio-api-key';

type MeetingView = {
  meeting: {
    id: string;
    title: string;
    agenda: string;
    timeZone: string;
    state: string;
    corridor: string;
    supportedLanguages: string[];
    interpretationMode: string;
    mediaMode: string;
    sequence: number;
    noticeVersion: string;
    isDemo: boolean;
    maxParticipants: number;
  };
  memberships: Array<{
    userId: string;
    role: string;
    active: boolean;
    speakingLanguage: string;
    listeningLanguage: string;
    listeningMode: string;
    presence: string;
  }>;
  utterances: Array<{
    id: string;
    speakerId: string;
    turnId: string;
    revision: {
      id: string;
      revisionNumber: number;
      originalText: string;
      language: string;
      commitState: string;
      translations: Array<{
        id: string;
        targetLanguage: string;
        text: string;
        status: string;
        modelVersion: string;
      }>;
    } | null;
  }>;
  items: Array<{
    id: string;
    kind: string;
    state: string;
    revision: {
      id: string;
      revisionNumber: number;
      wording: string;
      ownerParticipantIds: string[];
      requiredApproverIds: string[];
      dueDate: string | null;
      timeZone: string | null;
      contentHash: string;
      presentations: Array<{ id: string; language: string; wording: string }>;
      confirmations: Array<{ actorId: string; action: string; createdAt: string }>;
    } | null;
    disagreements: Array<{ id: string; status: string; reason: string | null }>;
  }>;
  minutes: Array<{
    id: string;
    revisionNumber: number;
    issuedAt: string | null;
    contentHash: string;
  }>;
  events: Array<{ id: string; type: string; sequence: number; createdAt: string }>;
  catalog: {
    media?: { mode: string; provisioned: boolean; note: string };
    limitations?: string[];
  };
};

export function MeetingBridgeMeetingClient({ meetingId }: { meetingId: string }) {
  const { getToken, isSignedIn, userId } = useAuth();
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('organizer-local');
  const [view, setView] = useState<MeetingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [turnText, setTurnText] = useState('');
  const [itemKind, setItemKind] = useState<'decision' | 'action' | 'proposal' | 'question'>('action');
  const [itemWording, setItemWording] = useState('Dispatch 50 bags of rice by 2026-10-16');
  const [itemDue, setItemDue] = useState('2026-10-16');
  const [listeningMode, setListeningMode] = useState('captions_only');
  const [exportPreview, setExportPreview] = useState<string | null>(null);
  const [correctUtteranceId, setCorrectUtteranceId] = useState('');
  const [correctText, setCorrectText] = useState('');
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [syncDestination, setSyncDestination] = useState<
    'private_download' | 'internal_queue' | 'slack' | 'email' | 'calendar'
  >('private_download');
  const [syncTarget, setSyncTarget] = useState('');
  const [broadcastUrl, setBroadcastUrl] = useState<string | null>(null);

  const signedIn = Boolean(isClerkConfigured() && isSignedIn);

  const authHeaders = useCallback(async () => {
    if (signedIn) {
      const token = await getToken();
      if (!token) throw new Error('Missing session token');
      return { token, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId };
  }, [apiKey, actorId, getToken, signedIn]);

  const me = useMemo(() => {
    if (!view) return null;
    const uid = signedIn ? userId : actorId;
    return view.memberships.find((m) => m.userId === uid) ?? null;
  }, [view, signedIn, userId, actorId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const a = await authHeaders();
      const res = await apiFetch<MeetingView>(`/v1/meetingbridge/meetings/${meetingId}`, {
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
      });
      setView(res);
      if (res.memberships[0]) {
        const mine =
          res.memberships.find((m) => m.userId === (signedIn ? userId : actorId)) ??
          res.memberships[0];
        setListeningMode(mine.listeningMode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meeting');
    }
  }, [authHeaders, meetingId, signedIn, userId, actorId]);

  useEffect(() => {
    if (signedIn || apiKey.startsWith('lg_')) void refresh();
  }, [signedIn, apiKey, refresh]);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function mintInvite() {
    await withBusy(async () => {
      const a = await authHeaders();
      const res = await apiFetch<{ token: string; joinPath: string }>(
        `/v1/meetingbridge/meetings/${meetingId}/invites`,
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
          body: {},
        },
      );
      setInviteUrl(`${window.location.origin}${res.joinPath}`);
    });
  }

  async function openLobby() {
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/meetings/${meetingId}/lobby`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
      });
    });
  }

  async function startLive() {
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/meetings/${meetingId}/start`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
      });
    });
  }

  async function closeMeeting() {
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/meetings/${meetingId}/close`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
      });
    });
  }

  async function savePreferences(event: FormEvent) {
    event.preventDefault();
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/meetings/${meetingId}/members/me`, {
        method: 'PATCH',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: { listeningMode },
      });
    });
  }

  async function sendUtterance(event: FormEvent) {
    event.preventDefault();
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/meetings/${meetingId}/utterances`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: {
          text: turnText,
          language: me?.speakingLanguage,
          targetLanguages: view?.meeting.supportedLanguages,
        },
      });
      setTurnText('');
    });
  }

  async function correctUtterance(event: FormEvent) {
    event.preventDefault();
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/meetings/${meetingId}/utterance-corrections`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: { utteranceId: correctUtteranceId, text: correctText },
      });
      setCorrectText('');
    });
  }

  async function proposeItem(event: FormEvent) {
    event.preventDefault();
    await withBusy(async () => {
      const a = await authHeaders();
      const owners = view?.memberships.filter((m) => m.role !== 'organizer').map((m) => m.userId) ?? [];
      const organizer = view?.memberships.find((m) => m.role === 'organizer')?.userId;
      const sourceRevisionIds = view?.utterances
        .map((u) => u.revision?.id)
        .filter((id): id is string => Boolean(id))
        .slice(-3);
      await apiFetch(`/v1/meetingbridge/meetings/${meetingId}/items`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: {
          kind: itemKind,
          wording: itemWording,
          ownerParticipantIds: owners.length ? owners : organizer ? [organizer] : [],
          requiredApproverIds: organizer ? [organizer, ...owners] : owners,
          dueDate: itemKind === 'action' ? itemDue : undefined,
          sourceRevisionIds,
        },
      });
    });
  }

  async function confirmItem(itemId: string, action: 'confirm' | 'change_request' | 'decline') {
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/items/${itemId}/confirmations`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: {
          meetingId,
          action,
          idempotencyKey: `${action}-${itemId}-${Date.now()}`,
        },
      });
    });
  }

  async function amendItem(itemId: string, expectedRevision: number, wording: string) {
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/items/${itemId}/revisions`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: { meetingId, expectedRevision, wording },
      });
    });
  }

  async function syncItem(itemId: string) {
    await withBusy(async () => {
      const a = await authHeaders();
      const res = await apiFetch<{ note?: string; sync?: { body?: string } }>(
        `/v1/meetingbridge/items/${itemId}/sync`,
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
          body: {
            meetingId,
            destination: syncDestination,
            target: syncTarget || undefined,
            idempotencyKey: `sync-${itemId}-${Date.now()}`,
          },
        },
      );
      setExportPreview(res.sync?.body ?? res.note ?? JSON.stringify(res, null, 2));
    });
  }

  async function connectMedia() {
    await withBusy(async () => {
      const a = await authHeaders();
      const res = await apiFetch<{
        token: string;
        mode: string;
        capability?: { note?: string; mode?: string };
        peers?: Array<{ userId: string }>;
      }>(`/v1/meetingbridge/meetings/${meetingId}/media/token`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
      });
      setMediaStatus(
        `${res.mode} token minted · peers ${(res.peers ?? []).length} · ${res.capability?.note ?? ''}`,
      );
    });
  }

  async function startBroadcast() {
    await withBusy(async () => {
      const a = await authHeaders();
      const res = await apiFetch<{ broadcastPath?: string; note?: string }>(
        `/v1/meetingbridge/meetings/${meetingId}/conferencing`,
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
          body: { provider: 'broadcast' },
        },
      );
      setBroadcastUrl(res.broadcastPath ?? null);
      setExportPreview(res.note ?? JSON.stringify(res, null, 2));
    });
  }

  async function requestBot(provider: 'zoom' | 'teams') {
    await withBusy(async () => {
      const a = await authHeaders();
      const res = await apiFetch<{ note?: string }>(`/v1/meetingbridge/meetings/${meetingId}/conferencing`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: { provider },
      });
      setExportPreview(res.note ?? JSON.stringify(res, null, 2));
    });
  }

  async function handoffDeal() {
    await withBusy(async () => {
      const a = await authHeaders();
      const res = await apiFetch<{ dealbridgePath?: string; note?: string }>(
        `/v1/meetingbridge/meetings/${meetingId}/handoff/dealbridge`,
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        },
      );
      if (res.dealbridgePath) window.location.href = res.dealbridgePath;
    });
  }

  async function handoffVoice() {
    await withBusy(async () => {
      const a = await authHeaders();
      const res = await apiFetch<{ voicebridgePath?: string }>(
        `/v1/meetingbridge/meetings/${meetingId}/handoff/voicebridge`,
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        },
      );
      if (res.voicebridgePath) window.location.href = res.voicebridgePath;
    });
  }

  async function issueMinutes() {
    await withBusy(async () => {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/meetings/${meetingId}/minutes`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
      });
    });
  }

  async function exportMinutes(format: 'markdown' | 'json' | 'csv_tasks') {
    const minutesId = view?.minutes[0]?.id;
    if (!minutesId) {
      setError('Issue minutes before exporting.');
      return;
    }
    await withBusy(async () => {
      const a = await authHeaders();
      const res = await apiFetch<{ body?: string; id?: string; format?: string }>(
        `/v1/meetingbridge/minutes/${minutesId}/exports`,
        {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
          body: {
            meetingId,
            format,
            idempotencyKey: `export-${minutesId}-${format}-${Date.now()}`,
          },
        },
      );
      setExportPreview(res.body ?? JSON.stringify(res, null, 2));
    });
  }

  const isOrganizer = me?.role === 'organizer';

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="MeetingBridge"
          title={view?.meeting.title ?? 'Meeting room'}
          lede={
            view
              ? `${view.meeting.state} · ${view.meeting.corridor} · ${view.meeting.interpretationMode} · media ${view.meeting.mediaMode}`
              : 'Loading meeting…'
          }
        >
          <div className="lg-page-header__actions">
            <Link href="/meetingbridge" className="vl-btn vl-btn-secondary">
              All meetings
            </Link>
            <Link href={`/meetingbridge/meetings/${meetingId}/lobby`} className="vl-btn vl-btn-secondary">
              Lobby
            </Link>
            <Link href={`/meetingbridge/meetings/${meetingId}/inbox`} className="vl-btn vl-btn-secondary">
              Inbox
            </Link>
            {isOrganizer ? (
              <Link
                href={`/meetingbridge/meetings/${meetingId}/diagnostics`}
                className="vl-btn vl-btn-secondary"
              >
                Diagnostics
              </Link>
            ) : null}
            <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void refresh()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        {!signedIn && (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <p className="lg-type-compact">Sign in, or use an API key with an actor id for local testing.</p>
            <input
              className="vl-field"
              placeholder="API key (lg_…)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <input
              className="vl-field"
              placeholder="Actor id"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            />
          </section>
        )}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        {view ? (
          <>
            <section className="lg-page-section" aria-labelledby="mb-agenda">
              <div className="lg-page-section__head">
                <h2 id="mb-agenda" className="lg-type-section">
                  Agenda &amp; notices
                </h2>
                <p className="lg-type-compact">
                  Timezone {view.meeting.timeZone}. Notice {view.meeting.noticeVersion}. Silence is never agreement.
                </p>
              </div>
              <p>{view.meeting.agenda || 'No agenda set.'}</p>
              <p className="lg-type-compact">{view.catalog?.media?.note}</p>
            </section>

            <section className="lg-page-section" aria-labelledby="mb-controls">
              <div className="lg-page-section__head">
                <h2 id="mb-controls" className="lg-type-section">
                  Room controls
                </h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {isOrganizer ? (
                  <>
                    <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void openLobby()}>
                      Open lobby
                    </button>
                    <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void startLive()}>
                      Start live
                    </button>
                    <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void mintInvite()}>
                      Invite participant
                    </button>
                    <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void closeMeeting()}>
                      Close meeting
                    </button>
                    <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void issueMinutes()}>
                      Issue minutes
                    </button>
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      disabled={busy}
                      onClick={() => void exportMinutes('markdown')}
                    >
                      Export Markdown
                    </button>
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      disabled={busy}
                      onClick={() => void exportMinutes('json')}
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      disabled={busy}
                      onClick={() => void exportMinutes('csv_tasks')}
                    >
                      Export tasks CSV
                    </button>
                    <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void handoffDeal()}>
                      Handoff to DealBridge
                    </button>
                    <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void handoffVoice()}>
                      VoiceBridge follow-up
                    </button>
                    <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void connectMedia()}>
                      Mint media token
                    </button>
                    <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void startBroadcast()}>
                      Caption broadcast
                    </button>
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      disabled={busy}
                      onClick={() => void requestBot('zoom')}
                    >
                      Zoom bot
                    </button>
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      disabled={busy}
                      onClick={() => void requestBot('teams')}
                    >
                      Teams bot
                    </button>
                  </>
                ) : (
                  <p className="lg-type-compact">Participant controls: speak, review items, and confirm explicitly.</p>
                )}
              </div>
              {inviteUrl ? (
                <p className="lg-card" style={{ marginTop: '0.75rem' }}>
                  Invite (single-use): <code style={{ wordBreak: 'break-all' }}>{inviteUrl}</code>
                </p>
              ) : null}
              {mediaStatus ? (
                <p className="lg-type-compact" style={{ marginTop: '0.75rem' }}>
                  Media: {mediaStatus}
                </p>
              ) : null}
              {broadcastUrl ? (
                <p className="lg-card" style={{ marginTop: '0.75rem' }}>
                  Broadcast:{' '}
                  <Link href={broadcastUrl}>
                    <code style={{ wordBreak: 'break-all' }}>{broadcastUrl}</code>
                  </Link>
                </p>
              ) : null}
            </section>

            <section className="lg-page-section" aria-labelledby="mb-members">
              <div className="lg-page-section__head">
                <h2 id="mb-members" className="lg-type-section">
                  Participants ({view.memberships.filter((m) => m.active).length}/{view.meeting.maxParticipants})
                </h2>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                {view.memberships.map((m) => (
                  <li key={m.userId} className="lg-card">
                    <strong>{m.role}</strong> · {m.userId.slice(0, 12)}
                    <div className="lg-type-compact">
                      speak {m.speakingLanguage} · listen {m.listeningLanguage} ({m.listeningMode}) · {m.presence}
                      {!m.active ? ' · removed' : ''}
                    </div>
                  </li>
                ))}
              </ul>
              <form onSubmit={savePreferences} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                <label className="vl-field-label">
                  Listening mode
                  <select className="vl-field" value={listeningMode} onChange={(e) => setListeningMode(e.target.value)}>
                    <option value="captions_only">Captions only</option>
                    <option value="original">Original audio</option>
                    <option value="translated">Translated (when TTS provisioned)</option>
                  </select>
                </label>
                <button type="submit" className="vl-btn vl-btn-secondary" disabled={busy}>
                  Save preferences
                </button>
              </form>
            </section>

            <section className="lg-page-section" aria-labelledby="mb-captions">
              <div className="lg-page-section__head">
                <h2 id="mb-captions" className="lg-type-section">
                  Captions &amp; turns
                </h2>
                <p className="lg-type-compact">
                  Controlled turn-taking with phrase-level committed translation. Mesh WebRTC signaling is available
                  without a Selective Forwarding Unit; simultaneous listen-channel speech stays gated until enabled
                  for this workspace.
                </p>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem' }}>
                {view.utterances.length === 0 ? (
                  <li className="lg-type-compact">No committed turns yet.</li>
                ) : (
                  view.utterances.map((u) => (
                    <li key={u.id} className="lg-card">
                      <div className="lg-type-compact">
                        {u.speakerId.slice(0, 10)} · turn {u.turnId} · {u.revision?.commitState ?? '—'}
                      </div>
                      <div>{u.revision?.originalText}</div>
                      {(u.revision?.translations ?? []).map((t) => (
                        <div key={t.id} className="lg-type-compact" style={{ marginTop: '0.25rem' }}>
                          → ({t.targetLanguage}) {t.text} · {t.status}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => {
                          setCorrectUtteranceId(u.id);
                          setCorrectText(u.revision?.originalText ?? '');
                        }}
                      >
                        Correct this turn
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <form onSubmit={sendUtterance} style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                <label className="vl-field-label">
                  Your turn (typed contribution)
                  <textarea
                    className="vl-field"
                    rows={3}
                    value={turnText}
                    onChange={(e) => setTurnText(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  Commit turn
                </button>
              </form>
              {correctUtteranceId ? (
                <form onSubmit={correctUtterance} style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                  <label className="vl-field-label">
                    Correction for utterance {correctUtteranceId.slice(0, 8)}…
                    <textarea
                      className="vl-field"
                      rows={2}
                      value={correctText}
                      onChange={(e) => setCorrectText(e.target.value)}
                      required
                    />
                  </label>
                  <button type="submit" className="vl-btn vl-btn-secondary" disabled={busy}>
                    Submit correction (invalidates dependent drafts)
                  </button>
                </form>
              ) : null}
            </section>

            <section className="lg-page-section" aria-labelledby="mb-items">
              <div className="lg-page-section__head">
                <h2 id="mb-items" className="lg-type-section">
                  Decisions &amp; actions
                </h2>
                <p className="lg-type-compact">
                  AI drafts are proposals only. Each action needs every named owner plus the organizer.
                </p>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem' }}>
                {view.items.map((item) => (
                  <li key={item.id} className="lg-card">
                    <strong>
                      {item.kind} · {item.state}
                    </strong>
                    <p style={{ margin: '0.35rem 0' }}>{item.revision?.wording}</p>
                    <div className="lg-type-compact">
                      owners {(item.revision?.ownerParticipantIds ?? []).join(', ') || '—'}
                      {item.revision?.dueDate ? ` · due ${item.revision.dueDate}` : ''}
                    </div>
                    <div className="lg-type-compact">
                      confirmations:{' '}
                      {(item.revision?.confirmations ?? [])
                        .map((c) => `${c.actorId.slice(0, 8)}:${c.action}`)
                        .join(' · ') || 'none yet'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="vl-btn vl-btn-primary"
                        disabled={busy}
                        onClick={() => void confirmItem(item.id, 'confirm')}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        disabled={busy}
                        onClick={() => void confirmItem(item.id, 'change_request')}
                      >
                        Request change
                      </button>
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        disabled={busy}
                        onClick={() => void confirmItem(item.id, 'decline')}
                      >
                        Decline
                      </button>
                      {item.revision ? (
                        <button
                          type="button"
                          className="vl-btn vl-btn-secondary"
                          disabled={busy}
                          onClick={() =>
                            void amendItem(
                              item.id,
                              item.revision!.revisionNumber,
                              `${item.revision!.wording} (amended)`,
                            )
                          }
                        >
                          Amend wording
                        </button>
                      ) : null}
                      {item.state === 'confirmed' && isOrganizer ? (
                        <button
                          type="button"
                          className="vl-btn vl-btn-secondary"
                          disabled={busy}
                          onClick={() => void syncItem(item.id)}
                        >
                          Sync task
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {isOrganizer ? (
                <div
                  className="lg-card"
                  style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}
                >
                  <label className="vl-field-label">
                    Sync destination
                    <select
                      className="vl-field"
                      value={syncDestination}
                      onChange={(e) =>
                        setSyncDestination(e.target.value as typeof syncDestination)
                      }
                    >
                      <option value="private_download">Private download</option>
                      <option value="internal_queue">Internal queue</option>
                      <option value="slack">Slack</option>
                      <option value="email">Email</option>
                      <option value="calendar">Calendar (ICS / Google)</option>
                    </select>
                  </label>
                  {(syncDestination === 'slack' || syncDestination === 'email') && (
                    <label className="vl-field-label">
                      Target ({syncDestination === 'slack' ? 'channel' : 'address'})
                      <input
                        className="vl-field"
                        value={syncTarget}
                        onChange={(e) => setSyncTarget(e.target.value)}
                        placeholder={syncDestination === 'slack' ? '#ops' : 'ops@example.com'}
                      />
                    </label>
                  )}
                </div>
              ) : null}
              <form onSubmit={proposeItem} className="lg-card" style={{ display: 'grid', gap: '0.65rem', marginTop: '0.75rem' }}>
                <label className="vl-field-label">
                  Kind
                  <select
                    className="vl-field"
                    value={itemKind}
                    onChange={(e) => setItemKind(e.target.value as typeof itemKind)}
                  >
                    <option value="action">Action</option>
                    <option value="decision">Decision</option>
                    <option value="proposal">Proposal</option>
                    <option value="question">Question</option>
                  </select>
                </label>
                <label className="vl-field-label">
                  Exact wording
                  <textarea
                    className="vl-field"
                    rows={2}
                    value={itemWording}
                    onChange={(e) => setItemWording(e.target.value)}
                    required
                  />
                </label>
                {itemKind === 'action' ? (
                  <label className="vl-field-label">
                    Due date ({view.meeting.timeZone})
                    <input className="vl-field" type="date" value={itemDue} onChange={(e) => setItemDue(e.target.value)} />
                  </label>
                ) : null}
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  Propose item
                </button>
              </form>
            </section>

            <section className="lg-page-section" aria-labelledby="mb-minutes">
              <div className="lg-page-section__head">
                <h2 id="mb-minutes" className="lg-type-section">
                  Minutes &amp; exports
                </h2>
              </div>
              {view.minutes.length === 0 ? (
                <p className="lg-type-compact">No issued minutes yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                  {view.minutes.map((m) => (
                    <li key={m.id} className="lg-card">
                      Revision {m.revisionNumber} · hash {m.contentHash.slice(0, 12)}…
                      {m.issuedAt ? ` · issued ${new Date(m.issuedAt).toLocaleString()}` : ''}
                    </li>
                  ))}
                </ul>
              )}
              {exportPreview ? (
                <pre
                  className="lg-card"
                  style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', maxHeight: 320, overflow: 'auto' }}
                >
                  {exportPreview}
                </pre>
              ) : null}
            </section>

            <section className="lg-page-section" aria-labelledby="mb-events">
              <div className="lg-page-section__head">
                <h2 id="mb-events" className="lg-type-section">
                  Recent events
                </h2>
              </div>
              <ul className="lg-type-compact" style={{ margin: 0 }}>
                {view.events.slice(-15).map((e) => (
                  <li key={e.id}>
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
