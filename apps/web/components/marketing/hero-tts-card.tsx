'use client';

import { useState } from 'react';

const VOICES = [
  { id: 'abe', label: 'Abe · Lagos' },
  { id: 'amara', label: 'Amara · Nairobi' },
  { id: 'thandi', label: 'Thandi · Johannesburg' },
  { id: 'kwame', label: 'Kwame · Accra' },
] as const;

const DEFAULT_TEXT =
  'Lugemi voices carry creative work, customer conversations, and public speech with literacy and presence across African languages.';

export function HeroTtsCard() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [voice, setVoice] = useState<(typeof VOICES)[number]['id']>('abe');
  const [status, setStatus] = useState<string | null>(null);

  function onPlay() {
    const selected = VOICES.find((item) => item.id === voice)?.label ?? 'Selected voice';
    setStatus(
      `${selected}: preview audio needs OWN_TTS_URL / console keys. Open Studio to generate speech — this card does not invent audio.`,
    );
  }

  return (
    <div className="mkt-tts-card">
      <div className="mkt-tts-card-head">
        <h2>Text to speech</h2>
        <span className="mkt-tts-badge">Interactive demo</span>
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
          {VOICES.map((item) => (
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
          {status ?? 'No autoplay. Play explains the generation path — it does not invent waveforms or audio levels.'}
        </p>
      </div>
    </div>
  );
}
