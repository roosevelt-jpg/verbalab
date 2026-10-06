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
  ceilings: { maxPluginsPerWorkspace: number; maxInvokeSteps: number };
  honesty: {
    openToolExecution: boolean;
    liveCodeExecution: boolean;
    browserExtensionOs: boolean;
    scopedPermissionsRequired: boolean;
    sandboxRequired: boolean;
    localPermissionHardGate: boolean;
    policyRuntimeWired: boolean;
    extendsMarketplace: boolean;
  };
  safety: { note: string };
};

type Plugin = {
  id: string;
  name: string;
  status: string;
  version: number;
  permissions: string[];
};

export function PluginRuntimeClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('Sandbox Formatter');
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/plugin-runtime/engine', { token }),
      apiFetch<{ plugins: Plugin[] }>('/v1/plugin-runtime/plugins', { token }),
    ]);
    setEngine(eng);
    setPlugins(list.plugins);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const registerAndInvoke = useCallback(async  => {
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const created = await apiFetch<{ plugin: Plugin }>('/v1/plugin-runtime/plugins', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name,
          permissions: ['plugin.read', 'plugin.transform', 'memory.put'],
          description: 'Sandbox text formatter plugin',
        }),
      });
      await apiFetch(`/v1/plugin-runtime/plugins/${created.plugin.id}/lifecycle`, {
        token,
        method: 'POST',
        body: JSON.stringify({ status: 'active' }),
      });
      const inv = await apiFetch<{
        invocation: {
          status: string;
          steps: Array<{ action: string; allowed: boolean }>;
        };
        note: string;
      }>('/v1/plugin-runtime/invoke', {
        token,
        method: 'POST',
        body: JSON.stringify({
          pluginId: created.plugin.id,
          actions: [
            { action: 'plugin.read' },
            { action: 'plugin.transform', input: { text: 'hello sandbox' } },
          ],
        }),
      });
      setResult(
        `${created.plugin.id} · ${inv.invocation.status}\n${inv.invocation.steps
          .map((s) => `${s.action}: ${s.allowed ? 'allowed' : 'denied'}`)
          .join('\n')}\n${inv.note}`,
      );
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plugin invoke failed');
    }
  }, [getToken, name, load]);

  return (
    <AppShell>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>AI Kernel</p>
        <h1 style={{ margin: '0.35rem 0 0.5rem', fontSize: '1.75rem' }}>Plugin Runtime</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
          Sandbox plugin registry with hard permission allowlists. Extends{' '}
          <Link href="/marketplace">marketplace</Link> — not a browser/VS Code extension OS.
        </p>

        {error ? (
          <p style={{ color: 'crimson' }} role="alert">
            {error}
          </p>
        ) : null}

        {engine ? (
          <section style={{ marginTop: '1.5rem' }}>
            <p style={{ margin: 0 }}>
              Mode: {engine.mode} · max plugins: {engine.ceilings.maxPluginsPerWorkspace}
            </p>
            <ul style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
              <li>openToolExecution: {String(engine.honesty.openToolExecution)}</li>
              <li>liveCodeExecution: {String(engine.honesty.liveCodeExecution)}</li>
              <li>browserExtensionOs: {String(engine.honesty.browserExtensionOs)}</li>
              <li>scopedPermissionsRequired: {String(engine.honesty.scopedPermissionsRequired)}</li>
              <li>localPermissionHardGate: {String(engine.honesty.localPermissionHardGate)}</li>
              <li>extendsMarketplace: {String(engine.honesty.extendsMarketplace)}</li>
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
          <button type="button" onClick={ => void registerAndInvoke}>
            Register, activate, invoke (sandbox)
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
          <h2 style={{ fontSize: '1.1rem' }}>Plugins ({plugins.length})</h2>
          <ul>
            {plugins.map((p) => (
              <li key={p.id}>
                {p.name} · {p.status} · v{p.version} · {p.permissions.join(', ')}
              </li>
            ))}
          </ul>
        </section>

        <p style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link href="/ai-kernel">AI Kernel</Link>
          <Link href="/agent-runtime">Agent Runtime</Link>
          <Link href="/workflow-runtime">Workflow Runtime</Link>
          <Link href="/marketplace">Marketplace</Link>
        </p>
      </main>
    </AppShell>
  );
}
