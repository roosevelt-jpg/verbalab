'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import {
  NativeAccentVoicePicker,
  type VoicePickerValue,
} from '@/components/console/native-accent-voice-picker';
import { SITE_CONTENT } from '@/data/site-content';
import {
  CONNECTOR_CATEGORIES,
  PLATFORM_CONNECTORS,
} from '@/lib/connectors-catalog';

const PATHS = [
  {
    id: 'A',
    title: 'Voice agents',
    body: 'Ship speaking agents with native accent, gender, and tone controls. Simulate turns, then graduate to production with the same own:* voices.',
    href: '/voice',
    cta: 'Open Agents',
    secondary: { href: '/chat', label: 'Chat Studio' },
  },
  {
    id: 'B',
    title: 'Video & dubbing voice',
    body: 'Synthesize narration and dubbed lines in Voice Studio, localize scripts, then route through Connectors or MCP/CLI into your video pipeline.',
    href: '/audio',
    cta: 'Open Voice Studio',
    secondary: { href: '/connectors', label: 'Connectors' },
  },
  {
    id: 'C',
    title: 'API keys & playground',
    body: 'Create lg_live_ / lg_test_ keys, exercise speech + translate in Playground, then ship with @lugemi/sdk, Docs, or MCP.',
    href: '/keys',
    cta: 'Manage API keys',
    secondary: { href: '/playground', label: 'Playground' },
  },
] as const;

const VIDEO_CONNECTORS = PLATFORM_CONNECTORS.filter(
  (c) => c.category === 'video' || c.category === 'voice',
).slice(0, 6);

export function BuildersClient() {
  const samples = SITE_CONTENT.sampleVoices;
  const [picker, setPicker] = useState<VoicePickerValue>({
    voiceId: samples[0]?.voiceId ?? 'own:sw-ke-female',
    gender: 'female',
    language: 'sw',
    accent: '',
    country: '',
    toneStyle: 'empathetic',
    emotionProfile: 'customer_support',
  });

  return (
    <AppShell>
      <p className="vl-tag" style={{ margin: 0 }}>
        Language Intelligence Infrastructure
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0.55rem 0 0.35rem',
          color: 'var(--brand-navy)',
        }}
      >
        Builders
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '44rem', lineHeight: 1.6 }}>
        Launch AI agents and video products that sound like humans — in native languages, Africa-first.
        Lugemi is the voice layer under your stack: own:* catalog, speech synthesize, translate, connectors,
        MCP/CLI, and metered <code className="vl-code">/v1</code> APIs. Not a thin TTS gadget.
      </p>

      <nav
        aria-label="Builder paths"
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
          marginBottom: '2rem',
        }}
      >
        {PATHS.map((path) => (
          <article key={path.id} className="vl-endpoint-card" style={{ display: 'grid', gap: '0.75rem' }}>
            <p style={pathLabel}>Path {path.id}</p>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--brand-navy)',
              }}
            >
              {path.title}
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
              {path.body}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Link href={path.href} className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
                {path.cta}
              </Link>
              <Link
                href={path.secondary.href}
                className="vl-btn vl-btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                {path.secondary.label}
              </Link>
            </div>
          </article>
        ))}
      </nav>

      <section className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionLabel}>A · Native accent voice picker</h2>
        <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Same control Agents and Voice Studio use — gender, language, country/region accent, and tone/emotion
          over the own:* registry. Selection carries into{' '}
          <Link href="/voice">Agents</Link> for speaking turns.
        </p>
        <NativeAccentVoicePicker value={picker} onChange={setPicker} preferOwn showEmotionTone />
        <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Selected <code className="vl-code">{picker.voiceId}</code>
          {picker.toneStyle ? (
            <>
              {' '}
              · tone <code className="vl-code">{picker.toneStyle}</code>
            </>
          ) : null}
          {picker.emotionProfile ? (
            <>
              {' '}
              · emotion <code className="vl-code">{picker.emotionProfile}</code>
            </>
          ) : null}
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/voice" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            Continue in Agents
          </Link>
        </div>
      </section>

      <section className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionLabel}>Human-sounding native catalog</h2>
        <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Africa-first sample registry from CMS — region and ethnic context on every voice. Full catalog loads
          live from <code className="vl-code">/v1/tts/voices</code> in the picker above.
        </p>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: '0.65rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
          }}
        >
          {samples.map((v) => (
            <li
              key={v.id}
              style={{
                border: '1px solid var(--border, #e5e2da)',
                borderRadius: '0.65rem',
                padding: '0.75rem 0.85rem',
              }}
            >
              <p style={{ margin: 0, fontWeight: 650, color: 'var(--brand-navy)' }}>{v.label}</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                {v.language} · {v.region}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45 }}>
                {v.ethnicContext}
              </p>
              <code className="vl-code" style={{ display: 'inline-block', marginTop: '0.45rem', fontSize: '0.75rem' }}>
                {v.voiceId}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionLabel}>B · Video voice · connectors & MCP</h2>
        <p style={{ margin: '0 0 0.85rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Wire synthesize + translate into video and voice platforms. Prefer documented connectors over brittle
          scrapers. MCP/CLI helpers live on the Developers hub.
        </p>
        <p style={{ margin: '0 0 0.65rem', fontSize: '0.8rem', fontWeight: 650, color: 'var(--muted)' }}>
          {CONNECTOR_CATEGORIES.filter((c) => c.id === 'voice' || c.id === 'video')
            .map((c) => c.label)
            .join(' · ')}
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.45rem' }}>
          {VIDEO_CONNECTORS.map((c) => (
            <li key={c.id} style={{ fontSize: '0.92rem' }}>
              <strong style={{ color: 'var(--brand-navy)' }}>{c.name}</strong>
              <span style={{ color: 'var(--muted)' }}> — {c.blurb}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
          <Link href="/audio" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            Voice Studio
          </Link>
          <Link href="/connectors" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Connectors
          </Link>
          <Link href="/developers" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            MCP · CLI · SDK
          </Link>
        </div>
      </section>

      <section className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionLabel}>C · Keys, playground, docs</h2>
        <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Soft <code className="vl-code">lg_test_</code> keys share this cluster for pilots;{' '}
          <code className="vl-code">lg_live_</code> for production. Same contracts as marketing demos and Agent
          simulate.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link href="/keys" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            API keys
          </Link>
          <Link href="/playground" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Playground
          </Link>
          <Link href="/docs" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Docs
          </Link>
          <Link href="/developers" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Developers
          </Link>
          <Link href="/p/builders" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Marketing · Builders
          </Link>
        </div>
      </section>

      <section className="vl-player-bar">
        <Link href="/voice" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
          Agents
        </Link>
        <Link href="/audio" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
          Voice Studio
        </Link>
        <Link href="/chat" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
          Chat Studio
        </Link>
        <Link href="/p/infrastructure" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
          Infrastructure
        </Link>
      </section>
    </AppShell>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.55rem',
  fontWeight: 700,
};

const pathLabel: React.CSSProperties = {
  ...sectionLabel,
  margin: 0,
};
