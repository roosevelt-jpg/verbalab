'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { RelayAuthGate, type RelayAuthBag } from '@/lib/relay-auth';

type BookingView = {
  booking: {
    id: string;
    status: string;
    paymentState: string;
    paymentMode: string;
    reservedStartAt: string;
    reservedEndAt: string;
    cancellationTerms: string;
    extensionApprovedMinutes?: number;
    revision?: number;
    interpreter: { displayName: string; supplyKind: string; status: string };
    quote: {
      id: string;
      currency: string;
      amountMinor: number;
      includedMinutes: number;
      minimumMinutes: number;
      cancellationTerms: string;
    };
    request: { id: string; corridorId: string; category: string; originProduct?: string | null };
    contextGrants: Array<{
      id: string;
      purpose: string;
      scopeNote: string;
      revokedAt?: string | null;
      stale?: boolean;
      evidence: unknown[];
    }>;
    sessions: Array<{ id: string; state: string; roomId: string }>;
    corrections?: Array<{
      id: string;
      suggestion: string;
      reviewStatus: string;
      trainingRightsGranted: boolean;
    }>;
    authorityNote?: string;
  };
};

export function RelayBookingClient({ bookingId }: { bookingId: string }) {
  return (
    <RelayAuthGate>{(auth) => <BookingFlow bookingId={bookingId} auth={auth} />}</RelayAuthGate>
  );
}

function BookingFlow({ bookingId, auth }: { bookingId: string; auth: RelayAuthBag }) {
  const [view, setView] = useState<BookingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [joinInfo, setJoinInfo] = useState<string | null>(null);
  const [evidenceText, setEvidenceText] = useState(
    'Selected Everyday/MeetingBridge summary: delivery window unclear; ask for exact date.',
  );
  const [correctionText, setCorrectionText] = useState(
    'Source wording updated — delivery date is Friday, not Thursday.',
  );
  const [disputeIssue, setDisputeIssue] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<BookingView>(`/v1/relay/bookings/${bookingId}`, {
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
      });
      setView(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load booking');
    }
  }, [auth, bookingId]);

  useEffect(() => {
    if (auth.ready) void load();
  }, [load, auth.ready]);

  async function markPaid() {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/bookings/${bookingId}/payments/mark-paid`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: { idempotencyKey: `paid-${bookingId}` },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment update failed');
    } finally {
      setBusy(false);
    }
  }

  async function grantContext(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/bookings/${bookingId}/context-grants`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: {
          purpose: 'session_interpretation',
          originProduct: view?.booking.request.originProduct ?? 'relay',
          evidence: [{ kind: 'summary', text: evidenceText }],
          scopeNote: 'Interpreter sees only this grant. Cannot confirm business terms.',
        },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed');
    } finally {
      setBusy(false);
    }
  }

  async function joinSession() {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<{
        media: { token: string; expiresAt: string; note: string };
        session: { roomId: string; state: string };
        authority: { note: string };
      }>(`/v1/relay/bookings/${bookingId}/join`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: { recordingOptIn: false },
      });
      setJoinInfo(
        `Room ${res.session.roomId} · ${res.session.state} · token expires ${res.media.expiresAt}. ${res.authority.note}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Join failed');
    } finally {
      setBusy(false);
    }
  }

  async function completeSession() {
    setBusy(true);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/bookings/${bookingId}/complete`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: { connectedSeconds: 1200 },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Complete failed');
    } finally {
      setBusy(false);
    }
  }

  async function approveExtension() {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/bookings/${bookingId}/extensions`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: {
          additionalMinutes: 15,
          expectedRevision: view?.booking.revision,
        },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extension failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitCorrection(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/bookings/${bookingId}/corrections`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: {
          suggestion: correctionText,
          grantId: view?.booking.contextGrants.find((g) => !g.revokedAt)?.id,
          trainingRightsGranted: false,
        },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Correction failed');
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking() {
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/bookings/${bookingId}/cancel`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: { reason: 'Requester cancelled from console' },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setBusy(false);
    }
  }

  async function openDispute(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/bookings/${bookingId}/disputes`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: { issue: disputeIssue || 'Service quality concern' },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dispute failed');
    } finally {
      setBusy(false);
    }
  }

  async function sendFeedback(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/bookings/${bookingId}/feedback`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: { rating: 4, comment: feedbackComment || 'Session completed', role: 'requester' },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feedback failed');
    } finally {
      setBusy(false);
    }
  }

  const b = view?.booking;
  const amount =
    b != null ? `${b.quote.currency} ${(b.quote.amountMinor / 100).toFixed(2)}` : '';

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Relay booking"
          title={b ? `${b.interpreter.displayName}` : 'Booking'}
          lede="Pinned quote, explicit context grant, then private browser join."
        >
          <div className="lg-page-header__actions">
            <Link href="/relay" className="vl-btn vl-btn-secondary">
              All bookings
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              className="vl-field"
              placeholder="lg_live_… or lg_test_…"
              value={auth.apiKey}
              onChange={(e) => auth.setApiKey(e.target.value)}
            />
            <input
              className="vl-field"
              placeholder="Actor id"
              value={auth.actorId}
              onChange={(e) => auth.setActorId(e.target.value)}
            />
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Load
            </button>
          </section>
        ) : null}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        {b ? (
          <>
            <section className="lg-page-section">
              <h2 className="lg-type-section">Status</h2>
              <p className="lg-type-compact">
                {b.status} · payment {b.paymentState} ({b.paymentMode}) · {b.request.corridorId} ·{' '}
                {b.request.category}
              </p>
              <p className="lg-type-compact">
                Reserved {new Date(b.reservedStartAt).toLocaleString()} –{' '}
                {new Date(b.reservedEndAt).toLocaleString()}
              </p>
              <p className="lg-type-compact">
                Interpreter: {b.interpreter.displayName}
                {b.interpreter.supplyKind === 'demo_staffed' ? ' (demo staffed — not a hired pool)' : ''}
              </p>
              <p className="lg-type-compact">
                Quote {amount} · {b.quote.includedMinutes} min included · min {b.quote.minimumMinutes}{' '}
                min
              </p>
              <p className="lg-type-compact">{b.cancellationTerms}</p>
              {b.status === 'awaiting_payment' ? (
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy}
                  onClick={() => void markPaid()}
                >
                  Mark manual invoice paid
                </button>
              ) : null}
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Context grant</h2>
              <p className="lg-type-compact">
                Share only selected evidence. Revocation blocks future reads — not what was already heard.
              </p>
              <form onSubmit={grantContext} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
                <textarea
                  className="vl-field"
                  rows={3}
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                />
                <button type="submit" className="vl-btn vl-btn-secondary" disabled={busy}>
                  Grant scoped context
                </button>
              </form>
              <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
                {b.contextGrants.map((g) => (
                  <li key={g.id}>
                    {g.purpose} · {g.revokedAt ? 'revoked' : g.stale ? 'stale' : 'active'} —{' '}
                    {g.scopeNote}
                  </li>
                ))}
              </ul>
              <form onSubmit={submitCorrection} className="lg-card" style={{ display: 'grid', gap: '0.65rem', marginTop: '0.75rem' }}>
                <label className="lg-type-compact" htmlFor="relay-correction">
                  Source correction (marks grant stale; separate from training rights)
                </label>
                <textarea
                  id="relay-correction"
                  className="vl-field"
                  rows={2}
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                />
                <button type="submit" className="vl-btn vl-btn-secondary" disabled={busy}>
                  Record correction
                </button>
              </form>
              {(b.corrections ?? []).length > 0 ? (
                <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
                  {b.corrections!.map((c) => (
                    <li key={c.id}>
                      {c.reviewStatus}: {c.suggestion}
                      {c.trainingRightsGranted ? ' · training rights granted' : ''}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Private session</h2>
              <p className="lg-type-compact">
                Browser audio with booking-bound tokens. Interpreter clarifies meaning only — cannot
                confirm your business terms.
              </p>
              <p className="lg-type-compact">
                Extension approved: {b.extensionApprovedMinutes ?? 0} min beyond quote ceiling
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy || b.status === 'awaiting_payment'}
                  onClick={() => void joinSession()}
                >
                  Join lobby
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy || !['confirmed', 'in_progress'].includes(b.status)}
                  onClick={() => void approveExtension()}
                >
                  Approve +15 min extension
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy || ['completed', 'cancelled'].includes(b.status)}
                  onClick={() => void completeSession()}
                >
                  Complete session
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy || ['completed', 'cancelled'].includes(b.status)}
                  onClick={() => void cancelBooking()}
                >
                  Cancel booking
                </button>
              </div>
              {joinInfo ? <p className="lg-type-compact">{joinInfo}</p> : null}
              {b.sessions[0] ? (
                <p className="lg-type-compact">
                  Session {b.sessions[0].state} · room {b.sessions[0].roomId}
                </p>
              ) : null}
              {b.authorityNote ? <p className="lg-type-compact">{b.authorityNote}</p> : null}
            </section>

            <section className="lg-page-section">
              <h2 className="lg-type-section">Feedback and disputes</h2>
              <p className="lg-type-compact">
                Ratings do not decide payouts. Disputes are human-operated and preserve evidence.
              </p>
              <form onSubmit={sendFeedback} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
                <input
                  className="vl-field"
                  placeholder="Optional feedback comment"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
                <button type="submit" className="vl-btn vl-btn-secondary" disabled={busy}>
                  Submit feedback
                </button>
              </form>
              <form onSubmit={openDispute} className="lg-card" style={{ display: 'grid', gap: '0.65rem', marginTop: '0.75rem' }}>
                <input
                  className="vl-field"
                  placeholder="Dispute issue"
                  value={disputeIssue}
                  onChange={(e) => setDisputeIssue(e.target.value)}
                />
                <button type="submit" className="vl-btn vl-btn-secondary" disabled={busy}>
                  Open dispute
                </button>
              </form>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
