'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AnamorphicCanopyCanvas } from '@/components/media/anamorphic-canopy-canvas';
import { CREATIVE_QUICK_TOOLS } from '@/lib/creative-nav';

const PROMPT_HINTS = [
  'Make a podcast intro with music...',
  'Narrate a product launch in Twi...',
  'Clone a calm studio voice for tutorials...',
  'Transcribe this interview and dub to Yoruba...',
];

export function CreativeHomeClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const placeholder = PROMPT_HINTS[0];

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q) {
      router.push('/creative/text-to-speech');
      return;
    }
    const lower = q.toLowerCase();
    if (lower.includes('music') || lower.includes('song') || lower.includes('beat')) {
      router.push(`/creative/music?q=${encodeURIComponent(q)}`);
      return;
    }
    if (lower.includes('clone') || lower.includes('voice design')) {
      router.push('/creative/voice-creation');
      return;
    }
    if (lower.includes('sound') || lower.includes('sfx') || lower.includes('foley')) {
      router.push(`/creative/sound-effects?q=${encodeURIComponent(q)}`);
      return;
    }
    if (lower.includes('transcribe') || lower.includes('speech to text')) {
      router.push('/creative/speech-to-text');
      return;
    }
    if (lower.includes('dub') || lower.includes('localize')) {
      router.push('/creative/dubbing');
      return;
    }
    if (lower.includes('image') || lower.includes('video')) {
      router.push('/creative/image-video');
      return;
    }
    if (lower.includes('flow') || lower.includes('workflow')) {
      router.push('/creative/flows');
      return;
    }
    router.push(`/creative/text-to-speech?text=${encodeURIComponent(q)}`);
  }

  return (
    <CreativeShell banner>
      <section className="lg-creative-hero">
        <h1>What would you like to create?</h1>
        <form className="lg-creative-prompt" onSubmit={onSubmit}>
          <span className="lg-creative-prompt-orb" aria-hidden />
          <button type="button" className="lg-creative-icon-btn" aria-label="Add attachment" onClick={() => router.push('/creative/assets')}>
            <CreativeIcon name="plus" />
          </button>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            aria-label="Creation prompt"
          />
          <span className="lg-creative-alpha">Alpha</span>
          <span className="lg-creative-icon-btn" aria-hidden>
            <CreativeIcon name="mic" />
          </span>
          <button type="submit" className="lg-creative-send" aria-label="Create">
            <CreativeIcon name="send" width={16} height={16} />
          </button>
        </form>
      </section>

      <nav className="lg-creative-quick" aria-label="Quick tools">
        {CREATIVE_QUICK_TOOLS.map((t) => (
          <Link key={`${t.label}-${t.href}`} href={t.href}>
            <span className="lg-creative-quick-icon">
              <CreativeIcon name={t.icon} />
            </span>
            {t.label}
          </Link>
        ))}
      </nav>

      <aside className="lg-creative-promo">
        <AnamorphicCanopyCanvas
          className="lg-creative-promo-canvas"
          intensity={0.65}
          showRings={false}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2>Baobab is here. Try it now in LugemiCreative</h2>
          <p>Next-model language intelligence — translate, speech, and agents on one foundation.</p>
        </div>
        <div className="lg-creative-promo-actions" style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/baobab" className="primary">
            Try it
          </Link>
          <Link href="/models" className="ghost">
            Learn more
          </Link>
        </div>
      </aside>
    </CreativeShell>
  );
}
