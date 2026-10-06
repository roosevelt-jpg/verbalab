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
};

function labelFor(lang: Language, locales: LocalePack[]) {
  const pack = locales.find((l) => l.languageCode === lang.code);
  const native = lang.nativeName && lang.nativeName !== lang.name ? ` · ${lang.nativeName}` : '';
  const locale = pack?.bcp47 ? ` / ${pack.bcp47}` : '';
  return `${lang.name}${native} (${lang.code}${locale})`;
}

/** Locale-aware language dropdown — every language code plus BCP-47 when seeded. */
export function LanguageLocaleSelect({
  value,
  onChange,
  languages,
  locales = [],
  allowAuto,
  className,
  id,
  disabled,
}: Props) {
  const sorted = [...languages].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <select
      id={id}
      className={className}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowAuto ? <option value="auto">Auto-detect</option> : null}
      {sorted.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {labelFor(lang, locales)}
        </option>
      ))}
    </select>
  );
}
