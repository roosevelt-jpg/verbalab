import {
  AFRICA_LANGUAGE_CATALOG,
  AFRICA_REGIONS,
} from '@/data/africa-language-catalog';

const HIGHLIGHT_NAMES = [
  'Yoruba',
  'Swahili',
  'Zulu',
  'Amharic',
  'Hausa',
  'Igbo',
  'Twi',
  'Wolof',
  'Oromo',
  'Luganda',
  'Lingala',
  'Afrikaans',
  'Arabic',
  'French',
  'Portuguese',
] as const;

const countryCount = new Set(AFRICA_LANGUAGE_CATALOG.map((e) => e.countryCode)).size;
const languageCount = new Set(AFRICA_LANGUAGE_CATALOG.map((e) => e.code)).size;

export function LanguageBar() {
  return (
    <section className="mkt-lang-bar" aria-label="Featured languages">
      <div className="mkt-wrap">
        <p
          className="mkt-lede"
          style={{ margin: '0 auto 12px', textAlign: 'center', maxWidth: '42rem' }}
        >
          Africa catalog: {countryCount} countries · {languageCount} language entries · {AFRICA_REGIONS.length} regions
          — ethnic varieties and tribes included where curated. LATAM, SEA, Middle East, and EU remain in strategic
          scope.
        </p>
        <ul className="mkt-lang-list">
          {HIGHLIGHT_NAMES.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
