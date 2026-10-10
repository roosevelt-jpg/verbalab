'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';

type ThreadView = {
  thread: { id: string; title: string; sequence: number; corridor: string };
  me: { role: string; language: string; variety: string | null };
  members: { userId: string; role: string; language: string }[];
  messages: Array<{
    id: string;
    authorId: string;
    state: string;
    activeRevisionId: string | null;
    replyToRevisionId: string | null;
    activeRevision: {
      id: string;
      revisionNumber: number;
      reviewedTranscript: string;
      language: string;
      status: string;
      supersedesId: string | null;
      correctionReason: string | null;
    } | null;
    myVariant: {
      id: string;
      state: string;
      text: string;
      targetLanguage: string;
      verificationState: string;
      hasAudio: boolean;
    } | null;
    history: Array<{ id: string; revisionNumber: number; status: string; supersedesId: string | null }>;
  }>;
  noticeVersion: string;
};

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export function VoiceBridgeThreadClient({ threadId }: { threadId: string }) {
  const { getToken, isSignedIn } = useAuth();
  const [view, setView] = useState<ThreadView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [draftMsg, setDraftMsg] = useState<{ messageId: string; draftRevisionId: string; transcript: string } | null>(
    null,
  );
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('vb-creator-1');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedRevisions, setSelectedRevisions] = useState<string[]>([]);
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [dealResult, setDealResult] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const tokenFn = useCallback(async () => {
    if (isClerkConfigured() && isSignedIn) return (await getToken()) ?? undefined;
    return apiKey.trim() || undefined;
  }, [apiKey, getToken, isSignedIn]);

  const headers = useCallback(() => {
    const h: Record<string, string> = {};
    if (!isClerkConfigured() || !isSignedIn) h['X-VoiceBridge-Actor-Id'] = actorId;
    return h;
  }, [actorId, isSignedIn]);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const token = await tokenFn();
      const data = await apiFetch<ThreadView>(`/v1/voicebridge/threads/${threadId}`, {
        token,
        headers: headers(),
      });
      setView(data);
      setPartyA((prev) => prev || data.members[0]?.userId || '');
      setPartyB((prev) => prev || data.members[1]?.userId || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load thread');
    }
  }, [headers, threadId, tokenFn]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createInvite() {
    setBusy(true);
    try {
      const token = await tokenFn();
      const inv = await apiFetch<{ token: string; joinPath: string }>(
        `/v1/voicebridge/threads/${threadId}/invites`,
        { method: 'POST', token, headers: headers(), body: '{}' },
      );
      setInviteUrl(`${window.location.origin}${inv.joinPath}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitDraft(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFn();
      const draft = await apiFetch<{
        messageId: string;
        draftRevision: { id: string; reviewedTranscript: string };
      }>(`/v1/voicebridge/threads/${threadId}/messages`, {
        method: 'POST',
        token,
        headers: headers(),
        body: JSON.stringify({ text }),
      });
      setDraftMsg({
        messageId: draft.messageId,
        draftRevisionId: draft.draftRevision.id,
        transcript: draft.draftRevision.reviewedTranscript,
      });
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitAudioDraft(blob: Blob, mimeType: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFn();
      const form = new FormData();
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      form.append('file', blob, `recording.${ext}`);
      form.append('language', view?.me.language ?? 'en');
      const draft = await apiFetch<{
        messageId: string;
        draftRevision: { id: string; reviewedTranscript: string };
      }>(`/v1/voicebridge/threads/${threadId}/messages`, {
        method: 'POST',
        token,
        headers: headers(),
        body: form,
      });
      setDraftMsg({
        messageId: draft.messageId,
        draftRevisionId: draft.draftRevision.id,
        transcript: draft.draftRevision.reviewedTranscript || '(review required — ASR draft)',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio draft failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecord() {
    if (recording && mediaRef.current) {
      mediaRef.current.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot record audio. Use text draft instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecorderMime();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        void submitAudioDraft(blob, type);
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone permission denied');
    }
  }

  async function publishDraft() {
    if (!draftMsg) return;
    setBusy(true);
    try {
      const token = await tokenFn();
      await apiFetch(`/v1/voicebridge/messages/${draftMsg.messageId}/publish`, {
        method: 'POST',
        token,
        headers: headers(),
        body: JSON.stringify({
          expectedDraftRevisionId: draftMsg.draftRevisionId,
          reviewedTranscript: draftMsg.transcript,
        }),
      });
      setDraftMsg(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  }

  async function correct(messageId: string, activeRevisionId: string, current: string) {
    const next = window.prompt('Corrected transcript (sender review)', current);
    if (!next?.trim()) return;
    setBusy(true);
    try {
      const token = await tokenFn();
      await apiFetch(`/v1/voicebridge/messages/${messageId}/corrections`, {
        method: 'POST',
        token,
        headers: headers(),
        body: JSON.stringify({
          expectedActiveRevisionId: activeRevisionId,
          reviewedTranscript: next.trim(),
          correctionReason: 'author_correction',
        }),
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Correction failed');
    } finally {
      setBusy(false);
    }
  }

  async function acknowledge(revisionId: string) {
    setBusy(true);
    try {
      const token = await tokenFn();
      await apiFetch(`/v1/voicebridge/revisions/${revisionId}/acknowledgments`, {
        method: 'POST',
        token,
        headers: headers(),
        body: '{}',
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ack failed');
    } finally {
      setBusy(false);
    }
  }

  function toggleRevision(id: string) {
    setSelectedRevisions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function createDealDraft() {
    setBusy(true);
    setDealResult(null);
    setError(null);
    try {
      const token = await tokenFn();
      const result = await apiFetch<{
        dealSessionId: string | null;
        dealbridgePath: string | null;
        note: string;
      }>(`/v1/voicebridge/threads/${threadId}/deal-drafts`, {
        method: 'POST',
        token,
        headers: headers(),
        body: JSON.stringify({
          selectedRevisionIds: selectedRevisions,
          partyAUserId: partyA,
          partyBUserId: partyB,
          category: 'voicebridge_handoff',
        }),
      });
      setDealResult(
        result.dealSessionId
          ? `${result.note} Session ${result.dealSessionId}${result.dealbridgePath ? ` → ${result.dealbridgePath}` : ''}`
          : result.note,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'DealBridge handoff failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="vl-page" style={{ maxWidth: 880, margin: '0 auto', padding: '2rem 1.25rem' }}>
      <p style={{ margin: 0 }}>
        <Link href="/voicebridge">← Threads</Link>
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', margin: '0.5rem 0' }}>
        {view?.thread.title ?? 'VoiceBridge thread'}
      </h1>
      {view ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          You: {view.me.role} · {view.me.language} · corridor {view.thread.corridor} · notice {view.noticeVersion}
        </p>
      ) : null}

      {!isClerkConfigured() || !isSignedIn ? (
        <div className="vl-panel" style={{ padding: '0.85rem', marginBottom: '1rem', display: 'grid', gap: 8 }}>
          <input className="vl-input" placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          <input className="vl-input" placeholder="Actor id" value={actorId} onChange={(e) => setActorId(e.target.value)} />
          <button type="button" className="vl-btn" onClick={() => void reload()}>
            Reload
          </button>
        </div>
      ) : null}

      {error ? <p role="alert" style={{ color: 'crimson' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" className="vl-btn" disabled={busy} onClick={() => void createInvite()}>
          Create invite link
        </button>
        {inviteUrl ? (
          <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{inviteUrl}</code>
        ) : null}
      </div>

      <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1.25rem' }} aria-labelledby="vb-members">
        <h2 id="vb-members" style={{ marginTop: 0, fontSize: '1.05rem' }}>
          Members
        </h2>
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {(view?.members ?? []).map((m) => (
            <li key={m.userId}>
              {m.userId} · {m.role} · {m.language}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.5rem' }} aria-labelledby="vb-conversation">
        <h2 id="vb-conversation" style={{ fontSize: '1.05rem', margin: 0 }}>
          Conversation
        </h2>
        {(view?.messages ?? []).map((msg) => (
          <article key={msg.id} className="vl-panel" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {msg.authorId} · {msg.state}
              {msg.activeRevision?.supersedesId ? ' · correction supersedes prior revision' : ''}
            </div>
            {msg.activeRevision ? (
              <>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedRevisions.includes(msg.activeRevision.id)}
                    onChange={() => toggleRevision(msg.activeRevision!.id)}
                    aria-label={`Select revision ${msg.activeRevision.revisionNumber} for DealBridge`}
                  />
                  Select for DealBridge draft
                </label>
                <p style={{ margin: '0.5rem 0 0.25rem' }}>
                  <strong>Source ({msg.activeRevision.language})</strong>
                  {msg.activeRevision.status === 'superseded' ? ' — superseded' : ''}
                </p>
                <p style={{ margin: '0 0 0.5rem', whiteSpace: 'pre-wrap' }}>
                  {msg.activeRevision.reviewedTranscript}
                </p>
                {msg.myVariant ? (
                  <>
                    <p style={{ margin: '0.5rem 0 0.25rem' }}>
                      <strong>For you ({msg.myVariant.targetLanguage})</strong> · {msg.myVariant.state}
                      {msg.myVariant.verificationState === 'needs_clarification'
                        ? ' · spoken delivery blocked pending clarification'
                        : ''}
                    </p>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.myVariant.text || '(unsupported / empty)'}</p>
                  </>
                ) : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {msg.authorId === actorId || (isSignedIn && msg.authorId) ? (
                    <button
                      type="button"
                      className="vl-btn"
                      disabled={busy || msg.state !== 'published'}
                      onClick={() =>
                        void correct(
                          msg.id,
                          msg.activeRevision!.id,
                          msg.activeRevision!.reviewedTranscript,
                        )
                      }
                    >
                      Correct
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="vl-btn"
                    disabled={busy}
                    onClick={() => void acknowledge(msg.activeRevision!.id)}
                  >
                    Acknowledge correction
                  </button>
                </div>
                {msg.history.length > 1 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 8 }}>
                    History: {msg.history.map((h) => `r${h.revisionNumber}/${h.status}`).join(' · ')}
                  </p>
                ) : null}
              </>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Awaiting sender review / publish.</p>
            )}
          </article>
        ))}
      </section>

      <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1.25rem' }} aria-labelledby="vb-deal">
        <h2 id="vb-deal" style={{ marginTop: 0, fontSize: '1.05rem' }}>
          DealBridge draft handoff
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 0 }}>
          Selected evidence becomes a proposed DealBridge draft only. Playback and acknowledgment are not agreement.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Party A user id
            <input className="vl-input" value={partyA} onChange={(e) => setPartyA(e.target.value)} />
          </label>
          <label>
            Party B user id
            <input className="vl-input" value={partyB} onChange={(e) => setPartyB(e.target.value)} />
          </label>
          <button
            type="button"
            className="vl-btn vl-btn-primary"
            disabled={busy || selectedRevisions.length === 0 || !partyA || !partyB}
            onClick={() => void createDealDraft()}
          >
            Create DealBridge draft
          </button>
          {dealResult ? <p style={{ margin: 0, fontSize: '0.9rem' }}>{dealResult}</p> : null}
        </div>
      </section>

      {draftMsg ? (
        <section
          className="vl-panel"
          style={{ padding: '1rem', marginBottom: '1rem', borderColor: 'var(--action-primary)' }}
          aria-labelledby="vb-review"
        >
          <h2 id="vb-review" style={{ marginTop: 0, fontSize: '1.05rem' }}>
            Sender review required
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Machine transcripts are not sender-confirmed until you review and publish.
          </p>
          <textarea
            className="vl-input"
            rows={4}
            value={draftMsg.transcript}
            onChange={(e) => setDraftMsg({ ...draftMsg, transcript: e.target.value })}
            aria-label="Reviewed transcript"
          />
          <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void publishDraft()}>
            Publish to recipients
          </button>
        </section>
      ) : (
        <form className="vl-panel" onSubmit={submitDraft} style={{ padding: '1rem', display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>New message</h2>
          <textarea
            className="vl-input"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message, or record audio below"
            aria-label="Message text"
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="vl-btn vl-btn-primary" type="submit" disabled={busy || !text.trim()}>
              Draft text for review
            </button>
            <button
              type="button"
              className="vl-btn"
              disabled={busy}
              aria-pressed={recording}
              onClick={() => void toggleRecord()}
            >
              {recording ? 'Stop recording' : 'Record audio'}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
            Recording uses the browser&apos;s supported codec (Opus/WebM when available). No autoplay; you review before
            publish.
          </p>
        </form>
      )}
    </main>
  );
}
