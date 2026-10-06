'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  buildIntlCountryOptions,
  formatCountryOptionLabel,
  type StudioCountryOption,
} from '@/lib/studio-countries';

type Props = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  'aria-label'?: string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Full ISO country select for residency / branding / admin.
 * Prefers GET /v1/countries?picker=1; falls back to Intl region names.
 */
export function CountrySelect({
  value,
  onChange,
  disabled,
  allowEmpty = true,
  emptyLabel = 'Select country',
  className = 'vl-field',
  style,
  ...rest
}: Props) {
  const [options, setOptions] = useState<StudioCountryOption[]>(() => buildIntlCountryOptions());

  useEffect(() => {
    let cancelled = false;
    void apiFetch<{ data: StudioCountryOption[] }>('/v1/countries?picker=1')
      .then((res) => {
        if (!cancelled && Array.isArray(res.data) && res.data.length > 0) {
          setOptions(res.data);
        }
      })
      .catch(() => {
        /* keep Intl fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <select
      className={className}
      value={value}
      disabled={disabled}
      aria-label={rest['aria-label'] ?? 'Country'}
      style={style}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {options.map((c) => (
        <option key={c.code} value={c.code}>
          {formatCountryOptionLabel(c)}
          {c.region && c.region !== 'Worldwide' ? ` · ${c.region}` : ''}
        </option>
      ))}
    </select>
  );
}
