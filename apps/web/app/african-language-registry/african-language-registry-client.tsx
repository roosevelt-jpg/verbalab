'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Lang = { code: string; name: string; nativeName?: string; family: string; writingSystems: string[]; dialects: string[]; regions: string[] };
type Engine = { product: string; note: string; counts?: { languages: number; families: number }; honesty: Record<string, boolean>; languages?: Lang[] };

export function AfricanLanguageRegistryClient() {
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    void Promise.all([
      apiFetch<Engine>('/v1/african-language-registry/engine'),
      apiFetch<{ languages: Lang[]; count: number }>('/v1/african-language-registry/languages'),
    ]).then(([engine, langs]) => {
      setData({ ...engine, languages: langs.languages, counts: { languages: langs.count, families: engine.counts?.families ?? 0 } });
    }).catch((err: Error) => setError(err.message));
  }, []);
  const filtered = useMemo(() => {
    const list = data?.languages ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((l) => l.code.toLowerCase().includes(needle) || l.name.toLowerCase().includes(needle) || (l.nativeName ?? '').toLowerCase().includes(needle) || l.family.toLowerCase().includes(needle));
  }, [data?.languages, q]);
  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>{data?.product ?? 'African Language Registry'}</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem', maxWidth: '44rem' }}>{data?.note ?? 'Comprehensive African language registry for translate, STT, TTS, and chat routing. Default demo pair: English → Twi (ak / ak-GH).'}</p>
      {data?.counts ? <p style={{ margin: '0 0 1rem', color: 'var(--brand-navy)', fontWeight: 600 }}>{data.counts.languages} languages registered</p> : null}
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <label style={{ display: 'grid', gap: '0.35rem', maxWidth: '24rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Filter languages</span>
            <input className="vl-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Twi, fon, Swahili…" />
          </label>
          <div style={{ overflow: 'auto', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead><tr style={{ textAlign: 'left', background: 'var(--surface, #f8fafc)' }}><th style={{ padding: '0.65rem 0.85rem' }}>Name</th><th style={{ padding: '0.65rem 0.85rem' }}>Code</th><th style={{ padding: '0.65rem 0.85rem' }}>Family</th><th style={{ padding: '0.65rem 0.85rem' }}>Regions</th></tr></thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.code} style={{ borderTop: '1px solid var(--border, #e5e7eb)' }}>
                    <td style={{ padding: '0.55rem 0.85rem' }}><div style={{ fontWeight: 600 }}>{l.name}</div>{l.nativeName && l.nativeName !== l.name ? <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{l.nativeName}</div> : null}</td>
                    <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>{l.code}</td>
                    <td style={{ padding: '0.55rem 0.85rem', color: 'var(--muted)' }}>{l.family}</td>
                    <td style={{ padding: '0.55rem 0.85rem', color: 'var(--muted)' }}>{l.regions.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0 }}><Link href="/translate?source=en&target=ak">Translate English → Twi</Link>{' · '}<Link href="/coverage">Africa coverage directory</Link>{' · '}<Link href="/african-intelligence-cloud">African Intelligence Cloud</Link></p>
        </div>
      ) : null}
    </AppShell>
  );
}
