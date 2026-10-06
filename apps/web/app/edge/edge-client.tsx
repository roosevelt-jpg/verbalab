'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';

type EdgePack = {
  pack_id: string;
  version: string;
  corridor: string;
  variety: string;
  device_class: string;
  peak_ram_mb: number;
  disk_mb: number;
  directions: string[];
  hashes: { manifest: string };
  revoked: boolean;
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
    void apiFetch<{ packs: EdgePack[] }>('/v1/edge/packs')
      .then((res) => {
        setPacks(res.packs);
        if (res.packs[0]) setPackId(res.packs[0].pack_id);
      })
      .catch(() => undefined);
  }, []);

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
      lede="Verified offline corridor packs for declared device classes. Modes: local, cloud_allowed, and cloud_forbidden — no silent cloud fallback when forbidden. Limited device list; peak RAM is a measured budget subject to review."
    >
      <form onSubmit={onRun} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key</span>
          <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="lg_live_…" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Pack</span>
          <select className="vl-field" value={packId} onChange={(e) => setPackId(e.target.value)}>
            {packs.map((p) => (
              <option key={p.pack_id} value={p.pack_id}>
                {p.pack_id} · {p.corridor} · {p.device_class} · {p.peak_ram_mb} MB RAM
              </option>
            ))}
          </select>
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

      {packs.length ? (
        <ul style={{ marginTop: '1.25rem', padding: 0, listStyle: 'none', display: 'grid', gap: '0.5rem' }}>
          {packs.map((p) => (
            <li key={p.pack_id} className="vl-panel" style={{ padding: '0.75rem 1rem' }}>
              <strong>{p.pack_id}</strong>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                {p.version} · {p.variety} · {p.directions.join(', ')} · disk {p.disk_mb} MB
                {p.revoked ? ' · revoked' : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </PortfolioShell>
  );
}
