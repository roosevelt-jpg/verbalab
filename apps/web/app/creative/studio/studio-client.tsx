'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import {
  createVideoProject,
  deleteVideoProject,
  loadVideoProjects,
  upsertVideoProject,
  type CreativeVideoProject,
} from '@/lib/creative-video-project';

const INSPIRATIONS = [
  {
    title: 'Film trailer',
    script: 'Tonight, a story unfolds across languages — trust the voice that sounds like home.',
    art: 'linear-gradient(120deg,#10264d,#1a4a48)',
  },
  {
    title: 'Explainer video',
    script: 'In two minutes, learn how local sellers close deals with clear, native-language voiceovers.',
    art: 'linear-gradient(120deg,#0a3d3a,#007c78)',
  },
  {
    title: 'Product video',
    script: 'Meet the product built for your market — hear it spoken the way your customers speak.',
    art: 'linear-gradient(120deg,#163a5a,#00b8ae)',
  },
  {
    title: 'News desk',
    script: 'Good evening. Here are the headlines shaping your city today.',
    art: 'linear-gradient(120deg,#0c2a4a,#2d6a66)',
  },
];

export function CreativeStudioClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [tab, setTab] = useState<'all' | 'video' | 'audio'>('all');
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<CreativeVideoProject[]>([]);

  useEffect(() => {
    setProjects(loadVideoProjects());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (tab !== 'all' && p.kind !== tab) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.script.toLowerCase().includes(q);
    });
  }, [projects, tab, query]);

  function refresh() {
    setProjects(loadVideoProjects());
  }

  function openNew(opts: { title: string; script?: string; kind?: 'video' | 'audio' }) {
    const project = createVideoProject(opts);
    upsertVideoProject(project);
    refresh();
    router.push(`/creative/studio/${project.id}`);
  }

  function createBlank() {
    openNew({ title: 'Untitled video', script: '', kind: 'video' });
  }

  function onPrompt(e: FormEvent) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q) return;
    openNew({
      title: q.slice(0, 80),
      script: q,
      kind: /video|film|trailer|news|product/i.test(q) ? 'video' : 'video',
    });
    setPrompt('');
  }

  return (
    <CreativeShell banner breadcrumb="Studio">
      <section className="lg-creative-hero" style={{ marginTop: '1rem', maxWidth: '40rem' }}>
        <h1>What would you like to create?</h1>
        <p style={{ margin: '0 0 0.75rem', color: 'var(--lc-muted)', fontSize: '0.92rem', lineHeight: 1.45 }}>
          Type a prompt or script → generate native-language voice → download audio or export WebM for video production.
        </p>
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
        <Link href="/creative/image-video" style={{ fontSize: '0.85rem', color: 'var(--lc-action)', fontWeight: 650 }}>
          Image & Video →
        </Link>
      </div>
      <div className="lg-creative-inspo">
        {INSPIRATIONS.map((i) => (
          <button
            key={i.title}
            type="button"
            className="lg-creative-inspo-btn"
            onClick={() => openNew({ title: i.title, script: i.script, kind: 'video' })}
          >
            <div className="lg-creative-inspo-art" style={{ background: i.art }} />
            <figcaption>{i.title}</figcaption>
          </button>
        ))}
      </div>

      <div className="lg-creative-toolbar" style={{ justifyContent: 'space-between' }}>
        <div className="lg-creative-tabs" style={{ border: 0, margin: 0, gap: '0.75rem' }}>
          {(['all', 'video', 'audio'] as const).map((t) => (
            <button key={t} type="button" className={tab === t ? 'is-active' : undefined} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/assets" className="lg-creative-btn">
            Assets
          </Link>
          <button type="button" className="lg-creative-btn primary" onClick={createBlank}>
            + New video project
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
          Create from a prompt — you will land in the editor to generate voice, preview scenes, and export.
        </div>
      ) : (
        <table className="lg-creative-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Updated</th>
              <th>Voice</th>
              <th>Type</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    href={`/creative/studio/${p.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'inherit', fontWeight: 650 }}
                  >
                    <CreativeIcon name={p.kind === 'video' ? 'video' : 'tts'} width={16} height={16} />
                    {p.title}
                  </Link>
                </td>
                <td>{new Date(p.updatedAt).toLocaleString()}</td>
                <td>{p.narration ? p.narration.voiceName || p.narration.voiceId : '—'}</td>
                <td>{p.kind}</td>
                <td>
                  <button
                    type="button"
                    className="lg-creative-ghost"
                    onClick={() => {
                      if (window.confirm(`Delete “${p.title}”?`)) {
                        deleteVideoProject(p.id);
                        refresh();
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CreativeShell>
  );
}
