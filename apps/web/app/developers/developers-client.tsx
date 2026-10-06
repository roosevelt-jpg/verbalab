'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

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
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Developers
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '40rem' }}>
        Our API: generate speech, transcribe, and translate with first-party Lugemi models. Africa-first coverage,
        with LATAM, Southeast Asia, the Middle East, and the EU in strategic scope. Use API keys, the TypeScript SDK,
        CLI, OpenAPI, and the playground. Soft <code className="vl-code">vl_test_</code> keys share this cluster and
        quota — not a separate sandbox plane.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <section>
            <h2 style={sectionLabel}>Organization</h2>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>{data.organization.name}</p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Plan {data.billing.planName} · {data.billing.charactersUsed.toLocaleString()} /{' '}
              {data.billing.characterQuota.toLocaleString()} characters · {data.usage.requests} translate requests
            </p>
          </section>

          <section>
            <h2 style={sectionLabel}>API keys</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {data.apiKeys.active} active ({data.apiKeys.live} live · {data.apiKeys.test} test)
            </p>
            <p style={{ margin: '0.65rem 0 0' }}>
              <Link href="/keys" style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Manage keys →
              </Link>
            </p>
          </section>

          <section>
            <h2 style={sectionLabel}>Applications (workspaces)</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.35rem' }}>
              {data.applications.data.map((app) => (
                <li key={app.id} style={{ color: app.isCurrent ? 'var(--ink)' : 'var(--muted)', fontWeight: app.isCurrent ? 600 : 400 }}>
                  {app.name}
                  {app.isCurrent ? ' · current' : ''}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={sectionLabel}>SDK & CLI</h2>
            <pre
              className="vl-code"
              style={{
                margin: 0,
                padding: '1rem',
                background: 'var(--bg-soft)',
                borderRadius: '0.45rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >{`${data.sdk.typescript.install}
${data.sdk.cli.install}

# ${data.sdk.cli.bin} ${data.sdk.cli.commands.join(' | ')}
export VERBALAB_API_KEY=vl_live_...
export VERBALAB_API_URL=${API_URL}`}</pre>
            <p style={{ margin: '0.65rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {data.sdk.typescript.name}@{data.sdk.typescript.version} · {data.sdk.cli.name}
            </p>
          </section>

          <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href="/docs" style={primaryLink}>
              Docs
            </Link>
            <Link href="/playground" style={secondaryLink}>
              Playground
            </Link>
            <a href={`${API_URL}/v1/openapi.json`} style={secondaryLink}>
              OpenAPI
            </a>
            <Link href="/usage" style={secondaryLink}>
              Usage
            </Link>
            <Link href="/billing" style={secondaryLink}>
              Billing
            </Link>
          </section>

          <section>
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
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const primaryLink: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
};

const secondaryLink: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--ink)',
};
