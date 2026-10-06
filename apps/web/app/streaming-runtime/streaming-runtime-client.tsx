'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  honesty: {
    websocketOs: boolean;
    grpcStreamingOs: boolean;
    videoStreamingOs: boolean;
    regeneratesExistingStreams: boolean;
    extendsExistingSse: boolean;
    primaryTransport: string;
  };
  ceilings: { maxChunksPerStream: number; mode: string };
  spendSafety: { note: string };
};

type Surface = {
  id: string;
  kind: string;
  name: string;
  status: string;
  transport: string;
  api: string | null;
  existing: boolean;
};

export function StreamingRuntimeClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [chunks, setChunks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, surf] = await Promise.all([
      apiFetch<Engine>('/v1/streaming-runtime/engine', { token }),
      apiFetch<{ surfaces: Surface[] }>('/v1/streaming-runtime/surfaces', { token }),
    ]);
    setEngine(eng);
    setSurfaces(surf.surfaces);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const runDemo = async () => {
    setBusy(true);
    setError(null);
    setChunks([]);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001';
      const res = await fetch(`${base}/v1/streaming-runtime/stream`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'llm',
          text: 'Streaming Runtime sandbox chunk demo for Lugemi.',
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Stream failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      const collected: string[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          const dataLine = part.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine.slice(6)) as { token?: string; event?: string };
            if (data.token) collected.push(data.token);
          } catch {
            /* ignore */
          }
        }
      }
      setChunks(collected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stream failed');
    } finally {
      setBusy(false);
    }
  };

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
        Streaming Runtime
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        SSE hub over existing speech/voice/translate streams plus sandbox LLM chunks. Not
        WebSocket/gRPC/video OS. <Link href="/inference-cloud">Inference Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {engine ? (
        <section
          style={{
            borderLeft: '3px solid #7c3aed',
            paddingLeft: '0.85rem',
            marginBottom: '1.75rem',
            maxWidth: '44rem',
          }}
        >
          <h2 style={label}>Honesty</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{engine.spendSafety.note}</p>
          <p style={{ margin: '0.35rem 0 0' }}>
            transport={engine.honesty.primaryTransport} · ws=
            {String(engine.honesty.websocketOs)} · grpc=
            {String(engine.honesty.grpcStreamingOs)} · regenerates=
            {String(engine.honesty.regeneratesExistingStreams)} · maxChunks=
            {engine.ceilings.maxChunksPerStream}
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: '1.75rem', maxWidth: '48rem' }}>
        <h2 style={label}>Surfaces</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {surfaces.map((s) => (
            <li key={s.id} style={{ marginBottom: '0.4rem' }}>
              <strong>{s.name}</strong> · {s.status} · {s.transport}
              {s.api ? ` · ${s.api}` : ''}
              {s.existing ? ' (existing)' : ''}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runDemo()}
          style={{
            marginTop: '0.85rem',
            border: '1px solid var(--border)',
            background: 'transparent',
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
          }}
        >
          Run LLM sandbox SSE
        </button>
      </section>

      {chunks.length > 0 ? (
        <section style={{ maxWidth: '48rem' }}>
          <h2 style={label}>Chunks</h2>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{chunks.join('')}</p>
        </section>
      ) : null}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};
