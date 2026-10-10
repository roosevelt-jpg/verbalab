'use client';

import Link from 'next/link';

const ANSWERS = [
  {
    q: 'Can people clone voice in realtime and use it in videos / songs?',
    a: 'Instant Voice Cloning ships: short consent sample → abuse review → speak with clone:{id}. That is the closest honest realtime product — not live model training. Use approved clones in Voice Studio, Dubbing, Chat Studio, and MCP/CLI for video narration or song vocals (DAW mix stays yours).',
  },
  {
    q: 'Can they upload a recorded voice?',
    a: 'Yes. Voice Studio accepts 1–5 recorded samples or in-browser mic capture with consent attestation and notes (Pro + review).',
  },
  {
    q: 'Can they extract voice from uploaded files?',
    a: 'Yes for audio-track extract (browser) and Lugemi isolate (energy VAD). Entertainment-grade neural stem separation is not offered on this surface.',
  },
] as const;

/** Marketing demo answering Instant Voice Cloning product questions. */
export function VoiceCloneFaqDemo() {
  return (
    <div className="mkt-page-demos">
      <p className="mkt-tts-label">Voice Cloning — product answers</p>
      <div
        style={{
          display: 'grid',
          gap: '0.85rem',
          padding: '1.15rem 1.25rem',
          border: '1px solid rgba(28,25,23,0.12)',
          borderRadius: '0.75rem',
          background:
            'linear-gradient(160deg, rgba(15,118,110,0.08), rgba(255,253,248,0.95) 45%, rgba(180,140,60,0.06))',
        }}
      >
        {ANSWERS.map((item) => (
          <div key={item.q}>
            <p style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '0.95rem' }}>{item.q}</p>
            <p style={{ margin: 0, color: '#57534e', fontSize: '0.9rem', lineHeight: 1.5 }}>{item.a}</p>
          </div>
        ))}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
          <Link href="/audio" className="vl-btn" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            Open Voice Studio
          </Link>
          <Link
            href="/audio?tab=extract"
            className="vl-btn vl-btn-secondary"
            style={{ textDecoration: 'none', fontSize: '0.85rem' }}
          >
            Extract / isolate
          </Link>
          <Link
            href="/audio?tab=projects"
            className="vl-btn vl-btn-secondary"
            style={{ textDecoration: 'none', fontSize: '0.85rem' }}
          >
            Use in projects
          </Link>
        </div>
      </div>
    </div>
  );
}
