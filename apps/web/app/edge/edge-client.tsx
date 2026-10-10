'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';
import { SearchableCombobox, type ComboboxOption } from '@/components/searchable-combobox';

type EdgePack = {
  pack_id: string;
  version: string;
  corridor: string;
  variety: string;
  language_code: string;
  name_en: string;
  device_class: string;
  peak_ram_mb: number;
  disk_mb: number;
  directions: string[];
  hashes: { manifest: string };
  revoked: boolean;
  pack_kind?: string;
};

type RunResult = {
  decision?: string;
  mode: string;
  original: string;
  translation: string | null;
  used_cloud: boolean;
  cloud_disclosure: string | null;
  confirm_quantity?: boolean;
  warnings: string[];
  pack_id: string;
  note?: string;
};

type VerifyResult = {
  pack_id: string;
  signature_valid: boolean;
  hashes_match: boolean;
  note?: string;
};

export function EdgeClient() {
  const [apiKey, setApiKey] = useState('');
  const [packs, setPacks] = useState<EdgePack[]>([]);
  const [total, setTotal] = useState(0);
  const [packId, setPackId] = useState('');
  const [mode, setMode] = useState<'local' | 'cloud_allowed' | 'cloud_forbidden'>('local');
  const [text, setText] = useState(
    'Please transfer fifty to Kwame Mensah tomorrow — not five hundred.',
  );
  const [cloudAuthorized, setCloudAuthorized] = useState(false);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiFetch<{ packs: EdgePack[]; total?: number }>('/v1/edge/packs')
      .then((res) => {
        setPacks(res.packs);
        setTotal(res.total ?? res.packs.length);
        const preferred =
          res.packs.find((p) => p.pack_id === 'lugemi-edge-ak-en') ?? res.packs[0];
        if (preferred) setPackId(preferred.pack_id);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const packOptions: ComboboxOption[] = useMemo(
    () =>
      packs.map((p) => ({
        value: p.pack_id,
        label: `${p.name_en} ↔ English · ${p.device_class} · ${p.peak_ram_mb} MB`,
        keywords: `${p.pack_id} ${p.corridor} ${p.variety} ${p.language_code} ${p.name_en}`,
        group: p.device_class,
      })),
    [packs],
  );

  const selected = packs.find((p) => p.pack_id === packId) ?? null;

  async function onVerify() {
    if (!packId) return;
    setError(null);
    try {
      const res = await apiFetch<VerifyResult>(`/v1/edge/packs/${packId}/verify`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setVerify(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    }
  }

  async function onRun(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    if (!apiKey.startsWith('lg_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return;
    }
    if (!packId) {
      setError('Select an edge pack');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<RunResult>(`/v1/edge/packs/${packId}/run`, {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({ mode, text, target: 'en', cloudAuthorized }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortfolioShell
      title="Lugemi Edge"
      lede={`Verified offline corridor packs for declared device classes. Modes: local, cloud_allowed, and cloud_forbidden — no silent cloud fallback when forbidden. Full registry catalog (${total || '…'} language↔English packs). Packs are local/demo signed manifests until real on-device weights ship.`}
    >
      <form onSubmit={onRun} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key</span>
          <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="lg_live_…" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Pack {total ? `(${total} in catalog)` : ''}
          </span>
          <SearchableCombobox
            value={packId}
            onChange={setPackId}
            options={packOptions}
            placeholder="Search language, corridor, or device class…"
            emptyLabel="Select a pack…"
            aria-label="Edge pack"
          />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Mode</span>
          <select
            className="vl-field"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="local">local</option>
            <option value="cloud_allowed">cloud_allowed</option>
            <option value="cloud_forbidden">cloud_forbidden</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={cloudAuthorized}
            onChange={(e) => setCloudAuthorized(e.target.checked)}
          />
          <span style={{ fontSize: '0.85rem' }}>Authorize cloud for this run (disclosed when used)</span>
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Push-to-talk text</span>
          <textarea className="vl-field" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void onVerify()}>
            Verify pack signature
          </button>
          <button type="submit" className="vl-btn" disabled={loading}>
            {loading ? 'Running…' : 'Run offline translate'}
          </button>
        </div>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      {selected ? (
        <div className="vl-panel" style={{ padding: '0.9rem', marginTop: '1rem' }}>
          <strong>{selected.name_en} ↔ English</strong>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
            {selected.pack_id} · {selected.version} · {selected.variety} · {selected.directions.join(', ')} ·{' '}
            {selected.device_class} · disk {selected.disk_mb} MB
            {selected.pack_kind ? ` · ${selected.pack_kind}` : ''}
          </span>
        </div>
      ) : null}

      {verify ? (
        <div className="vl-panel" style={{ padding: '0.9rem', marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>
            Signature {verify.signature_valid ? 'valid' : 'invalid'} · hashes{' '}
            {verify.hashes_match ? 'match' : 'mismatch'} · {verify.pack_id}
          </p>
          {verify.note ? (
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>{verify.note}</p>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="vl-panel" style={{ padding: '1rem', marginTop: '1rem', display: 'grid', gap: '0.45rem' }}>
          <div>
            Mode <strong>{result.mode}</strong>
            {result.decision ? ` · ${result.decision}` : null}
            {result.used_cloud ? ' · used cloud' : ' · stayed local'}
          </div>
          <p style={{ margin: 0 }}>
            <strong>Original</strong> — {result.original}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Translation</strong> — {result.translation ?? '(none)'}
          </p>
          {result.confirm_quantity ? (
            <p style={{ margin: 0, color: 'var(--brand-navy)' }}>Confirm uncertain quantity before acting.</p>
          ) : null}
          {result.cloud_disclosure ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{result.cloud_disclosure}</p>
          ) : null}
          {result.warnings?.length ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{result.warnings.join(' ')}</p>
          ) : null}
          {result.note ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{result.note}</p>
          ) : null}
        </div>
      ) : null}
    </PortfolioShell>
  );
}
