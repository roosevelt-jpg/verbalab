'use client';

import { useMemo } from 'react';
import {
  buildLocaleCatalogOptions,
  type CatalogAccent,
  type CatalogDialect,
  type CatalogLanguage,
  type CatalogLocalePack,
} from '@/lib/locale-catalog';
import { SearchableCombobox, type ComboboxOption } from '@/components/searchable-combobox';

type Props = {
  value: string;
  onChange: (code: string) => void;
  languages: CatalogLanguage[];
  locales?: CatalogLocalePack[];
  dialects?: CatalogDialect[];
  accents?: CatalogAccent[];
  allowAuto?: boolean;
  /** Empty first option (optional fields). */
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  /** When true, also list BCP-47 locale codes (e.g. ak-GH). Default true. */
  includeLocaleCodes?: boolean;
  /** When true, list every dialect in the registry. Default true for shared catalog sync. */
  includeDialects?: boolean;
  /** When true, list every accent in the registry. Default true for shared catalog sync. */
  includeAccents?: boolean;
};

const GROUP_LABEL: Record<string, string> = {
  language: 'Languages',
  locale: 'Locales (BCP-47)',
  dialect: 'Dialects',
  accent: 'Accents',
};

/**
 * Shared locale combobox fed by the language engine registry.
 * Type-to-filter + keyboard nav. Labels: `English (en)`, `Twi — Ghana (ak-GH)`.
 */
export function LanguageLocaleSelect({
  value,
  onChange,
  languages,
  locales = [],
  dialects = [],
  accents = [],
  allowAuto,
  allowEmpty,
  emptyLabel = '—',
  className,
  id,
  disabled,
  includeLocaleCodes = true,
  includeDialects = true,
  includeAccents = true,
}: Props) {
  const options = useMemo(() => {
    const built = buildLocaleCatalogOptions({
      languages,
      locales,
      dialects,
      accents,
      includeLocaleCodes,
      includeDialects,
      includeAccents,
    });
    const extras: ComboboxOption[] = [];
    if (allowEmpty) {
      extras.push({ value: '', label: emptyLabel, group: 'Special', keywords: 'empty none off' });
    }
    if (allowAuto) {
      extras.push({
        value: 'auto',
        label: 'Auto-detect',
        group: 'Special',
        keywords: 'auto detect',
      });
    }
    const mapped: ComboboxOption[] = built.map((o) => ({
      value: o.value,
      label: o.label,
      group: GROUP_LABEL[o.group] ?? o.group,
      keywords: o.value,
    }));
    if (
      value &&
      value !== 'auto' &&
      !extras.some((e) => e.value === value) &&
      !mapped.some((o) => o.value === value)
    ) {
      extras.push({
        value,
        label: `${value} (custom)`,
        group: 'Special',
        keywords: value,
      });
    }
    return [...extras, ...mapped];
  }, [
    languages,
    locales,
    dialects,
    accents,
    includeLocaleCodes,
    includeDialects,
    includeAccents,
    allowEmpty,
    allowAuto,
    emptyLabel,
    value,
  ]);

  return (
    <SearchableCombobox
      id={id}
      className={className}
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled || languages.length === 0}
      placeholder={languages.length === 0 ? 'Loading languages…' : 'Search language, locale, dialect…'}
      emptyLabel={languages.length === 0 ? 'Loading languages…' : emptyLabel}
      aria-label="Language or locale"
    />
  );
}

/** Alias preferred in product copy — same shared registry-backed control. */
export const LocaleSelect = LanguageLocaleSelect;
