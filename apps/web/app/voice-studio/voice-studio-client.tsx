'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreativeAuthGate, type CreativeAuth } from '@/components/creative/creative-auth-gate';
import { CreativeApiKeyField } from '@/components/creative/creative-api-key-field';
import { AppShell } from '@/components/app-shell';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import { ANAMORPHIC_STILLS } from '@/lib/anamorphic-stills';
import { API_URL } from '@/lib/api';
import { loadCreativeApiKey } from '@/lib/creative-auth';
import { DEMO_VOICE_PROFILES } from '@/lib/demo-speech';
import './voice-studio.css';

type Project = {
  id: string;
  name: string;
  description: string;
  sourceLanguage: string;
  status: string;
  reviewPolicy: string;
  editions?: Array<{ id: string; languageVariety: string; status: string; voiceId: string }>;
  hasRelease?: boolean;
};

type EditionSegment = {
  stableId: string;
  sourceText: string;
  translatedText: string;
  translationHash: string;
  takeId?: string;
  reviewStatus?: string;
  criticalFlags?: string[];
};

type Edition = {
  id: string;
  languageVariety: string;
  voiceId: string;
  status: string;
  expectedRevision: number;
  segments: EditionSegment[];
  selectedTakeIds: string[];
};

type WorkspaceDetail = {
  project: Project;
  sourceRevisions: Array<{ id: string; contentHash: string; segmentCount: number; scriptPreview: string }>;
  editions: Edition[];
  releases: Array<{ id: string; assemblyId: string; assemblyHash: string }>;
  pronunciations: Array<{
    id: string;
    writtenForm: string;
    value: string;
    languageVariety: string;
    status: string;
    revision: number;
  }>;
};

const CORRIDORS = Object.values(DEMO_VOICE_PROFILES)
  .filter((p, idx, arr) => p.voice && arr.findIndex((x) => x.voice === p.voice) === idx)
  .map((p) => ({
    id: p.id,
    label: p.label,
    lang: p.lang,
    voice: p.voice!,
  }));

type Step = 'library' | 'script' | 'edition' | 'review' | 'export';

function StudioInner({ auth }: { auth: CreativeAuth }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [step, setStep] = useState<Step>('library');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('Nairobi market announcement');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [script, setScript] = useState(
    'Welcome to Lugemi.\n\nWe can deliver fifty bags of rice by Friday for two hundred dollars.\n\nPlease confirm the quantity before noon.',
  );
  const [corridorId, setCorridorId] = useState(
    CORRIDORS.find((c) => c.lang.startsWith('sw'))?.id ?? CORRIDORS[0]?.id ?? 'sw-ke-female',
  );
  const [edition, setEdition] = useState<Edition | null>(null);
  const [assemblyId, setAssemblyId] = useState<string | null>(null);
  const [assemblyHash, setAssemblyHash] = useState<string | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lexemeForm, setLexemeForm] = useState('Lugemi');
  const [lexemeAlias, setLexemeAlias] = useState('Loo-geh-mee');
  const [apiKeyTick, setApiKeyTick] = useState(0);

  const corridor = useMemo(
    () => CORRIDORS.find((c) => c.id === corridorId) ?? CORRIDORS[0],
    [corridorId],
  );

  const authHeaders = useCallback(async () => {
    const token = await auth.getToken();
    const key = loadCreativeApiKey();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (key) headers.Authorization = `Bearer ${key}`;
    else throw new Error('Sign in or add an API key to use Voice Studio.');
    return headers;
  // apiKeyTick forces re-auth after key paste
  }, [auth, apiKeyTick]); // eslint-disable-line react-hooks/exhaustive-deps -- apiKeyTick busts auth headers after key paste

  const loadProjects = useCallback(async () => {
    const headers = await authHeaders();
    const res = await fetch(`${API_URL}/v1/voice-studio/workspace/projects`, { headers });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { projects: Project[] };
    setProjects(data.projects);
  }, [authHeaders]);

  const loadDetail = useCallback(
    async (id: string) => {
      const headers = await authHeaders();
      const res = await fetch(`${API_URL}/v1/voice-studio/workspace/projects/${id}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as WorkspaceDetail;
      setDetail(data);
      if (data.editions[0]) setEdition(data.editions[0]);
      if (data.releases[0]) {
        setReleaseId(data.releases[0].id);
        setAssemblyId(data.releases[0].assemblyId);
        setAssemblyHash(data.releases[0].assemblyHash);
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    if (!auth.isLoaded) return;
    void loadProjects().catch((err: Error) => {
      if (!/Sign in or add/i.test(err.message)) setError(err.message);
    });
  }, [auth.isLoaded, loadProjects]);

  async function createProject() {
    setBusy(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_URL}/v1/voice-studio/workspace/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: title,
          sourceLanguage,
          reviewPolicy: 'producer_self_preview',
          description: 'Voice Studio workspace project',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const project = (await res.json()) as Project;
      setSelectedId(project.id);
      await loadProjects();
      await loadDetail(project.id);
      setStep('script');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function importScript() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_URL}/v1/voice-studio/workspace/projects/${selectedId}/scripts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ script }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadDetail(selectedId);
      setStep('edition');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  async function createEditionAndTranslate() {
    if (!selectedId || !corridor) return;
    setBusy(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const createRes = await fetch(
        `${API_URL}/v1/voice-studio/workspace/projects/${selectedId}/editions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            languageVariety: corridor.lang,
            voiceId: corridor.voice,
          }),
        },
      );
      if (!createRes.ok) throw new Error(await createRes.text());
      const created = (await createRes.json()) as { edition: Edition };
      const tr = await fetch(
        `${API_URL}/v1/voice-studio/workspace/editions/${created.edition.id}/translations`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ expectedRevision: created.edition.expectedRevision }),
        },
      );
      if (!tr.ok) throw new Error(await tr.text());
      const translated = (await tr.json()) as { edition: Edition };
      setEdition(translated.edition);
      await loadDetail(selectedId);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edition failed');
    } finally {
      setBusy(false);
    }
  }

  async function generateAudio() {
    if (!edition) return;
    setBusy(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(
        `${API_URL}/v1/voice-studio/workspace/editions/${edition.id}/generations`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ expectedRevision: edition.expectedRevision }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { edition: Edition; takes: Array<{ id: string }> };
      setEdition(data.edition);
      if (data.takes[0]) await playTake(data.takes[0].id);
      if (selectedId) await loadDetail(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generate failed');
    } finally {
      setBusy(false);
    }
  }

  async function playTake(takeId: string) {
    const headers = await authHeaders();
    const res = await fetch(`${API_URL}/v1/voice-studio/workspace/takes/${takeId}/audio`, {
      headers: { Authorization: headers.Authorization! },
    });
    if (!res.ok) throw new Error(await res.text());
    const blob = await res.blob();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(blob));
  }

  async function approveSegmentReviews() {
    if (!edition) return;
    setBusy(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const segs = edition.segments.filter((s) => s.takeId);
      for (const seg of segs) {
        const rev = await fetch(`${API_URL}/v1/voice-studio/workspace/takes/${seg.takeId}/reviews`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            decision: 'approved',
            qualifications: ['demo-reviewer', edition.languageVariety],
            ratings: {
              intelligibility: 4,
              naturalness: 4,
              lexicalTone: 4,
              varietyAuthenticity: 3,
              meaningPreservation: 4,
              joinQuality: 4,
            },
          }),
        });
        if (!rev.ok) throw new Error(await rev.text());
      }
      const asmJson = await fetch(
        `${API_URL}/v1/voice-studio/workspace/editions/${edition.id}/assemblies`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ takeIds: segs.map((s) => s.takeId!), pauseMs: 180 }),
        },
      );
      if (!asmJson.ok) throw new Error(await asmJson.text());
      const assembled = (await asmJson.json()) as {
        assembly: { id: string; audioSha256: string };
      };
      setAssemblyId(assembled.assembly.id);
      setAssemblyHash(assembled.assembly.audioSha256);

      const audioRes = await fetch(
        `${API_URL}/v1/voice-studio/workspace/assemblies/${assembled.assembly.id}/audio`,
        { headers: { Authorization: headers.Authorization! } },
      );
      if (audioRes.ok) {
        const blob = await audioRes.blob();
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
      }
      setStep('export');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review/assemble failed');
    } finally {
      setBusy(false);
    }
  }

  async function approveAndExport() {
    if (!assemblyId || !assemblyHash) return;
    setBusy(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const appr = await fetch(
        `${API_URL}/v1/voice-studio/workspace/assemblies/${assemblyId}/approvals`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ assemblyHash }),
        },
      );
      if (!appr.ok) throw new Error(await appr.text());
      const release = (await appr.json()) as { release: { id: string } };
      setReleaseId(release.release.id);
      const exp = await fetch(
        `${API_URL}/v1/voice-studio/workspace/releases/${release.release.id}/exports`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ format: 'wav' }),
        },
      );
      if (!exp.ok) throw new Error(await exp.text());
      const artifact = (await exp.json()) as {
        export: { audioBase64: string; mimeType: string; checksum: string };
      };
      const bin = atob(artifact.export.audioBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(new Blob([bytes], { type: artifact.export.mimeType }));
      setAudioUrl(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lugemi-studio-export-${release.release.id}.wav`;
      a.click();
      if (selectedId) await loadDetail(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  async function savePronunciation() {
    if (!selectedId || !corridor) return;
    setBusy(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_URL}/v1/voice-studio/workspace/pronunciations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          writtenForm: lexemeForm,
          value: lexemeAlias,
          languageVariety: corridor.lang,
          scope: 'project',
          projectId: selectedId,
          status: 'approved',
          representation: 'pronunciation_alias',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadDetail(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pronunciation save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="vs-hero" aria-label="Lugemi Voice Studio">
        <div className="vs-hero__media" aria-hidden="true">
          <img src={ANAMORPHIC_STILLS.voice} alt="" className="vs-hero__img" />
          <div className="vs-hero__veil" />
        </div>
        <div className="vs-hero__copy">
          <p className="vs-brand">Lugemi</p>
          <h1 className="vs-title">Voice Studio</h1>
          <p className="vs-lede">
            Turn scripts into translated, reviewed speech — with pronunciation memory, sentence
            regeneration, and versioned approved exports.
          </p>
          <div className="vs-cta">
            <button
              type="button"
              className="vs-btn vs-btn--primary"
              disabled={busy}
              onClick={() => setStep('library')}
            >
              Open projects
            </button>
            <a href="/docs" className="vs-btn vs-btn--ghost">
              Workflow docs
            </a>
          </div>
        </div>
      </section>

      <div className="vs-shell">
        <CreativeApiKeyField onChange={() => setApiKeyTick((n) => n + 1)} />

        <nav className="vs-steps" aria-label="Studio steps">
          {(
            [
              ['library', 'Projects'],
              ['script', 'Script'],
              ['edition', 'Edition'],
              ['review', 'Review'],
              ['export', 'Export'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`vs-step${step === id ? ' is-active' : ''}`}
              onClick={() => setStep(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {error ? (
          <div className="vs-error" role="alert">
            {error}
          </div>
        ) : null}

        {step === 'library' ? (
          <section className="vs-panel">
            <h2>Project library</h2>
            <p className="vs-muted">
              Private workspace projects. Africa-first corridors with honest capability gates.
            </p>
            <div className="vs-form">
              <label>
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                Source language
                <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                  <option value="fr">French</option>
                  <option value="am">Amharic</option>
                </select>
              </label>
              <button
                type="button"
                className="vs-btn vs-btn--primary"
                disabled={busy}
                onClick={() => void createProject()}
              >
                Create project
              </button>
            </div>
            <ul className="vs-list">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="vs-list__btn"
                    onClick={() => {
                      setSelectedId(p.id);
                      void loadDetail(p.id).then(() => setStep('script'));
                    }}
                  >
                    <strong>{p.name}</strong>
                    <span>
                      {p.status} · {p.sourceLanguage}
                      {p.hasRelease ? ' · released' : ''}
                    </span>
                  </button>
                </li>
              ))}
              {!projects.length ? (
                <li className="vs-muted">No projects yet — create one to begin.</li>
              ) : null}
            </ul>
          </section>
        ) : null}

        {step === 'script' ? (
          <section className="vs-panel">
            <h2>Script</h2>
            <p className="vs-muted">
              UTF-8 paste/import. Diacritics and tone marks are preserved. Segmentation uses stable
              IDs.
            </p>
            {!selectedId ? (
              <p className="vs-muted">Select or create a project first.</p>
            ) : (
              <>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={8}
                  aria-label="Source script"
                />
                <button
                  type="button"
                  className="vs-btn vs-btn--primary"
                  disabled={busy}
                  onClick={() => void importScript()}
                >
                  Import revision
                </button>
                {detail?.sourceRevisions[0] ? (
                  <p className="vs-muted">
                    Latest revision {detail.sourceRevisions[0].id.slice(0, 12)}… ·{' '}
                    {detail.sourceRevisions[0].segmentCount} segments · hash{' '}
                    {detail.sourceRevisions[0].contentHash.slice(0, 12)}
                  </p>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {step === 'edition' ? (
          <section className="vs-panel">
            <h2>Target edition</h2>
            <p className="vs-muted">
              Choose a verified variety and voice. Unsupported combinations return an explicit
              capability error — never a beep.
            </p>
            <label>
              Language / voice corridor
              <select value={corridorId} onChange={(e) => setCorridorId(e.target.value)}>
                {CORRIDORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} · {c.lang}
                  </option>
                ))}
              </select>
            </label>
            <div className="vs-form-row">
              <label>
                Pronunciation written form
                <input value={lexemeForm} onChange={(e) => setLexemeForm(e.target.value)} />
              </label>
              <label>
                Spoken alias
                <input value={lexemeAlias} onChange={(e) => setLexemeAlias(e.target.value)} />
              </label>
              <button
                type="button"
                className="vs-btn"
                disabled={busy}
                onClick={() => void savePronunciation()}
              >
                Pin pronunciation
              </button>
            </div>
            <button
              type="button"
              className="vs-btn vs-btn--primary"
              disabled={busy || !selectedId}
              onClick={() => void createEditionAndTranslate()}
            >
              Create edition & translate
            </button>
            {edition ? (
              <div className="vs-segments">
                {edition.segments.map((s) => (
                  <article key={s.stableId} className="vs-seg">
                    <div>
                      <span className="vs-muted">Source</span>
                      <p>{s.sourceText}</p>
                    </div>
                    <div>
                      <span className="vs-muted">Target</span>
                      <p>{s.translatedText || '—'}</p>
                      {s.criticalFlags?.length ? (
                        <p className="vs-warn">Flags: {s.criticalFlags.join(', ')}</p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 'review' ? (
          <section className="vs-panel">
            <h2>Generate & native review</h2>
            <p className="vs-muted">
              Generate real audio from Lugemi voices. Reviews are human judgments — AI scores never
              count as native approval. Synthetic speech is labeled.
            </p>
            <div className="vs-form-row">
              <button
                type="button"
                className="vs-btn vs-btn--primary"
                disabled={busy || !edition}
                onClick={() => void generateAudio()}
              >
                Generate takes
              </button>
              <button
                type="button"
                className="vs-btn"
                disabled={busy || !edition?.segments.some((s) => s.takeId)}
                onClick={() => void approveSegmentReviews()}
              >
                Review + assemble
              </button>
            </div>
            {audioUrl ? (
              <div className="vs-audio">
                <AudioPreviewBar src={audioUrl} label="Play draft audio (no autoplay)" />
                <p className="vs-muted">Synthetic speech · draft until release approval</p>
              </div>
            ) : (
              <p className="vs-muted">No audio yet.</p>
            )}
            {edition?.segments.map((s, i) =>
              s.takeId ? (
                <button
                  key={s.takeId}
                  type="button"
                  className="vs-linkish"
                  onClick={() => void playTake(s.takeId!)}
                >
                  Play segment {i + 1}
                </button>
              ) : null,
            )}
          </section>
        ) : null}

        {step === 'export' ? (
          <section className="vs-panel">
            <h2>Assembly & approved export</h2>
            <p className="vs-muted">
              Release pins the exact assembly hash. Later drafts cannot silently replace an approved
              export.
            </p>
            {assemblyHash ? (
              <p className="vs-mono">assembly sha256 {assemblyHash.slice(0, 24)}…</p>
            ) : (
              <p className="vs-muted">Assemble from the Review step first.</p>
            )}
            <button
              type="button"
              className="vs-btn vs-btn--primary"
              disabled={busy || !assemblyId}
              onClick={() => void approveAndExport()}
            >
              Approve release & download WAV
            </button>
            {releaseId ? <p className="vs-muted">Release {releaseId}</p> : null}
            {audioUrl ? <AudioPreviewBar src={audioUrl} label="Play approved export" /> : null}
            <div className="vs-side-visual" aria-hidden="true">
              <AnamorphicPanel variant="speech" size="md" label="Speech depth" />
            </div>
          </section>
        ) : null}

        <footer className="vs-foot">
          <Link href="/audio">African studio tools</Link>
          {' · '}
          <Link href="/neural-tts">Neural TTS</Link>
          {' · '}
          <Link href="/creative/studio">Creative Studio</Link>
        </footer>
      </div>
    </AppShell>
  );
}

export function VoiceStudioClient() {
  return <CreativeAuthGate>{(auth) => <StudioInner auth={auth} />}</CreativeAuthGate>;
}
