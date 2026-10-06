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
  { code: 'ig', native: 'Igbo', en: 'Igbo' },
  { code: 'ak', native: 'Twi', en: 'Akan' },
  { code: 'wo', native: 'Wolof', en: 'Wolof' },
  { code: 'lg', native: 'Luganda', en: 'Luganda' },
  { code: 'om', native: 'Afaan Oromoo', en: 'Oromo' },
  { code: 'ar', native: 'العربية', en: 'Arabic', lang: 'ar', dir: 'rtl' },
  { code: 'fr', native: 'Français', en: 'French' },
];

export function LanguagePlayers() {
  return (
    <section className="mkt-players" aria-labelledby="mkt-players-heading">
      <div className="mkt-wrap">
        <p className="mkt-kicker" id="mkt-players-heading">
          Language samples
        </p>
        <p className="mkt-lede" style={{ marginTop: 0, marginBottom: 24 }}>
          Africa-first samples spanning the Lugemi catalog — languages and dialects across African countries and
          ethnic communities, plus global-scope languages. Playback ships when a generated sample exists; these
          controls do not autoplay.
        </p>
        <div className="mkt-player-row">
          {LANGUAGES.map((item) => (
            <article key={item.code} className="mkt-player">
              <div className="mkt-player-top">
                <div className="mkt-disc" aria-hidden="true" />
                <button
                  type="button"
                  className="mkt-play"
                  disabled
                  aria-label={`${item.en} sample coming`}
                >
                  Sample coming
                </button>
              </div>
              <div className="mkt-player-meta">
                <div className="mkt-player-name" lang={item.lang} dir={item.dir}>
                  {item.native}
                </div>
                <div className="mkt-player-en">{item.en}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
