'use client';

import { useState } from 'react';
import type { CmsHeroDemo } from '@/data/cms-types';

export function HeroTtsCard({ demo }: { demo: CmsHeroDemo }) {
  const [text, setText] = useState(demo.defaultText);
  const [voice, setVoice] = useState(demo.voices[0]?.id ?? '');
  const [status, setStatus] = useState<string | null>(null);

  function onPlay() {
    const selected = demo.voices.find((item) => item.id === voice)?.label ?? 'Selected voice';
    setStatus(
      `${selected}: preview audio needs OWN_TTS_URL / console keys. Open Studio to generate speech — this card does not invent audio.`,
    );
  }

  return (
    <div className="mkt-tts-card">
      <div className="mkt-tts-card-head">
        <h2>{demo.title}</h2>
        <span className="mkt-tts-badge">{demo.badge}</span>
      </div>
      <label className="mkt-tts-label" htmlFor="mkt-tts-text">
        Script
      </label>
      <textarea
        id="mkt-tts-text"
        className="mkt-tts-textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={5}
        spellCheck
      />
      <fieldset className="mkt-tts-voices">
        <legend className="mkt-tts-label">Voice</legend>
        <div className="mkt-voice-chips">
          {demo.voices.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === voice ? 'mkt-voice-chip is-active' : 'mkt-voice-chip'}
              aria-pressed={item.id === voice}
              onClick={() => {
                setVoice(item.id);
                setStatus(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mkt-tts-actions">
        <button type="button" className="vl-btn vl-btn-primary" onClick={onPlay}>
          Play
        </button>
        <p className="mkt-tts-hint" role="status" aria-live="polite">
          {status ?? demo.playHint}
        </p>
      </div>
    </div>
  );
}
