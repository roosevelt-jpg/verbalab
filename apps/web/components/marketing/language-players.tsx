type LanguageCard = {
  code: string;
  native: string;
  en: string;
  lang?: string;
  dir?: 'rtl';
};

const LANGUAGES: LanguageCard[] = [
  { code: 'sw', native: 'Kiswahili', en: 'Swahili' },
  { code: 'yo', native: 'Yorùbá', en: 'Yoruba' },
  { code: 'ha', native: 'Hausa', en: 'Hausa' },
  { code: 'am', native: 'አማርኛ', en: 'Amharic', lang: 'am' },
  { code: 'zu', native: 'isiZulu', en: 'Zulu' },
  { code: 'ar', native: 'العربية', en: 'Arabic', lang: 'ar', dir: 'rtl' },
  { code: 'es', native: 'Español', en: 'Spanish' },
  { code: 'pt', native: 'Português', en: 'Portuguese' },
  { code: 'id', native: 'Bahasa Indonesia', en: 'Indonesian' },
  { code: 'hi', native: 'हिन्दी', en: 'Hindi', lang: 'hi' },
  { code: 'fr', native: 'Français', en: 'French' },
  { code: 'de', native: 'Deutsch', en: 'German' },
];

export function LanguagePlayers() {
  return (
    <section className="mkt-players" aria-labelledby="mkt-players-heading">
      <div className="mkt-wrap">
        <p className="mkt-kicker" id="mkt-players-heading">
          Language samples
        </p>
        <p className="mkt-lede" style={{ marginTop: 0, marginBottom: 24 }}>
          Seed-registry languages spanning Africa-first coverage plus Latin America, Southeast Asia, the Middle
          East, and the EU. Playback ships when a generated sample exists — these controls do not autoplay and do
          not pretend to measure audio.
        </p>
        <div className="mkt-player-row">
          {LANGUAGES.map((item) => (
            <article key={item.code} className="mkt-player">
              <div className="mkt-disc" aria-hidden="true" />
              <div className="mkt-player-meta">
                <div className="mkt-player-name" lang={item.lang} dir={item.dir}>
                  {item.native}
                </div>
                <div className="mkt-player-en">{item.en}</div>
              </div>
              <button
                type="button"
                className="mkt-play"
                disabled
                aria-label={`${item.en} sample coming`}
              >
                Sample coming
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
