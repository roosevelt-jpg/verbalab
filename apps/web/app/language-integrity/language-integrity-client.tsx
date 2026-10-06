'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  trust: Record<string, boolean>;
  honesty: Record<string, boolean>;
  safety?: { note?: string };
};

type Protocol = {
  product: string;
  africaFirst: string;
  innocentProtection: string;
  requirements: Array<{ id: string; title: string; body: string }>;
  limits: string[];
  endpoints: Record<string, string>;
};

type Policy = {
  required?: Record<string, unknown>;
  forbidden?: string[];
};

type Clone = {
  id: string;
  name: string;
  status: string;
  consentAttested: boolean;
  ownershipAttested: boolean;
  watermarkRequired: boolean;
};

type VerifyResult = {
  verdict: string;
  summary: string;
  findings: Array<{ code: string; severity: string; detail: string }>;
  clone?: { id: string; status: string; consentAttested: boolean } | null;
};

export function LanguageIntegrityClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [library, setLibrary] = useState<Clone[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [watermark, setWatermark] = useState('required');
  const [consent, setConsent] = useState(true);
  const [cloneId, setCloneId] = useState('');
  const [notes, setNotes] = useState('Speaker consent recorded for official ministry notice.');
  const [claim, setClaim] = useState('Synthetic voice proposed for civic bilingual notice.');
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);

  const load = useCallback(async () => {
    const [eng, proto, pol] = await Promise.all([
      apiFetch<Engine>('/v1/language-integrity/engine'),
      apiFetch<Protocol>('/v1/language-integrity/protocol'),
      apiFetch<Policy>('/v1/voice-cloning/consent/policy').catch(() => null),
    ]);
    setEngine(eng);
    setProtocol(proto);
    setPolicy(pol);

    if (!isLoaded) return;
    try {
      const token = await getToken();
      if (!token) return;
      const lib = await apiFetch<{ library: Clone[] }>('/v1/voice-cloning/library', { token });
      setLibrary(lib.library ?? []);
    } catch {
      // Signed-out operators still see public integrity surfaces.
    }
  }, [getToken, isLoaded]);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function runVerify() {
    setVerifyBusy(true);
    setError(null);
    try {
      const token = await getToken().catch(() => null);
      const body = {
        claimType: 'provenance',
        watermarkHeader: watermark === 'missing' ? '' : watermark,
        consentAttested: consent,
        cloneId: cloneId.trim() || undefined,
        attestationNotes: notes,
        audioClaimText: claim,
      };
      const path =
        token && cloneId.trim()
          ? '/v1/language-integrity/verify/workspace'
          : '/v1/language-integrity/verify';
      const data = await apiFetch<VerifyResult>(path, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
      setVerify(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setVerifyBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Language Integrity</h1>
      <p style={ledeStyle}>
        Authenticity panel for governments and workspaces: synthetic disclosure / watermark status, clone consent
        attestation, provenance verify, and links to audit + human translation review. Honest framing — provenance
        and protocol, not foolproof deepfake detection.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {engine ? (
        <section style={panelStyle} aria-labelledby="integrity-status">
          <h2 id="integrity-status" style={sectionTitle}>
            Authenticity status
          </h2>
          <div style={{ display: 'grid', gap: '0.55rem', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))' }}>
            <StatusChip
              label="Watermark on clones"
              ok={engine.trust.watermarkRequiredOnCloneSpeech === true}
              detail="X-Lugemi-Watermark: required"
            />
            <StatusChip
              label="Consent gate"
              ok={engine.trust.consentRequiredForClones === true}
              detail="Enrollment attestation required"
            />
            <StatusChip
              label="Abuse review"
              ok={engine.trust.abuseReviewRequired === true}
              detail="pending_review → approve"
            />
            <StatusChip
              label="Human translation review"
              ok={engine.trust.humanTranslationReview === true}
              detail="/reviews accept · reject"
            />
            <StatusChip
              label="Deepfake detector claim"
              ok={engine.trust.deepfakeDetectionClaimed !== true}
              detail="Not claimed — metadata only"
              invert
            />
            <StatusChip
              label="Court certification claim"
              ok={engine.trust.courtroomCertificationClaimed !== true}
              detail="Counsel decides admissibility"
              invert
            />
          </div>
          <p style={{ margin: '1rem 0 0', color: 'var(--muted)', lineHeight: 1.55 }}>{engine.note}</p>
          {engine.safety?.note ? (
            <p style={{ margin: '0.75rem 0 0', borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem', color: 'var(--muted)' }}>
              {engine.safety.note}
            </p>
          ) : null}
        </section>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Loading integrity engine…</p>
      )}

      <section style={panelStyle} aria-labelledby="integrity-verify">
        <h2 id="integrity-verify" style={sectionTitle}>
          Verify / demo flow
        </h2>
        <p style={{ margin: '0 0 0.85rem', color: 'var(--muted)', lineHeight: 1.55 }}>
          Paste a claim or check known Lugemi watermark / consent metadata. With a signed-in session and clone id,
          workspace verify resolves your library.
        </p>
        <div style={{ display: 'grid', gap: '0.65rem', maxWidth: '36rem' }}>
          <label style={fieldLabel}>
            Watermark header
            <select value={watermark} onChange={(e) => setWatermark(e.target.value)} style={inputStyle}>
              <option value="required">required</option>
              <option value="missing">missing</option>
              <option value="off">off (invalid)</option>
            </select>
          </label>
          <label style={{ ...fieldLabel, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            Consent attested
          </label>
          <label style={fieldLabel}>
            Clone id (optional)
            <input
              value={cloneId}
              onChange={(e) => setCloneId(e.target.value)}
              placeholder="Paste workspace clone id"
              style={inputStyle}
              list="integrity-clones"
            />
            <datalist id="integrity-clones">
              {library.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </datalist>
          </label>
          <label style={fieldLabel}>
            Attestation notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={inputStyle} />
          </label>
          <label style={fieldLabel}>
            Audio / use claim
            <textarea value={claim} onChange={(e) => setClaim(e.target.value)} rows={2} style={inputStyle} />
          </label>
          <button type="button" className="vl-btn" disabled={verifyBusy} onClick={() => void runVerify()}>
            {verifyBusy ? 'Checking…' : 'Run integrity check'}
          </button>
        </div>
        {verify ? (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ margin: 0, fontWeight: 650 }}>
              Verdict: <span style={{ textTransform: 'uppercase' }}>{verify.verdict}</span>
            </p>
            <p style={{ margin: '0.35rem 0 0.65rem', color: 'var(--muted)', lineHeight: 1.55 }}>{verify.summary}</p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {verify.findings.map((f) => (
                <li key={`${f.code}-${f.detail.slice(0, 32)}`}>
                  [{f.severity}] {f.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {library.length > 0 ? (
        <section style={panelStyle} aria-labelledby="integrity-clones-panel">
          <h2 id="integrity-clones-panel" style={sectionTitle}>
            Clone consent / watermark
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
            {library.map((c) => (
              <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                <strong>
                  {c.name}
                </strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  consent {c.consentAttested ? 'yes' : 'no'} · ownership {c.ownershipAttested ? 'yes' : 'no'} ·
                  watermark {c.watermarkRequired ? 'required' : 'off'} · id {c.id}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {policy?.forbidden ? (
        <section style={panelStyle}>
          <h2 style={sectionTitle}>Consent policy</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            {(policy.forbidden ?? []).slice(0, 4).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {protocol ? (
        <section style={panelStyle} aria-labelledby="integrity-protocol">
          <h2 id="integrity-protocol" style={sectionTitle}>
            Government adoption protocol
          </h2>
          <p style={{ margin: '0 0 0.65rem', color: 'var(--muted)', lineHeight: 1.55 }}>{protocol.africaFirst}</p>
          <p style={{ margin: '0 0 1rem', fontWeight: 550, lineHeight: 1.55 }}>{protocol.innocentProtection}</p>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)', lineHeight: 1.55 }}>
            {protocol.requirements.map((r) => (
              <li key={r.id} style={{ marginBottom: '0.55rem' }}>
                <strong style={{ color: 'var(--ink)' }}>{r.title}</strong> — {r.body}
              </li>
            ))}
          </ol>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Limits: {protocol.limits.join(' · ')}
          </p>
        </section>
      ) : null}

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.75rem' }}>
        <Link href="/audit" style={primary}>
          Audit trail
        </Link>
        <Link href="/voice-cloning" style={secondary}>
          Voice clones review
        </Link>
        <Link href="/reviews" style={secondary}>
          Translate + human review
        </Link>
        <Link href="/p/legal-integrity" style={secondary}>
          Marketing · Legal integrity
        </Link>
        <Link href="/docs" style={secondary}>
          API docs
        </Link>
      </section>

      {engine ? (
        <section>
          <h2 style={sectionTitle}>Capabilities</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                <strong>
                  {c.name}
                </strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {c.notes}
                  {c.api ? ` · ${c.api}` : ''}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}

function StatusChip({
  label,
  ok,
  detail,
  invert,
}: {
  label: string;
  ok: boolean;
  detail: string;
  invert?: boolean;
}) {
  const good = invert ? ok : ok;
  return (
    <div
      style={{
        padding: '0.75rem 0.85rem',
        borderRadius: '0.45rem',
        border: '1px solid var(--line)',
        background: good ? 'rgba(15, 118, 110, 0.08)' : 'rgba(180, 35, 24, 0.06)',
      }}
    >
      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
        {label}
      </div>
      <div style={{ fontWeight: 650, marginTop: '0.25rem' }}>{good ? 'On' : 'Off'}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>{detail}</div>
    </div>
  );
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.85rem',
  fontWeight: 720,
  letterSpacing: '-0.03em',
  margin: '0 0 0.35rem',
};

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0 0 1.75rem',
  maxWidth: '44rem',
  lineHeight: 1.6,
};

const sectionTitle: CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.75rem',
};

const panelStyle: CSSProperties = {
  marginBottom: '1.5rem',
  padding: '1.15rem 1.2rem',
  border: '1px solid var(--line)',
  borderRadius: '0.55rem',
  background: 'var(--surface)',
};

const fieldLabel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  fontSize: '0.82rem',
  color: 'var(--muted)',
};

const inputStyle: CSSProperties = {
  padding: '0.5rem 0.6rem',
  borderRadius: '0.4rem',
  border: '1px solid var(--line)',
  font: 'inherit',
  color: 'var(--ink)',
  background: 'var(--bg)',
};

const primary: CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
};

const secondary: CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--ink)',
};
