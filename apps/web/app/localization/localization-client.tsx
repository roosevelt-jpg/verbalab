'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Platform = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null; notes: string }>;
};

type QaResult = {
  passed: boolean;
  errorCount: number;
  warningCount: number;
  issues: Array<{ code: string; severity: string; key?: string; message: string }>;
};

type IcuResult = {
  valid: boolean;
  placeholders: string[];
  hasPlural: boolean;
  formatted?: string;
};

export function LocalizationClient {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [icuMessage, setIcuMessage] = useState('{count, plural, one {# item} other {# items}}');
  const [icuLocale, setIcuLocale] = useState('en');
  const [icuCount, setIcuCount] = useState('3');
  const [icu, setIcu] = useState<IcuResult | null>(null);
  const [qa, setQa] = useState<QaResult | null>(null);
  const [layoutCode, setLayoutCode] = useState('ar');
  const [layout, setLayout] = useState<{ dir: string; rtl: boolean; script: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    setPlatform(await apiFetch<Platform>('/v1/localization'));
  }, []);

  useEffect( => {
    void load.catch((err: Error) => setError(err.message));
  }, [load]);

  async function runIcu {
    setError(null);
    const validated = await apiFetch<IcuResult>('/v1/icu/validate', {
      method: 'POST',
      body: JSON.stringify({ message: icuMessage }),
    });
    const formatted = await apiFetch<{ formatted: string }>('/v1/icu/format', {
      method: 'POST',
      body: JSON.stringify({
        message: icuMessage,
        locale: icuLocale,
        values: { count: Number(icuCount) },
      }),
    });
    setIcu({ ...validated, formatted: formatted.formatted });
  }

  async function runQa {
    setError(null);
    setQa(
      await apiFetch<QaResult>('/v1/localize/qa', {
        method: 'POST',
        body: JSON.stringify({
          format: 'json',
          sourceContent: { hello: 'Hello', items: '{count, plural, one {# item} other {# items}}' },
          targetContent: { hello: 'Habari', items: '{count, plural, one {# kipengele} other {# vipengele}}' },
          source: 'en',
          target: 'sw',
        }),
      }),
    );
  }

  async function runLayout {
    setError(null);
    setLayout(await apiFetch(`/v1/locales/${encodeURIComponent(layoutCode)}/layout`));
  }

  return (
    <AppShell>
      <h1 style={h1}>Localization</h1>
      <p style={{ color: 'var(--muted)', maxWidth: '44rem', margin: '0 0 1.25rem' }}>
        {platform?.note ?? 'Software-string localization platform.'}{' '}
        <Link href="/localize">Localize files</Link> · <Link href="/locales">Locale packs</Link>
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {platform ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'grid', gap: '0.4rem' }}>
          {platform.capabilities.map((c) => (
            <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.4rem', fontSize: '0.92rem' }}>
              <strong>{c.name}</strong> · {c.status}
              {c.api ? ` · ${c.api}` : ''}
              <span style={{ display: 'block', color: 'var(--muted)' }}>{c.notes}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={h2}>ICU validate / format</h2>
        <label className="vl-label" style={{ display: 'grid', marginBottom: '0.5rem' }}>
          Message
          <input className="vl-field" value={icuMessage} onChange={(e) => setIcuMessage(e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <label className="vl-label">
            Locale
            <input className="vl-field" value={icuLocale} onChange={(e) => setIcuLocale(e.target.value)} />
          </label>
          <label className="vl-label">
            count
            <input className="vl-field" value={icuCount} onChange={(e) => setIcuCount(e.target.value)} />
          </label>
          <button type="button" className="vl-button" onClick={ => void runIcu.catch((e: Error) => setError(e.message))}>
            Run
          </button>
        </div>
        {icu ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            valid={String(icu.valid)} · placeholders={icu.placeholders.join(', ') || '—'} ·{' '}
            {icu.formatted ? `formatted="${icu.formatted}"` : ''}
          </p>
        ) : null}
      </section>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={h2}>Localization QA</h2>
        <button type="button" className="vl-button" onClick={ => void runQa.catch((e: Error) => setError(e.message))}>
          Run sample QA
        </button>
        {qa ? (
          <p style={{ marginTop: '0.5rem', color: qa.passed ? 'var(--muted)' : '#b42318' }}>
            {qa.passed ? 'Passed' : 'Failed'} · {qa.errorCount} errors · {qa.warningCount} warnings
          </p>
        ) : null}
      </section>

      <section>
        <h2 style={h2}>RTL / layout</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
          <label className="vl-label">
            Language
            <input className="vl-field" value={layoutCode} onChange={(e) => setLayoutCode(e.target.value)} />
          </label>
          <button type="button" className="vl-button" onClick={ => void runLayout.catch((e: Error) => setError(e.message))}>
            Lookup
          </button>
        </div>
        {layout ? (
          <p style={{ color: 'var(--muted)' }}>
            dir={layout.dir} · rtl={String(layout.rtl)} · script={layout.script ?? '—'}
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}

const h1: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.85rem',
  fontWeight: 720,
  letterSpacing: '-0.03em',
  margin: '0 0 0.35rem',
};

const h2: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  fontWeight: 650,
  margin: '0 0 0.5rem',
};
