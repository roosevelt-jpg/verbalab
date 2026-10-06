const LANGUAGES = [
  'Yoruba',
  'Swahili',
  'Zulu',
  'Amharic',
  'Hausa',
  'Igbo',
  'Twi',
  'Wolof',
  'Afrikaans',
  'Arabic',
  'French',
  'Portuguese',
] as const;

export function LanguageBar() {
  return (
    <section className="mkt-lang-bar" aria-label="Featured languages">
      <div className="mkt-wrap">
        <ul className="mkt-lang-list">
          {LANGUAGES.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
