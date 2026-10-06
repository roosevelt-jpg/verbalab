'use client';

import { useAuth } from '@clerk/nextjs';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type DatasetAsset = {
  id: string;
  title: string;
  licenseTag: string;
  consentNotes: string;
  containsPii: boolean;
  sourceLang: string | null;
  targetLang: string | null;
  partnerOrgName: string | null;
  status: string;
  latestVersion: {
    version: number;
    filename: string;
    sizeBytes: number;
  } | null;
  versions: Array<{ version: number; filename: string; sizeBytes: number; createdAt: string }>;
};

const LICENSE_OPTIONS = [
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'cc0-1.0',
  'university-mou',
  'proprietary',
  'custom',
];

export function DatasetsClient {
  const { getToken, isLoaded } = useAuth;
  const [rows, setRows] = useState<DatasetAsset[]>([]);
  const [title, setTitle] = useState('');
  const [licenseTag, setLicenseTag] = useState('university-mou');
  const [consentNotes, setConsentNotes] = useState('');
  const [partnerOrgName, setPartnerOrgName] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('sw');
  const [containsPii, setContainsPii] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    setRows(await apiFetch<DatasetAsset[]>('/v1/datasets', { token }));
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void (async  => {
      try {
        await load;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load datasets');
      }
    });
  }, [isLoaded, load]);

  async function onUpload(event: FormEvent) {
    event.preventDefault;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      if (!file) throw new Error('Choose a file');
      const form = new FormData;
      form.append('file', file);
      form.append('title', title);
      form.append('licenseTag', licenseTag);
      form.append('consentNotes', consentNotes);
      form.append('containsPii', containsPii ? 'true' : 'false');
      if (partnerOrgName) form.append('partnerOrgName', partnerOrgName);
      if (sourceLang) form.append('sourceLang', sourceLang);
      if (targetLang) form.append('targetLang', targetLang);
      const res = await fetch(`${API_URL}/v1/datasets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = (await res.json) as DatasetAsset & { message?: string; error?: { message: string } };
      if (!res.ok) throw new Error(body.error?.message ?? body.message ?? `Upload failed (${res.status})`);
      setTitle('');
      setConsentNotes('');
      setPartnerOrgName('');
      setFile(null);
      setMessage(`Stored “${body.title}” with legal metadata.`);
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function archive(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/datasets/${id}`, { method: 'DELETE', token });
      setMessage('Dataset archived and files unlinked.');
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed');
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string, version: number, filename: string) {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const res = await fetch(`${API_URL}/v1/datasets/${id}/versions/${version}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click;
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Datasets</h1>
        <p style={{ color: '#555', marginBottom: '1.5rem', lineHeight: 1.55 }}>
          Legal intake for licensed corpora (university MOUs, CC packs). Annotate externally with Label
          Studio if needed, then upload finished artifacts here. Marketplace TM packs are separate.
        </p>

        {error ? (
          <p style={{ color: '#b00020', marginBottom: '1rem' }} role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p style={{ color: '#0a7a3e', marginBottom: '1rem' }}>{message}</p> : null}

        <form
          onSubmit={(e) => void onUpload(e)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            maxWidth: 520,
            marginBottom: '2.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Intake upload</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
          />
          <select
            value={licenseTag}
            onChange={(e) => setLicenseTag(e.target.value)}
            style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
          >
            {LICENSE_OPTIONS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <textarea
            value={consentNotes}
            onChange={(e) => setConsentNotes(e.target.value)}
            placeholder="Consent / MOU reference (required)"
            required
            rows={3}
            style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc', fontFamily: 'inherit' }}
          />
          <input
            value={partnerOrgName}
            onChange={(e) => setPartnerOrgName(e.target.value)}
            placeholder="Partner / university (optional)"
            style={{ padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              placeholder="source"
              style={{ flex: 1, padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
            />
            <input
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              placeholder="target"
              style={{ flex: 1, padding: '0.55rem 0.7rem', border: '1px solid #ccc' }}
            />
          </div>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#444' }}>
            <input
              type="checkbox"
              checked={containsPii}
              onChange={(e) => setContainsPii(e.target.checked)}
            />
            Contains PII / sensitive personal data
          </label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button
            type="submit"
            disabled={busy || !title.trim || !consentNotes.trim || !file}
            style={{
              alignSelf: 'flex-start',
              padding: '0.55rem 1rem',
              border: '1px solid #111',
              background: '#111',
              color: '#fff',
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            Store dataset
          </button>
        </form>

        <section>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Assets</h2>
          {rows.length === 0 ? (
            <p style={{ color: '#666' }}>No dataset assets yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {rows.map((row) => (
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
                        ({row.status} · {row.licenseTag}
                        {row.containsPii ? ' · PII' : ''})
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      {row.latestVersion
                        ? `v${row.latestVersion.version} · ${row.latestVersion.filename} · ${row.latestVersion.sizeBytes} bytes`
                        : 'No versions'}
                      {row.partnerOrgName ? ` · ${row.partnerOrgName}` : ''}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {row.consentNotes}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {row.latestVersion && row.status !== 'archived' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={ =>
                          void download(
                            row.id,
                            row.latestVersion!.version,
                            row.latestVersion!.filename,
                          ).catch((err) =>
                            setError(err instanceof Error ? err.message : 'Download failed'),
                          )
                        }
                        style={{
                          padding: '0.4rem 0.75rem',
                          border: '1px solid #111',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Download
                      </button>
                    ) : null}
                    {row.status !== 'archived' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={ => void archive(row.id)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          border: '1px solid #999',
                          background: '#fff',
                          cursor: busy ? 'wait' : 'pointer',
                        }}
                      >
                        Archive
                      </button>
                    ) : null}
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
