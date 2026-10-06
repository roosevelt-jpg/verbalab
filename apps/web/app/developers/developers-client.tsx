'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CodePanel } from '@/components/code-panel';

type Overview = {
  organization: { name: string; plan: string };
  apiKeys: { active: number; live: number; test: number };
  billing: {
    planName: string;
    charactersUsed: number;
    characterQuota: number;
    charactersRemaining: number;
  };
  usage: { characters: number; requests: number };
  sdk: {
    typescript: { name: string; version: string; install: string };
    cli: { name: string; bin: string; install: string; commands: string[] };
  };
  applications: { mappedTo: string; data: { id: string; name: string; isCurrent: boolean }[] };
  sandbox: { separateCluster: boolean; note: string };
  oauthClients: { supported: boolean; note: string };
  links: Record<string, string>;
};

export function DevelopersClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/developer/overview', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  return (
    <AppShell>
      <p className="vl-tag" style={{ margin: 0 }}>
        Lugemi API
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0.55rem 0 0.35rem',
          color: 'var(--brand-navy)',
        }}
      >
        Developers
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '40rem', lineHeight: 1.6 }}>
        Build speaking agents with Lugemi: create an API key, install <code className="vl-code">@lugemi/sdk</code>, and
        call speech, translate, detect, or voice simulate. Africa-first languages, accents, and cultural context; LATAM,
        Southeast Asia, the Middle East, and the EU in scope. Soft <code className="vl-code">lg_test_</code> keys share
        this cluster — not a separate sandbox plane.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <section className="vl-endpoint-card">
            <h2 style={sectionLabel}>Organization</h2>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', color: 'var(--brand-navy)' }}>
              {data.organization.name}
            </p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Plan {data.billing.planName} · {data.billing.charactersUsed.toLocaleString()} /{' '}
              {data.billing.characterQuota.toLocaleString()} characters · {data.usage.requests} translate requests
            </p>
          </section>

          <section className="vl-endpoint-card">
            <h2 style={sectionLabel}>API keys</h2>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--brand-navy)' }}>
              {data.apiKeys.active} active ({data.apiKeys.live} live · {data.apiKeys.test} test)
            </p>
            <p style={{ margin: '0.65rem 0 0' }}>
              <Link href="/keys" style={{ color: 'var(--action-primary)', fontWeight: 550 }}>
                Manage keys →
              </Link>
            </p>
          </section>

          <section className="vl-endpoint-card">
            <h2 style={sectionLabel}>Applications (workspaces)</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.35rem' }}>
              {data.applications.data.map((app) => (
                <li
                  key={app.id}
                  style={{ color: app.isCurrent ? 'var(--ink)' : 'var(--muted)', fontWeight: app.isCurrent ? 600 : 400 }}
                >
                  {app.name}
                  {app.isCurrent ? ' · current' : ''}
                </li>
              ))}
            </ul>
          </section>

          <section className="vl-endpoint-card">
            <h2 style={sectionLabel}>SDK & CLI</h2>
            <CodePanel
              label="Install"
              code={`${data.sdk.typescript.install}
${data.sdk.cli.install}

# ${data.sdk.cli.bin} ${data.sdk.cli.commands.join(' | ')}
export LUGEMI_API_KEY=lg_live_...
export LUGEMI_API_URL=${API_URL}`}
            />
            <p style={{ margin: '0.65rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {data.sdk.typescript.name}@{data.sdk.typescript.version} · {data.sdk.cli.name}
            </p>
          </section>

          <section className="vl-player-bar">
            <Link href="/docs" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
              Docs
            </Link>
            <Link href="/playground" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Playground
            </Link>
            <a href={`${API_URL}/v1/openapi.json`} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              OpenAPI
            </a>
            <Link href="/usage" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Usage
            </Link>
            <Link href="/billing" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
              Billing
            </Link>
          </section>

          <section className="vl-endpoint-card">
            <h2 style={sectionLabel}>Honest limits</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Sandbox: {data.sandbox.note} Separate cluster: {data.sandbox.separateCluster ? 'yes' : 'no'}. OAuth
              clients: {data.oauthClients.supported ? 'yes' : 'no'} — {data.oauthClients.note}
            </p>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.55rem',
  fontWeight: 700,
};
