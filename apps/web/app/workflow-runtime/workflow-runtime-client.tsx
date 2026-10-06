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
  ceilings: { maxWorkflowsPerWorkspace: number; maxStepsPerRun: number };
  honesty: {
    openToolExecution: boolean;
    liveStepExecution: boolean;
    temporalOs: boolean;
    scopedPermissionsRequired: boolean;
    sandboxRequired: boolean;
    localPermissionHardGate: boolean;
    policyRuntimeWired: boolean;
    extendsWorkflowsProduct: boolean;
  };
  safety: { note: string };
};

type Workflow = {
  id: string;
  name: string;
  status: string;
  version: number;
  permissions: string[];
};

export function WorkflowRuntimeClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('Sandbox QA Flow');
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/workflow-runtime/engine', { token }),
      apiFetch<{ workflows: Workflow[] }>('/v1/workflow-runtime/workflows', { token }),
    ]);
    setEngine(eng);
    setWorkflows(list.workflows);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const createAndRun = useCallback(async  => {
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const created = await apiFetch<{ workflow: Workflow }>('/v1/workflow-runtime/workflows', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name,
          permissions: ['reason.plan', 'memory.put', 'memory.search', 'workflow.rollback'],
          mode: 'sequential',
          steps: [
            { action: 'reason.plan', input: { problem: 'translation QA checklist' } },
            { action: 'memory.put', input: { content: 'workflow sandbox note' } },
          ],
        }),
      });
      await apiFetch(`/v1/workflow-runtime/workflows/${created.workflow.id}/lifecycle`, {
        token,
        method: 'POST',
        body: JSON.stringify({ status: 'active' }),
      });
      const run = await apiFetch<{
        run: { id: string; status: string; steps: Array<{ action: string; allowed: boolean }> };
        note: string;
      }>('/v1/workflow-runtime/run', {
        token,
        method: 'POST',
        body: JSON.stringify({ workflowId: created.workflow.id }),
      });
      setResult(
        `${created.workflow.id} · ${run.run.status}\n${run.run.steps
          .map((s) => `${s.action}: ${s.allowed ? 'allowed' : 'denied'}`)
          .join('\n')}\n${run.note}`,
      );
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workflow run failed');
    }
  }, [getToken, name, load]);

  return (
    <AppShell>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>AI Kernel</p>
        <h1 style={{ margin: '0.35rem 0 0.5rem', fontSize: '1.75rem' }}>Workflow Runtime</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
          Sandbox multi-step workflows with hard permission allowlists. Extends product{' '}
          <Link href="/workflows">/workflows</Link> — not Temporal/Airflow OS.
        </p>

        {error ? (
          <p style={{ color: 'crimson' }} role="alert">
            {error}
          </p>
        ) : null}

        {engine ? (
          <section style={{ marginTop: '1.5rem' }}>
            <p style={{ margin: 0 }}>
              Mode: {engine.mode} · max workflows: {engine.ceilings.maxWorkflowsPerWorkspace}
            </p>
            <ul style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
              <li>openToolExecution: {String(engine.honesty.openToolExecution)}</li>
              <li>liveStepExecution: {String(engine.honesty.liveStepExecution)}</li>
              <li>temporalOs: {String(engine.honesty.temporalOs)}</li>
              <li>scopedPermissionsRequired: {String(engine.honesty.scopedPermissionsRequired)}</li>
              <li>localPermissionHardGate: {String(engine.honesty.localPermissionHardGate)}</li>
              <li>extendsWorkflowsProduct: {String(engine.honesty.extendsWorkflowsProduct)}</li>
            </ul>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.safety.note}</p>
          </section>
        ) : null}

        <section style={{ marginTop: '1.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem' }}
            />
          </label>
          <button type="button" onClick={ => void createAndRun}>
            Create, activate, run (sandbox)
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
          <h2 style={{ fontSize: '1.1rem' }}>Workflows ({workflows.length})</h2>
          <ul>
            {workflows.map((w) => (
              <li key={w.id}>
                {w.name} · {w.status} · v{w.version} · {w.permissions.join(', ')}
              </li>
            ))}
          </ul>
        </section>

        <p style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link href="/ai-kernel">AI Kernel</Link>
          <Link href="/agent-runtime">Agent Runtime</Link>
          <Link href="/workflows">Workflows product</Link>
          <Link href="/memory-runtime">Memory Runtime</Link>
        </p>
      </main>
    </AppShell>
  );
}
