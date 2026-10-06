import { AFRICA_LANGUAGE_TICKER } from '@/data/africa-language-catalog';

export function LanguageTicker() {
  const items = [...AFRICA_LANGUAGE_TICKER, ...AFRICA_LANGUAGE_TICKER];

  return (
    <section className="mkt-ticker" aria-label="African languages across the Lugemi catalog">
      <div className="mkt-ticker-track">
        {items.map((item, index) => (
          <span key={`${item.code}-${index}`} className="mkt-ticker-item">
            <span className="mkt-ticker-native" lang={item.code}>
              {item.nativeName}
            </span>
            <span className="mkt-ticker-en">{item.name}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
