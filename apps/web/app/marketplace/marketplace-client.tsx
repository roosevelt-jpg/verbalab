'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Listing = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  status: string;
  termCount: number;
  itemCount?: number;
  priceCents?: number;
  currency?: string;
  publisherName: string | null;
  publisherOrgId: string;
  createdAt: string;
};

type Install = {
  id: string;
  listingId: string;
  termsInstalled: number;
  itemsInstalled?: number;
  installedAt: string;
  listing: Listing;
};

type ConnectStatus = {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  onboardingConfigured: boolean;
  marketplacePaymentsConfigured: boolean;
  platformFeeBps: number;
};

type Sale = {
  id: string;
  listingTitle: string;
  listingKind: string;
  amountCents: number;
  applicationFeeCents: number;
  currency: string;
  status: string;
  role: string;
  createdAt: string;
};

const KINDS = [
  { id: 'glossary', label: 'Glossary', publishHint: 'Publish from workspace glossary terms' },
  { id: 'prompt', label: 'Prompts', publishHint: 'Publish active managed prompts (chat / rag / voice_faq)' },
  { id: 'dataset', label: 'Dataset', publishHint: 'Publish approved TM pairs as a parallel dataset' },
] as const;

function kindLabel(kind: string) {
  return KINDS.find((k) => k.id === kind)?.label ?? kind;
}

function formatPrice(cents: number | undefined, currency = 'usd') {
  if (!cents) return 'Free';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase,
  }).format(cents / 100);
}

export function MarketplaceClient {
  const { getToken, isLoaded } = useAuth;
  const [catalog, setCatalog] = useState<Listing[]>([]);
  const [mine, setMine] = useState<Listing[]>([]);
  const [installs, setInstalls] = useState<Install[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('glossary');
  const [filterKind, setFilterKind] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const kindQuery = filterKind === 'all' ? '' : `&kind=${filterKind}`;
    const [published, myListings, myInstalls, mySales, connectStatus] = await Promise.all([
      apiFetch<Listing[]>(`/v1/marketplace/listings?${kindQuery.replace(/^&/, '')}`, { token }),
      apiFetch<Listing[]>(`/v1/marketplace/listings?mine=1${kindQuery}`, { token }),
      apiFetch<Install[]>('/v1/marketplace/installs', { token }),
      apiFetch<Sale[]>('/v1/marketplace/sales', { token }),
      apiFetch<ConnectStatus>('/v1/marketplace/connect/status', { token }),
    ]);
    setCatalog(published);
    setMine(myListings);
    setInstalls(myInstalls);
    setSales(mySales);
    setConnect(connectStatus);
  }, [getToken, filterKind]);

  useEffect( => {
    if (!isLoaded) return;
    void (async  => {
      try {
        await load;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load marketplace');
      }
    });
  }, [isLoaded, load]);

  async function publish {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const dollars = Number(priceDollars);
      const priceCents = Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
      await apiFetch('/v1/marketplace/listings', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title,
          description: description || undefined,
          kind,
          priceCents,
        }),
      });
      setTitle('');
      setDescription('');
      setPriceDollars('0');
      setMessage(`Published ${kindLabel(kind).toLowerCase} listing from this workspace.`);
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  }

  async function install(id: string, listingKind: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const result = await apiFetch<{
        requiresPayment?: boolean;
        checkoutUrl?: string | null;
        termsInstalled?: number;
        itemsInstalled?: number;
        saleStatus?: string;
      }>(`/v1/marketplace/listings/${id}/install`, { method: 'POST', token });
      if (result.requiresPayment && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      const n = result.itemsInstalled ?? result.termsInstalled ?? 0;
      setMessage(
        result.saleStatus === 'recorded'
          ? `Installed ${n} ${kindLabel(listingKind).toLowerCase} item(s) (sale recorded).`
          : `Installed ${n} ${kindLabel(listingKind).toLowerCase} item(s) into this workspace.`,
      );
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Install failed');
    } finally {
      setBusy(false);
    }
  }

  async function unpublish(id: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/marketplace/listings/${id}`, { method: 'DELETE', token });
      setMessage('Listing unpublished.');
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unpublish failed');
    } finally {
      setBusy(false);
    }
  }

  async function startConnect {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const result = await apiFetch<{ url: string }>('/v1/marketplace/connect/onboard', {
        method: 'POST',
        token,
      });
      if (result.url) window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connect onboarding failed');
    } finally {
      setBusy(false);
    }
  }

  const installedIds = new Set(installs.map((i) => i.listingId));
  const publishHint = KINDS.find((k) => k.id === kind)?.publishHint ?? '';

  return (
    <AppShell>
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Marketplace</h1>
        <p style={{ color: '#555', marginBottom: '1.5rem' }}>
          Publish and install glossary, prompt, and dataset packs. Paid listings share revenue via
          Stripe Connect (platform fee {connect ? `${connect.platformFeeBps / 100}%` : '20%'}).
        </p>

        {error ? (
          <p style={{ color: '#b00020', marginBottom: '1rem' }} role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p style={{ color: '#0a7a3e', marginBottom: '1rem' }}>{message}</p>
        ) : null}

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Creator payouts</h2>
          <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
            {connect?.chargesEnabled
              ? `Connect ready (${connect.accountId}).`
              : connect?.connected
                ? 'Connect account created — finish onboarding to accept paid installs.'
                : 'Connect Stripe Express to publish paid listings when live payments are enabled.'}
          </p>
          <button
            type="button"
            disabled={busy || !connect?.onboardingConfigured}
            onClick={ => void startConnect}
            style={{
              padding: '0.45rem 0.85rem',
              border: '1px solid #111',
              background: '#fff',
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {connect?.chargesEnabled ? 'Update Connect account' : 'Connect payouts'}
          </button>
          {!connect?.onboardingConfigured ? (
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Stripe Connect URLs are not configured in this environment.
            </p>
          ) : null}
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Publish</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: 480 }}>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof KINDS)[number]['id'])}
              style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
            >
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>{publishHint}</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Listing title"
              style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
            />
            <input
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              placeholder="Price USD (0 = free)"
              type="number"
              min="0"
              step="0.01"
              style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
            />
            <button
              type="button"
              disabled={busy || !title.trim}
              onClick={ => void publish}
              style={{
                alignSelf: 'flex-start',
                padding: '0.55rem 1rem',
                border: '1px solid #111',
                background: '#111',
                color: '#fff',
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              Publish listing
            </button>
          </div>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '0.75rem',
              gap: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Catalog</h2>
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
              style={{ padding: '0.35rem 0.55rem', border: '1px solid #ccc' }}
            >
              <option value="all">All kinds</option>
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          {catalog.length === 0 ? (
            <p style={{ color: '#666' }}>No published listings yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {catalog.map((row) => (
                <li
                  key={row.id}
                  style={{
                    padding: '0.85rem 0',
                    borderBottom: '1px solid #e8e8e8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {row.title}{' '}
                      <span style={{ fontWeight: 400, color: '#666' }}>({kindLabel(row.kind)})</span>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      {row.itemCount ?? row.termCount} items ·{' '}
                      {formatPrice(row.priceCents, row.currency)} ·{' '}
                      {row.publisherName ?? 'Publisher'}
                      {row.description ? ` · ${row.description}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy || installedIds.has(row.id)}
                    onClick={ => void install(row.id, row.kind)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      border: '1px solid #111',
                      background: installedIds.has(row.id) ? '#f0f0f0' : '#fff',
                      cursor: busy || installedIds.has(row.id) ? 'default' : 'pointer',
                    }}
                  >
                    {installedIds.has(row.id)
                      ? 'Installed'
                      : row.priceCents
                        ? `Buy · ${formatPrice(row.priceCents, row.currency)}`
                        : 'Install'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Your listings</h2>
          {mine.length === 0 ? (
            <p style={{ color: '#666' }}>You have not published any listings.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {mine.map((row) => (
                <li
                  key={row.id}
                  style={{
                    padding: '0.85rem 0',
                    borderBottom: '1px solid #e8e8e8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {row.title}{' '}
                      <span style={{ fontWeight: 400, color: '#666' }}>
                        ({kindLabel(row.kind)} · {row.status} ·{' '}
                        {formatPrice(row.priceCents, row.currency)})
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      {row.itemCount ?? row.termCount} items
                    </div>
                  </div>
                  {row.status === 'published' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={ => void unpublish(row.id)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        border: '1px solid #999',
                        background: '#fff',
                        cursor: busy ? 'wait' : 'pointer',
                      }}
                    >
                      Unpublish
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Installed</h2>
          {installs.length === 0 ? (
            <p style={{ color: '#666' }}>No installs in this workspace yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {installs.map((row) => (
                <li key={row.id} style={{ padding: '0.65rem 0', borderBottom: '1px solid #e8e8e8' }}>
                  <div style={{ fontWeight: 600 }}>
                    {row.listing.title}{' '}
                    <span style={{ fontWeight: 400, color: '#666' }}>
                      ({kindLabel(row.listing.kind)})
                    </span>
                  </div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    {row.itemsInstalled ?? row.termsInstalled} items ·{' '}
                    {new Date(row.installedAt).toLocaleString}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Sales</h2>
          {sales.length === 0 ? (
            <p style={{ color: '#666' }}>No marketplace sales yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {sales.map((row) => (
                <li key={row.id} style={{ padding: '0.65rem 0', borderBottom: '1px solid #e8e8e8' }}>
                  <div style={{ fontWeight: 600 }}>
                    {row.listingTitle}{' '}
                    <span style={{ fontWeight: 400, color: '#666' }}>
                      ({kindLabel(row.listingKind)} · {row.role} · {row.status})
                    </span>
                  </div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    {formatPrice(row.amountCents, row.currency)} · fee{' '}
                    {formatPrice(row.applicationFeeCents, row.currency)} ·{' '}
                    {new Date(row.createdAt).toLocaleString}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}
