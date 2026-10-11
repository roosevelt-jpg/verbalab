'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader, FeaturePanel } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { RelayAuthGate, type RelayAuthBag } from '@/lib/relay-auth';

type Catalog = {
  name?: string;
  headline?: string;
  description?: string;
  honesty?: string[];
  corridorCount?: number;
  marketCount?: number;
  markets?: {
    code: string;
    nameEn: string;
    region: string;
    worldRegion?: string;
    englishAccent?: { nameEn: string; bcp47: string };
    culturalVarieties?: { varietyName: string; languageCode: string; dialects: string[] }[];
  }[];
  corridors?: {
    id: string;
    label: string;
    note: string;
    marketCode?: string;
    marketName?: string;
    region?: string;
    englishAccent?: { nameEn: string; bcp47: string };
  }[];
  payments?: { mode: string; note: string };
};

type BookingRow = {
  id: string;
  status: string;
  paymentState: string;
  reservedStartAt: string;
  interpreter?: { displayName: string; supplyKind: string };
  request?: { corridorId: string };
};

export function RelayHomeClient() {
  return <RelayAuthGate>{(auth) => <RelayHomeFlow auth={auth} />}</RelayAuthGate>;
}

function RelayHomeFlow({ auth }: { auth: RelayAuthBag }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [coverageNote, setCoverageNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [corridorId, setCorridorId] = useState('ak-en-business');
  const [marketCode, setMarketCode] = useState('GH');
  const [durationMinutes, setDurationMinutes] = useState(30);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (!auth.ready) {
        setCatalog({
          name: 'Lugemi Relay',
          headline: 'Book a qualified interpreter when machine help is not enough.',
          description: 'Sign in or paste an API key to request a scheduled browser session.',
          corridors: [
            {
              id: 'ak-en-business',
              label: 'Akan/Twi ↔ Ghanaian English · general business (Ghana)',
              note: '',
              marketCode: 'GH',
              englishAccent: { nameEn: 'Ghanaian English', bcp47: 'en-GH' },
            },
          ],
          markets: [
            {
              code: 'GH',
              nameEn: 'Ghana',
              region: 'West Africa',
              englishAccent: { nameEn: 'Ghanaian English', bcp47: 'en-GH' },
            },
          ],
          honesty: [],
        });
        return;
      }
      const a = await auth.authHeaders();
      const headers = a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined;
      const cat = await apiFetch<Catalog>('/v1/relay/catalog', { token: a.token, headers });
      setCatalog(cat);
      if (cat.corridors?.length) {
        setCorridorId((prev) =>
          cat.corridors!.some((c) => c.id === prev) ? prev : cat.corridors![0]!.id,
        );
        const selected = cat.corridors.find((c) => c.id === corridorId) ?? cat.corridors[0];
        if (selected?.marketCode) setMarketCode(selected.marketCode);
      }
      const cov = await apiFetch<{ unmatchedPolicy?: string; interpreters?: { openSlots: number }[] }>(
        '/v1/relay/coverage',
        { token: a.token, headers },
      );
      const open = (cov.interpreters ?? []).reduce((n, i) => n + i.openSlots, 0);
      setCoverageNote(`${open} open slots · ${cov.unmatchedPolicy ?? ''}`);
      const res = await apiFetch<{ bookings: BookingRow[] }>('/v1/relay/bookings', {
        token: a.token,
        headers,
      });
      setBookings(res.bookings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load Relay');
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await auth.authHeaders();
      const preferredStartAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const created = await apiFetch<{
        request: { id: string; status: string };
        offer?: { id: string } | null;
        quote?: { id: string } | null;
      }>('/v1/relay/requests', {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        body: {
          corridorId,
          durationMinutes,
          preferredStartAt,
          preferredTimezone: 'Africa/Accra',
          idempotencyKey: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      });
      if (created.request.status === 'unmatched') {
        setError('No interpreter slot covers that window — request left unmatched without charging.');
        await load();
        return;
      }
      if (created.offer?.id) {
        await apiFetch(`/v1/relay/offers/${created.offer.id}/accept`, {
          method: 'POST',
          token: a.token,
          headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
        });
      }
      if (created.quote?.id) {
        const booked = await apiFetch<{ booking: { id: string } }>(
          `/v1/relay/requests/${created.request.id}/quotes/${created.quote.id}/accept`,
          {
            method: 'POST',
            token: a.token,
            headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
          },
        );
        window.location.href = `/relay/bookings/${booked.booking.id}`;
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create request');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Relay"
          title={catalog?.name ?? 'Relay'}
          lede={catalog?.headline ?? 'Book a qualified interpreter when machine help is not enough.'}
        >
          <div className="lg-page-header__actions">
            <Link href="/relay/offers" className="vl-btn vl-btn-secondary">
              Offers
            </Link>
            <Link href="/relay/ops" className="vl-btn vl-btn-secondary">
              Ops
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        <FeaturePanel
          title="Human interpreter fallback"
          body={
            catalog?.description ??
            'Approve price and context sharing, then join a private browser session. Interpreters cannot confirm business terms for you.'
          }
        />

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <p className="lg-type-compact">Paste a Lugemi API key to use Relay without Clerk.</p>
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

        {coverageNote ? <p className="lg-type-compact">{coverageNote}</p> : null}
        {catalog?.payments ? (
          <p className="lg-type-compact">
            Payments: {catalog.payments.mode} — {catalog.payments.note}
          </p>
        ) : null}

        <section className="lg-page-section" aria-labelledby="relay-start">
          <div className="lg-page-section__head">
            <h2 id="relay-start" className="lg-type-section">
              Request a scheduled session
            </h2>
            <p className="lg-type-compact">
              General business only. Medical, legal and emergency domains stay disabled.
            </p>
          </div>
          <form onSubmit={onCreate} className="lg-card" style={{ display: 'grid', gap: '0.65rem' }}>
            <p className="lg-type-compact">
              {catalog?.marketCount ?? 0} markets (Africa · LATAM · SEA · Middle East) ·{' '}
              {catalog?.corridorCount ?? 0} wired corridors · country English + local dialects
            </p>
            <label className="vl-field-label">
              Market
              <select
                className="vl-field"
                value={marketCode}
                onChange={(e) => {
                  const next = e.target.value;
                  setMarketCode(next);
                  const first = (catalog?.corridors ?? []).find((c) => c.marketCode === next);
                  if (first) setCorridorId(first.id);
                }}
              >
                {(catalog?.markets ?? []).map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.nameEn}
                    {m.englishAccent ? ` · ${m.englishAccent.nameEn}` : ''}
                    {m.culturalVarieties?.[0] ? ` · ${m.culturalVarieties[0].varietyName}` : ''} (
                    {m.worldRegion ?? m.region})
                  </option>
                ))}
              </select>
            </label>
            <label className="vl-field-label">
              Corridor
              <select
                className="vl-field"
                value={corridorId}
                onChange={(e) => setCorridorId(e.target.value)}
              >
                {(catalog?.corridors ?? [])
                  .filter((c) => !marketCode || c.marketCode === marketCode || !c.marketCode)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="vl-field-label">
              Duration (minutes)
              <input
                className="vl-field"
                type="number"
                min={30}
                max={180}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </label>
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy || !auth.ready}>
              {busy ? 'Matching…' : 'Request interpreter'}
            </button>
          </form>
        </section>

        {catalog?.honesty?.length ? (
          <section className="lg-page-section">
            <h2 className="lg-type-section">How Relay stays honest</h2>
            <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
              {catalog.honesty.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="lg-page-section">
          <h2 className="lg-type-section">Your bookings</h2>
          {!bookings.length ? (
            <p className="lg-type-compact">No bookings yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
              {bookings.map((b) => (
                <li key={b.id}>
                  <Link href={`/relay/bookings/${b.id}`} className="lg-card" style={{ display: 'block' }}>
                    <strong>
                      {b.interpreter?.displayName ?? 'Interpreter'} · {b.request?.corridorId}
                    </strong>
                    <div className="lg-type-compact">
                      {b.status} · payment {b.paymentState} ·{' '}
                      {new Date(b.reservedStartAt).toLocaleString()}
                      {b.interpreter?.supplyKind === 'demo_staffed' ? ' · demo staffed' : ''}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
