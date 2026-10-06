'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type {
  CatalogAccent,
  CatalogDialect,
  CatalogLanguage,
  CatalogLocalePack,
} from '@/lib/locale-catalog';

export type LocaleCatalogState = {
  languages: CatalogLanguage[];
  locales: CatalogLocalePack[];
  dialects: CatalogDialect[];
  accents: CatalogAccent[];
  loading: boolean;
  error: string | null;
};

const empty: LocaleCatalogState = {
  languages: [],
  locales: [],
  dialects: [],
  accents: [],
  loading: true,
  error: null,
};

/** One fetch for the shared language / locale / dialect / accent registry. */
export function useLocaleCatalog(): LocaleCatalogState {
  const [state, setState] = useState<LocaleCatalogState>(empty);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    void Promise.all([
      apiFetch<{ data: CatalogLanguage[] }>('/v1/languages'),
      apiFetch<{ data: CatalogLocalePack[] }>('/v1/locales').catch(() => ({
        data: [] as CatalogLocalePack[],
      })),
      apiFetch<{ data: CatalogDialect[] }>('/v1/dialects').catch(() => ({
        data: [] as CatalogDialect[],
      })),
      apiFetch<{ data: CatalogAccent[] }>('/v1/accents').catch(() => ({
        data: [] as CatalogAccent[],
      })),
    ])
      .then(([langRes, locRes, dialectRes, accentRes]) => {
        if (cancelled) return;
        setState({
          languages: langRes.data ?? [],
          locales: locRes.data ?? [],
          dialects: dialectRes.data ?? [],
          accents: accentRes.data ?? [],
          loading: false,
          error: null,
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load locale catalog',
        }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
