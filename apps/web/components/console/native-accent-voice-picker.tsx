'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { apiFetch } from '@/lib/api';
import { SITE_CONTENT } from '@/data/site-content';
import { formatLanguageLabel, formatVariantLabel, regionDisplayName } from '@/lib/locale-catalog';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';
import { SearchableCombobox } from '@/components/searchable-combobox';

export type AccentVoice = {
  id: string;
  name: string;
  gender: string;
  languages: string[];
  personality?: string;
  accent?: string | null;
  region?: string | null;
  country?: string | null;
  ethnicContext?: string | null;
  toneStyles?: string[];
  category?: string;
  provider?: string;
};

export type VoicePickerValue = {
  voiceId: string;
  gender: string;
  language: string;
  accent: string;
  country: string;
  toneStyle: string;
  emotionProfile: string;
};

type Props = {
  value: VoicePickerValue;
  onChange: (next: VoicePickerValue) => void;
  /** Prefer Africa-first own:* voices when listing. */
  preferOwn?: boolean;
  showEmotionTone?: boolean;
  emotionProfiles?: Array<{ id: string; name: string; category: string }>;
};

const EMOTION_FALLBACK = [
  { id: 'customer_support', name: 'Customer Support', category: 'domain' },
  { id: 'professional', name: 'Professional', category: 'domain' },
  { id: 'calm', name: 'Calm', category: 'emotion' },
  { id: 'empathetic', name: 'Empathetic', category: 'emotion' },
  { id: 'urgent', name: 'Urgent', category: 'emotion' },
  { id: 'happy', name: 'Happy', category: 'emotion' },
  { id: 'sales', name: 'Sales', category: 'domain' },
];

export function NativeAccentVoicePicker({
  value,
  onChange,
  preferOwn = true,
  showEmotionTone = true,
  emotionProfiles,
}: Props) {
  const catalog = useLocaleCatalog();
  const [voices, setVoices] = useState<AccentVoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{ data: AccentVoice[] }>('/v1/tts/voices?category=own')
      .then((res) => {
        if (res.data?.length) {
          setVoices(res.data);
          return;
        }
        return apiFetch<{ data: AccentVoice[] }>('/v1/tts/voices').then((all) =>
          setVoices(all.data ?? []),
        );
      })
      .catch(() => {
        // Soft fallback to CMS sample registry when API is unreachable.
        const samples = SITE_CONTENT.sampleVoices.map((v) => ({
          id: v.voiceId,
          name: v.label,
          gender: v.voiceId.includes('female')
            ? 'female'
            : v.voiceId.includes('male')
              ? 'male'
              : 'neutral',
          languages: [v.language.toLowerCase().slice(0, 2)],
          accent: v.ethnicContext,
          region: v.region,
          country: v.region,
          ethnicContext: v.ethnicContext,
          toneStyles: ['empathetic', 'customer_support'],
          category: 'own',
        }));
        setVoices(samples);
        setError('Using CMS sample voices (TTS catalog unavailable).');
      });
  }, []);

  const languages = useMemo(() => {
    const codes = new Set<string>();
    for (const l of catalog.languages) codes.add(l.code);
    for (const v of voices) for (const lang of v.languages ?? []) codes.add(lang);
    return [...codes].sort((a, b) => a.localeCompare(b));
  }, [voices, catalog.languages]);

  const languageLabel = useMemo(() => {
    const map = new Map(catalog.languages.map((l) => [l.code, formatLanguageLabel(l)]));
    return (code: string) => map.get(code) ?? code;
  }, [catalog.languages]);

  const accents = useMemo(() => {
    const rows = catalog.accents.length ? [...catalog.accents] : [];
    const known = new Set(rows.map((a) => a.code));
    for (const v of voices) {
      if (!v.accent || known.has(v.accent)) continue;
      known.add(v.accent);
      rows.push({
        code: v.accent,
        languageCode: v.languages?.[0] ?? '',
        nameEn: v.accent,
        region: v.country ?? v.region ?? null,
      });
    }
    return rows.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  }, [voices, catalog.accents]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const v of voices) if (v.country) set.add(v.country);
    for (const a of catalog.accents) if (a.region) set.add(a.region);
    for (const d of catalog.dialects) if (d.region) set.add(d.region);
    return [...set].sort();
  }, [voices, catalog.accents, catalog.dialects]);

  const filtered = useMemo(() => {
    return voices.filter((v) => {
      if (preferOwn && v.category && v.category !== 'own' && !v.id.startsWith('own:')) return false;
      if (value.gender && value.gender !== 'any' && v.gender !== value.gender) return false;
      if (value.language && value.language !== 'any' && !(v.languages ?? []).includes(value.language))
        return false;
      if (value.accent && value.accent !== 'any') {
        const accentRow = catalog.accents.find((a) => a.code === value.accent);
        const matches =
          v.accent === value.accent ||
          (accentRow != null &&
            (v.accent === accentRow.nameEn ||
              v.accent === accentRow.code ||
              (v.region != null && accentRow.region != null && v.region === accentRow.region)));
        if (!matches) return false;
      }
      if (value.country && value.country !== 'any' && v.country !== value.country) return false;
      if (
        value.toneStyle &&
        value.toneStyle !== 'any' &&
        v.toneStyles &&
        !v.toneStyles.map((t) => t.toLowerCase()).includes(value.toneStyle.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [voices, value, preferOwn, catalog.accents]);

  useEffect(() => {
    if (!filtered.length) return;
    if (!filtered.some((v) => v.id === value.voiceId)) {
      onChange({ ...value, voiceId: filtered[0]!.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-pick when filter set changes
  }, [filtered.map((v) => v.id).join('|')]);

  const profiles = emotionProfiles?.length ? emotionProfiles : EMOTION_FALLBACK;
  const selected = voices.find((v) => v.id === value.voiceId) ?? filtered[0];

  function patch(partial: Partial<VoicePickerValue>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
        Pick a native-accent <code>own:*</code> voice by language, country/region, ethnic context,
        gender, and delivery tone. Metadata guides selection — not a claim of perfect tribal
        acoustic cloning.
      </p>
      {error ? (
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>{error}</p>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(9.5rem, 1fr))',
          gap: '0.65rem',
        }}
      >
        <label style={field}>
          <span style={label}>Gender</span>
          <select
            value={value.gender}
            onChange={(e) => patch({ gender: e.target.value })}
            style={input}
          >
            <option value="any">Any</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>
        <label style={field}>
          <span style={label}>Language</span>
          <SearchableCombobox
            value={value.language}
            onChange={(language) => patch({ language })}
            options={[
              { value: 'any', label: 'Any', keywords: 'all' },
              ...languages.map((lang) => ({
                value: lang,
                label: languageLabel(lang),
                keywords: lang,
              })),
            ]}
            aria-label="Language"
            placeholder="Search language…"
          />
        </label>
        <label style={field}>
          <span style={label}>Country</span>
          <SearchableCombobox
            value={value.country}
            onChange={(country) => patch({ country })}
            options={[
              { value: 'any', label: 'Any', keywords: 'all' },
              ...countries.map((c) => ({
                value: c,
                label: `${regionDisplayName(c) ?? c} (${c})`,
                keywords: c,
              })),
            ]}
            aria-label="Country"
            placeholder="Search country…"
          />
        </label>
        <label style={field}>
          <span style={label}>Accent / region</span>
          <SearchableCombobox
            value={value.accent}
            onChange={(accent) => patch({ accent })}
            options={[
              { value: 'any', label: 'Any', keywords: 'all' },
              ...accents.map((a) => ({
                value: a.code,
                label: formatVariantLabel(a),
                keywords: `${a.code} ${a.languageCode}`,
              })),
            ]}
            aria-label="Accent"
            placeholder="Search accent…"
          />
        </label>
        {showEmotionTone ? (
          <label style={field}>
            <span style={label}>Tone / emotion style</span>
            <select
              value={value.emotionProfile}
              onChange={(e) =>
                patch({ emotionProfile: e.target.value, toneStyle: e.target.value })
              }
              style={input}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.category}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <label style={field}>
        <span style={label}>Voice</span>
        <SearchableCombobox
          value={value.voiceId}
          onChange={(voiceId) => patch({ voiceId })}
          options={
            filtered.length === 0
              ? [{ value: '', label: 'No voices match filters' }]
              : filtered.map((v) => ({
                  value: v.id,
                  label: `${v.name} · ${v.gender}${v.accent ? ` · ${v.accent}` : ''}${v.country ? ` · ${v.country}` : ''}`,
                  keywords: `${v.id} ${v.name} ${v.accent ?? ''} ${v.country ?? ''}`,
                }))
          }
          aria-label="Voice"
          placeholder="Search voice…"
        />
      </label>

      {selected ? (
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: '0.65rem',
            fontSize: '0.88rem',
            color: 'var(--muted)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--ink)' }}>{selected.name}</strong> · <code>{selected.id}</code>
          {selected.ethnicContext ? (
            <div>Ethnic / community context: {selected.ethnicContext}</div>
          ) : null}
          {selected.region ? <div>Region: {selected.region}</div> : null}
          {selected.toneStyles?.length ? (
            <div>Suggested tones: {selected.toneStyles.join(' · ')}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const field: CSSProperties = { display: 'grid', gap: '0.3rem' };
const label: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--muted)',
};
const input: CSSProperties = {
  padding: '0.5rem 0.65rem',
  border: '1px solid var(--line)',
  borderRadius: '0.4rem',
  fontSize: '0.92rem',
  background: 'var(--bg, #fff)',
  color: 'var(--ink)',
};
