'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CountrySelect } from '@/components/country-select';

type DataSettings = {
  organizationId: string;
  name: string;
  retentionDays: number | null;
  persistSourceText: boolean;
  allowVendorTraining: boolean;
};

type Residency = {
  organizationId: string;
  dataRegion: string | null;
  matchesCurrentDeploy: boolean;
  currentDeploy: { code: string; name: string; apiBaseUrl: string };
  pinnedRegion: { code: string; name: string; apiBaseUrl: string } | null;
  note: string;
};

type RegionCatalog = {
  currentRegion: string;
  regions: { code: string; name: string; residencyLabel: string }[];
};

type Branding = {
  id: string;
  companyName: string;
  logoUrl: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  socialX: string;
  socialLinkedIn: string;
  socialGitHub: string;
  socialWebsite: string;
};

export function DataClient() {
  const { getToken, isLoaded } = useAuth();
  const [settings, setSettings] = useState<DataSettings | null>(null);
  const [residency, setResidency] = useState<Residency | null>(null);
  const [catalog, setCatalog] = useState<RegionCatalog | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [regionPick, setRegionPick] = useState('');
  const [retentionInput, setRetentionInput] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [data, res, regions, brand] = await Promise.all([
      apiFetch<DataSettings>('/v1/organization/data-settings', { token }),
      apiFetch<Residency>('/v1/organization/residency', { token }),
      apiFetch<RegionCatalog>('/v1/regions'),
      apiFetch<Branding>('/v1/organization/branding', { token }),
    ]);
    setSettings(data);
    setResidency(res);
    setCatalog(regions);
    setBranding(brand);
    setRegionPick(res.dataRegion ?? '');
    setRetentionInput(data.retentionDays != null ? String(data.retentionDays) : '');
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function saveResidency() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const data = await apiFetch<Residency>('/v1/organization/residency', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ dataRegion: regionPick === '' ? null : regionPick }),
      });
      setResidency(data);
      setRegionPick(data.dataRegion ?? '');
      setMessage(
        data.matchesCurrentDeploy
          ? 'Residency saved.'
          : `Pinned to ${data.dataRegion}. Use ${data.pinnedRegion?.apiBaseUrl ?? 'the matching regional API'} — this console talks to ${data.currentDeploy.apiBaseUrl}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Residency save failed');
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(patch: Partial<DataSettings>) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const data = await apiFetch<DataSettings>('/v1/organization/data-settings', {
        method: 'PATCH',
        token,
        body: JSON.stringify(patch),
      });
      setSettings(data);
      setRetentionInput(data.retentionDays != null ? String(data.retentionDays) : '');
      setMessage('Settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function saveBranding() {
    if (!branding) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const data = await apiFetch<Branding>('/v1/organization/branding', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          companyName: branding.companyName,
          logoUrl: branding.logoUrl,
          addressLine1: branding.addressLine1,
          addressLine2: branding.addressLine2,
          city: branding.city,
          region: branding.region,
          postalCode: branding.postalCode,
          country: branding.country,
          socialX: branding.socialX,
          socialLinkedIn: branding.socialLinkedIn,
          socialGitHub: branding.socialGitHub,
          socialWebsite: branding.socialWebsite,
        }),
      });
      setBranding(data);
      setMessage('Email branding saved. System emails use this logo, address, and socials.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Branding save failed');
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const data = await apiFetch<Record<string, unknown>>('/v1/organization/export', {
        method: 'POST',
        token,
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lugemi-export-${settings?.name ?? 'workspace'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Export downloaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrg() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/organization', {
        method: 'DELETE',
        token,
        body: JSON.stringify({ confirmName }),
      });
      setMessage('Organization deleted. Sign out and start fresh.');
      setSettings(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Data
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Retention, residency, email branding, export, and deletion. See the DPA data map in the repo docs.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--muted)' }}>{message}</p> : null}

      {settings ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem', maxWidth: '42rem' }}>
          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Email branding</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Logo, postal address, and social links appear on every system email. Add your Resend key later —
              templates are ready now.
            </p>
            {branding ? (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {(
                  [
                    ['companyName', 'Company name'],
                    ['logoUrl', 'Logo URL (default /brand/lugemi-email-logo.png)'],
                    ['addressLine1', 'Address line 1'],
                    ['addressLine2', 'Address line 2'],
                    ['city', 'City'],
                    ['region', 'Region / state'],
                    ['postalCode', 'Postal code'],
                    ['country', 'Country'],
                    ['socialWebsite', 'Website'],
                    ['socialX', 'X / Twitter URL'],
                    ['socialLinkedIn', 'LinkedIn URL'],
                    ['socialGitHub', 'GitHub URL'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} style={{ display: 'grid', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>{label}</span>
                    {key === 'country' ? (
                      <CountrySelect
                        className="vl-input"
                        value={branding.country}
                        disabled={busy}
                        onChange={(code) => setBranding({ ...branding, country: code })}
                        emptyLabel="Country"
                      />
                    ) : (
                      <input
                        className="vl-input"
                        value={branding[key]}
                        disabled={busy}
                        onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                      />
                    )}
                  </label>
                ))}
                <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void saveBranding()}>
                  Save email branding
                </button>
              </div>
            ) : null}
          </section>

          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Data residency</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Each region is a separate deploy and database — not a global mesh. Pinning does not migrate existing
              data. Owners only.
            </p>
            {residency ? (
              <>
                <p style={{ fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
                  This API island:{' '}
                  <strong style={{ color: 'var(--ink)' }}>{residency.currentDeploy.name}</strong> (
                  {residency.currentDeploy.code})
                  {!residency.matchesCurrentDeploy ? (
                    <span style={{ color: 'var(--bad)' }}> — pin does not match; switch regional URL</span>
                  ) : null}
                </p>
                <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>Pinned region (empty = no pin)</span>
                  <select
                    className="vl-input"
                    value={regionPick}
                    disabled={busy}
                    onChange={(e) => setRegionPick(e.target.value)}
                  >
                    <option value="">No pin</option>
                    {(catalog?.regions ?? []).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.residencyLabel})
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="vl-btn" disabled={busy} onClick={() => void saveResidency()}>
                  Save residency
                </button>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.75rem 0 0' }}>{residency.note}</p>
              </>
            ) : null}
          </section>

          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Retention &amp; persistence</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Org: <strong style={{ color: 'var(--ink)' }}>{settings.name}</strong>
            </p>

            <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem' }}>Retention days (empty = keep)</span>
              <input
                className="vl-input"
                type="number"
                min={1}
                max={3650}
                value={retentionInput}
                onChange={(e) => setRetentionInput(e.target.value)}
                disabled={busy}
              />
            </label>
            <button
              type="button"
              className="vl-btn"
              disabled={busy}
              onClick={() =>
                void saveSettings({
                  retentionDays: retentionInput.trim() === '' ? null : Number(retentionInput),
                })
              }
            >
              Save retention
            </button>

            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={settings.persistSourceText}
                  disabled={busy}
                  onChange={(e) => void saveSettings({ persistSourceText: e.target.checked })}
                />
                Persist source text (reviews / TM)
              </label>
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={settings.allowVendorTraining}
                  disabled={busy}
                  onChange={(e) => void saveSettings({ allowVendorTraining: e.target.checked })}
                />
                Allow vendor training on submitted content
              </label>
            </div>
          </section>

          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Export</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Download workspace glossary, TM, reviews, knowledge metadata, keys (prefixes), and usage as JSON.
            </p>
            <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void exportData()}>
              Export workspace
            </button>
          </section>

          <section className="vl-panel" style={{ padding: '1.25rem', borderColor: 'var(--bad)' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Delete organization</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Permanently deletes this org and cascaded data. Type the org name to confirm. Owners only.
            </p>
            <input
              className="vl-input"
              placeholder={settings.name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              disabled={busy}
              style={{ marginBottom: '0.75rem' }}
            />
            <button
              type="button"
              className="vl-btn"
              disabled={busy || confirmName !== settings.name}
              onClick={() => void deleteOrg()}
              style={{ background: 'var(--bad)', color: '#fff', border: 'none' }}
            >
              Delete organization
            </button>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
