'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Product = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

type Overview = {
  products: Product[];
  architecture: {
    regeneratesVolumes1to10: boolean;
    paymentProcessorOs: boolean;
    storesRawCardData: boolean;
    stripeOrEquivalentRequired: boolean;
    realMoneyRiskCategory: boolean;
  };
  safety: {
    stripeOrEquivalentRequired: boolean;
    storesRawCardData: boolean;
    pluginAgentSandboxRequired: boolean;
    realMoneyRiskCategory: boolean;
    note: string;
  };
  deferred: Record<string, boolean>;
  links: Record<string, string>;
  note: string;
};

export function EcosystemCloudClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/ecosystem-cloud/overview', { token }));
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
        Ecosystem Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Marketplace and monetization hub over existing content and voice marketplaces — not a
        payment-processor OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{data.note}</p>

          <section
            style={{
              borderLeft: '3px solid #b45309',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Real-money safety</h2>
            <p style={{ margin: 0, maxWidth: '44rem', color: 'var(--muted)' }}>{data.safety.note}</p>
            <ul style={{ margin: '0.5rem 0 0', color: 'var(--muted)' }}>
              <li>
                stripeOrEquivalentRequired: {String(data.safety.stripeOrEquivalentRequired)}
              </li>
              <li>storesRawCardData: {String(data.safety.storesRawCardData)}</li>
              <li>
                pluginAgentSandboxRequired: {String(data.safety.pluginAgentSandboxRequired)}
              </li>
              <li>realMoneyRiskCategory: {String(data.safety.realMoneyRiskCategory)}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Honesty</h2>
            <ul style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>
                regeneratesVolumes1to10: {String(data.architecture.regeneratesVolumes1to10)}
              </li>
              <li>paymentProcessorOs: {String(data.architecture.paymentProcessorOs)}</li>
              <li>
                stripeOrEquivalentRequired:{' '}
                {String(data.architecture.stripeOrEquivalentRequired)}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href={data.links.contentMarketplace ?? '/marketplace'} style={secondary}>
                Content marketplace
              </Link>
              <Link href={data.links.voiceMarketplace ?? '/voice-marketplace'} style={secondary}>
                Voice marketplace
              </Link>
              <Link href={data.links.billing ?? '/billing'} style={secondary}>
                Billing
              </Link>
              <Link href={data.links.pluginRuntime ?? '/plugin-runtime'} style={secondary}>
                Plugin Runtime
              </Link>
              <Link href={data.links.policyFabric ?? '/policy-fabric'} style={secondary}>
                Policy Fabric
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Products</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {data.products.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong> — {p.notes}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 0.5rem',
  color: 'var(--muted)',
};

const secondary: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.35rem 0.7rem',
  border: '1px solid var(--border, #ddd)',
  borderRadius: 4,
  textDecoration: 'none',
  color: 'inherit',
  fontSize: '0.9rem',
};
