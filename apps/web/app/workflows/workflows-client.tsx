'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Workflow = {
  id: string;
  name: string;
  steps: unknown;
  createdAt: string;
};

const EXAMPLE = `[
  { "id": "s1", "op": "transcribe", "documentId": "doc_…" },
  { "id": "s2", "op": "translate", "source": "auto", "target": "sw", "text": "{{s1.text}}" },
  { "id": "s3", "op": "notify", "channel": "email", "message": "Done: {{s2.text}}" }
]`;

export function WorkflowsClient() {
  const { getToken, isLoaded } = useAuth();
  const [rows, setRows] = useState<Workflow[]>([]);
  const [name, setName] = useState('Transcribe → translate → notify');
  const [stepsJson, setStepsJson] = useState(EXAMPLE);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const list = await apiFetch<Workflow[]>('/v1/workflows', { token });
    setRows(list);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      let steps: unknown;
      try {
        steps = JSON.parse(stepsJson);
      } catch {
        throw new Error('Steps must be valid JSON');
      }
      await apiFetch('/v1/workflows', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, steps }),
      });
      setMessage('Workflow saved. Run with POST /v1/workflows/{id}/run (API key) or POST /v1/jobs type=workflow.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/workflows/${id}`, { method: 'DELETE', token });
      setMessage('Deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Workflows
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Directed steps as JSON, executed by the job runner. Ops: transcribe, translate, notify. Not Temporal.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--muted)' }}>{message}</p> : null}

      <section className="vl-panel" style={{ marginTop: '1.5rem', padding: '1.25rem', maxWidth: '42rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Save definition</h2>
        <label style={{ display: 'grid', gap: '0.35rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem', marginTop: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Steps (JSON)</span>
          <textarea
            value={stepsJson}
            onChange={(e) => setStepsJson(e.target.value)}
            rows={12}
            disabled={busy}
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}
          />
        </label>
        <button type="button" onClick={() => void save()} disabled={busy} style={{ marginTop: '1rem' }}>
          Save workflow
        </button>
      </section>

      <section style={{ marginTop: '2rem', maxWidth: '42rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Saved</h2>
        {rows.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No workflows yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'grid', gap: '0.75rem' }}>
            {rows.map((row) => (
              <li key={row.id} className="vl-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start' }}>
                  <div>
                    <strong>{row.name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {row.id} · {Array.isArray(row.steps) ? row.steps.length : '?'} steps
                    </div>
                  </div>
                  <button type="button" onClick={() => void remove(row.id)} disabled={busy}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
