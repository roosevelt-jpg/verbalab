'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';

const INSPIRATIONS = [
  { title: 'Film trailer', href: '/creative/text-to-speech?text=Announce%20the%20trailer', art: 'linear-gradient(120deg,#10264d,#1a4a48)' },
  { title: 'Explainer video', href: '/creative/dubbing', art: 'linear-gradient(120deg,#0a3d3a,#007c78)' },
  { title: 'Product video', href: '/creative/image-video', art: 'linear-gradient(120deg,#163a5a,#00b8ae)' },
  { title: 'Audio documentary', href: '/creative/audiobooks', art: 'linear-gradient(120deg,#0c2a4a,#2d6a66)' },
];

type Project = {
  id: string;
  title: string;
  kind: 'video' | 'audio' | 'all';
  updatedAt: string;
  role: string;
};

const SEED_KEY = 'lugemi.creative.studio.projects.v1';

function loadProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SEED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

function saveProjects(rows: Project[]) {
  window.localStorage.setItem(SEED_KEY, JSON.stringify(rows));
}

export function CreativeStudioClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [tab, setTab] = useState<'all' | 'video' | 'audio'>('all');
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (tab !== 'all' && p.kind !== tab) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q);
    });
  }, [projects, tab, query]);

  function createBlank() {
    const next: Project = {
      id: `proj_${Date.now()}`,
      title: 'Untitled project',
      kind: 'audio',
      updatedAt: new Date().toISOString(),
      role: 'Owner',
    };
    const rows = [next, ...loadProjects()];
    saveProjects(rows);
    setProjects(rows);
  }

  function onPrompt(e: FormEvent) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q) return;
    const next: Project = {
      id: `proj_${Date.now()}`,
      title: q.slice(0, 80),
      kind: /video|film|trailer/i.test(q) ? 'video' : 'audio',
      updatedAt: new Date().toISOString(),
      role: 'Owner',
    };
    const rows = [next, ...loadProjects()];
    saveProjects(rows);
    setProjects(rows);
    setPrompt('');
    router.push('/creative/text-to-speech?text=' + encodeURIComponent(q));
  }

  return (
    <CreativeShell banner breadcrumb="Studio">
      <section className="lg-creative-hero" style={{ marginTop: '1rem', maxWidth: '40rem' }}>
        <h1>What would you like to create?</h1>
        <form className="lg-creative-prompt" onSubmit={onPrompt}>
          <button type="button" className="lg-creative-icon-btn" aria-label="Add" onClick={createBlank}>
            <CreativeIcon name="plus" />
          </button>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Make a faceless news video about…"
            aria-label="Studio prompt"
          />
          <button type="submit" className="lg-creative-send" aria-label="Create project" disabled={!prompt.trim()}>
            <CreativeIcon name="send" width={16} height={16} />
          </button>
        </form>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--lc-navy)' }}>Inspirations</h2>
        <Link href="/creative/more" style={{ fontSize: '0.85rem', color: 'var(--lc-action)', fontWeight: 650 }}>
          View all →
        </Link>
      </div>
      <div className="lg-creative-inspo">
        {INSPIRATIONS.map((i) => (
          <Link key={i.title} href={i.href}>
            <div className="lg-creative-inspo-art" style={{ background: i.art }} />
            <figcaption>{i.title}</figcaption>
          </Link>
        ))}
      </div>

      <div className="lg-creative-toolbar" style={{ justifyContent: 'space-between' }}>
        <div className="lg-creative-tabs" style={{ border: 0, margin: 0, gap: '0.75rem' }}>
          {(['all', 'video', 'audio'] as const).map((t) => (
            <button key={t} type="button" className={tab === t ? 'is-active' : undefined} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/assets" className="lg-creative-btn">
            Upload
          </Link>
          <button type="button" className="lg-creative-btn primary" onClick={createBlank}>
            + New blank project
          </button>
        </div>
      </div>

      <label className="lg-creative-field" style={{ marginBottom: '0.85rem' }}>
        <CreativeIcon name="search" width={16} height={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" aria-label="Search projects" />
      </label>

      {filtered.length === 0 ? (
        <div className="lg-creative-empty">
          <strong>No projects yet</strong>
          Create from a prompt or start a blank audio/video project. Projects are stored in this browser.
        </div>
      ) : (
        <table className="lg-creative-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Updated</th>
              <th>Role</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CreativeIcon name={p.kind === 'video' ? 'video' : 'tts'} width={16} height={16} />
                    {p.title}
                  </span>
                </td>
                <td>{new Date(p.updatedAt).toLocaleString()}</td>
                <td>{p.role}</td>
                <td>{p.kind}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CreativeShell>
  );
}
