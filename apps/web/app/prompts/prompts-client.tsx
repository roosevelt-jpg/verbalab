'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type PromptSummary = {
  key: string;
  activeVersion: number | null;
  latestVersion: number | null;
  usingFallback: boolean;
  defaultPreview: string;
};

type VersionRow = {
  version: number;
  body: string;
  note: string | null;
  active: boolean;
  createdAt: string;
};

export function PromptsClient() {
  const { getToken, isLoaded } = useAuth();
  const [rows, setRows] = useState<PromptSummary[]>([]);
  const [selected, setSelected] = useState('chat');
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setRows(await apiFetch<PromptSummary[]>('/v1/prompts', { token }));
  }, [getToken]);

  const loadVersions = useCallback(async (key: string) => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const data = await apiFetch<{ versions: VersionRow[]; activeVersion: number | null }>(
      `/v1/prompts/${key}/versions`,
      { token },
    );
    setVersions(data.versions);
    const active = data.versions.find((v) => v.active);
    if (active) setBody(active.body);
    else if (data.versions[0]) setBody(data.versions[0].body);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        await loadList();
        await loadVersions(selected);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompts');
      }
    })();
  }, [isLoaded, loadList, loadVersions, selected]);

  async function saveVersion() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/prompts/${selected}/versions`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body, note: note || undefined, activate: true }),
      });
      setMessage(`Saved and activated a new ${selected} version.`);
      setNote('');
      await loadList();
      await loadVersions(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function activate(version: number) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/prompts/${selected}/activate`, {
        method: 'POST',
        token,
        body: JSON.stringify({ version }),
      });
      setMessage(`Activated ${selected} v${version}.`);
      await loadList();
      await loadVersions(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activate failed');
    } finally {
      setBusy(false);
    }
  }

  async function restoreFallback() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/prompts/${selected}/fallback`, { method: 'POST', token, body: '{}' });
      setMessage(`Restored code fallback for ${selected}.`);
      await loadList();
      await loadVersions(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fallback restore failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Prompts
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Versioned system prompts for chat, RAG, and voice FAQ. Rollback without redeploying.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--muted)' }}>{message}</p> : null}

      <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            disabled={busy}
            onClick={() => setSelected(row.key)}
            style={{
              opacity: selected === row.key ? 1 : 0.7,
              fontWeight: selected === row.key ? 700 : 400,
            }}
          >
            {row.key}
            {row.usingFallback ? ' (fallback)' : ` v${row.activeVersion}`}
          </button>
        ))}
      </div>

      <section className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.25rem', maxWidth: '48rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Edit {selected}</h2>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          disabled={busy}
          style={{ width: '100%', marginTop: '0.75rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          disabled={busy}
          style={{ width: '100%', marginTop: '0.5rem' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => void saveVersion()} disabled={busy || !body.trim()}>
            Save & activate
          </button>
          <button type="button" onClick={() => void restoreFallback()} disabled={busy}>
            Use code fallback
          </button>
        </div>
      </section>

      <section style={{ marginTop: '1.5rem', maxWidth: '48rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>History</h2>
        {versions.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No versions yet — runtime uses the code default.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'grid', gap: '0.75rem' }}>
            {versions.map((v) => (
              <li key={v.version} className="vl-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <strong>
                      v{v.version}
                      {v.active ? ' · active' : ''}
                    </strong>
                    {v.note ? <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{v.note}</div> : null}
                  </div>
                  {!v.active ? (
                    <button type="button" disabled={busy} onClick={() => void activate(v.version)}>
                      Activate
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
