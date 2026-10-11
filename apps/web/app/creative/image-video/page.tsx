'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { API_URL } from '@/lib/api';
import { resolveCreativeToken } from '@/lib/creative-auth';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import {
  CulturalIdentitySelect,
  type CulturalIdentityPack,
} from '@/components/cultural-identity-select';
import {
  createVideoProject,
  upsertVideoProject,
  type VideoScene,
} from '@/lib/creative-video-project';

type VideoPlanScene = {
  title: string;
  caption: string;
  durationSec: number;
  mimeType: string;
  imageBase64: string;
  background?: string;
};

/**
 * Image & Video: generate scene stills + open Studio for Echo narration and WebM export.
 */
export default function CreativeImageVideoPage() {
  if (!isClerkConfigured()) {
    return <CreativeImageVideoInner getToken={async () => null} />;
  }
  return <CreativeImageVideoAuthed />;
}

function CreativeImageVideoAuthed() {
  const { getToken } = useAuth();
  return <CreativeImageVideoInner getToken={getToken} />;
}

function CreativeImageVideoInner({
  getToken,
}: {
  getToken: () => Promise<string | null>;
}) {
  const router = useRouter();
  const [accentId, setAccentId] = useState('gh-ghanaian-english');
  const [pack, setPack] = useState<CulturalIdentityPack | null>(null);
  const [title, setTitle] = useState('Product video');
  const [script, setScript] = useState(
    'Meet the product built for your market — hear it spoken the way your customers speak.',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function generateAndOpen(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const token = await resolveCreativeToken(() => getToken());
      if (!token) throw new Error('Sign in or apply a Studio API key under /keys.');

      const res = await fetch(`${API_URL}/v1/creative-media/video-plan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || 'Video project',
          script: script.trim() || pack?.samplePhrase || title,
          style: /news/i.test(title) ? 'news' : /film|trailer/i.test(title) ? 'cinematic' : 'product',
        }),
      });
      const body = (await res.json()) as {
        scenes?: VideoPlanScene[];
        error?: { message?: string };
        note?: string;
      };
      if (!res.ok) throw new Error(body.error?.message || `Video plan failed (${res.status})`);

      const project = createVideoProject({
        title: title.trim() || 'Video project',
        script: script.trim() || pack?.samplePhrase || title,
        kind: 'video',
        accentId: accentId || undefined,
        voiceId: pack?.echoVoiceId || 'alloy',
      });
      project.culturalIdentity = pack?.culturalIdentity || pack?.nameEn;
      project.speechVariety = pack?.speechVariety;
      project.locale = pack?.bcp47;
      project.scenes = (body.scenes ?? []).map((s, i) => {
        const scene: VideoScene = {
          id: `${project.id}_scene_${i}`,
          title: s.title || `Scene ${i + 1}`,
          caption: s.caption,
          durationSec: s.durationSec,
          background: s.background || project.scenes[i]?.background || '#0c1f3f',
          imageDataUrl: `data:${s.mimeType};base64,${s.imageBase64}`,
        };
        return scene;
      });
      if (!project.scenes.length) {
        throw new Error('No scenes returned from creative media.');
      }
      upsertVideoProject(project);
      setNote(body.note || `Generated ${project.scenes.length} scene stills.`);
      router.push(`/creative/studio/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate video plan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreativeShell banner breadcrumb="Image & Video">
      <div className="lg-creative-page-head">
        <div>
          <h1>Image & Video</h1>
          <p>
            Generate scene stills from your script, pick a cultural voice pack, then produce Echo narration and
            export WebM in Studio — end-to-end on Lugemi.
          </p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/studio" className="lg-creative-btn">
            Open Studio
          </Link>
          <button
            type="button"
            className="lg-creative-btn primary"
            disabled={busy}
            onClick={() => void generateAndOpen()}
          >
            <CreativeIcon name="video" width={16} height={16} />
            {busy ? 'Generating…' : 'Generate video project'}
          </button>
        </div>
      </div>

      <form className="lg-creative-video-entry" onSubmit={(e) => void generateAndOpen(e)}>
        <label className="lg-creative-field-block">
          <span>Project title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Project title" />
        </label>

        <label className="lg-creative-field-block">
          <span>Script (native language welcome)</span>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={5}
            aria-label="Video script"
          />
        </label>

        <label className="lg-creative-field-block">
          <span>Cultural accent / identity</span>
          <CulturalIdentitySelect
            value={accentId}
            onChange={(id, next) => {
              setAccentId(id);
              setPack(next);
              if (next?.samplePhrase && (!script.trim() || script.includes('customers speak'))) {
                setScript(next.samplePhrase);
              }
            }}
          />
        </label>

        {pack ? (
          <dl className="lg-creative-pack-meta">
            <div>
              <dt>cultural_identity</dt>
              <dd>{pack.culturalIdentity || pack.cultural_identity}</dd>
            </div>
            <div>
              <dt>speech_variety</dt>
              <dd>
                <code>{pack.speechVariety || pack.speech_variety}</code>
              </dd>
            </div>
            <div>
              <dt>Echo voice</dt>
              <dd>
                <code>{pack.echoVoiceId ?? '—'}</code>
                {pack.bcp47 ? ` · ${pack.bcp47}` : ''}
              </dd>
            </div>
          </dl>
        ) : null}

        <p className="lg-creative-note" style={{ marginTop: 0 }}>
          Live: prompt-conditioned scene stills via <code>/v1/creative-media/video-plan</code>, Echo narration, scene
          preview, MP3 download, and WebM export in Creative Studio.
        </p>

        {error ? <p className="lg-creative-error">{error}</p> : null}
        {note ? <p className="lg-creative-note">{note}</p> : null}

        <div className="lg-creative-actions">
          <button type="submit" className="lg-creative-btn primary" disabled={busy}>
            {busy ? 'Generating stills…' : 'Generate stills → Open Studio'}
          </button>
          <Link
            href={`/creative/text-to-speech?text=${encodeURIComponent(script)}`}
            className="lg-creative-btn"
          >
            Quick TTS only
          </Link>
        </div>
      </form>
    </CreativeShell>
  );
}
