'use client';

import { useState } from 'react';
import type { CmsHeroDemo } from '@/data/cms-types';
import { useDemoPlayer } from './use-demo-player';

export function HeroTtsCard({ demo }: { demo: CmsHeroDemo }) {
  const [text, setText] = useState(demo.defaultText);
  const [voice, setVoice] = useState(demo.voices[0]?.id ?? '');
  const { play, stop, playingId, status, error } = useDemoPlayer;
  const selected = demo.voices.find((item) => item.id === voice);

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
              onClick={ => {
                setVoice(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mkt-tts-actions">
        <button
          type="button"
          className="vl-btn vl-btn-primary"
          onClick={ => {
            if (playingId === 'hero-tts') {
              stop;
              return;
            }
            void play({
              id: 'hero-tts',
              text,
              voiceId: voice,
              label: selected?.label,
            });
          }}
        >
          {playingId === 'hero-tts' ? 'Stop' : 'Play'}
        </button>
        <button
          type="button"
          className="vl-btn vl-btn-secondary"
          disabled={!selected}
          onClick={ => {
            void play({
              id: `hero-voice-${voice}`,
              text: text || demo.defaultText,
              voiceId: voice,
              label: selected?.label,
            });
          }}
        >
          Preview voice
        </button>
        <p className="mkt-tts-hint" role="status" aria-live="polite">
          {error ?? status ?? 'Press Play to hear this script in the selected voice.'}
        </p>
      </div>
    </div>
  );
}
