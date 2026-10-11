'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CodePanel } from '@/components/code-panel';
import { PageHeader, PremiumCard } from '@/components/platform';
import {
  applyStudioApiKey,
  clearStudioApiKey,
  formatStudioApiKeyLabel,
  loadStudioApiKeyIdentity,
  subscribeStudioApiKey,
  type StudioApiKeyIdentity,
} from '@/lib/studio-api-key';

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  environment: 'live' | 'test';
  kind: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  workspaceId?: string;
};

export function KeysClient() {
  const { getToken, isLoaded } = useAuth();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState('Default');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [secretOnce, setSecretOnce] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [active, setActive] = useState<StudioApiKeyIdentity | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [pasteSecret, setPasteSecret] = useState('');

  const syncActive = useCallback(() => {
    setActive(loadStudioApiKeyIdentity());
  }, []);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const rows = await apiFetch<ApiKeyRow[]>('/v1/api-keys', { token });
    setKeys(rows);
  }, [getToken]);

  useEffect(() => {
    syncActive();
    return subscribeStudioApiKey(syncActive);
  }, [syncActive]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function verifyAndMarkUsed(secret: string) {
    // Bearer machine auth updates lastUsedAt on the server.
    await apiFetch('/v1/detect', {
      method: 'POST',
      token: secret,
      body: JSON.stringify({ text: 'Lugemi key check' }),
    });
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSecretOnce(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const created = await apiFetch<{
        id: string;
        name: string;
        prefix: string;
        environment: 'live' | 'test';
        secret: string;
      }>('/v1/api-keys', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, environment }),
      });
      setSecretOnce(created.secret);
      const identity = applyStudioApiKey({
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        environment: created.environment,
        secret: created.secret,
      });
      setActive(identity);
      setVerifying(true);
      try {
        await verifyAndMarkUsed(created.secret);
        setNotice(
          `Applied ${formatStudioApiKeyLabel(identity)} across Studio (Playground, Creative, product tools). Machine traffic verified.`,
        );
      } catch {
        setNotice(
          `Applied ${formatStudioApiKeyLabel(identity)} across Studio. Copy the secret now — it is only shown once.`,
        );
      } finally {
        setVerifying(false);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function onRevoke(id: string) {
    setError(null);
    setNotice(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/api-keys/${id}`, { method: 'DELETE', token });
      if (active?.id === id) {
        clearStudioApiKey();
        setActive(null);
        setNotice('Revoked key cleared from Studio.');
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    }
  }

  function onClearStudio() {
    clearStudioApiKey();
    setActive(null);
    setNotice('Cleared Studio machine key. Console sign-in is unchanged.');
  }

  async function onApplyExisting(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const secret = pasteSecret.trim();
    if (!secret.startsWith('lg_live_') && !secret.startsWith('lg_test_')) {
      setError('Paste the full lg_live_ or lg_test_ secret you saved at creation.');
      return;
    }
    const match = keys.find((k) => !k.revokedAt && secret.startsWith(k.prefix));
    const identity = applyStudioApiKey({
      id: match?.id ?? '',
      name: match?.name ?? (secret.startsWith('lg_live_') ? 'Live key' : 'Test key'),
      prefix: match?.prefix ?? secret.slice(0, 16),
      environment: match?.environment ?? (secret.startsWith('lg_test_') ? 'test' : 'live'),
      secret,
    });
    setActive(identity);
    setPasteSecret('');
    setVerifying(true);
    try {
      await verifyAndMarkUsed(secret);
      setNotice(`Identified and applied ${formatStudioApiKeyLabel(identity)} across Studio.`);
      await load();
    } catch (err) {
      setNotice(
        `Applied ${formatStudioApiKeyLabel(identity)} in this browser. Verify failed: ${
          err instanceof Error ? err.message : 'unknown error'
        }`,
      );
    } finally {
      setVerifying(false);
    }
  }

  async function onReverifyActive() {
    if (!active?.secret) return;
    setError(null);
    setVerifying(true);
    try {
      await verifyAndMarkUsed(active.secret);
      setNotice(`Verified ${formatStudioApiKeyLabel(active)} — last used updated.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Lugemi API"
          title="API keys"
          lede="Create live or test machine keys for your workspace. Creating a key applies it as the Studio machine identity — Playground, Creative, Chat, Voice Studio, and product tools send that Bearer on every API action."
        >
          <p>
            Once applied, product API calls prefer your{' '}
            <code className="vl-code">lg_live_</code> / <code className="vl-code">lg_test_</code> key so
            usage meters and “last used” update even while you are signed in with Clerk. Clerk stays for
            console identity (create/revoke keys, billing, workspace admin). See{' '}
            <Link href="/developers" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
              Developers
            </Link>
            .
          </p>
        </PageHeader>

        <PremiumCard
          title="Studio machine identity"
          meta={<span className="vl-tag">{active ? 'Applied' : 'None'}</span>}
        >
          {active ? (
            <>
              <p className="lg-card__body" style={{ marginTop: 0 }}>
                <strong>{active.name}</strong> · <code className="vl-code">{active.prefix}…</code> ·{' '}
                {active.environment}
              </p>
              <p className="lg-type-compact" style={{ color: 'var(--muted)' }}>
                Applied {new Date(active.appliedAt).toLocaleString()}. Prefills Playground and Studio tool
                API key fields. “Never used” on a key card means no Bearer traffic yet — create/verify
                marks usage.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                <Link href="/playground" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
                  Open Playground
                </Link>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  disabled={verifying}
                  onClick={() => void onReverifyActive()}
                >
                  {verifying ? 'Verifying…' : 'Verify key'}
                </button>
                <button type="button" className="vl-btn vl-btn-secondary" onClick={onClearStudio}>
                  Clear from Studio
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="lg-card__body" style={{ marginTop: 0 }}>
                No API key applied yet. Create a live key below, or paste a secret you already saved —
                Lugemi will identify it by prefix and apply it across Studio.
              </p>
              <form
                onSubmit={(e) => void onApplyExisting(e)}
                className="vl-player-bar"
                style={{ marginTop: '0.85rem', alignItems: 'stretch' }}
              >
                <label className="vl-field-label" style={{ flex: '1 1 14rem' }}>
                  Paste existing secret
                  <input
                    className="vl-field vl-code"
                    type="password"
                    autoComplete="off"
                    value={pasteSecret}
                    onChange={(e) => setPasteSecret(e.target.value)}
                    placeholder="lg_live_… (shown once at creation)"
                  />
                </label>
                <button
                  type="submit"
                  className="vl-btn vl-btn-primary"
                  style={{ alignSelf: 'end' }}
                  disabled={verifying || !pasteSecret.trim()}
                >
                  {verifying ? 'Applying…' : 'Identify & apply'}
                </button>
              </form>
            </>
          )}
        </PremiumCard>

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
            <button type="submit" className="vl-btn vl-btn-primary" style={{ alignSelf: 'end' }} disabled={verifying}>
              {verifying ? 'Creating…' : 'Create & apply'}
            </button>
          </form>
        </PremiumCard>

        {secretOnce ? (
          <PremiumCard title="Copy now — shown once" meta={<span className="vl-tag">Secret</span>}>
            <CodePanel code={secretOnce} label="Secret" />
            <p className="lg-type-compact" style={{ marginTop: '0.75rem', color: 'var(--muted)' }}>
              Already applied in this browser. Store the secret for SDK / CI — you cannot view it again.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Link href="/playground" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
                Continue in Playground
              </Link>
              <Link href="/developers" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                SDK · CLI · MCP
              </Link>
            </div>
          </PremiumCard>
        ) : null}

        {notice ? (
          <p role="status" style={{ color: 'var(--brand-navy)', margin: 0, fontWeight: 600 }}>
            {notice}
          </p>
        ) : null}

        {error ? (
          <p role="alert" style={{ color: 'var(--bad)', margin: 0 }}>
            {error}
          </p>
        ) : null}

        <section className="lg-page-section">
          <div className="lg-page-section__head">
            <h2 className="lg-type-section">Your keys</h2>
            <p className="lg-type-body">
              Prefixes identify keys without revealing the secret. Active Studio key is highlighted.
            </p>
          </div>
          {keys.length === 0 ? (
            <p className="lg-type-compact">No API keys yet. Create one above — the secret is shown once.</p>
          ) : (
            <div className="lg-grid-2">
              {keys.map((key) => {
                const isActive = Boolean(active && (active.id === key.id || active.prefix === key.prefix));
                return (
                  <PremiumCard
                    key={key.id}
                    title={key.name}
                    meta={
                      <span style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <span className="vl-tag">{key.environment}</span>
                        {isActive ? <span className="vl-tag">Studio</span> : null}
                      </span>
                    }
                    footer={
                      !key.revokedAt ? (
                        <button
                          type="button"
                          className="vl-btn vl-btn-danger"
                          onClick={() => void onRevoke(key.id)}
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="vl-tag">Revoked</span>
                      )
                    }
                  >
                    <p
                      className="lg-card__body"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                    >
                      {key.prefix}…
                      {key.lastUsedAt
                        ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}`
                        : ' · never used (no Bearer traffic yet)'}
                    </p>
                    {isActive ? (
                      <p className="lg-type-compact" style={{ color: 'var(--muted)', marginTop: '0.35rem' }}>
                        Identified as the Studio machine key in this browser.
                      </p>
                    ) : null}
                  </PremiumCard>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
