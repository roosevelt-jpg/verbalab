'use client';

import { useMemo } from 'react';
import {
  buildLocaleCatalogOptions,
  type CatalogAccent,
  type CatalogDialect,
  type CatalogLanguage,
  type CatalogLocalePack,
} from '@/lib/locale-catalog';

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

/**
 * Shared locale dropdown fed by the language engine registry.
 * Labels: `English (en)`, `Swahili (sw)`, `Twi — Ghana (ak-GH)`.
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
  const options = useMemo(
    () =>
      buildLocaleCatalogOptions({
        languages,
        locales,
        dialects,
        accents,
        includeLocaleCodes,
        includeDialects,
        includeAccents,
      }),
    [languages, locales, dialects, accents, includeLocaleCodes, includeDialects, includeAccents],
  );

  const hasValue =
    value === 'auto' ||
    value === '' ||
    options.some((o) => o.value === value) ||
    languages.some((l) => l.code === value);

  const languageOptions = options.filter((o) => o.group === 'language');
  const localeOptions = options.filter((o) => o.group === 'locale');
  const dialectOptions = options.filter((o) => o.group === 'dialect');
  const accentOptions = options.filter((o) => o.group === 'accent');
  const useGroups =
    includeLocaleCodes || includeDialects || includeAccents;

  return (
    <select
      id={id}
      className={className}
      value={hasValue ? value : value || ''}
      disabled={disabled || languages.length === 0}
      onChange={(e) => onChange(e.target.value)}
    >
      {languages.length === 0 ? <option value="">Loading languages…</option> : null}
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {allowAuto ? <option value="auto">Auto-detect</option> : null}
      {!hasValue && value ? <option value={value}>{value} (custom)</option> : null}
      {useGroups ? (
        <>
          <optgroup label="Languages">
            {languageOptions.map((o) => (
              <option key={`lang-${o.value}`} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
          {includeLocaleCodes && localeOptions.length > 0 ? (
            <optgroup label="Locales (BCP-47)">
              {localeOptions.map((o) => (
                <option key={`loc-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : null}
          {includeDialects && dialectOptions.length > 0 ? (
            <optgroup label="Dialects">
              {dialectOptions.map((o) => (
                <option key={`dia-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : null}
          {includeAccents && accentOptions.length > 0 ? (
            <optgroup label="Accents">
              {accentOptions.map((o) => (
                <option key={`acc-${o.value}`} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : null}
        </>
      ) : (
        languageOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))
      )}
    </select>
  );
}

/** Alias preferred in product copy — same shared registry-backed control. */
export const LocaleSelect = LanguageLocaleSelect;
