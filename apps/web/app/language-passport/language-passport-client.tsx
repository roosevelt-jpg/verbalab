'use client';

import { FormEvent, useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { resolveWorkspaceBearer } from '@/lib/studio-api-key';

type PassportEntry = {
  id: string;
  type: string;
  status: string;
  currentRevision: number;
  entryKey: string;
  latest?: {
    sourceForm?: string;
    languageVariety?: string;
    approvedValue?: unknown;
    context?: Record<string, unknown>;
  } | null;
};

type Passport = {
  id: string;
  state: string;
  personalizationEnabled: boolean;
  preferencesRevision: number;
  preferredVarieties: string[];
  preferredVoiceIds: string[];
  trainingConsent: boolean;
  retentionDays: number;
  promise: string;
  entries: PassportEntry[];
  grants: Array<{ id: string; purpose: string; expiresAt: string; revokedAt?: string | null }>;
  modelSync?: {
    accentIdentityPacks: number;
    ownTtsVoices: number;
    adapters: Array<{ adapter: string; status: string; notes: string }>;
  };
};

type ResolveResult = {
  outcome: string;
  matched: unknown[];
  conflicts: unknown[];
  explain: string[];
  glossaryTerms?: unknown[];
  unitClarifications?: unknown[];
};

const ENTRY_TYPES = [
  'terminology_meaning',
  'approved_translation',
  'pronunciation',
  'local_unit_definition',
  'preferred_name',
  'preference',
] as const;

export function LanguagePassportClient() {
  const { getToken, isLoaded } = useAuth();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolveText, setResolveText] = useState('Deliver one bag of rice tomorrow');
  const [resolveProduct, setResolveProduct] = useState('dealbridge');
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [exportJson, setExportJson] = useState<string | null>(null);

  const [type, setType] = useState<(typeof ENTRY_TYPES)[number]>('local_unit_definition');
  const [sourceForm, setSourceForm] = useState('one bag');
  const [languageVariety, setLanguageVariety] = useState('gh-ghanaian-english');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ak');
  const [approvedText, setApprovedText] = useState('25 kg sack');
  const [packageCount, setPackageCount] = useState('1');
  const [packageSize, setPackageSize] = useState('25');
  const [unit, setUnit] = useState('kg');
  const [contextProduct, setContextProduct] = useState('rice');
  const [contextCategory, setContextCategory] = useState('rice_trade');
  const [businessScopeId, setBusinessScopeId] = useState('biz_demo');

  const tokenFor = useCallback(async () => resolveWorkspaceBearer(() => getToken()), [getToken]);

  const reload = useCallback(async () => {
    const token = await tokenFor();
    if (!token) throw new Error('Sign in or apply a Studio API key');
    const data = await apiFetch<Passport>('/v1/passport/me', { token });
    setPassport(data);
  }, [tokenFor]);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Language Passport');
      }
    })();
  }, [isLoaded, reload]);

  async function onTogglePersonalization() {
    if (!passport) return;
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFor();
      if (!token) throw new Error('Not signed in');
      const next = await apiFetch<Passport>('/v1/passport/preferences', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          personalizationEnabled: !passport.personalizationEnabled,
          expectedPreferencesRevision: passport.preferencesRevision,
        }),
      });
      setPassport(next);
      setMessage(
        next.personalizationEnabled
          ? 'Personalization resumed — approved memory may apply again.'
          : 'Personalization paused — Passport memory will not be applied.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEntry(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await tokenFor();
      if (!token) throw new Error('Not signed in');
      const approvedValue =
        type === 'local_unit_definition'
          ? { packageCount, packageSize, unit }
          : type === 'pronunciation'
            ? { kind: 'pronunciation', alias: approvedText }
            : type === 'approved_translation'
              ? { kind: 'translation', value: approvedText, targetLang }
              : { kind: 'text', value: approvedText };

      await apiFetch('/v1/passport/entries', {
        method: 'POST',
        token,
        body: JSON.stringify({
          type,
          sourceForm,
          languageVariety,
          sourceLang: sourceLang || undefined,
          targetLang: targetLang || undefined,
          approvedValue,
          context: {
            category: contextCategory || undefined,
            product: contextProduct || undefined,
            businessScopeId: businessScopeId || undefined,
          },
          examples: [`Example use of “${sourceForm}”`],
          autoApprove: false,
        }),
      });
      setMessage('Entry saved as awaiting approval — it will not apply until you approve it.');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function approve(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFor();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/passport/entries/${id}/approvals`, { method: 'POST', token, body: '{}' });
      setMessage('Entry approved and synced to compatible workspace models (glossary / ASR / Voice Studio).');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFor();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/passport/entries/${id}`, { method: 'DELETE', token });
      setMessage('Entry deleted (tombstoned).');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  async function runResolve() {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFor();
      if (!token) throw new Error('Not signed in');
      const result = await apiFetch<ResolveResult>('/v1/passport/resolutions', {
        method: 'POST',
        token,
        body: JSON.stringify({
          product: resolveProduct,
          text: resolveText,
          sourceLang,
          targetLang,
          languageVariety,
          context: {
            category: contextCategory || undefined,
            product: contextProduct || undefined,
            businessScopeId: businessScopeId || undefined,
          },
          pinSnapshot: true,
        }),
      });
      setResolveResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolve failed');
    } finally {
      setBusy(false);
    }
  }

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFor();
      if (!token) throw new Error('Not signed in');
      const data = await apiFetch<Record<string, unknown>>('/v1/passport/exports', {
        method: 'POST',
        token,
        body: '{}',
      });
      setExportJson(JSON.stringify(data, null, 2));
      setMessage('Export ready — checksum included; credentials and grants excluded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <main style={page}>
        <header style={{ marginBottom: '1.25rem' }}>
          <p style={eyebrow}>Language Passport</p>
          <h1 style={title}>Your language. Your meaning. Wherever you use Lugemi.</h1>
          <p style={lead}>
            Private, portable, user-approved language context — terminology, local units, pronunciation,
            and preferences. Synced to Accent Identity packs, OWN TTS voices, glossary, ASR vocabulary, and
            Voice Studio lexemes. Not an identity document, biometric, or silent model-training feed.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            Related:{' '}
            <Link href="/glossary">Glossary</Link> · <Link href="/accent-identity">Accent Identity</Link> ·{' '}
            <Link href="/speech-recognition">Speech vocabulary</Link> ·{' '}
            <Link href="/voice-studio">Voice Studio</Link>
          </p>
        </header>

        {error ? (
          <p role="alert" style={errBox}>
            {error}
          </p>
        ) : null}
        {message ? <p style={okBox}>{message}</p> : null}

        {passport ? (
          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <strong>Profile</strong>
                <p style={muted}>
                  State: {passport.state} · prefs rev {passport.preferencesRevision} · retention{' '}
                  {passport.retentionDays}d
                </p>
                <p style={muted}>
                  Varieties: {(passport.preferredVarieties ?? []).join(', ') || 'none yet'} · Voices:{' '}
                  {(passport.preferredVoiceIds ?? []).join(', ') || 'none yet'}
                </p>
              </div>
              <button type="button" onClick={() => void onTogglePersonalization()} disabled={busy}>
                {passport.personalizationEnabled ? 'Pause personalization' : 'Resume personalization'}
              </button>
            </div>
            {passport.modelSync ? (
              <p style={{ ...muted, marginTop: '0.75rem' }}>
                Model sync: {passport.modelSync.accentIdentityPacks} Accent Identity packs ·{' '}
                {passport.modelSync.ownTtsVoices} OWN TTS voices ·{' '}
                {passport.modelSync.adapters.length} adapters (
                {passport.modelSync.adapters.map((a) => a.adapter).join(', ')})
              </p>
            ) : null}
          </section>
        ) : null}

        <section style={card}>
          <h2 style={h2}>Save meaning (explicit approval required)</h2>
          <p style={muted}>
            Corrections never become reusable memory until you approve. Context-specific rules (e.g. rice
            bag size) will not apply to flour or unknown business scope.
          </p>
          <form onSubmit={(e) => void onSaveEntry(e)} style={{ display: 'grid', gap: '0.65rem' }}>
            <label style={label}>
              Entry type
              <select value={type} onChange={(e) => setType(e.target.value as (typeof ENTRY_TYPES)[number])}>
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label style={label}>
              Source form
              <input value={sourceForm} onChange={(e) => setSourceForm(e.target.value)} required />
            </label>
            <label style={label}>
              Language variety (Accent Identity id / speechVariety)
              <input value={languageVariety} onChange={(e) => setLanguageVariety(e.target.value)} required />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <label style={label}>
                Source lang
                <input value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} />
              </label>
              <label style={label}>
                Target lang
                <input value={targetLang} onChange={(e) => setTargetLang(e.target.value)} />
              </label>
            </div>
            {type === 'local_unit_definition' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                <label style={label}>
                  Package count
                  <input value={packageCount} onChange={(e) => setPackageCount(e.target.value)} />
                </label>
                <label style={label}>
                  Package size
                  <input value={packageSize} onChange={(e) => setPackageSize(e.target.value)} />
                </label>
                <label style={label}>
                  Unit
                  <input value={unit} onChange={(e) => setUnit(e.target.value)} />
                </label>
              </div>
            ) : (
              <label style={label}>
                Approved meaning / alias
                <input value={approvedText} onChange={(e) => setApprovedText(e.target.value)} />
              </label>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
              <label style={label}>
                Context product
                <input value={contextProduct} onChange={(e) => setContextProduct(e.target.value)} />
              </label>
              <label style={label}>
                Category
                <input value={contextCategory} onChange={(e) => setContextCategory(e.target.value)} />
              </label>
              <label style={label}>
                Business scope id
                <input value={businessScopeId} onChange={(e) => setBusinessScopeId(e.target.value)} />
              </label>
            </div>
            <button type="submit" disabled={busy}>
              Save for future use (awaiting approval)
            </button>
          </form>
        </section>

        <section style={card}>
          <h2 style={h2}>Entries</h2>
          {!passport?.entries?.length ? (
            <p style={muted}>No entries yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.65rem' }}>
              {passport.entries.map((e) => (
                <li key={e.id} style={row}>
                  <div>
                    <strong>
                      {e.latest?.sourceForm ?? e.entryKey} · {e.type}
                    </strong>
                    <p style={muted}>
                      {e.status} · rev {e.currentRevision} · variety {e.latest?.languageVariety ?? '—'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {e.status === 'awaiting_user_approval' ? (
                      <button type="button" disabled={busy} onClick={() => void approve(e.id)}>
                        Approve
                      </button>
                    ) : null}
                    <button type="button" disabled={busy} onClick={() => void remove(e.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={card}>
          <h2 style={h2}>Resolution preview</h2>
          <p style={muted}>Explainable plan: matched spans, conflicts, and adapter actions — never silent.</p>
          <label style={label}>
            Product
            <select value={resolveProduct} onChange={(e) => setResolveProduct(e.target.value)}>
              {[
                'translate',
                'dealbridge',
                'voicebridge',
                'voice_studio',
                'everyday',
                'relay',
                'meetingbridge',
                'speech_recognition',
              ].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label style={label}>
            Text
            <textarea rows={3} value={resolveText} onChange={(e) => setResolveText(e.target.value)} />
          </label>
          <button type="button" disabled={busy} onClick={() => void runResolve()}>
            Resolve with Passport
          </button>
          {resolveResult ? (
            <pre style={pre}>{JSON.stringify(resolveResult, null, 2)}</pre>
          ) : null}
        </section>

        <section style={card}>
          <h2 style={h2}>Export / privacy</h2>
          <p style={muted}>
            Export selected approved entries with checksum. Import treats content as untrusted and creates
            pending entries only — foreign grants cannot grant local access.
          </p>
          <button type="button" disabled={busy} onClick={() => void onExport()}>
            Export Passport JSON
          </button>
          {exportJson ? <pre style={pre}>{exportJson}</pre> : null}
        </section>
      </main>
    </AppShell>
  );
}

const page: CSSProperties = { maxWidth: 920, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' };
const eyebrow: CSSProperties = {
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  color: 'var(--muted)',
  margin: 0,
};
const title: CSSProperties = { fontSize: '1.75rem', margin: '0.35rem 0 0.5rem', lineHeight: 1.2 };
const lead: CSSProperties = { color: 'var(--muted)', margin: '0 0 0.75rem', maxWidth: 70 * 8 };
const card: CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '1rem 1.1rem',
  marginBottom: '1rem',
  background: 'var(--surface, #fff)',
};
const h2: CSSProperties = { fontSize: '1.1rem', margin: '0 0 0.35rem' };
const muted: CSSProperties = { color: 'var(--muted)', fontSize: '0.9rem', margin: '0.2rem 0' };
const label: CSSProperties = { display: 'grid', gap: 4, fontSize: '0.85rem' };
const row: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.75rem',
  alignItems: 'center',
  borderTop: '1px solid var(--line)',
  paddingTop: '0.55rem',
};
const pre: CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.75rem',
  background: 'var(--code-bg, #0f172a0d)',
  borderRadius: 8,
  overflow: 'auto',
  fontSize: '0.8rem',
};
const errBox: CSSProperties = { color: '#b91c1c', marginBottom: '0.75rem' };
const okBox: CSSProperties = { color: '#0f766e', marginBottom: '0.75rem' };
