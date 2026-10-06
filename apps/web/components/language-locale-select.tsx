'use client';

type Language = { code: string; name: string; nativeName?: string | null; tier?: string };
type LocalePack = { languageCode: string; bcp47: string | null };

type Props = {
  value: string;
  onChange: (code: string) => void;
  languages: Language[];
  locales?: LocalePack[];
  allowAuto?: boolean;
  className?: string;
  id?: string;
  disabled?: boolean;
  /** When true, also list BCP-47 locale codes as selectable values (e.g. ak-GH). */
  includeLocaleCodes?: boolean;
};

type Option = { value: string; label: string; group: 'language' | 'locale' };

function buildOptions(languages: Language[], locales: LocalePack[], includeLocaleCodes: boolean): Option[] {
  const byCode = new Map(languages.map((l) => [l.code, l]));
  const sortedLangs = [...languages].sort((a, b) => a.name.localeCompare(b.name));

  const languageOptions: Option[] = sortedLangs.map((lang) => {
    const pack = locales.find((l) => l.languageCode === lang.code);
    const native = lang.nativeName && lang.nativeName !== lang.name ? ` · ${lang.nativeName}` : '';
    const localeHint = pack?.bcp47 ? ` · default ${pack.bcp47}` : '';
    return {
      value: lang.code,
      label: `${lang.name}${native} (${lang.code})${localeHint}`,
      group: 'language',
    };
  });

  if (!includeLocaleCodes) return languageOptions;

  const localeOptions: Option[] = [...locales]
    .filter((l) => l.bcp47)
    .sort((a, b) => (a.bcp47 ?? '').localeCompare(b.bcp47 ?? ''))
    .map((pack) => {
      const lang = byCode.get(pack.languageCode);
      const name = lang?.name ?? pack.languageCode;
      const native =
        lang?.nativeName && lang.nativeName !== lang.name ? ` · ${lang.nativeName}` : '';
      return {
        value: pack.bcp47!,
        label: `${name}${native} — ${pack.bcp47}`,
        group: 'locale',
      };
    });

  return [...languageOptions, ...localeOptions];
}

/** Locale-aware language dropdown — every language code plus optional BCP-47 locale codes. */
export function LanguageLocaleSelect({
  value,
  onChange,
  languages,
  locales = [],
  allowAuto,
  className,
  id,
  disabled,
  includeLocaleCodes = true,
}: Props) {
  const options = buildOptions(languages, locales, includeLocaleCodes);
  const hasValue =
    value === 'auto' || options.some((o) => o.value === value) || languages.some((l) => l.code === value);

  return (
    <select
      id={id}
      className={className}
      value={hasValue ? value : value || ''}
      disabled={disabled || languages.length === 0}
      onChange={(e) => onChange(e.target.value)}
    >
      {languages.length === 0 ? <option value="">Loading languages…</option> : null}
      {allowAuto ? <option value="auto">Auto-detect</option> : null}
      {!hasValue && value ? <option value={value}>{value} (custom)</option> : null}
      {includeLocaleCodes ? (
        <>
          <optgroup label="Languages">
            {options
              .filter((o) => o.group === 'language')
              .map((o) => (
                <option key={`lang-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))}
          </optgroup>
          <optgroup label="Locales (BCP-47)">
            {options
              .filter((o) => o.group === 'locale')
              .map((o) => (
                <option key={`loc-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))}
          </optgroup>
        </>
      ) : (
        options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))
      )}
    </select>
  );
}
