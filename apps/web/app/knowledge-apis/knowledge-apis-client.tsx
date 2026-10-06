'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  honesty: {
    grpcOs: boolean;
    kafkaEventStreamingOs: boolean;
    sdkGeneratorOs: boolean;
    extendsExistingKnowledgeApis: boolean;
    orgWorkspaceScoped: boolean;
  };
};

type Surface = {
  product: string;
  rest: string[];
  graphql: string[];
  console: string | null;
};

export function KnowledgeApisClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, surf] = await Promise.all([
      apiFetch<Engine>('/v1/knowledge-apis/engine', { token }),
      apiFetch<{ surfaces: Surface[] }>('/v1/knowledge-apis/surfaces', { token }),
    ]);
    setEngine(eng);
    setSurfaces(surf.surfaces);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
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
        Knowledge APIs
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Public API pack for the Knowledge Cloud — REST, GraphQL, OpenAPI, SDK/CLI, webhooks, and a
        light SSE audit tail. Extends{' '}
        <Link href="/developers">Developers</Link>. Not gRPC / Kafka / SDK-generator OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {surfaces.length ? (
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.65rem' }}>Surfaces</h2>
          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
            {surfaces.map((s) => (
              <li key={s.product} style={{ marginBottom: '0.55rem' }}>
                <strong>{s.product}</strong>
                {s.console ? (
                  <>
                    {' · '}
                    <Link href={s.console}>{s.console}</Link>
                  </>
                ) : null}
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {s.rest.slice(0, 2).join(' · ')}
                  {s.rest.length > 2 ? ` · +${s.rest.length - 2}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Honesty: grpcOs={String(engine.honesty.grpcOs)} · kafkaEventStreamingOs=
            {String(engine.honesty.kafkaEventStreamingOs)} · sdkGeneratorOs=
            {String(engine.honesty.sdkGeneratorOs)} · extendsExistingKnowledgeApis=
            {String(engine.honesty.extendsExistingKnowledgeApis)}
          </p>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.45rem' }}>
                <strong>{c.name}</strong> · {c.status}
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ marginTop: '2rem' }}>
        <Link href="/knowledge-cloud">Knowledge Cloud</Link>
        {' · '}
        <Link href="/developers">Developers</Link>
        {' · '}
        <Link href="/docs">Docs</Link>
        {' · '}
        <Link href="/playground">Playground</Link>
      </p>
    </AppShell>
  );
}
