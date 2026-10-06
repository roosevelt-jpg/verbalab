'use client';

import { useState } from 'react';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { SITE_CONTENT } from '@/data/site-content';

const VOICES = SITE_CONTENT.sampleVoices.slice(0, 4);
const DEFAULT_TEXT = SITE_CONTENT.samplePrompts[0]?.text ?? '';

export function HeroTtsCard() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [voice, setVoice] = useState(VOICES[0]?.id ?? 'sw-ke-female');
  const [status, setStatus] = useState<string | null>(null);

  function onPlay() {
    const selected = VOICES.find((item) => item.id === voice);
    setStatus(
      selected
        ? `${selected.label} (${selected.voiceId}): preview audio needs OWN_TTS_URL / console keys. Open Studio to generate speech — this card does not invent audio.`
        : 'Open Studio to generate speech.',
    );
  }

  return (
    <div className="mkt-tts-card">
      <AnamorphicPanel variant="voice" size="sm" label="Voice depth" />
      <div className="mkt-tts-card-head" style={{ marginTop: 12 }}>
        <h2>Speaking agent script</h2>
        <span className="mkt-tts-badge">Prefill demo</span>
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
        <legend className="mkt-tts-label">Sample voice</legend>
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
          {status ??
            'No autoplay. Play explains the OWN_TTS_URL path — it does not invent waveforms or audio levels.'}
        </p>
      </div>
    </div>
  );
}
