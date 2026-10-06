const HIGHLIGHT_NAMES = [
  'English',
  'French',
  'Swahili',
  'Zulu',
  'Amharic',
  'Oromo',
  'Igbo',
  'Twi',
  'Hausa',
  'Afrikaans',
  'Arabic',
  'Somali',
  'Yoruba',
  'Portuguese',
] as const;

export function LanguageBar() {
  return (
    <section className="mkt-lang-bar" aria-label="Featured languages">
      <div className="mkt-wrap">
        <ul className="mkt-lang-list">
          {HIGHLIGHT_NAMES.map((name) => (
            <li key={name}>{name}</li>
          ))}
          <li aria-hidden="true">+</li>
        </ul>
      </div>
    </section>
  );
}
