'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };
type Version = { id: string; modelSlug: string; version: string; status: string };
type Deployment = {
  id: string;
  modelSlug: string;
  strategy: string;
  status: string;
  canaryPercent: number | null;
};

type Engine = {
  product: string;
  note: string;
  honesty: {
    mlflowOs: boolean;
    trafficMeshOs: boolean;
    regeneratesVl110: boolean;
    automaticWeightDeploy: boolean;
  };
  capabilities: Capability[];
  liveSummary: { featureCount: number };
};

export function ModelRegistryClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, vers, deps] = await Promise.all([
      apiFetch<Engine>('/v1/model-registry/engine', { token }),
      apiFetch<{ versions: Version[] }>('/v1/model-registry/versions', { token }),
      apiFetch<{ deployments: Deployment[] }>('/v1/model-registry/deployments', { token }),
    ]);
    setEngine(eng);
    setVersions(vers.versions);
    setDeployments(deps.deployments);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const createCanaryPlan = async  => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const created = await apiFetch<{ version: Version }>('/v1/model-registry/versions', {
        token,
        method: 'POST',
        body: JSON.stringify({ modelSlug: 'google-translate', version: 'console-1' }),
      });
      await apiFetch(`/v1/model-registry/versions/${created.version.id}/approve`, {
        token,
        method: 'POST',
        body: '{}',
      });
      await apiFetch('/v1/model-registry/deployments', {
        token,
        method: 'POST',
        body: JSON.stringify({
          versionId: created.version.id,
          strategy: 'canary',
          canaryPercent: 10,
        }),
      });
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan failed');
    } finally {
      setBusy(false);
    }
  };

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
        Model Registry
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Cards, versions, approvals, and deploy plans over existing — not MLflow or a traffic-mesh
        canary OS. <Link href="/models">Live models</Link> ·{' '}
        <Link href="/foundation-model-cloud">Foundation Model Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section
            style={{
              borderLeft: '3px solid #b45309',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Honesty</h2>
            <ul style={{ margin: 0, color: 'var(--muted)' }}>
              <li>mlflowOs: {String(engine.honesty.mlflowOs)}</li>
              <li>trafficMeshOs: {String(engine.honesty.trafficMeshOs)}</li>
              <li>automaticWeightDeploy: {String(engine.honesty.automaticWeightDeploy)}</li>
              <li>regeneratesVl110: {String(engine.honesty.regeneratesVl110)}</li>
              <li> features in live matrix: {engine.liveSummary.featureCount}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Actions</h2>
            <button type="button" onClick={ => void createCanaryPlan} disabled={busy} style={btn}>
              {busy ? 'Planning…' : 'Create canary deploy plan'}
            </button>
          </section>

          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {engine.capabilities.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong> ({c.status}) — {c.notes}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Versions</h2>
            {versions.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>No sandbox versions yet.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
                {versions.map((v) => (
                  <li key={v.id}>
                    <strong>{v.modelSlug}</strong> {v.version} — {v.status}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 style={label}>Deployments</h2>
            {deployments.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>No deploy plans yet.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
                {deployments.map((d) => (
                  <li key={d.id}>
                    <strong>{d.modelSlug}</strong> — {d.strategy}
                    {d.canaryPercent !== null ? ` ${d.canaryPercent}%` : ''} · {d.status}
                  </li>
                ))}
              </ul>
            )}
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

const btn: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  border: '1px solid var(--border, #ddd)',
  borderRadius: 4,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '0.9rem',
};
