'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';

type Workflow = {
  id: string;
  name: string;
  steps: unknown;
  createdAt: string;
};

const TEMPLATES = [
  { title: 'Product showcase video', href: '/creative/studio', art: 'linear-gradient(135deg,#10264d,#00b8ae)' },
  { title: 'Explainer video', href: '/creative/dubbing', art: 'linear-gradient(135deg,#0a3d3a,#3a5a8a)' },
  { title: 'Compare voices', href: '/creative/voices', art: 'linear-gradient(135deg,#007c78,#10264d)' },
  { title: 'Book cover design', href: '/creative/image-video', art: 'linear-gradient(135deg,#163a5a,#087f78)' },
];


export function CreativeFlowsClient() {
  if (!isClerkConfigured()) {
    return <CreativeFlowsClientInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeFlowsClientAuthed />;
}

function CreativeFlowsClientAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeFlowsClientInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeFlowsClientInner({ getToken, isLoaded }: { getToken: () => Promise<string | null>; isLoaded: boolean }) {
  // auth via props: getToken, isLoaded
  const [rows, setRows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to load flows.');
    const list = await apiFetch<Workflow[]>('/v1/workflows', { token });
    setRows(list);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function createFlow() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to create a flow.');
      const name = window.prompt('Flow name', 'Transcribe → translate → notify');
      if (!name?.trim()) {
        setBusy(false);
        return;
      }
      await apiFetch('/v1/workflows', {
        method: 'POST',
        token,
        body: {
          name: name.trim(),
          steps: [
            { id: 's1', op: 'transcribe', documentId: 'doc_placeholder' },
            { id: 's2', op: 'translate', source: 'auto', target: 'sw', text: '{{s1.text}}' },
            { id: 's3', op: 'notify', channel: 'email', message: 'Done: {{s2.text}}' },
          ],
        },
      });
      setMessage('Flow saved. Run via API key on /v1/workflows/{id}/run or the Workflows console.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create flow');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreativeShell banner breadcrumb="Flows">
      <div className="lg-creative-page-head">
        <div>
          <h1>Flows</h1>
          <p>Directed creative pipelines on Lugemi Workflows — transcribe, translate, notify, and more.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/workflows" className="lg-creative-btn">
            Workflows console
          </Link>
          <button type="button" className="lg-creative-btn primary" disabled={busy} onClick={() => void createFlow()}>
            <CreativeIcon name="plus" width={16} height={16} />
            New Flow
          </button>
        </div>
      </div>

      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--lc-navy)' }}>Get started</h2>
      <div className="lg-creative-inspo">
        {TEMPLATES.map((t) => (
          <Link key={t.title} href={t.href}>
            <div className="lg-creative-inspo-art" style={{ background: t.art }} />
            <figcaption>{t.title}</figcaption>
          </Link>
        ))}
      </div>

      {error ? <p className="lg-creative-error">{error}</p> : null}
      {message ? <p className="lg-creative-note">{message}</p> : null}

      {rows.length === 0 ? (
        <div className="lg-creative-empty">
          <strong>No flows yet</strong>
          Create a new flow to get started, or open the Workflows console for JSON step editing.
        </div>
      ) : (
        <table className="lg-creative-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Steps</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.createdAt?.slice?.(0, 10) ?? '—'}</td>
                <td>{Array.isArray(r.steps) ? r.steps.length : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CreativeShell>
  );
}
