'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  mode: string;
  ceilings: { maxPoliciesPerWorkspace: number };
  honesty: {
    hardGate: boolean;
    logOnly: boolean;
    wiredIntoAgentRuntime: boolean;
    wiredIntoWorkflowRuntime: boolean;
    wiredIntoPluginRuntime: boolean;
    opaOs: boolean;
  };
  safety: { note: string };
};

type Policy = {
  id: string;
  name: string;
  kind: string;
  effect: string;
  actions: string[];
  enabled: boolean;
};

export function PolicyRuntimeClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/policy-runtime/engine', { token }),
      apiFetch<{ policies: Policy[] }>('/v1/policy-runtime/policies', { token }),
    ]);
    setEngine(eng);
    setPolicies(list.policies);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const createAndEvaluate = useCallback(async  => {
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const created = await apiFetch<{ policy: Policy }>('/v1/policy-runtime/policies', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name: 'Deny memory.put for agents',
          kind: 'security',
          effect: 'deny',
          actions: ['memory.put'],
          targets: ['agent-runtime'],
        }),
      });
      const evalDeny = await apiFetch<{
        allowed: boolean;
        hardGate: boolean;
        logOnly: boolean;
        reason: string;
      }>('/v1/policy-runtime/evaluate', {
        token,
        method: 'POST',
        body: JSON.stringify({
          runtime: 'agent-runtime',
          action: 'memory.put',
        }),
      });
      const evalGlobal = await apiFetch<{
        allowed: boolean;
        reason: string;
      }>('/v1/policy-runtime/evaluate', {
        token,
        method: 'POST',
        body: JSON.stringify({ action: 'shell.exec' }),
      });
      setResult(
        `${created.policy.id}\nmemory.put allowed=${evalDeny.allowed} hardGate=${evalDeny.hardGate} logOnly=${evalDeny.logOnly}\n${evalDeny.reason}\nshell.exec allowed=${evalGlobal.allowed}\n${evalGlobal.reason}`,
      );
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Policy action failed');
    }
  }, [getToken, load]);

  return (
    <AppShell>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>AI Kernel</p>
        <h1 style={{ margin: '0.35rem 0 0.5rem', fontSize: '1.75rem' }}>Policy Runtime</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
          Hard-gate enforcement for Agent / Workflow / Plugin. Denies return 403 — not log-only.
        </p>

        {error ? (
          <p style={{ color: 'crimson' }} role="alert">
            {error}
          </p>
        ) : null}

        {engine ? (
          <section style={{ marginTop: '1.5rem' }}>
            <p style={{ margin: 0 }}>Mode: {engine.mode}</p>
            <ul style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
              <li>hardGate: {String(engine.honesty.hardGate)}</li>
              <li>logOnly: {String(engine.honesty.logOnly)}</li>
              <li>wiredIntoAgentRuntime: {String(engine.honesty.wiredIntoAgentRuntime)}</li>
              <li>wiredIntoWorkflowRuntime: {String(engine.honesty.wiredIntoWorkflowRuntime)}</li>
              <li>wiredIntoPluginRuntime: {String(engine.honesty.wiredIntoPluginRuntime)}</li>
              <li>opaOs: {String(engine.honesty.opaOs)}</li>
            </ul>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.safety.note}</p>
          </section>
        ) : null}

        <section style={{ marginTop: '1.75rem' }}>
          <button type="button" onClick={ => void createAndEvaluate}>
            Create deny policy + evaluate
          </button>
          {result ? (
            <pre
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.04)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {result}
            </pre>
          ) : null}
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem' }}>Policies ({policies.length})</h2>
          <ul>
            {policies.map((p) => (
              <li key={p.id}>
                {p.name} · {p.kind}/{p.effect} · {p.enabled ? 'on' : 'off'} ·{' '}
                {p.actions.join(', ')}
              </li>
            ))}
          </ul>
        </section>

        <p style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link href="/ai-kernel">AI Kernel</Link>
          <Link href="/agent-runtime">Agent Runtime</Link>
          <Link href="/workflow-runtime">Workflow Runtime</Link>
          <Link href="/plugin-runtime">Plugin Runtime</Link>
        </p>
      </main>
    </AppShell>
  );
}
