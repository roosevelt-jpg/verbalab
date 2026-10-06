'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Product = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

type Overview = {
  usage: {
    periodStart: string;
    stt: { requests: number; seconds: number; minutes: number };
    tts: { requests: number; characters: number };
  };
  workspace: { voiceClones: number };
  products: Product[];
  architecture: {
    graphql: boolean;
    cqrs: boolean;
    terraform: boolean;
    kubernetes: boolean;
    streaming: boolean;
    batch: boolean;
    billing: boolean;
    monitoring: boolean;
  };
  deferred: Record<string, boolean>;
  links: Record<string, string>;
};

export function SpeechClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/speech/overview', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
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
        Speech Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Parent hub for batch STT, segment SSE streaming, TTS, interpreter, voice studio, and deferred speech intelligence
        products. Extends existing audio APIs — does not regenerate Language Cloud or Identity.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <section>
            <h2 style={label}>This period</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              STT {data.usage.stt.requests} req · {data.usage.stt.minutes} min · TTS{' '}
              {data.usage.tts.requests} req · {data.usage.tts.characters} chars
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Since {data.usage.periodStart.slice(0, 10)} · {data.workspace.voiceClones} voice clones
            </p>
          </section>

          <section>
            <h2 style={label}>Products</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
              {data.products.map((p) => (
                <li key={p.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {p.name}{' '}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        {p.notes}
                      </div>
                    </div>
                    {p.console ? (
                      <Link href={p.console} style={{ color: 'var(--accent)', fontWeight: 550, fontSize: '0.9rem' }}>
                        Open →
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href={data.links.recognition ?? '/speech-recognition'} style={primary}>
              STT Engine
            </Link>
            <Link href={data.links.audio} style={secondary}>
              Voice Studio
            </Link>
            <Link href={data.links.speakers ?? '/speaker-intelligence'} style={secondary}>
              Speakers
            </Link>
            <Link href={data.links.interpret} style={secondary}>
              Interpreter
            </Link>
            <Link href={data.links.voice} style={secondary}>
              Voice FAQ
            </Link>
            <Link href={data.links.emotion ?? '/emotion-intelligence'} style={secondary}>
              Emotion AI
            </Link>
            <Link href={data.links.audioIntelligence ?? '/audio-intelligence'} style={secondary}>
              Audio AI
            </Link>
            <Link href={data.links.pronunciation ?? '/pronunciation-intelligence'} style={secondary}>
              Pronunciation
            </Link>
            <Link href={data.links.wakeWord ?? '/wake-word'} style={secondary}>
              Wake Word
            </Link>
            <Link href={data.links.callIntelligence ?? '/call-intelligence'} style={secondary}>
              Calls
            </Link>
            <Link href={data.links.speechAnalytics ?? '/speech-analytics'} style={secondary}>
              Speech Analytics
            </Link>
            <Link href={data.links.accentIntelligence ?? '/accent-intelligence'} style={secondary}>
              Accent AI
            </Link>
            <Link href={data.links.accents} style={secondary}>
              Accents
            </Link>
            <Link href={data.links.usage} style={secondary}>
              Usage
            </Link>
            <Link href={data.links.billing} style={secondary}>
              Billing
            </Link>
            <Link href={data.links.graphql} style={secondary}>
              GraphQL
            </Link>
          </section>

          <section>
            <h2 style={label}>Architecture honesty</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Batch {data.architecture.batch ? 'yes' : 'no'} · Streaming{' '}
              {data.architecture.streaming ? 'yes (segment SSE)' : 'deferred'} · GraphQL{' '}
              {data.architecture.graphql ? 'yes' : 'no'} · CQRS{' '}
              {data.architecture.cqrs ? 'yes (Speech Cloud hub)' : 'no'} · Billing{' '}
              {data.architecture.billing ? 'yes (STT/TTS metering)' : 'no'} · Monitoring{' '}
              {data.architecture.monitoring ? 'yes' : 'no'} · Terraform{' '}
              {data.architecture.terraform ? 'yes (AWS)' : 'no'} · Kubernetes{' '}
              {data.architecture.kubernetes ? 'yes (EKS af-south-1)' : 'no'}
            </p>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Deferred: live-mic WebSocket, forced-alignment phonemes, echo AEC, trained SER,
              on-device wake DNN, realtime CCaaS streaming, WER evaluation lab.
            </p>
          </section>
        </div>
      ) : null}
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
