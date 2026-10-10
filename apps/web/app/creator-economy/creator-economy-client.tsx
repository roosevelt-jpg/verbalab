'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Scenario = {
  id: string;
  amountCents: number;
  feeBps: number;
  expectedApplicationFeeCents: number;
  expectedPublisherNetCents: number;
  handCheckPassed: boolean;
};

type Engine = {
  product: string;
  note: string;
  safety: { note: string; storesRawCardData: boolean; stripeOrEquivalentRequired: boolean };
  honesty: {
    paymentProcessorOs: boolean;
    taxHandlingComplete: boolean;
    disputeChargebackComplete: boolean;
    creatorPayoutMathVerifiedLive: boolean;
    creatorPayoutMathHandCheckedInTests: boolean;
    storesRawCardData: boolean;
    stripeOrEquivalentRequired: boolean;
  };
  royalty: {
    ecosystemHubFeeBps: number;
    contentMarketplaceFeeBpsDefault: number;
    formula: string;
  };
};

export function CreatorEconomyClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, royalty] = await Promise.all([
      apiFetch<Engine>('/v1/creator-economy/engine', { token }),
      apiFetch<{ scenarios: Scenario[]; allHandChecksPassed: boolean }>(
        '/v1/creator-economy/royalty/scenarios',
        { token },
      ),
    ]);
    setEngine(eng);
    setScenarios(royalty.scenarios);
    setAllPassed(royalty.allHandChecksPassed);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Creator Economy
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Royalty math and Connect payouts over existing — Stripe-only, never a card vault.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section style={{ borderLeft: '3px solid #b45309', paddingLeft: '0.85rem' }}>
            <h2 style={label}>Real-money safety</h2>
            <p style={{ margin: 0, maxWidth: '44rem', color: 'var(--muted)' }}>
              {engine.safety.note}
            </p>
            <ul style={{ margin: '0.5rem 0 0', color: 'var(--muted)' }}>
              <li>
                stripeOrEquivalentRequired:{' '}
                {String(engine.honesty.stripeOrEquivalentRequired)}
              </li>
              <li>storesRawCardData: {String(engine.honesty.storesRawCardData)}</li>
              <li>paymentProcessorOs: {String(engine.honesty.paymentProcessorOs)}</li>
              <li>taxHandlingComplete: {String(engine.honesty.taxHandlingComplete)}</li>
              <li>
                disputeChargebackComplete:{' '}
                {String(engine.honesty.disputeChargebackComplete)}
              </li>
              <li>
                creatorPayoutMathVerifiedLive:{' '}
                {String(engine.honesty.creatorPayoutMathVerifiedLive)}
              </li>
              <li>
                creatorPayoutMathHandCheckedInTests:{' '}
                {String(engine.honesty.creatorPayoutMathHandCheckedInTests)}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Royalty formula</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {engine.royalty.formula}
            </p>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)' }}>
              Ecosystem hubs: {engine.royalty.ecosystemHubFeeBps} bps · Content marketplace
              default: {engine.royalty.contentMarketplaceFeeBpsDefault} bps
            </p>
          </section>

          <section>
            <h2 style={label}>
              Hand-check scenarios {allPassed === true ? '(all passed)' : ''}
            </h2>
            {scenarios.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>No scenarios loaded.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
                {scenarios.map((s) => (
                  <li key={s.id}>
                    <strong>{s.id}</strong> — {s.amountCents}¢ @ {s.feeBps} bps → fee{' '}
                    {s.expectedApplicationFeeCents} / net {s.expectedPublisherNetCents}
                    {s.handCheckPassed ? ' · ok' : ' · FAIL'}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href="/marketplace" style={secondary}>
                Content Marketplace
              </Link>
              <Link href="/billing" style={secondary}>
                Billing
              </Link>
              <Link href="/ecosystem-cloud" style={secondary}>
                Ecosystem Cloud
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

const label: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 0.5rem',
  color: 'var(--muted)',
};

const secondary: CSSProperties = {
  display: 'inline-block',
  padding: '0.35rem 0.7rem',
  border: '1px solid var(--border, #ddd)',
  borderRadius: 4,
  textDecoration: 'none',
  color: 'inherit',
  fontSize: '0.9rem',
};
