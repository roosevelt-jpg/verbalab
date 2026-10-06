'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CodePanel } from '@/components/code-panel';

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  environment: 'live' | 'test';
  kind: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export function KeysClient() {
  const { getToken, isLoaded } = useAuth();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState('Default');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [secretOnce, setSecretOnce] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const rows = await apiFetch<ApiKeyRow[]>('/v1/api-keys', { token });
    setKeys(rows);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSecretOnce(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const created = await apiFetch<{ secret: string }>('/v1/api-keys', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, environment }),
      });
      setSecretOnce(created.secret);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function onRevoke(id: string) {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/api-keys/${id}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    }
  }

  return (
    <AppShell>
      <p className="vl-tag" style={{ margin: 0 }}>
        Lugemi API
      </p>
      <h1
        style={{
          margin: '0.55rem 0 0',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.03em',
          fontSize: '2rem',
          color: 'var(--brand-navy)',
        }}
      >
        API keys
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', lineHeight: 1.6, maxWidth: '40rem' }}>
        Secrets are shown once. Use <code className="vl-code">vl_live_</code> or soft-sandbox{' '}
        <code className="vl-code">vl_test_</code> (same cluster & quota). See{' '}
        <Link href="/developers" style={{ color: 'var(--action-primary)' }}>
          Developers
        </Link>
        .
      </p>

      <form
        onSubmit={onCreate}
        className="vl-player-bar"
        style={{ margin: '1.5rem 0', alignItems: 'stretch' }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name"
          className="vl-field"
          style={{ flex: '1 1 10rem', minWidth: '8rem' }}
          required
        />
        <select
          className="vl-field"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as 'live' | 'test')}
          style={{ width: 'auto', minWidth: '10rem' }}
        >
          <option value="live">live (vl_live_)</option>
          <option value="test">test (vl_test_)</option>
        </select>
        <button type="submit" className="vl-btn vl-btn-primary">
          Create
        </button>
      </form>

      {secretOnce ? (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--brand-navy)' }}>
            Copy now — shown once
          </p>
          <CodePanel code={secretOnce} label="Secret" />
        </div>
      ) : null}

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {keys.length === 0 ? (
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
          No API keys yet. Create one above — the secret is shown once.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
          {keys.map((key) => (
            <li
              key={key.id}
              className="vl-endpoint-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>
                  {key.name}{' '}
                  <span className="vl-tag" style={{ marginLeft: '0.35rem' }}>
                    {key.environment}
                  </span>
                </div>
                <div className="vl-code" style={{ color: 'var(--muted)', marginTop: '0.35rem' }}>
                  {key.prefix}…{key.revokedAt ? ' · revoked' : ''}
                  {key.lastUsedAt ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}` : ' · never used'}
                </div>
              </div>
              {!key.revokedAt ? (
                <button type="button" className="vl-btn vl-btn-danger" onClick={() => void onRevoke(key.id)}>
                  Revoke
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
