'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import {
  createBrandKit,
  createFolder,
  formatBytes,
  loadCreativeAssets,
  saveCreativeAssets,
  typeLabel,
  uploadCreativeFile,
  type CreativeAsset,
} from '@/lib/creative-assets';

export function CreativeAssetsClient() {
  const [tab, setTab] = useState<'files' | 'kits'>('files');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAssets(loadCreativeAssets());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (tab === 'kits') return a.kind === 'brand-kit';
      if (a.kind === 'brand-kit') return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q);
    });
  }, [assets, query, tab]);

  function refresh(next: CreativeAsset[]) {
    setAssets(next);
    saveCreativeAssets(next);
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setNote(null);
    for (const file of Array.from(files)) {
      await uploadCreativeFile(file);
    }
    setAssets(loadCreativeAssets());
    setNote(`Uploaded ${files.length} file${files.length === 1 ? '' : 's'} to this browser workspace.`);
  }

  function onNewFolder() {
    const name = window.prompt('Folder name', 'New folder');
    if (!name?.trim()) return;
    const folder = createFolder(name);
    refresh([folder, ...loadCreativeAssets().filter((a) => a.id !== folder.id)]);
  }

  function onNewKit() {
    const name = window.prompt('Brand kit name', 'Brand kit');
    if (!name?.trim()) return;
    const kit = createBrandKit(name);
    refresh([kit, ...loadCreativeAssets().filter((a) => a.id !== kit.id)]);
    setTab('kits');
  }

  return (
    <CreativeShell banner breadcrumb="Assets">
      <div className="lg-creative-page-head">
        <div>
          <h1>Assets</h1>
          <p>
            Files and brand kits for LugemiCreative projects. Stored in this browser for now — CMS media stays on the
            platform ops console for admins.
          </p>
        </div>
        <div className="lg-creative-actions">
          {tab === 'files' ? (
            <button type="button" className="lg-creative-btn" onClick={onNewFolder}>
              <CreativeIcon name="folder" width={16} height={16} />
              New folder
            </button>
          ) : (
            <button type="button" className="lg-creative-btn" onClick={onNewKit}>
              <CreativeIcon name="plus" width={16} height={16} />
              New brand kit
            </button>
          )}
          <button type="button" className="lg-creative-btn primary" onClick={() => fileRef.current?.click()}>
            <CreativeIcon name="upload" width={16} height={16} />
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            onChange={(e) => void onUpload(e.target.files)}
          />
        </div>
      </div>

      <div className="lg-creative-tabs" role="tablist">
        <button type="button" role="tab" className={tab === 'files' ? 'is-active' : undefined} onClick={() => setTab('files')}>
          Files
        </button>
        <button type="button" role="tab" className={tab === 'kits' ? 'is-active' : undefined} onClick={() => setTab('kits')}>
          Brand Kits
        </button>
      </div>

      <div className="lg-creative-toolbar">
        <label className="lg-creative-field">
          <CreativeIcon name="search" width={16} height={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Start typing to search"
            aria-label="Search assets"
          />
        </label>
        <button
          type="button"
          className="lg-creative-icon-btn"
          aria-label="List view"
          aria-pressed={view === 'list'}
          onClick={() => setView('list')}
          style={view === 'list' ? { background: 'var(--lc-soft)', color: 'var(--lc-navy)' } : undefined}
        >
          <CreativeIcon name="list" />
        </button>
        <button
          type="button"
          className="lg-creative-icon-btn"
          aria-label="Grid view"
          aria-pressed={view === 'grid'}
          onClick={() => setView('grid')}
          style={view === 'grid' ? { background: 'var(--lc-soft)', color: 'var(--lc-navy)' } : undefined}
        >
          <CreativeIcon name="grid" />
        </button>
      </div>

      {note ? <p className="lg-creative-note">{note}</p> : null}

      {filtered.length === 0 ? (
        <div className="lg-creative-empty">
          <strong>{tab === 'kits' ? 'No brand kits yet' : 'No files yet'}</strong>
          {tab === 'kits'
            ? 'Create a brand kit for logos, colors, and preferred voices.'
            : 'Upload audio, images, or create a folder to get started.'}
        </div>
      ) : view === 'grid' ? (
        <div className="lg-creative-cards">
          {filtered.map((a) => (
            <article key={a.id} className="lg-creative-card" style={{ minHeight: '8rem' }}>
              <div style={{ color: 'var(--lc-navy)' }}>
                <CreativeIcon name={a.kind === 'folder' ? 'folder' : a.kind === 'brand-kit' ? 'assets' : 'media'} />
              </div>
              <h3>{a.name}</h3>
              <p>
                {typeLabel(a)} · {formatBytes(a.sizeBytes)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <table className="lg-creative-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Added</th>
              <th>Type</th>
              <th>File size</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CreativeIcon
                      name={a.kind === 'folder' ? 'folder' : a.kind === 'brand-kit' ? 'assets' : 'media'}
                      width={16}
                      height={16}
                    />
                    {a.name}
                  </span>
                </td>
                <td>{a.createdAt.slice(0, 10)}</td>
                <td>{typeLabel(a)}</td>
                <td>{formatBytes(a.sizeBytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CreativeShell>
  );
}
