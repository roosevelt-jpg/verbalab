'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CodePanel } from '@/components/code-panel';
import { PageHeader, PremiumCard } from '@/components/platform';

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
      <div className="lg-page">
      <PageHeader
        eyebrow="Lugemi API"
        title="API keys"
        lede="Create live or test keys for your workspace. Secrets are shown once at creation—store them securely before you leave the page."
      >
        <p>
          Use <code className="vl-code">lg_live_</code> for production traffic or soft-sandbox{' '}
          <code className="vl-code">lg_test_</code> for the same cluster and quota. See{' '}
          <Link href="/developers" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
            Developers
          </Link>{' '}
          for authentication headers and SDK examples.
        </p>
      </PageHeader>

      <PremiumCard title="Create a key" meta={<span className="vl-tag">Workspace</span>}>
        <form
          onSubmit={onCreate}
          className="vl-player-bar"
          style={{ margin: 0, alignItems: 'stretch' }}
        >
          <label className="vl-field-label" style={{ flex: '1 1 10rem', minWidth: '8rem' }}>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key name"
              className="vl-field"
              required
            />
          </label>
          <label className="vl-field-label" style={{ minWidth: '10rem' }}>
            Environment
            <select
              className="vl-field"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as 'live' | 'test')}
            >
              <option value="live">live (lg_live_)</option>
              <option value="test">test (lg_test_)</option>
            </select>
          </label>
          <button type="submit" className="vl-btn vl-btn-primary" style={{ alignSelf: 'end' }}>
            Create
          </button>
        </form>
      </PremiumCard>

      {secretOnce ? (
        <PremiumCard title="Copy now — shown once" meta={<span className="vl-tag">Secret</span>}>
          <CodePanel code={secretOnce} label="Secret" />
        </PremiumCard>
      ) : null}

      {error ? (
        <p role="alert" style={{ color: 'var(--bad)', margin: 0 }}>
          {error}
        </p>
      ) : null}

      <section className="lg-page-section">
        <div className="lg-page-section__head">
          <h2 className="lg-type-section">Your keys</h2>
          <p className="lg-type-body">Revoke unused keys promptly. Prefixes help you identify keys without revealing the secret.</p>
        </div>
        {keys.length === 0 ? (
          <p className="lg-type-compact">No API keys yet. Create one above — the secret is shown once.</p>
        ) : (
          <div className="lg-grid-2">
            {keys.map((key) => (
              <PremiumCard
                key={key.id}
                title={key.name}
                meta={<span className="vl-tag">{key.environment}</span>}
                footer={
                  !key.revokedAt ? (
                    <button type="button" className="vl-btn vl-btn-danger" onClick={() => void onRevoke(key.id)}>
                      Revoke
                    </button>
                  ) : (
                    <span className="vl-tag">Revoked</span>
                  )
                }
              >
                <p className="lg-card__body" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  {key.prefix}…
                  {key.lastUsedAt
                    ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}`
                    : ' · never used'}
                </p>
              </PremiumCard>
            ))}
          </div>
        )}
      </section>
      </div>
    </AppShell>
  );
}
