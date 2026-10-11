'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import {
  NativeAccentVoicePicker,
  type VoicePickerValue,
} from '@/components/console/native-accent-voice-picker';
import { SITE_CONTENT } from '@/data/site-content';
import { apiFetch } from '@/lib/api';
import {
  CONNECTOR_CATEGORIES,
  PLATFORM_CONNECTORS,
} from '@/lib/connectors-catalog';

const PATHS = [
  {
    id: 'A',
    title: 'Voice agents',
    body: 'Ship speaking agents with native accent, gender, and tone controls. Simulate turns, then graduate to production with the same own:* voices.',
    href: '/voice',
    cta: 'Open Agents',
    secondary: { href: '/chat', label: 'Chat Studio' },
  },
  {
    id: 'B',
    title: 'Video & dubbing voice',
    body: 'Synthesize narration and dubbed lines in Voice Studio, localize scripts, then route through Connectors or MCP/CLI into your video pipeline.',
    href: '/audio',
    cta: 'Open Voice Studio',
    secondary: { href: '/connectors', label: 'Connectors' },
  },
  {
    id: 'C',
    title: 'API keys & playground',
    body: 'Create lg_live_ / lg_test_ keys, exercise speech + translate in Playground, then ship with @lugemi/sdk, Docs, or MCP.',
    href: '/keys',
    cta: 'Manage API keys',
    secondary: { href: '/playground', label: 'Playground' },
  },
] as const;

const VIDEO_CONNECTORS = PLATFORM_CONNECTORS.filter(
  (c) => c.category === 'video' || c.category === 'voice',
).slice(0, 6);

type IdentityPack = {
  id: string;
  nameEn: string;
  languageCode: string;
  country: string;
  countryLabel: string;
  countryFlag: string;
  regionTags: string[];
  identityProfile: string;
  echoVoiceId?: string;
  demoVoiceKey: string | null;
  culturalIdentity?: string;
  speechVariety?: string;
  bcp47?: string;
  samplePhrase: string;
};

type IdentityList = {
  data: IdentityPack[];
  countries: { code: string; label: string; flag: string; packCount: number }[];
  total: number;
  languageCount?: number;
  languageTotal?: number;
  countryCount?: number;
};

type CatalogRow = {
  countryCode: string;
  countryLabel: string;
  countryFlag: string;
  region: string;
  label: string;
  language: string;
  ethnicContext: string;
  voiceId: string;
  packId: string;
  packCount: number;
};

function primaryPackForCountry(packs: IdentityPack[]): IdentityPack {
  const english = packs.find(
    (p) => p.languageCode === 'en' || (p.bcp47 ?? '').toLowerCase().startsWith('en-'),
  );
  return english ?? packs[0]!;
}

function regionForPack(pack: IdentityPack): string {
  const skip = new Set(
    [pack.countryLabel, pack.nameEn, pack.culturalIdentity, 'latam', 'sea', 'mena', 'anglosphere', 'africa', 'europe', 'global']
      .filter(Boolean)
      .map((s) => s!.toLowerCase()),
  );
  for (const tag of pack.regionTags) {
    if (!skip.has(tag.toLowerCase()) && tag.length > 2) return tag;
  }
  return pack.regionTags[1] || pack.regionTags[0] || 'Worldwide';
}

export function BuildersClient() {
  const samples = SITE_CONTENT.sampleVoices;
  const [picker, setPicker] = useState<VoicePickerValue>({
    voiceId: samples[0]?.voiceId ?? 'own:sw-ke-female',
    gender: 'female',
    language: 'sw',
    accent: '',
    country: '',
    toneStyle: 'empathetic',
    emotionProfile: 'customer_support',
  });
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [catalogNote, setCatalogNote] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  useEffect(() => {
    void apiFetch<IdentityList>('/v1/accents/identity')
      .then((res) => {
        const byCountry = new Map<string, IdentityPack[]>();
        for (const pack of res.data) {
          const arr = byCountry.get(pack.country) ?? [];
          arr.push(pack);
          byCountry.set(pack.country, arr);
        }
        const rows: CatalogRow[] = res.countries
          .map((c) => {
            const packs = byCountry.get(c.code) ?? [];
            if (!packs.length) return null;
            const primary = primaryPackForCountry(packs);
            const voiceId =
              primary.echoVoiceId ||
              (primary.demoVoiceKey
                ? primary.demoVoiceKey.startsWith('own:')
                  ? primary.demoVoiceKey
                  : `own:${primary.demoVoiceKey}`
                : 'own:en-us-female');
            return {
              countryCode: c.code,
              countryLabel: c.label,
              countryFlag: c.flag,
              region: regionForPack(primary),
              label: primary.culturalIdentity || primary.nameEn,
              language: primary.bcp47 || primary.languageCode,
              ethnicContext: primary.identityProfile,
              voiceId,
              packId: primary.id,
              packCount: c.packCount,
            } satisfies CatalogRow;
          })
          .filter((r): r is CatalogRow => r != null)
          .sort((a, b) => a.countryLabel.localeCompare(b.countryLabel));
        setCatalog(rows);
        const languageTotal = res.languageTotal ?? res.languageCount;
        setCatalogNote(
          `${rows.length} countries · ${languageTotal ?? '—'} languages · ${res.total} accent identity packs · live from GET /v1/accents/identity`,
        );
      })
      .catch((err: Error) => {
        setCatalogError(err.message);
        setCatalog(
          samples.map((v) => ({
            countryCode: v.id,
            countryLabel: v.region,
            countryFlag: '🌍',
            region: v.region,
            label: v.label,
            language: v.language,
            ethnicContext: v.ethnicContext,
            voiceId: v.voiceId,
            packId: v.id,
            packCount: 1,
          })),
        );
        setCatalogNote('CMS sample fallback — accent identity API unavailable.');
      });
  }, [samples]);

  const regions = useMemo(() => {
    return [...new Set(catalog.map((r) => r.region))].sort((a, b) => a.localeCompare(b));
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.filter((row) => {
      if (regionFilter !== 'all' && row.region !== regionFilter) return false;
      if (!needle) return true;
      return (
        row.countryLabel.toLowerCase().includes(needle) ||
        row.countryCode.toLowerCase().includes(needle) ||
        row.label.toLowerCase().includes(needle) ||
        row.language.toLowerCase().includes(needle) ||
        row.voiceId.toLowerCase().includes(needle) ||
        row.region.toLowerCase().includes(needle)
      );
    });
  }, [catalog, query, regionFilter]);

  return (
    <AppShell>
      <p className="vl-tag" style={{ margin: 0 }}>
        Language Intelligence Infrastructure
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0.55rem 0 0.35rem',
          color: 'var(--brand-navy)',
        }}
      >
        Builders
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '44rem', lineHeight: 1.6 }}>
        Launch AI agents and video products that sound like humans — in native languages, Africa-first.
        Lugemi is the voice layer under your stack: own:* catalog, speech synthesize, translate, connectors,
        MCP/CLI, and metered <code className="vl-code">/v1</code> APIs. Not a thin TTS gadget.
      </p>

      <nav
        aria-label="Builder paths"
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
          marginBottom: '2rem',
        }}
      >
        {PATHS.map((path) => (
          <article key={path.id} className="vl-endpoint-card" style={{ display: 'grid', gap: '0.75rem' }}>
            <p style={pathLabel}>Path {path.id}</p>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--brand-navy)',
              }}
            >
              {path.title}
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
              {path.body}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Link href={path.href} className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
                {path.cta}
              </Link>
              <Link
                href={path.secondary.href}
                className="vl-btn vl-btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                {path.secondary.label}
              </Link>
            </div>
          </article>
        ))}
      </nav>

      <section className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionLabel}>A · Native accent voice picker</h2>
        <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Same control Agents and Voice Studio use — gender, language, country/region accent, and tone/emotion
          over the own:* registry. Selection carries into{' '}
          <Link href="/voice">Agents</Link> for speaking turns.
        </p>
        <NativeAccentVoicePicker value={picker} onChange={setPicker} preferOwn showEmotionTone />
        <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Selected <code className="vl-code">{picker.voiceId}</code>
          {picker.toneStyle ? (
            <>
              {' '}
              · tone <code className="vl-code">{picker.toneStyle}</code>
            </>
          ) : null}
          {picker.emotionProfile ? (
            <>
              {' '}
              · emotion <code className="vl-code">{picker.emotionProfile}</code>
            </>
          ) : null}
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/voice" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            Continue in Agents
          </Link>
        </div>
      </section>

      <section className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionLabel}>Human-sounding native catalog</h2>
        <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Every country pack — one country-identifying Echo voice per country, with cultural English (or local
          L1) metadata. Full accent varieties live under{' '}
          <Link href="/accent-identity">Accent Identity</Link>; live TTS ids also load in the picker above from{' '}
          <code className="vl-code">/v1/tts/voices</code>.
        </p>
        {catalogNote ? (
          <p style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: 'var(--muted)' }}>{catalogNote}</p>
        ) : (
          <p style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Loading country catalog…
          </p>
        )}
        {catalogError ? (
          <p role="alert" style={{ margin: '0 0 0.85rem', color: 'var(--danger, #b42318)', fontSize: '0.85rem' }}>
            {catalogError}
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.65rem',
            marginBottom: '0.85rem',
            alignItems: 'center',
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country, language, voice…"
            aria-label="Search native catalog by country"
            style={{
              flex: '1 1 14rem',
              minWidth: '12rem',
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #e5e2da)',
              background: 'var(--surface, #fff)',
              color: 'var(--text)',
            }}
          />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            aria-label="Filter catalog by region"
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #e5e2da)',
              background: 'var(--surface, #fff)',
              color: 'var(--text)',
            }}
          >
            <option value="all">All regions ({catalog.length})</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {filteredCatalog.length} countr{filteredCatalog.length === 1 ? 'y' : 'ies'}
          </span>
        </div>

        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: '0.65rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
            maxHeight: '36rem',
            overflow: 'auto',
          }}
        >
          {filteredCatalog.map((v) => (
            <li
              key={v.countryCode}
              style={{
                border: '1px solid var(--border, #e5e2da)',
                borderRadius: '0.65rem',
                padding: '0.75rem 0.85rem',
              }}
            >
              <p style={{ margin: 0, fontWeight: 650, color: 'var(--brand-navy)' }}>
                <span aria-hidden="true">{v.countryFlag}</span> {v.countryLabel}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                {v.label}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                {v.language} · {v.region}
                {v.packCount > 1 ? ` · ${v.packCount} packs` : ''}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45 }}>
                {v.ethnicContext}
              </p>
              <code className="vl-code" style={{ display: 'inline-block', marginTop: '0.45rem', fontSize: '0.75rem' }}>
                {v.voiceId}
              </code>
            </li>
          ))}
        </ul>
        {catalog.length > 0 && filteredCatalog.length === 0 ? (
          <p style={{ margin: '0.85rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            No countries match that search.
          </p>
        ) : null}
        <div style={{ marginTop: '1rem' }}>
          <Link href="/accent-identity" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Open Accent Identity
          </Link>
        </div>
      </section>

      <section className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionLabel}>B · Video voice · connectors & MCP</h2>
        <p style={{ margin: '0 0 0.85rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Wire synthesize + translate into video and voice platforms. Prefer documented connectors over brittle
          scrapers. MCP/CLI helpers live on the Developers hub.
        </p>
        <p style={{ margin: '0 0 0.65rem', fontSize: '0.8rem', fontWeight: 650, color: 'var(--muted)' }}>
          {CONNECTOR_CATEGORIES.filter((c) => c.id === 'voice' || c.id === 'video')
            .map((c) => c.label)
            .join(' · ')}
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.45rem' }}>
          {VIDEO_CONNECTORS.map((c) => (
            <li key={c.id} style={{ fontSize: '0.92rem' }}>
              <strong style={{ color: 'var(--brand-navy)' }}>{c.name}</strong>
              <span style={{ color: 'var(--muted)' }}> — {c.blurb}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
          <Link href="/audio" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            Voice Studio
          </Link>
          <Link href="/connectors" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Connectors
          </Link>
          <Link href="/developers" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            MCP · CLI · SDK
          </Link>
        </div>
      </section>

      <section className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionLabel}>C · Keys, playground, docs</h2>
        <p style={{ margin: '0 0 1rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Soft <code className="vl-code">lg_test_</code> keys share this cluster for pilots;{' '}
          <code className="vl-code">lg_live_</code> for production. Same contracts as marketing demos and Agent
          simulate.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link href="/keys" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            API keys
          </Link>
          <Link href="/playground" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Playground
          </Link>
          <Link href="/docs" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Docs
          </Link>
          <Link href="/developers" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Developers
          </Link>
          <Link href="/p/builders" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
            Marketing · Builders
          </Link>
        </div>
      </section>

      <section className="vl-player-bar">
        <Link href="/voice" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
          Agents
        </Link>
        <Link href="/audio" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
          Voice Studio
        </Link>
        <Link href="/chat" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
          Chat Studio
        </Link>
        <Link href="/p/infrastructure" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
          Infrastructure
        </Link>
      </section>
    </AppShell>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.55rem',
  fontWeight: 700,
};

const pathLabel: React.CSSProperties = {
  ...sectionLabel,
  margin: 0,
};
