'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

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

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8 border-b border-zinc-200 pb-6">
          <p className="text-sm font-medium tracking-wide text-teal-800">Lugemi AccessLine</p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-zinc-900 sm:text-4xl">
            {catalog?.headline ?? 'Call in your language. Get grounded delivery answers.'}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-600">
            {catalog?.description ??
              'Native-language telephone service for logistics delivery-status. Simulator runs end-to-end without carrier credentials.'}
          </p>
          {catalog && (
            <p className="mt-3 text-sm text-zinc-500">
              Pilot: {catalog.pilot.corridor.label}. Telephony:{' '}
              <span className="font-medium text-zinc-700">{catalog.telephony.mode}</span> —{' '}
              {catalog.telephony.note}
            </p>
          )}
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="mb-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Business line</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Simulated lines are labeled. Live Twilio numbers require separate authorization.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void createLine()}
                className="rounded bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-50"
              >
                Create simulated line
              </button>
              <select
                className="rounded border border-zinc-300 px-2 py-2 text-sm"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
              >
                <option value="">Select line…</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.inboundNumber})
                  </option>
                ))}
              </select>
            </div>
            {lines.find((l) => l.id === lineId)?.honesty && (
              <p className="mt-2 text-xs text-amber-800">{lines.find((l) => l.id === lineId)?.honesty}</p>
            )}

            <h2 className="mt-8 text-lg font-semibold text-zinc-900">Simulator call</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !lineId}
                onClick={() => void startCall()}
                className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Start call
              </button>
              <button
                type="button"
                disabled={busy || !call || call.state === 'ended'}
                onClick={() => void hangup()}
                className="rounded border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
              >
                Hang up
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-zinc-600">DTMF digits</span>
                <div className="mt-1 flex gap-2">
                  <input
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 font-mono text-sm"
                    value={digits}
                    onChange={(e) => setDigits(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={busy || !call}
                    onClick={() => void sendDtmf()}
                    className="rounded bg-teal-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </label>
              <label className="block text-sm">
                <span className="text-zinc-600">Speech (intent / reference)</span>
                <div className="mt-1 flex gap-2">
                  <input
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                    value={speech}
                    onChange={(e) => setSpeech(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={busy || !call}
                    onClick={() => void sendSpeech()}
                    className="rounded bg-teal-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    Say
                  </button>
                </div>
              </label>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Journey: language DTMF → ask delivery status → OTP (simulator) → order ref with leading zeros →
              grounded status (null ETA stays null).{' '}
              <Link href="/docs/ACCESSLINE.md" className="underline">
                Docs
              </Link>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Live call state</h2>
            {!call && <p className="mt-2 text-sm text-zinc-500">No active simulator call.</p>}
            {call && (
              <div className="mt-3 space-y-3 rounded-lg border border-zinc-200 bg-gradient-to-b from-teal-50/40 to-white p-4">
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-zinc-500">State</dt>
                    <dd className="font-medium">{call.state}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Auth</dt>
                    <dd className="font-medium">{call.authState ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Language</dt>
                    <dd className="font-medium">{call.selectedVariety ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Order</dt>
                    <dd className="font-mono text-xs">{call.orderReference ?? '—'}</dd>
                  </div>
                </dl>
                {call.prompt && (
                  <p className="rounded bg-white/80 p-3 text-sm leading-relaxed text-zinc-800">{call.prompt}</p>
                )}
                {call.delivery && (
                  <p className="text-sm text-zinc-700">
                    Delivery: <strong>{call.delivery.status}</strong> ({call.delivery.resultState})
                    {call.delivery.estimatedDelivery == null ? ' · no ETA' : ` · ETA ${call.delivery.estimatedDelivery}`}
                  </p>
                )}
                {call.simulator?.note && (
                  <p className="text-xs text-amber-800">{call.simulator.note}</p>
                )}
              </div>
            )}

            <h3 className="mt-6 text-sm font-semibold text-zinc-800">Event log</h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-zinc-600">
              {log.map((entry, i) => (
                <li key={`${entry}-${i}`} className="font-mono">
                  {entry}
                </li>
              ))}
            </ul>

            {catalog && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-zinc-800">Honesty</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-600">
                  {catalog.honesty.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
