'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { apiFetch } from '@/lib/api';
import { SITE_CONTENT } from '@/data/site-content';

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
    const set = new Set<string>();
    for (const v of voices) for (const lang of v.languages ?? []) set.add(lang);
    return [...set].sort();
  }, [voices]);

  const accents = useMemo(() => {
    const set = new Set<string>();
    for (const v of voices) if (v.accent) set.add(v.accent);
    return [...set].sort();
  }, [voices]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const v of voices) if (v.country) set.add(v.country);
    return [...set].sort();
  }, [voices]);

  const filtered = useMemo(() => {
    return voices.filter((v) => {
      if (preferOwn && v.category && v.category !== 'own' && !v.id.startsWith('own:')) return false;
      if (value.gender && value.gender !== 'any' && v.gender !== value.gender) return false;
      if (value.language && value.language !== 'any' && !(v.languages ?? []).includes(value.language))
        return false;
      if (value.accent && value.accent !== 'any' && v.accent !== value.accent) return false;
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
  }, [voices, value, preferOwn]);

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
          <select
            value={value.language}
            onChange={(e) => patch({ language: e.target.value })}
            style={input}
          >
            <option value="any">Any</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
        <label style={field}>
          <span style={label}>Country</span>
          <select
            value={value.country}
            onChange={(e) => patch({ country: e.target.value })}
            style={input}
          >
            <option value="any">Any</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label style={field}>
          <span style={label}>Accent / region</span>
          <select
            value={value.accent}
            onChange={(e) => patch({ accent: e.target.value })}
            style={input}
          >
            <option value="any">Any</option>
            {accents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
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
        <select
          value={value.voiceId}
          onChange={(e) => patch({ voiceId: e.target.value })}
          style={input}
        >
          {filtered.length === 0 ? <option value="">No voices match filters</option> : null}
          {filtered.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · {v.gender}
              {v.accent ? ` · ${v.accent}` : ''}
              {v.country ? ` · ${v.country}` : ''}
            </option>
          ))}
        </select>
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
