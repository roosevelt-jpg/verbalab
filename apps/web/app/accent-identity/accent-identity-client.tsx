'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { playDemoSpeech, stopDemoSpeech } from '@/lib/demo-speech';

type IdentityPack = {
  id: string;
  nameEn: string;
  languageCode: string;
  country: string;
  countryLabel: string;
  countryFlag: string;
  regionTags: string[];
  identityProfile: string;
  pronunciationMarkers: string[];
  samplePhrase: string;
  echoVoiceId?: string;
  echoModelDisplayName: string | null;
  demoVoiceKey: string | null;
  bcp47?: string;
  culturalIdentity?: string;
  cultural_identity?: string;
  speechVariety?: string;
  speech_variety?: string;
  lifestyleTags?: string[];
  lifestyle_tags?: string[];
};

type IdentityList = {
  data: IdentityPack[];
  count: number;
  total: number;
  countries: { code: string; label: string; flag: string; packCount: number }[];
  note: string;
  product: string;
};

const REGION_COLORS: Record<string, string> = {
  GH: '#006B3F',
  NG: '#008751',
  PH: '#0038A8',
  ZA: '#007A4D',
  KE: '#BB0000',
  SN: '#00853F',
  EG: '#CE1126',
  ET: '#078930',
  TH: '#A51931',
  VN: '#DA251D',
  MY: '#010066',
  ID: '#FF0000',
  SA: '#006C35',
  LB: '#EE161F',
  GB: '#012169',
  US: '#3C3B6E',
  MX: '#006847',
  BR: '#009C3B',
  HT: '#00209F',
  TZ: '#1EB53A',
  CI: '#F77F00',
  CM: '#007A5E',
  RW: '#00A1DE',
  AO: '#CC092F',
};

export function AccentIdentityClient() {
  const [catalog, setCatalog] = useState<IdentityList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<IdentityList>('/v1/accents/identity')
      .then(setCatalog)
      .catch((err: Error) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    const list = catalog?.data ?? [];
    const needle = query.trim().toLowerCase();
    return list.filter((p) => {
      if (country !== 'all' && p.country !== country) return false;
      if (!needle) return true;
      return (
        p.nameEn.toLowerCase().includes(needle) ||
        p.identityProfile.toLowerCase().includes(needle) ||
        p.regionTags.some((t) => t.toLowerCase().includes(needle)) ||
        p.pronunciationMarkers.some((m) => m.toLowerCase().includes(needle))
      );
    });
  }, [catalog?.data, country, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, IdentityPack[]>();
    for (const pack of filtered) {
      const key = pack.countryLabel;
      const arr = map.get(key) ?? [];
      arr.push(pack);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const stopPlayback = useCallback(() => {
    stopDemoSpeech();
    setActiveId(null);
    setLoadingId(null);
  }, []);

  const playPack = useCallback(
    async (pack: IdentityPack) => {
      if (activeId === pack.id) {
        stopPlayback();
        return;
      }
      stopDemoSpeech();
      setLoadingId(pack.id);
      setActiveId(null);
      try {
        await playDemoSpeech({
          text: pack.samplePhrase,
          voiceId: pack.demoVoiceKey ?? undefined,
          lang: pack.bcp47 ?? pack.languageCode,
          label: pack.nameEn,
          onStarted: () => {
            setLoadingId(null);
            setActiveId(pack.id);
          },
        });
        setLoadingId(null);
        setActiveId(pack.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Playback failed');
        setLoadingId(null);
        setActiveId(null);
      }
    },
    [activeId, stopPlayback],
  );

  useEffect(() => () => stopDemoSpeech(), []);

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Accent Identity
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem', maxWidth: '44rem' }}>
        Hear how tribe, culture, and lifestyle shape speech. Each pack exposes{' '}
        <code>cultural_identity</code>, <code>speech_variety</code> (e.g. ghanaian_english,
        nigerian_pidgin, filipino_english), and lifestyle tags — linked to Lugemi Echo Voice. Search by
        country, culture, or variety, then press Play to demo.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.65rem',
          marginBottom: '1rem',
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          placeholder="Search accents, tribes, regions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search accent identity packs"
          style={{
            flex: '1 1 14rem',
            minWidth: '12rem',
            padding: '0.55rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label="Filter by country"
          style={{
            padding: '0.55rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        >
          <option value="all">All countries ({catalog?.total ?? '…'})</option>
          {(catalog?.countries ?? []).map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.label} ({c.packCount})
            </option>
          ))}
        </select>
        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          {filtered.length} pack{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {error ? (
        <p role="alert" style={{ color: 'var(--danger, #c0392b)', marginBottom: '1rem' }}>
          {error}
        </p>
      ) : null}

      {!catalog && !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading accent identity catalog…</p>
      ) : null}

      {grouped.map(([countryLabel, packs]) => (
        <section key={countryLabel} style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 650,
              margin: '0 0 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span aria-hidden="true">{packs[0]?.countryFlag}</span>
            {countryLabel}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 20rem), 1fr))',
              gap: '0.85rem',
            }}
          >
            {packs.map((pack) => {
              const accentColor = REGION_COLORS[pack.country] ?? 'var(--accent, #c45c26)';
              const isActive = activeId === pack.id;
              const isLoading = loadingId === pack.id;
              return (
                <article
                  key={pack.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1rem',
                    background: 'var(--surface)',
                    borderTop: `3px solid ${accentColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: 650,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {pack.culturalIdentity || pack.cultural_identity || pack.nameEn}
                      </h3>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                        <code>{pack.speechVariety || pack.speech_variety || pack.id}</code>
                        {pack.echoModelDisplayName ? ` · ${pack.echoModelDisplayName}` : ''}
                      </p>
                    </div>
                    <DemoPlayStopButton
                      active={isActive}
                      loading={isLoading}
                      onPlay={() => void playPack(pack)}
                      onStop={stopPlayback}
                      label="Play"
                      stopLabel="Stop"
                      ariaLabel={`${isActive ? 'Stop' : 'Play'} ${pack.nameEn} demo`}
                      variant="chip"
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(pack.lifestyleTags || pack.lifestyle_tags || []).slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          background: `${accentColor}18`,
                          color: accentColor,
                          border: `1px solid ${accentColor}44`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {pack.regionTags.slice(0, 2).map((tag) => (
                      <span
                        key={`r-${tag}`}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          background: 'var(--bg, rgba(0,0,0,0.04))',
                          color: 'var(--muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.45, color: 'var(--text)' }}>
                    {pack.identityProfile}
                  </p>

                  <div>
                    <p
                      style={{
                        margin: '0 0 0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Pronunciation markers
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>
                      {pack.pronunciationMarkers.join(' · ')}
                    </p>
                  </div>

                  <blockquote
                    style={{
                      margin: 0,
                      padding: '0.65rem 0.75rem',
                      borderLeft: `3px solid ${accentColor}`,
                      background: 'var(--bg, rgba(0,0,0,0.03))',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '0.9rem',
                      fontStyle: 'italic',
                      lineHeight: 1.45,
                    }}
                  >
                    {pack.samplePhrase}
                  </blockquote>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {catalog ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
          {catalog.note} API:{' '}
          <code style={{ fontSize: '0.8rem' }}>GET /v1/accents/identity</code> · TTS:{' '}
          <code style={{ fontSize: '0.8rem' }}>POST /v1/tts/synthesize</code> with{' '}
          <code style={{ fontSize: '0.8rem' }}>accentId</code>,{' '}
          <code style={{ fontSize: '0.8rem' }}>speechVariety</code>, or{' '}
          <code style={{ fontSize: '0.8rem' }}>locale</code>.
        </p>
      ) : null}
    </AppShell>
  );
}
