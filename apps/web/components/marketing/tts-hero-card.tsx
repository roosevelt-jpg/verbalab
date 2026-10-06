const VOICES = [
  { name: 'Aki', language: 'Luganda', place: 'Uganda' },
  { name: 'Akosua', language: 'Akan (Twi)', place: 'Ghana' },
  { name: 'Amara', language: 'Igbo', place: 'Nigeria' },
  { name: 'Zuri', language: 'Swahili', place: 'Kenya' },
  { name: 'Thabo', language: 'Zulu', place: 'South Africa' },
  { name: 'Hana', language: 'Amharic', place: 'Ethiopia' },
] as const;

/** Illustrative TTS card for the marketing hero — not a live synthesis session. */
export function TtsHeroCard {
  return (
    <aside className="mkt-tts-card" aria-label="Text-to-speech preview">
      <div className="mkt-tts-card-head">
        <h2>Text to speech</h2>
        <span className="mkt-tts-badge">Preview</span>
      </div>
      <label className="mkt-tts-label" htmlFor="mkt-tts-text">
        Text
      </label>
      <textarea
        id="mkt-tts-text"
        className="mkt-tts-textarea"
        readOnly
        rows={3}
        defaultValue="Habari, karibu Lugemi. Tunazungumza lugha za Afrika kote."
      />
      <p className="mkt-tts-hint">Illustrative Studio layout — generate live audio after you open Speech.</p>
      <div className="mkt-tts-voices">
        <div className="mkt-voice-chips" role="list">
          {VOICES.map((voice) => (
            <button key={voice.name} type="button" className="mkt-voice-chip" role="listitem" disabled>
              {voice.name} — {voice.language} ({voice.place})
            </button>
          ))}
        </div>
      </div>
      <div className="mkt-tts-actions">
        <a href="/speech" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
          Open Speech
        </a>
      </div>
    </aside>
  );
}
