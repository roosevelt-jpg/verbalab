'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { SearchableCombobox, type ComboboxOption } from '@/components/searchable-combobox';

export type CulturalIdentityPack = {
  id: string;
  nameEn: string;
  languageCode: string;
  country: string;
  countryLabel: string;
  countryFlag: string;
  culturalIdentity: string;
  cultural_identity?: string;
  speechVariety: string;
  speech_variety?: string;
  lifestyleTags: string[];
  lifestyle_tags?: string[];
  echoVoiceId?: string;
  bcp47?: string;
  samplePhrase?: string;
};

type IdentityList = {
  data: CulturalIdentityPack[];
  culturalEnglishDefaults?: Record<
    string,
    { accentIdentityId: string; speechVariety: string; echoVoiceId: string }
  >;
};

type Props = {
  value: string;
  onChange: (packId: string, pack: CulturalIdentityPack | null) => void;
  country?: string;
  language?: string;
  speechVariety?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  /** Prefer cultural English varieties (GH/NG/PH/ZA) at the top of the list. */
  preferCulturalEnglish?: boolean;
};

const CULTURAL_ENGLISH_PRIORITY = [
  'gh-ghanaian-english',
  'gh-pidgin',
  'ng-nigerian-english',
  'ng-pidgin',
  'ph-filipino-english',
  'za-south-african-english',
  'ke-english',
];

/**
 * Searchable cultural accent / identity picker.
 * Labels show cultural identity + speech variety — never bare ISO codes alone.
 */
export function CulturalIdentitySelect({
  value,
  onChange,
  country,
  language,
  speechVariety,
  className,
  id,
  disabled,
  allowEmpty,
  emptyLabel = 'No cultural identity',
  preferCulturalEnglish = true,
}: Props) {
  const [packs, setPacks] = useState<CulturalIdentityPack[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (language) params.set('language', language);
    if (speechVariety) params.set('speechVariety', speechVariety);
    const q = params.toString();
    void apiFetch<IdentityList>(`/v1/accents/identity${q ? `?${q}` : ''}`)
      .then((res) => setPacks(res.data ?? []))
      .catch((err: Error) => setError(err.message));
  }, [country, language, speechVariety]);

  const options: ComboboxOption[] = useMemo(() => {
    const sorted = [...packs].sort((a, b) => {
      if (preferCulturalEnglish) {
        const ai = CULTURAL_ENGLISH_PRIORITY.indexOf(a.id);
        const bi = CULTURAL_ENGLISH_PRIORITY.indexOf(b.id);
        if (ai !== -1 || bi !== -1) {
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        }
      }
      return (a.culturalIdentity || a.nameEn).localeCompare(b.culturalIdentity || b.nameEn);
    });

    const rows: ComboboxOption[] = [];
    if (allowEmpty) {
      rows.push({
        value: '',
        label: emptyLabel,
        group: 'Special',
        keywords: 'none empty off',
      });
    }
    for (const p of sorted) {
      const identity = p.culturalIdentity || p.cultural_identity || p.nameEn;
      const variety = p.speechVariety || p.speech_variety || '';
      const tags = (p.lifestyleTags || p.lifestyle_tags || []).slice(0, 3).join(' ');
      rows.push({
        value: p.id,
        label: `${p.countryFlag} ${identity}${variety ? ` · ${variety}` : ''}`,
        group: p.countryLabel || p.country,
        keywords: `${p.nameEn} ${identity} ${variety} ${tags} ${p.bcp47 ?? ''} ${p.languageCode}`,
      });
    }
    return rows;
  }, [packs, allowEmpty, emptyLabel, preferCulturalEnglish]);

  const selected = packs.find((p) => p.id === value) ?? null;

  return (
    <div className={className}>
      <SearchableCombobox
        id={id}
        value={value}
        onChange={(next) => {
          const pack = packs.find((p) => p.id === next) ?? null;
          onChange(next, pack);
        }}
        options={options}
        disabled={disabled}
        placeholder="Search cultural accent / identity…"
      />
      {selected ? (
        <p
          style={{
            margin: '0.35rem 0 0',
            fontSize: '0.75rem',
            color: 'var(--lc-muted)',
            lineHeight: 1.4,
          }}
        >
          {(selected.lifestyleTags || selected.lifestyle_tags || []).slice(0, 4).join(' · ') ||
            selected.speechVariety}
          {selected.echoVoiceId ? ` · ${selected.echoVoiceId}` : ''}
        </p>
      ) : null}
      {error ? (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#b42318' }}>{error}</p>
      ) : null}
    </div>
  );
}
