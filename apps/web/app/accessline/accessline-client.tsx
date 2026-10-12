'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { FeaturePanel, PageHeader, PremiumCard, StatCard } from '@/components/platform';
import { resolveWorkspaceBearer } from '@/lib/studio-api-key';

type Catalog = {
  name: string;
  headline: string;
  description: string;
  telephony: { configured: boolean; mode: string; note: string; media: string };
  honesty: string[];
  deferred: string[];
  pilot: { scope: string; corridor: { label: string } };
};

type ProviderNumber = {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  voiceEnabled: boolean;
};

type ProviderNumbers = {
  provider: string;
  configured: boolean;
  numbers: ProviderNumber[];
  note: string;
};

type Line = {
  id: string;
  name: string;
  inboundNumber: string;
  integrationMode: string;
  honesty: string;
  enabledLanguages: string[];
};

const DIAL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

export function AccessLineClient() {
  const { getToken, isLoaded } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [provider, setProvider] = useState<ProviderNumbers | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [dialBuffer, setDialBuffer] = useState('');
  const [lineName, setLineName] = useState('AccessLine business line');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const tokenHeaders = useCallback(async () => {
    const token = await resolveWorkspaceBearer(() => getToken());
    if (!token) throw new Error('Sign in or apply a Studio API key to use AccessLine.');
    return token;
  }, [getToken]);

  const refresh = useCallback(async () => {
    const token = await tokenHeaders();
    const [cat, lineRes, numbers] = await Promise.all([
      apiFetch<Catalog>('/v1/accessline/catalog', { token }),
      apiFetch<{ lines: Line[] }>('/v1/accessline/lines', { token }),
      apiFetch<ProviderNumbers>('/v1/accessline/telephony/numbers', { token }),
    ]);
    setCatalog(cat);
    setLines((lineRes.lines ?? []).filter((l) => l.integrationMode !== 'simulated'));
    setProvider(numbers);
    if (!selectedNumber && numbers.numbers?.[0]) {
      setSelectedNumber(numbers.numbers[0].phoneNumber);
      setDialBuffer(numbers.numbers[0].phoneNumber);
    }
  }, [tokenHeaders, selectedNumber]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  function pushLog(msg: string) {
    setLog((prev) => [msg, ...prev].slice(0, 40));
  }

  function pressKey(key: string) {
    setDialBuffer((prev) => `${prev}${key}`.slice(0, 20));
  }

  function clearDial() {
    setDialBuffer('');
  }

  function backspace() {
    setDialBuffer((prev) => prev.slice(0, -1));
  }

  const liveNumbers = provider?.numbers ?? [];
  const telephonyReady = Boolean(provider?.configured);
  const matchedNumber = useMemo(
    () => liveNumbers.find((n) => n.phoneNumber === dialBuffer || n.phoneNumber === selectedNumber),
    [liveNumbers, dialBuffer, selectedNumber],
  );

  async function attachNumber() {
    const phone = dialBuffer.trim() || selectedNumber.trim();
    if (!phone) {
      setError('Select or dial a live provider number first.');
      return;
    }
    if (!telephonyReady) {
      setError(
        'Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and TWILIO_WEBHOOK_BASE_URL — then numbers pull into this dialer.',
      );
      return;
    }
    if (!liveNumbers.some((n) => n.phoneNumber === phone)) {
      setError('That number is not on the Twilio account. Pick a number from the live list.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await tokenHeaders();
      const line = await apiFetch<Line>('/v1/accessline/lines', {
        token,
        method: 'POST',
        body: {
          name: lineName.trim() || 'AccessLine business line',
          inboundNumber: phone,
          enabledLanguages: ['sw-KE', 'en'],
          integrationMode: 'twilio',
        },
      });
      pushLog(`Attached live line ${line.inboundNumber}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attach number');
    } finally {
      setBusy(false);
    }
  }

  const activeLiveLines = lines.filter((l) => l.integrationMode === 'twilio');

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="AccessLine"
          title={catalog?.headline ?? 'Call in your language. Get grounded delivery answers.'}
          lede={
            catalog?.description ??
            'Native-language telephone service for logistics delivery-status. Callers use an ordinary business number.'
          }
        >
          <p>
            Live dialer pad — numbers appear only after Twilio (or another authorized carrier
            integration) is connected. The console never invents simulated DIDs.
          </p>
        </PageHeader>

        <div className="lg-grid-stats">
          <StatCard
            label="Telephony"
            value={telephonyReady ? 'Live' : 'Waiting'}
            hint={catalog?.telephony.mode ?? provider?.note ?? 'awaiting_provider'}
          />
          <StatCard
            label="Provider numbers"
            value={liveNumbers.length}
            hint={provider?.provider ?? 'twilio'}
          />
          <StatCard
            label="Attached lines"
            value={activeLiveLines.length}
            hint="Live business lines in this workspace"
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
              title="Live DID"
              body="Provider numbers pull into the dialer when Twilio credentials are present. Attach one as your inbound AccessLine."
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
            title="Live dialer"
            meta={
              <span className="vl-tag">{telephonyReady ? 'Provider connected' : 'Awaiting integration'}</span>
            }
            footer={
              <>
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy || !telephonyReady || !matchedNumber}
                  onClick={() => void attachNumber()}
                >
                  Attach as business line
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={busy}
                  onClick={() => void refresh().catch((err: Error) => setError(err.message))}
                >
                  Refresh numbers
                </button>
              </>
            }
          >
            <p className="lg-card__body">
              {provider?.note ??
                'Connect Twilio to pull live numbers. Until then the pad stays empty of DIDs.'}
            </p>

            <div
              aria-live="polite"
              style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-control)',
                background: 'var(--surface-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.35rem',
                letterSpacing: '0.04em',
                minHeight: '2.75rem',
                color: 'var(--brand-navy)',
              }}
            >
              {dialBuffer || <span style={{ color: 'var(--muted)' }}>Enter number…</span>}
            </div>

            <div
              role="group"
              aria-label="Dial pad"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '0.5rem',
                marginTop: '0.85rem',
              }}
            >
              {DIAL_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  style={{ minHeight: '3rem', fontSize: '1.15rem', fontWeight: 700 }}
                  onClick={() => pressKey(key)}
                >
                  {key}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
              <button type="button" className="vl-btn vl-btn-secondary" onClick={backspace}>
                Delete
              </button>
              <button type="button" className="vl-btn vl-btn-secondary" onClick={clearDial}>
                Clear
              </button>
            </div>

            <label className="vl-field-label" style={{ marginTop: '1rem' }}>
              Line name
              <input
                className="vl-field"
                value={lineName}
                onChange={(e) => setLineName(e.target.value)}
                placeholder="AccessLine business line"
              />
            </label>

            <label className="vl-field-label" style={{ marginTop: '0.75rem' }}>
              Live numbers from provider
              <select
                className="vl-field"
                value={selectedNumber}
                disabled={liveNumbers.length === 0}
                onChange={(e) => {
                  setSelectedNumber(e.target.value);
                  setDialBuffer(e.target.value);
                }}
              >
                {liveNumbers.length === 0 ? (
                  <option value="">No live numbers yet — connect Twilio</option>
                ) : (
                  liveNumbers.map((n) => (
                    <option key={n.sid} value={n.phoneNumber}>
                      {n.friendlyName} ({n.phoneNumber})
                      {!n.voiceEnabled ? ' · voice off' : ''}
                    </option>
                  ))
                )}
              </select>
            </label>
            {!telephonyReady ? (
              <p className="vl-field-hint" style={{ marginTop: '0.65rem' }}>
                Set Twilio credentials on the API, redeploy, then Refresh numbers. Docs:{' '}
                <Link href="/docs/ACCESSLINE.md" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
                  AccessLine guide
                </Link>
              </p>
            ) : null}
          </PremiumCard>

          <PremiumCard
            title="Attached business lines"
            meta={<span className="vl-tag">{activeLiveLines.length} live</span>}
          >
            {activeLiveLines.length === 0 ? (
              <p className="lg-card__body">
                No live lines attached yet. When provider numbers appear on the dialer, attach one to
                receive AccessLine webhooks on that DID.
              </p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
                {activeLiveLines.map((l) => (
                  <li
                    key={l.id}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-control)',
                      background: 'var(--surface-muted)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{l.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                      {l.inboundNumber}
                    </div>
                    <div className="vl-field-hint">{l.integrationMode} · {l.enabledLanguages.join(', ')}</div>
                  </li>
                ))}
              </ul>
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
