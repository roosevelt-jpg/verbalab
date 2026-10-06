'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';

type Stream = { id: string; capture: string; main_use: string };
type Contributor = {
  contributor_id: string;
  permitted_purposes: string[];
  withdrawal_status: string;
  remedy: { note: string; completion: string } | null;
};
type RecordResult = {
  record: {
    record_id: string;
    split: string;
    stream_id: string;
    artifact_hash: string;
    label_status: string;
  };
};
type ExportCheck = { denied_count: number; results: Array<{ record_id: string; allowed: boolean; reason: string | null }> };

export function DataAdvantageClient() {
  const [apiKey, setApiKey] = useState('');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [purposes, setPurposes] = useState('service_processing,model_training');
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [artifact, setArtifact] = useState(
    'Mixed Twi-English correction: amount fifty, name Kwame Mensah, not five hundred.',
  );
  const [streamId, setStreamId] = useState('meaning_contrasts');
  const [labelStatus, setLabelStatus] = useState('adjudicated');
  const [record, setRecord] = useState<RecordResult | null>(null);
  const [exportCheck, setExportCheck] = useState<ExportCheck | null>(null);
  const [sample, setSample] = useState<{ sample_id: string; steps: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiFetch<{ streams: Stream[] }>('/v1/data-advantage/streams')
      .then((r) => setStreams(r.streams))
      .catch(() => undefined);
  }, []);

  function authHeaders() {
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }

  function requireKey() {
    if (!apiKey.startsWith('lg_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return false;
    }
    return true;
  }

  async function createContributor(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!requireKey()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/data-advantage/contributors`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          permittedPurposes: purposes.split(',').map((s) => s.trim()).filter(Boolean),
          territories: ['GH', 'NG'],
          contactRoute: 'language-lead@lugemi.local',
        }),
      });
      const body = (await res.json()) as Contributor & { message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setContributor(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function ingestRecord(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!requireKey() || !contributor) {
      if (!contributor) setError('Create a contributor first');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/data-advantage/records`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          contributorId: contributor.contributor_id,
          artifactContent: artifact,
          sourceLanguageTags: ['ak', 'en'],
          varietyId: 'ak-GH-twi',
          streamId,
          labelStatus,
          split: 'train',
          synthetic: false,
        }),
      });
      const body = (await res.json()) as RecordResult & { message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setRecord(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function runExportCheck() {
    setError(null);
    if (!requireKey()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/data-advantage/records/export-check`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          requiredPurpose: 'model_training',
          recordIds: record ? [record.record.record_id] : undefined,
        }),
      });
      const body = (await res.json()) as ExportCheck & { message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setExportCheck(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function withdraw() {
    setError(null);
    if (!requireKey() || !contributor) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/v1/data-advantage/contributors/${contributor.contributor_id}/withdraw`,
        { method: 'POST', headers: authHeaders(), body: '{}' },
      );
      const body = (await res.json()) as Contributor & { message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setContributor(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function sampleErrorLoop() {
    setError(null);
    if (!requireKey()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/data-advantage/error-loop/sample`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ streamId, corridor: 'twi-english', severity: 'critical' }),
      });
      const body = (await res.json()) as { sample_id: string; steps: string[]; message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setSample(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortfolioShell
      title="Lugemi Data Advantage"
      lede="Rights-aware acquisition of the errors that matter: contributor contracts, permissioned records, export-denial tests, and an offline error-acquisition loop. Extends Dataset Cloud — no parallel data OS."
      docsHref="/docs"
    >
      <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Acquisition streams</h2>
        <ul style={{ margin: '0.65rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.4rem' }}>
          {streams.map((s) => (
            <li key={s.id} style={{ fontSize: '0.9rem' }}>
              <strong>{s.main_use}</strong> — {s.capture}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={createContributor} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key</span>
          <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="lg_live_…" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Permitted purposes (comma-separated)</span>
          <input className="vl-field" value={purposes} onChange={(e) => setPurposes(e.target.value)} />
        </label>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Working…' : 'Register contributor'}
        </button>
      </form>

      {contributor ? (
        <div className="vl-panel" style={{ padding: '0.9rem', marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>
            <strong>{contributor.contributor_id}</strong> · {contributor.withdrawal_status}
          </p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Purposes: {contributor.permitted_purposes.join(', ')}
          </p>
          {contributor.remedy ? (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
              Remedy ({contributor.remedy.completion}): {contributor.remedy.note}
            </p>
          ) : null}
          <button type="button" className="vl-btn vl-btn-secondary" style={{ marginTop: '0.65rem' }} onClick={() => void withdraw()}>
            Withdraw contributor
          </button>
        </div>
      ) : null}

      <form onSubmit={ingestRecord} className="vl-panel" style={{ padding: '1rem', marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Artifact content</span>
          <textarea className="vl-field" rows={3} value={artifact} onChange={(e) => setArtifact(e.target.value)} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Stream</span>
            <select className="vl-field" value={streamId} onChange={(e) => setStreamId(e.target.value)}>
              {(streams.length ? streams : [{ id: streamId, capture: '', main_use: '' }]).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Label status</span>
            <select className="vl-field" value={labelStatus} onChange={(e) => setLabelStatus(e.target.value)}>
              <option value="raw">raw</option>
              <option value="annotated">annotated</option>
              <option value="adjudicated">adjudicated</option>
              <option value="ambiguous">ambiguous</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
        </div>
        <button type="submit" className="vl-btn" disabled={loading}>
          Ingest record
        </button>
      </form>

      {record ? (
        <div className="vl-panel" style={{ padding: '0.9rem', marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>
            Record <code>{record.record.record_id}</code> · split {record.record.split} · {record.record.stream_id}
          </p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--muted)', wordBreak: 'break-all' }}>
            hash {record.record.artifact_hash}
          </p>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void runExportCheck()}>
          Export-denial check
        </button>
        <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void sampleErrorLoop()}>
          Sample error loop
        </button>
      </div>

      {exportCheck ? (
        <div className="vl-panel" style={{ padding: '0.9rem', marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>Denied: {exportCheck.denied_count}</p>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
            {exportCheck.results.map((r) => (
              <li key={r.record_id}>
                {r.record_id}: {r.allowed ? 'allow' : r.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {sample ? (
        <div className="vl-panel" style={{ padding: '0.9rem', marginTop: '1rem' }}>
          <p style={{ margin: 0 }}>
            Sample <code>{sample.sample_id}</code>
          </p>
          <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
            {sample.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}
    </PortfolioShell>
  );
}
