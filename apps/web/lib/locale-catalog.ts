/** Shared locale registry types + label helpers for LanguageLocaleSelect / LocaleSelect. */

export type CatalogLanguage = {
  code: string;
  name: string;
  nativeName?: string | null;
  tier?: string;
};

export type CatalogLocalePack = {
  languageCode: string;
  bcp47: string | null;
};

export type CatalogAccent = {
  code: string;
  languageCode: string;
  nameEn: string;
  nameNative?: string | null;
  region?: string | null;
};

export type CatalogDialect = {
  code: string;
  languageCode: string;
  nameEn: string;
  nameNative?: string | null;
  region?: string | null;
};

export type LocaleCatalogOption = {
  value: string;
  label: string;
  group: 'language' | 'locale' | 'dialect' | 'accent';
};

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/** Resolve ISO 3166-1 alpha-2 (or similar) to English region name. */
export function regionDisplayName(regionCode: string | null | undefined): string | null {
  if (!regionCode) return null;
  const code = regionCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return regionCode;
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

function regionFromBcp47(bcp47: string): string | null {
  const parts = bcp47.split(/[-_]/);
  if (parts.length < 2) return null;
  const maybe = parts[1]!;
  return /^[A-Za-z]{2}$/.test(maybe) ? maybe.toUpperCase() : null;
}

/** Language option: `English (en)`, `Swahili (sw)`. */
export function formatLanguageLabel(lang: CatalogLanguage): string {
  return `${lang.name} (${lang.code})`;
}

/**
 * Locale option with region when present: `Twi — Ghana (ak-GH)`.
 * Prefers native name for the display stem when it differs from the English name.
 */
export function formatLocaleLabel(lang: CatalogLanguage | undefined, bcp47: string): string {
  const stem =
    lang?.nativeName && lang.nativeName.trim() && lang.nativeName !== lang.name
      ? lang.nativeName
      : (lang?.name ?? bcp47.split(/[-_]/)[0] ?? bcp47);
  const region = regionDisplayName(regionFromBcp47(bcp47));
  if (region) return `${stem} — ${region} (${bcp47})`;
  return `${stem} (${bcp47})`;
}

/** Dialect / accent option: `Asante Twi — Ghana (ak-gh-asante)`. */
export function formatVariantLabel(row: {
  code: string;
  nameEn: string;
  region?: string | null;
}): string {
  const region = regionDisplayName(row.region);
  if (region) return `${row.nameEn} — ${region} (${row.code})`;
  return `${row.nameEn} (${row.code})`;
}

export function buildLocaleCatalogOptions(input: {
  languages: CatalogLanguage[];
  locales?: CatalogLocalePack[];
  dialects?: CatalogDialect[];
  accents?: CatalogAccent[];
  includeLocaleCodes?: boolean;
  includeDialects?: boolean;
  includeAccents?: boolean;
}): LocaleCatalogOption[] {
  const {
    languages,
    locales = [],
    dialects = [],
    accents = [],
    includeLocaleCodes = true,
    includeDialects = true,
    includeAccents = true,
  } = input;

  const byCode = new Map(languages.map((l) => [l.code, l]));
  const options: LocaleCatalogOption[] = [...languages]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((lang) => ({
      value: lang.code,
      label: formatLanguageLabel(lang),
      group: 'language' as const,
    }));

  if (includeLocaleCodes) {
    for (const pack of [...locales]
      .filter((l) => l.bcp47)
      .sort((a, b) => (a.bcp47 ?? '').localeCompare(b.bcp47 ?? ''))) {
      options.push({
        value: pack.bcp47!,
        label: formatLocaleLabel(byCode.get(pack.languageCode), pack.bcp47!),
        group: 'locale',
      });
    }
  }

  if (includeDialects) {
    for (const d of [...dialects].sort((a, b) => a.nameEn.localeCompare(b.nameEn))) {
      options.push({
        value: d.code,
        label: formatVariantLabel(d),
        group: 'dialect',
      });
    }
  }

  if (includeAccents) {
    for (const a of [...accents].sort((a, b) => a.nameEn.localeCompare(b.nameEn))) {
      options.push({
        value: a.code,
        label: formatVariantLabel(a),
        group: 'accent',
      });
    }
  }

  return options;
}
