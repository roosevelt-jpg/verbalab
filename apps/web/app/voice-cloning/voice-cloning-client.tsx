'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { PlanGate } from '@/components/billing/plan-gate';
import { planHasFeature } from '@/data/billing-plans';

type Capability = { id: string; name: string; status: string; notes: string };
type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  trust: {
    consentRequired: boolean;
    ownershipAttestation: boolean;
    abuseReview: boolean;
    watermarkRequired: boolean;
  };
};
type Policy = {
  required: Record<string, unknown>;
  professionalMode: { minSamples: number; ownershipAttested: boolean };
  forbidden: string[];
};
type Clone = {
  id: string;
  name: string;
  status: string;
  cloneMode: string;
  consentAttested: boolean;
  ownershipAttested: boolean;
  licenseType: string;
  enrollmentVerified: boolean;
  sampleCount: number;
  watermarkRequired: boolean;
};
type Analytics = {
  total: number;
  byStatus: Record<string, number>;
  byMode: Record<string, number>;
  consentAttested: number;
  ownershipAttested: number;
};

export function VoiceCloningClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [library, setLibrary] = useState<Clone[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [clonesAllowed, setClonesAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const overview = await apiFetch<{
      organization: { plan: string };
      featureFlags: Record<string, boolean>;
    }>('/v1/cloud/overview', { token }).catch( => null);
    if (overview) {
      setPlanId(overview.organization.plan);
      setClonesAllowed(overview.featureFlags.voiceClones ?? planHasFeature(overview.organization.plan, 'voiceClones'));
    }
    const [eng, pol, lib, stats] = await Promise.all([
      apiFetch<Engine>('/v1/voice-cloning/engine', { token }),
      apiFetch<Policy>('/v1/voice-cloning/consent/policy', { token }),
      apiFetch<{ library: Clone[] }>('/v1/voice-cloning/library', { token }),
      apiFetch<Analytics>('/v1/voice-cloning/engine/analytics', { token }),
    ]);
    setEngine(eng);
    setPolicy(pol);
    setLibrary(lib.library);
    setAnalytics(stats);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

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
        Voice Cloning
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Enterprise cloning with explicit consent, ownership attestation, abuse review, licensing,
        permissions, and required watermarking. Extends existing — does not skip trust gates.
      </p>

      <div style={{ marginBottom: '1.25rem' }}>
        <PlanGate feature="voiceClones" currentPlan={planId} allowed={clonesAllowed} />
      </div>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          Library: {analytics.total} clones · consent {analytics.consentAttested} · ownership{' '}
          {analytics.ownershipAttested}
        </p>
      ) : null}

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.75rem' }}>
        <Link href="/audio" style={primary}>
          Enroll in Voice Studio
        </Link>
        <Link href="/voice-cloud" style={secondary}>
          Voice Cloud
        </Link>
        <Link href="/neural-tts" style={secondary}>
          Neural TTS
        </Link>
      </section>

      {engine ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={label}>Trust gates</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            Consent {engine.trust.consentRequired ? 'required' : 'optional'} · Ownership attestation{' '}
            {engine.trust.ownershipAttestation ? 'supported' : 'no'} · Abuse review{' '}
            {engine.trust.abuseReview ? 'required' : 'no'} · Watermark{' '}
            {engine.trust.watermarkRequired ? 'required' : 'no'}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.65rem 0 0' }}>{engine.note}</p>
        </section>
      ) : null}

      {policy ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={label}>Consent policy</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            <li>Professional mode: ≥{policy.professionalMode.minSamples} samples + ownership attestation</li>
            {policy.forbidden.slice(0, 3).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={label}>Enterprise library</h2>
        {!library.length ? (
          <p style={{ color: 'var(--muted)' }}>No clones yet — enroll via Voice Studio with consent.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
            {library.map((c) => (
              <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                <strong>
                  {c.name} · {c.status} · {c.cloneMode}
                </strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  consent {c.consentAttested ? 'yes' : 'no'} · ownership{' '}
                  {c.ownershipAttested ? 'yes' : 'no'} · license {c.licenseType} · enrollment{' '}
                  {c.enrollmentVerified ? 'verified' : 'pending'} · {c.sampleCount} samples · watermark{' '}
                  {c.watermarkRequired ? 'on' : 'off'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {engine ? (
        <section>
          <h2 style={label}>Capabilities</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                <strong>
                  {c.name} · {c.status}
                </strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      )}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const primary: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
};

const secondary: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--ink)',
};
