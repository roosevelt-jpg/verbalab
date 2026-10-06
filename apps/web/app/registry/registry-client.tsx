'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Overview = {
  product: string;
  note: string;
  counts: Record<string, number>;
};

type Family = { code: string; nameEn: string; notes: string | null };
type Script = { code: string; nameEn: string; kind: string; rtl: boolean; sampleChars: string | null };
type Rule = {
  code: string;
  kind: string;
  languageCode: string | null;
  nameEn: string;
  description: string;
};
type Language = {
  code: string;
  name: string;
  script: string | null;
  familyCode: string | null;
  familyName: string | null;
  tier: string;
  rtl: boolean;
};
type Analytics = {
  languagesByTier: Array<{ tier: string; count: number }>;
  languagesByFamily: Array<{ familyCode: string | null; count: number }>;
  rulesByKind: Array<{ kind: string; count: number }>;
};
type Health = { status: string; issues: string[]; checkedAt: string };
type ValidateResult = { valid: boolean; errors: string[] };

export function RegistryClient() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [validateCode, setValidateCode] = useState('sw');
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [tab, setTab] = useState<'languages' | 'families' | 'scripts' | 'rules'>('languages');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [ov, langs, fam, scr, rul, an, hp] = await Promise.all([
      apiFetch<Overview>('/v1/registry'),
      apiFetch<{ data: Language[] }>('/v1/languages'),
      apiFetch<{ data: Family[] }>('/v1/registry/families'),
      apiFetch<{ data: Script[] }>('/v1/registry/scripts'),
      apiFetch<{ data: Rule[] }>('/v1/registry/rules'),
      apiFetch<Analytics>('/v1/registry/analytics'),
      apiFetch<Health>('/v1/registry/health'),
    ]);
    setOverview(ov);
    setLanguages(langs.data);
    setFamilies(fam.data);
    setScripts(scr.data);
    setRules(rul.data);
    setAnalytics(an);
    setHealth(hp);
  }, []);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function runValidate() {
    setError(null);
    try {
      setValidateResult(
        await apiFetch<ValidateResult>('/v1/registry/validate', {
          method: 'POST',
          body: JSON.stringify({ language: validateCode.trim() }),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validate failed');
    }
  }

  const counts = overview?.counts;

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
        Language Registry
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        {overview?.note ??
          'Enterprise catalog of registered languages, families, writing systems, locales, and linguistic rules.'}
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {counts ? (
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))', gap: '0.75rem', margin: '0 0 1.75rem' }}>
          {[
            ['Languages', counts.languages],
            ['Families', counts.families],
            ['Scripts', counts.scripts],
            ['Alphabets', counts.alphabets],
            ['Dialects', counts.dialects],
            ['Locales', counts.locales],
            ['Rules', counts.linguisticRules],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.4rem' }}>
              <dt style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{label}</dt>
              <dd style={{ margin: 0, fontSize: '1.35rem', fontWeight: 650 }}>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {health ? (
        <p style={{ margin: '0 0 1.25rem', color: health.status === 'ok' ? 'var(--muted)' : '#b42318' }}>
          Monitoring: <strong>{health.status}</strong>
          {health.issues.length ? ` · ${health.issues.join('; ')}` : ' · integrity checks passed'}
        </p>
      ) : null}

      {analytics ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={h2}>Analytics</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
            Tier: {analytics.languagesByTier.map((t) => `${t.tier}=${t.count}`).join(' · ')}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
            Rules: {analytics.rulesByKind.map((t) => `${t.kind}=${t.count}`).join(' · ')}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
            Families: {analytics.languagesByFamily.map((t) => `${t.familyCode ?? 'none'}=${t.count}`).join(' · ')}
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={h2}>Validation</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <label className="vl-label" style={{ display: 'grid' }}>
            Language code
            <input
              className="vl-field"
              value={validateCode}
              onChange={(e) => setValidateCode(e.target.value)}
              style={{ minWidth: '8rem' }}
            />
          </label>
          <button type="button" className="vl-button" onClick={() => void runValidate()}>
            Validate
          </button>
        </div>
        {validateResult ? (
          <p style={{ marginTop: '0.5rem', color: validateResult.valid ? 'var(--muted)' : '#b42318' }}>
            {validateResult.valid ? 'Valid in registry' : validateResult.errors.join('; ')}
          </p>
        ) : null}
      </section>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {(['languages', 'families', 'scripts', 'rules'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 0,
              borderBottom: tab === t ? '2px solid var(--fg)' : '2px solid transparent',
              padding: '0.25rem 0',
              cursor: 'pointer',
              font: 'inherit',
              color: 'inherit',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'languages' ? (
        <ul style={list}>
          {languages.map((l) => (
            <li key={l.code} style={row}>
              <strong>{l.code}</strong> · {l.name}
              <span style={meta}>
                {l.familyName ?? l.familyCode ?? '—'} · {l.script ?? '—'} · {l.tier}
                {l.rtl ? ' · RTL' : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'families' ? (
        <ul style={list}>
          {families.map((f) => (
            <li key={f.code} style={row}>
              <strong>{f.code}</strong> · {f.nameEn}
              {f.notes ? <span style={meta}>{f.notes}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'scripts' ? (
        <ul style={list}>
          {scripts.map((s) => (
            <li key={s.code} style={row}>
              <strong>{s.code}</strong> · {s.nameEn} · {s.kind}
              {s.rtl ? ' · RTL' : ''}
              {s.sampleChars ? <span style={meta}>{s.sampleChars}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'rules' ? (
        <ul style={list}>
          {rules.map((r) => (
            <li key={r.code} style={row}>
              <strong>{r.code}</strong> · {r.kind}
              {r.languageCode ? ` · ${r.languageCode}` : ''} · {r.nameEn}
              <span style={meta}>{r.description}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </AppShell>
  );
}

const h2: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  fontWeight: 650,
  margin: '0 0 0.5rem',
};

const list: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gap: '0.55rem',
};

const row: CSSProperties = {
  borderTop: '1px solid var(--line)',
  paddingTop: '0.55rem',
};

const meta: CSSProperties = {
  display: 'block',
  color: 'var(--muted)',
  fontSize: '0.9rem',
  marginTop: '0.2rem',
};
