'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import {
  CulturalIdentitySelect,
  type CulturalIdentityPack,
} from '@/components/cultural-identity-select';
import {
  createVideoProject,
  defaultScenesFromScript,
  upsertVideoProject,
} from '@/lib/creative-video-project';

/**
 * Image & Video entry: native-language narration → Studio project → download / WebM export.
 * Full generative video models remain roadmap; voice + scene composition is fully wired.
 */
export default function CreativeImageVideoPage() {
  const router = useRouter();
  const [accentId, setAccentId] = useState('gh-ghanaian-english');
  const [pack, setPack] = useState<CulturalIdentityPack | null>(null);
  const [title, setTitle] = useState('Product video');
  const [script, setScript] = useState(
    'Meet the product built for your market — hear it spoken the way your customers speak.',
  );

  function startProject(e?: FormEvent) {
    e?.preventDefault();
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
    project.scenes = defaultScenesFromScript(project.script);
    upsertVideoProject(project);
    router.push(`/creative/studio/${project.id}`);
  }

  return (
    <CreativeShell banner breadcrumb="Image & Video">
      <div className="lg-creative-page-head">
        <div>
          <h1>Image & Video</h1>
          <p>
            End-to-end path: write a script in your language → pick a cultural voice pack → generate narration in
            Studio → download MP3 for CapCut/Premiere or export WebM on Lugemi.
          </p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/studio" className="lg-creative-btn">
            Open Studio
          </Link>
          <button type="button" className="lg-creative-btn primary" onClick={() => startProject()}>
            <CreativeIcon name="video" width={16} height={16} />
            Start video project
          </button>
        </div>
      </div>

      <form className="lg-creative-video-entry" onSubmit={startProject}>
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
          Generative image/video models are still roadmap. Narration, scene stitched preview, MP3 download, and WebM
          export are live end-to-end in Creative Studio.
        </p>

        <div className="lg-creative-actions">
          <button type="submit" className="lg-creative-btn primary">
            Continue to Studio → Generate voice
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
