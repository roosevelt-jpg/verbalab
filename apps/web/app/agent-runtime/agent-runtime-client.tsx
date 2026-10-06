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
  mode: string;
  capabilities: Capability[];
  ceilings: { maxAgentsPerWorkspace: number; maxStepsPerRun: number };
  honesty: {
    openToolExecution: boolean;
    scopedPermissionsRequired: boolean;
    sandboxRequired: boolean;
    localPermissionHardGate: boolean;
    policyRuntimeWired: boolean;
  };
  safety: { note: string };
};

type Agent = {
  id: string;
  name: string;
  status: string;
  permissions: string[];
};

export function AgentRuntimeClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('East Africa trade desk');
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/agent-runtime/engine', { token }),
      apiFetch<{ agents: Agent[] }>('/v1/agent-runtime/agents', { token }),
    ]);
    setEngine(eng);
    setAgents(list.agents);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const createAndRun = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const created = await apiFetch<{ agent: Agent }>('/v1/agent-runtime/agents', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name,
          permissions: ['reason.plan', 'memory.search', 'memory.put', 'agent.message'],
          goal: 'Draft a translation QA checklist',
        }),
      });
      await apiFetch(`/v1/agent-runtime/agents/${created.agent.id}/lifecycle`, {
        token,
        method: 'POST',
        body: JSON.stringify({ status: 'active' }),
      });
      const run = await apiFetch<{
        run: { status: string; steps: Array<{ action: string; allowed: boolean }> };
        note: string;
      }>('/v1/agent-runtime/run', {
        token,
        method: 'POST',
        body: JSON.stringify({
          agentId: created.agent.id,
          actions: [
            { action: 'reason.plan', input: { problem: 'translation QA checklist' } },
            { action: 'memory.put', input: { content: 'Remember QA checklist draft' } },
          ],
        }),
      });
      setResult(
        `${created.agent.id} · ${run.run.status}\n${run.run.steps
          .map((s) => `${s.action}: ${s.allowed ? 'allowed' : 'denied'}`)
          .join('\n')}\n${run.note}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent run failed');
    }
  }, [getToken, name, load]);

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
        Agent Runtime
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Sandbox speaking agents with hard permission allowlists — the runtime layer for agents that talk across
        languages and accents. Missing permissions are blocked — not open tool execution against real accounts.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Agent name"
          style={{ ...input, minWidth: '14rem', flex: 1 }}
        />
        <button type="button" onClick={() => void createAndRun()} disabled={!name.trim()} style={btn}>
          Create + sandbox run
        </button>
      </div>
      {result ? (
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.85rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          {result}
        </pre>
      ) : null}

      {agents.length ? (
        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>
          Agents {agents.length}
          {engine ? ` · max ${engine.ceilings.maxAgentsPerWorkspace}` : null}
        </p>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{engine.safety.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Mode: {engine.mode} · openToolExecution=
            {String(engine.honesty.openToolExecution)} · localPermissionHardGate=
            {String(engine.honesty.localPermissionHardGate)} · policyRuntimeWired=
            {String(engine.honesty.policyRuntimeWired)}
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
        <Link href="/ai-kernel">AI Kernel</Link>
        {' · '}
        <Link href="/reasoning-runtime">Reasoning Runtime</Link>
        {' · '}
        <Link href="/memory-runtime">Memory Runtime</Link>
        {' · '}
        <Link href="/workflows">Workflows</Link>
      </p>
    </AppShell>
  );
}

const input: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.75rem',
  background: 'var(--surface)',
  color: 'inherit',
  font: 'inherit',
};

const btn: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  background: 'var(--fg)',
  color: 'var(--bg)',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
};
