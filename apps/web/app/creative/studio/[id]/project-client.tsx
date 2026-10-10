'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import {
  CulturalIdentitySelect,
  type CulturalIdentityPack,
} from '@/components/cultural-identity-select';
import {
  blobToDataUrl,
  defaultScenesFromScript,
  downloadBlob,
  downloadDataUrl,
  exportProjectWebM,
  getVideoProject,
  projectTotalDuration,
  slugifyFilename,
  upsertVideoProject,
  type CreativeVideoProject,
  type VideoScene,
} from '@/lib/creative-video-project';
import { loadCreativeAssets, saveCreativeAssets, type CreativeAsset } from '@/lib/creative-assets';
import { isLugemiApiKey, loadCreativeApiKey } from '@/lib/creative-auth';
import { CreativeApiKeyField } from '@/components/creative/creative-api-key-field';

type Voice = {
  id: string;
  name: string;
  languages?: string[];
};

export function CreativeVideoProjectClient({ projectId }: { projectId: string }) {
  if (!isClerkConfigured()) {
    return <ProjectInner projectId={projectId} getToken={async () => null} isLoaded />;
  }
  return <ProjectAuthed projectId={projectId} />;
}

function ProjectAuthed({ projectId }: { projectId: string }) {
  const { getToken, isLoaded } = useAuth();
  return <ProjectInner projectId={projectId} getToken={getToken} isLoaded={isLoaded} />;
}

function ProjectInner({
  projectId,
  getToken,
  isLoaded,
}: {
  projectId: string;
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<CreativeVideoProject | null>(null);
  const [missing, setMissing] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [identityPack, setIdentityPack] = useState<CulturalIdentityPack | null>(null);
  const [busy, setBusy] = useState<'tts' | 'export' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewScene, setPreviewScene] = useState(0);
  const [apiKey, setApiKey] = useState('');

  const resolveToken = useCallback(async () => {
    const session = await getToken();
    if (session) return session;
    const key = apiKey || loadCreativeApiKey();
    if (isLugemiApiKey(key)) return key;
    return null;
  }, [apiKey, getToken]);

  useEffect(() => {
    const p = getVideoProject(projectId);
    if (!p) {
      setMissing(true);
      return;
    }
    setProject(p);
  }, [projectId]);

  const persist = useCallback((next: CreativeVideoProject) => {
    const saved = upsertVideoProject(next);
    setProject(saved);
    return saved;
  }, []);

  const loadVoices = useCallback(async () => {
    const token = await resolveToken();
    if (!token) return;
    const res = await apiFetch<{ data: Voice[] }>('/v1/tts/voices', { token });
    setVoices(res.data);
  }, [resolveToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void loadVoices().catch(() => undefined);
  }, [isLoaded, loadVoices]);

  const selectedVoice = useMemo(
    () => voices.find((v) => v.id === project?.voiceId) ?? null,
    [voices, project?.voiceId],
  );

  function patch(partial: Partial<CreativeVideoProject>) {
    if (!project) return;
    persist({ ...project, ...partial });
  }

  function rebuildScenes() {
    if (!project) return;
    persist({
      ...project,
      scenes: defaultScenesFromScript(project.script || project.title),
    });
    setNote('Scenes rebuilt from script sentences.');
  }

  function updateScene(id: string, partial: Partial<VideoScene>) {
    if (!project) return;
    persist({
      ...project,
      scenes: project.scenes.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    });
  }

  async function onSceneImage(sceneId: string, file: File | null) {
    if (!file || !project) return;
    const dataUrl = await blobToDataUrl(file);
    updateScene(sceneId, { imageDataUrl: dataUrl });
  }

  async function generateNarration() {
    if (!project) return;
    setBusy('tts');
    setError(null);
    setNote(null);
    try {
      const token = await resolveToken();
      if (!token) throw new Error('Sign in or paste a lg_test_ / lg_live_ API key.');
      const text = project.script.trim();
      if (!text) throw new Error('Add a script before generating voice.');
      const voice = identityPack?.echoVoiceId || project.voiceId;
      const res = await fetch(`${API_URL}/v1/tts/synthesize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          format: 'mp3',
          accentId: project.accentId || undefined,
          speechVariety: identityPack?.speechVariety || project.speechVariety || undefined,
          locale: identityPack?.bcp47 || project.locale || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || `TTS failed (${res.status})`);
      }
      const blob = await res.blob();
      const audioDataUrl = await blobToDataUrl(blob);
      const next = persist({
        ...project,
        voiceId: voice,
        culturalIdentity:
          identityPack?.culturalIdentity || identityPack?.nameEn || project.culturalIdentity,
        speechVariety: identityPack?.speechVariety || project.speechVariety,
        locale: identityPack?.bcp47 || project.locale,
        narration: {
          mimeType: blob.type || 'audio/mpeg',
          audioDataUrl,
          voiceId: voice,
          voiceName: selectedVoice?.name || voice,
          accentId: project.accentId || undefined,
          speechVariety: identityPack?.speechVariety || project.speechVariety,
          locale: identityPack?.bcp47 || project.locale,
          characterCount: text.length,
          generatedAt: new Date().toISOString(),
        },
      });

      // Persist into Assets library for reuse across Creative tools.
      const asset: CreativeAsset = {
        id: `ca_narr_${Date.now().toString(36)}`,
        name: `${next.title.slice(0, 40)} — narration.mp3`,
        kind: 'file',
        mimeType: 'audio/mpeg',
        sizeBytes: blob.size,
        parentId: null,
        createdAt: new Date().toISOString(),
        previewUrl: audioDataUrl,
        notes: 'Generated from Creative Studio video project',
      };
      saveCreativeAssets([asset, ...loadCreativeAssets().filter((a) => a.id !== asset.id)]);
      setNote(
        identityPack
          ? `Narration ready · ${identityPack.culturalIdentity || identityPack.nameEn} (${identityPack.speechVariety}). Saved to Assets.`
          : 'Narration ready and saved to Assets.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(null);
    }
  }

  function downloadAudio() {
    if (!project?.narration) return;
    const ext = project.narration.mimeType.includes('wav') ? 'wav' : 'mp3';
    downloadDataUrl(project.narration.audioDataUrl, `${slugifyFilename(project.title)}-narration.${ext}`);
    setNote('Narration downloaded — drop it into CapCut, Premiere, DaVinci, or any editor.');
  }

  async function exportVideo() {
    if (!project) return;
    setBusy('export');
    setError(null);
    setExportProgress(0);
    try {
      const blob = await exportProjectWebM(project, {
        onProgress: setExportProgress,
      });
      downloadBlob(blob, `${slugifyFilename(project.title)}.webm`);
      const asset: CreativeAsset = {
        id: `ca_vid_${Date.now().toString(36)}`,
        name: `${project.title.slice(0, 40)}.webm`,
        kind: 'file',
        mimeType: blob.type || 'video/webm',
        sizeBytes: blob.size,
        parentId: null,
        createdAt: new Date().toISOString(),
        previewUrl: URL.createObjectURL(blob),
        notes: 'Exported from Creative Studio',
      };
      saveCreativeAssets([asset, ...loadCreativeAssets().filter((a) => a.id !== asset.id)]);
      setNote('WebM exported and saved to Assets. Use MP3 download for external NLE timelines.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(null);
      setExportProgress(0);
    }
  }

  if (missing) {
    return (
      <CreativeShell banner breadcrumb="Studio">
        <div className="lg-creative-empty">
          <strong>Project not found</strong>
          This project is stored in this browser. Start a new one from Studio.
          <div style={{ marginTop: '0.75rem' }}>
            <Link href="/creative/studio" className="lg-creative-btn primary">
              Back to Studio
            </Link>
          </div>
        </div>
      </CreativeShell>
    );
  }

  if (!project) {
    return (
      <CreativeShell banner breadcrumb="Studio">
        <p className="lg-creative-note">Loading project…</p>
      </CreativeShell>
    );
  }

  const duration = projectTotalDuration(project);
  const activeScene = project.scenes[previewScene] ?? project.scenes[0];

  return (
    <CreativeShell banner breadcrumb="Studio project">
      <div className="lg-creative-page-head">
        <div>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem' }}>
            <Link href="/creative/studio" style={{ color: 'var(--lc-action)', fontWeight: 650 }}>
              ← Studio
            </Link>
          </p>
          <h1>
            <input
              className="lg-creative-title-input"
              value={project.title}
              onChange={(e) => patch({ title: e.target.value })}
              aria-label="Project title"
            />
          </h1>
          <p>
            Type your script in any language, generate a native-sounding voice bed, preview scenes, then download
            audio for an external editor — or export a WebM from Lugemi.
          </p>
        </div>
        <div className="lg-creative-actions">
          <button
            type="button"
            className="lg-creative-btn"
            disabled={!project.narration || busy !== null}
            onClick={downloadAudio}
          >
            <CreativeIcon name="download" width={16} height={16} />
            Download audio
          </button>
          <button
            type="button"
            className="lg-creative-btn"
            disabled={!project.narration || busy !== null}
            onClick={() => void exportVideo()}
          >
            <CreativeIcon name="video" width={16} height={16} />
            {busy === 'export' ? `Exporting… ${Math.round(exportProgress * 100)}%` : 'Export WebM'}
          </button>
          <button
            type="button"
            className="lg-creative-btn primary"
            disabled={busy !== null || !project.script.trim()}
            onClick={() => void generateNarration()}
          >
            {busy === 'tts' ? 'Generating…' : 'Generate voice'}
          </button>
        </div>
      </div>

      <div className="lg-creative-video-grid">
        <section className="lg-creative-video-main">
          <label className="lg-creative-field-block">
            <span>Script (type in your native language)</span>
            <textarea
              value={project.script}
              onChange={(e) => patch({ script: e.target.value })}
              rows={8}
              placeholder="Write the words you want spoken in the video…"
              aria-label="Video script"
            />
          </label>

          <div className="lg-creative-video-preview" style={{ background: activeScene?.background }}>
            {activeScene?.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeScene.imageDataUrl} alt="" className="lg-creative-video-preview__img" />
            ) : null}
            <div className="lg-creative-video-preview__overlay">
              <strong>{project.title}</strong>
              <p>{activeScene?.caption || 'Add scenes or generate from script'}</p>
              {(project.culturalIdentity || project.speechVariety) && (
                <span>
                  {[project.culturalIdentity, project.speechVariety].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>

          {project.narration ? (
            <div style={{ marginTop: '0.85rem' }}>
              <AudioPreviewBar src={project.narration.audioDataUrl} label="Narration preview" />
            </div>
          ) : (
            <p className="lg-creative-note">Generate voice to preview and unlock downloads.</p>
          )}

          {error ? <p className="lg-creative-error">{error}</p> : null}
          {note ? <p className="lg-creative-note">{note}</p> : null}
        </section>

        <aside className="lg-creative-video-side">
          <CreativeApiKeyField onChange={setApiKey} />
          <label className="lg-creative-field-block">
            <span>Cultural accent / identity</span>            <CulturalIdentitySelect
              value={project.accentId}
              allowEmpty
              emptyLabel="None — use voice only"
              onChange={(id, pack) => {
                setIdentityPack(pack);
                const seedScript = pack?.samplePhrase && !project.script.trim() ? pack.samplePhrase : undefined;
                patch({
                  accentId: id,
                  voiceId: pack?.echoVoiceId || project.voiceId,
                  speechVariety: pack?.speechVariety || undefined,
                  locale: pack?.bcp47 || undefined,
                  culturalIdentity: pack?.culturalIdentity || pack?.nameEn || undefined,
                  ...(seedScript
                    ? { script: seedScript, scenes: defaultScenesFromScript(seedScript) }
                    : {}),
                });
              }}
            />
          </label>

          <label className="lg-creative-field-block">
            <span>Voice</span>
            <select
              value={project.voiceId}
              onChange={(e) => patch({ voiceId: e.target.value })}
            >
              {voices.length === 0 ? <option value={project.voiceId}>{project.voiceId}</option> : null}
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.languages?.[0] ? ` · ${v.languages[0]}` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="lg-creative-toolbar" style={{ margin: '0.5rem 0' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--lc-navy)' }}>
              Scenes · ~{duration.toFixed(0)}s
            </strong>
            <button type="button" className="lg-creative-btn" onClick={rebuildScenes}>
              Rebuild from script
            </button>
          </div>

          <ul className="lg-creative-scene-list">
            {project.scenes.map((scene, idx) => (
              <li key={scene.id} className={idx === previewScene ? 'is-active' : undefined}>
                <button type="button" className="lg-creative-scene-hit" onClick={() => setPreviewScene(idx)}>
                  <span>{scene.title}</span>
                  <small>{scene.durationSec}s</small>
                </button>
                <input
                  value={scene.caption}
                  onChange={(e) => updateScene(scene.id, { caption: e.target.value })}
                  aria-label={`${scene.title} caption`}
                />
                <div className="lg-creative-scene-actions">
                  <label>
                    Duration
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={scene.durationSec}
                      onChange={(e) =>
                        updateScene(scene.id, { durationSec: Math.max(1, Number(e.target.value) || 1) })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="lg-creative-btn"
                    onClick={() => {
                      setPreviewScene(idx);
                      fileRef.current?.setAttribute('data-scene', scene.id);
                      fileRef.current?.click();
                    }}
                  >
                    {scene.imageDataUrl ? 'Replace still' : 'Add still'}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const sceneId = e.target.getAttribute('data-scene') || project.scenes[previewScene]?.id;
              const file = e.target.files?.[0] ?? null;
              if (sceneId) void onSceneImage(sceneId, file);
              e.target.value = '';
            }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <Link href="/creative/assets" className="lg-creative-btn">
              Open Assets
            </Link>
            <Link
              href={`/creative/text-to-speech?text=${encodeURIComponent(project.script)}&voice=${encodeURIComponent(project.voiceId)}`}
              className="lg-creative-btn"
            >
              Open in TTS
            </Link>
            <button type="button" className="lg-creative-ghost" onClick={() => router.push('/creative/studio')}>
              Close
            </button>
          </div>
        </aside>
      </div>
    </CreativeShell>
  );
}
