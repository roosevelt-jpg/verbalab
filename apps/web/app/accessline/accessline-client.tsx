'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { FeaturePanel, PageHeader, PremiumCard, StatCard } from '@/components/platform';

type Catalog = {
  name: string;
  headline: string;
  description: string;
  telephony: { configured: boolean; mode: string; note: string; media: string };
  honesty: string[];
  deferred: string[];
  pilot: { scope: string; corridor: { label: string } };
};

type Line = {
  id: string;
  name: string;
  inboundNumber: string;
  integrationMode: string;
  honesty: string;
  enabledLanguages: string[];
};

type CallView = {
  id: string;
  state: string;
  selectedVariety?: string | null;
  authState?: string;
  orderReference?: string | null;
  lastDeliveryStatus?: string | null;
  prompt?: string;
  delivery?: { status: string; estimatedDelivery: string | null; resultState: string };
  simulator?: { otpCode?: string; note?: string };
  turns?: { role: string; transcript: string; stage?: string | null }[];
  next?: { expect?: string };
};

export function AccessLineClient() {
  const { getToken, isLoaded } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [lineId, setLineId] = useState<string>('');
  const [call, setCall] = useState<CallView | null>(null);
  const [digits, setDigits] = useState('1');
  const [speech, setSpeech] = useState('I need delivery status for my order');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const tokenHeaders = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to use AccessLine.');
    return token;
  }, [getToken]);

  const refresh = useCallback(async () => {
    const token = await tokenHeaders();
    const [cat, lineRes] = await Promise.all([
      apiFetch<Catalog>('/v1/accessline/catalog', { token }),
      apiFetch<{ lines: Line[] }>('/v1/accessline/lines', { token }),
    ]);
    setCatalog(cat);
    setLines(lineRes.lines ?? []);
    if (!lineId && lineRes.lines?.[0]) setLineId(lineRes.lines[0].id);
  }, [tokenHeaders, lineId]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  function pushLog(msg: string) {
    setLog((prev) => [msg, ...prev].slice(0, 40));
  }

  async function createLine() {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenHeaders();
      const line = await apiFetch<Line>('/v1/accessline/lines', {
        token,
        method: 'POST',
        body: {
          name: 'Pilot logistics KE',
          inboundNumber: `sim:+2547${String(Date.now()).slice(-8)}`,
          enabledLanguages: ['sw-KE', 'en'],
        },
      });
      setLineId(line.id);
      pushLog(`Created simulated line ${line.inboundNumber}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create line');
    } finally {
      setBusy(false);
    }
  }

  async function startCall() {
    if (!lineId) return;
    setBusy(true);
    setError(null);
    try {
      const token = await tokenHeaders();
      const res = await apiFetch<CallView>('/v1/accessline/simulate/start', {
        token,
        method: 'POST',
        body: { lineId, callerId: '+254700000111' },
      });
      setCall(res);
      pushLog(`Call ${res.id} → ${res.state}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start call');
    } finally {
      setBusy(false);
    }
  }

  async function sendDtmf() {
    if (!call) return;
    setBusy(true);
    setError(null);
    try {
      const token = await tokenHeaders();
      const res = await apiFetch<CallView>(`/v1/accessline/simulate/${call.id}/dtmf`, {
        token,
        method: 'POST',
        body: { digits },
      });
      setCall(res);
      pushLog(`DTMF ${digits} → ${res.state}${res.simulator?.otpCode ? ' (OTP issued in simulator)' : ''}`);
      if (res.simulator?.otpCode) setDigits(res.simulator.otpCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'DTMF failed');
    } finally {
      setBusy(false);
    }
  }

  async function sendSpeech() {
    if (!call) return;
    setBusy(true);
    setError(null);
    try {
      const token = await tokenHeaders();
      const res = await apiFetch<CallView>(`/v1/accessline/simulate/${call.id}/speech`, {
        token,
        method: 'POST',
        body: { text: speech },
      });
      setCall(res);
      pushLog(`Speech → ${res.state}`);
      if (res.simulator?.otpCode) setDigits(res.simulator.otpCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech failed');
    } finally {
      setBusy(false);
    }
  }

  async function hangup() {
    if (!call) return;
    setBusy(true);
    try {
      const token = await tokenHeaders();
      const res = await apiFetch<CallView>(`/v1/accessline/simulate/${call.id}/hangup`, {
        token,
        method: 'POST',
        body: {},
      });
      setCall(res);
      pushLog('Call ended — stale turns rejected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hangup failed');
    } finally {
      setBusy(false);
    }
  }

  const activeLine = lines.find((l) => l.id === lineId);

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="AccessLine"
          title={catalog?.headline ?? 'Call in your language. Get grounded delivery answers.'}
          lede={
            catalog?.description ??
            'Native-language telephone service for logistics delivery-status. The simulator runs the full journey without carrier credentials.'
          }
        >
          <p>
            Callers use an ordinary business number—no smartphone app required. Private order details
            always require registered-customer authentication. Live PSTN and number purchase need
            separate authorization.
          </p>
        </PageHeader>

        <div className="lg-grid-stats">
          <StatCard
            label="Telephony"
            value={catalog?.telephony.configured ? 'Ready' : 'Sim'}
            hint={catalog?.telephony.mode ?? 'simulated_only'}
          />
          <StatCard label="Lines" value={lines.length} hint="Business lines in this workspace" />
          <StatCard
            label="Call state"
            value={call?.state ?? 'idle'}
            hint={call ? `Auth: ${call.authState ?? 'none'}` : 'Start a simulator call'}
          />
          <StatCard
            label="Corridor"
            value="KE"
            hint={catalog?.pilot.corridor.label ?? 'Kenya logistics pilot'}
          />
        </div>

        <section className="lg-page-section" aria-label="How AccessLine works">
          <div className="lg-page-section__head">
            <h2 className="lg-type-section">How the journey works</h2>
            <p className="lg-type-body">
              Each step is policy-controlled. The model may phrase approved facts; it cannot invent
              status, skip authentication, or dial arbitrary numbers.
            </p>
          </div>
          <div className="lg-grid-3">
            <FeaturePanel
              icon="phone"
              title="Language & intent"
              body="DTMF or speech selects a supported variety, then recognizes delivery status, hours, repeat, or human help."
            />
            <FeaturePanel
              icon="shield"
              title="Registered auth"
              body="OTP to a pre-registered contact only. Caller ID and order references never unlock private data alone."
            />
            <FeaturePanel
              icon="wave"
              title="Grounded answers"
              body="Delivery lookup returns structured facts. Null ETA stays unavailable—never invented."
            />
          </div>
        </section>

        {error ? (
          <div
            className="lg-card lg-card--flat"
            style={{ borderColor: 'color-mix(in srgb, var(--bad) 35%, var(--border-subtle))' }}
            role="alert"
          >
            <p className="lg-card__body" style={{ color: 'var(--bad)', margin: 0 }}>
              {error}
            </p>
          </div>
        ) : null}

        <div className="lg-grid-2">
          <PremiumCard
            title="Business line"
            meta={<span className="vl-tag">Simulator</span>}
            footer={
              <>
                <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void createLine()}>
                  Create simulated line
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy || !lineId}
                  onClick={() => void startCall()}
                >
                  Start call
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy || !call || call.state === 'ended'}
                  onClick={() => void hangup()}
                >
                  Hang up
                </button>
              </>
            }
          >
            <p className="lg-card__body">
              Simulated lines are labeled and safe for pilot testing. Map a Twilio DID only after
              provisioning is authorized.
            </p>
            <label className="vl-field-label" style={{ marginTop: '0.75rem' }}>
              Active line
              <select className="vl-field" value={lineId} onChange={(e) => setLineId(e.target.value)}>
                <option value="">Select line…</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.inboundNumber})
                  </option>
                ))}
              </select>
            </label>
            {activeLine?.honesty ? <p className="vl-field-hint">{activeLine.honesty}</p> : null}

            <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
              <label className="vl-field-label">
                DTMF digits
                <span className="vl-field-hint">Language (1/2), OTP, or order reference with leading zeros.</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="vl-field" value={digits} onChange={(e) => setDigits(e.target.value)} />
                  <button type="button" className="vl-btn vl-btn-primary" disabled={busy || !call} onClick={() => void sendDtmf()}>
                    Send
                  </button>
                </div>
              </label>
              <label className="vl-field-label">
                Speech
                <span className="vl-field-hint">Ask for delivery status, hours, repeat, or a human agent.</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="vl-field" value={speech} onChange={(e) => setSpeech(e.target.value)} />
                  <button type="button" className="vl-btn vl-btn-primary" disabled={busy || !call} onClick={() => void sendSpeech()}>
                    Say
                  </button>
                </div>
              </label>
            </div>
            <p className="vl-field-hint" style={{ marginTop: '0.75rem' }}>
              Docs:{' '}
              <Link href="/docs/ACCESSLINE.md" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
                AccessLine guide
              </Link>
            </p>
          </PremiumCard>

          <PremiumCard
            title="Live call state"
            meta={call ? <span className="vl-tag">{call.state}</span> : <span className="vl-tag">Idle</span>}
          >
            {!call ? (
              <p className="lg-card__body">No active simulator call. Create a line and start a call to begin.</p>
            ) : (
              <>
                <div className="lg-grid-2" style={{ gap: '0.65rem' }}>
                  <div>
                    <div className="lg-type-caption">Language</div>
                    <div style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{call.selectedVariety ?? '—'}</div>
                  </div>
                  <div>
                    <div className="lg-type-caption">Auth</div>
                    <div style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{call.authState ?? '—'}</div>
                  </div>
                  <div>
                    <div className="lg-type-caption">Order</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {call.orderReference ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="lg-type-caption">Delivery</div>
                    <div style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>
                      {call.lastDeliveryStatus ?? '—'}
                    </div>
                  </div>
                </div>
                {call.prompt ? (
                  <p
                    className="lg-card__body"
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-control)',
                      background: 'var(--surface-muted)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {call.prompt}
                  </p>
                ) : null}
                {call.delivery ? (
                  <p className="vl-field-hint">
                    Result <strong>{call.delivery.status}</strong> ({call.delivery.resultState})
                    {call.delivery.estimatedDelivery == null
                      ? ' · no ETA'
                      : ` · ETA ${call.delivery.estimatedDelivery}`}
                  </p>
                ) : null}
                {call.simulator?.note ? <p className="vl-field-hint">{call.simulator.note}</p> : null}
              </>
            )}

            <div style={{ marginTop: '1rem' }}>
              <h3 className="lg-type-card" style={{ fontSize: '1rem' }}>
                Event log
              </h3>
              <ul
                style={{
                  margin: '0.5rem 0 0',
                  padding: 0,
                  listStyle: 'none',
                  maxHeight: '10rem',
                  overflow: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {log.length === 0 ? <li>Waiting for actions…</li> : null}
                {log.map((entry, i) => (
                  <li key={`${entry}-${i}`} style={{ padding: '0.2rem 0' }}>
                    {entry}
                  </li>
                ))}
              </ul>
            </div>

            {catalog ? (
              <div style={{ marginTop: '1rem' }}>
                <h3 className="lg-type-card" style={{ fontSize: '1rem' }}>
                  Honesty
                </h3>
                <ul className="lg-prose" style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
                  {catalog.honesty.map((h) => (
                    <li key={h} style={{ marginBottom: '0.35rem' }}>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </PremiumCard>
        </div>
      </div>
    </AppShell>
  );
}
