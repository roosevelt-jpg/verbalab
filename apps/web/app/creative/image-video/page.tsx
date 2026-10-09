'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreativeShell } from '@/components/creative/creative-shell';
import {
  CulturalIdentitySelect,
  type CulturalIdentityPack,
} from '@/components/cultural-identity-select';

/**
 * Image & Video companion surface.
 * Native image/video generation weights are not live; cultural voice sync for
 * narration beds is production-complete via Echo + Accent Identity packs.
 */
export default function CreativeImageVideoPage() {
  const [accentId, setAccentId] = useState('gh-ghanaian-english');
  const [pack, setPack] = useState<CulturalIdentityPack | null>(null);

  return (
    <CreativeShell banner breadcrumb="Image & Video">
      <div className="lg-creative-page-head">
        <div>
          <h1>Image & Video</h1>
          <p>
            Pair localized narration with cultural voice packs for video pipelines. Visual generation
            remains roadmap; voice sync for lip-sync / audio beds is live via Echo.
          </p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/text-to-speech" className="lg-creative-btn primary">
            Open Text to Speech
          </Link>
          <Link href="/creative/dubbing" className="lg-creative-btn">
            Open Dubbing
          </Link>
          <Link href="/accent-identity" className="lg-creative-btn">
            Accent Identity
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '1rem',
          maxWidth: '36rem',
          padding: '1.25rem',
          borderRadius: 12,
          border: '1px solid var(--lc-line)',
          background: 'var(--lc-bg)',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', color: 'var(--lc-navy)' }}>
            Cultural voice sync for video
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--lc-muted)', lineHeight: 1.45 }}>
            Choose a cultural accent / identity pack. Video connectors and MCP{' '}
            <code>lugemi_video_voice_line</code> use the same packs so narration sounds native to the
            target lifestyle — Ghanaian English, Nigerian Pidgin, Filipino English, and every Lugemi
            identity pack.
          </p>
        </div>

        <label style={{ display: 'grid', gap: 6, fontSize: '0.8rem', fontWeight: 650, color: 'var(--lc-muted)' }}>
          Cultural accent / identity
          <CulturalIdentitySelect
            value={accentId}
            onChange={(id, next) => {
              setAccentId(id);
              setPack(next);
            }}
          />
        </label>

        {pack ? (
          <dl
            style={{
              margin: 0,
              display: 'grid',
              gap: '0.45rem',
              fontSize: '0.85rem',
              color: 'var(--lc-navy)',
            }}
          >
            <div>
              <dt style={{ color: 'var(--lc-muted)', fontSize: '0.72rem', fontWeight: 650 }}>
                cultural_identity
              </dt>
              <dd style={{ margin: 0 }}>{pack.culturalIdentity || pack.cultural_identity}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--lc-muted)', fontSize: '0.72rem', fontWeight: 650 }}>
                speech_variety
              </dt>
              <dd style={{ margin: 0 }}>
                <code>{pack.speechVariety || pack.speech_variety}</code>
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--lc-muted)', fontSize: '0.72rem', fontWeight: 650 }}>
                Echo voice
              </dt>
              <dd style={{ margin: 0 }}>
                <code>{pack.echoVoiceId ?? '—'}</code>
                {pack.bcp47 ? ` · ${pack.bcp47}` : ''}
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--lc-muted)', fontSize: '0.72rem', fontWeight: 650 }}>
                Lifestyle tags
              </dt>
              <dd style={{ margin: 0 }}>
                {(pack.lifestyleTags || pack.lifestyle_tags || []).join(' · ') || '—'}
              </dd>
            </div>
          </dl>
        ) : null}

        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--lc-muted)', lineHeight: 1.45 }}>
          Honesty: native image/video generation models are planned, not live. Cultural voice routing
          for video narration is production-complete in software (registry, API, MCP, UI) even where
          Echo weights are still demo-quality adapters.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href={`/creative/text-to-speech${pack?.samplePhrase ? `?text=${encodeURIComponent(pack.samplePhrase)}` : ''}`}
            className="lg-creative-btn primary"
          >
            Synthesize with this pack
          </Link>
          <Link href="/creative/assets" className="lg-creative-btn">
            Open Assets
          </Link>
        </div>
      </div>
    </CreativeShell>
  );
}
