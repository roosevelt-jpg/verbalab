'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };

type Engine = {
  product: string;
  note: string;
  mode: string;
  capabilities: Capability[];
  ceilings: { maxRenderedChars: number; cacheTtlSec: number };
  honesty: {
    autoPromptResearchLab: boolean;
    callsLlmOnExecute: boolean;
    promptMeshOs: boolean;
    regeneratesPromptIntelligence: boolean;
    extendsPromptIntelligence: boolean;
    extendsVersionedPrompts: boolean;
  };
};

type Analytics = { events: number; byAction: Record<string, number> };

export function PromptRuntimeClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState('chat');
  const [variablesJson, setVariablesJson] = useState('{"locale":"sw"}');
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ana] = await Promise.all([
      apiFetch<Engine>('/v1/prompt-runtime/engine', { token }),
      apiFetch<Analytics>('/v1/prompt-runtime/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const execute = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      let variables: Record<string, string> = {};
      try {
        variables = JSON.parse(variablesJson || '{}') as Record<string, string>;
      } catch {
        throw new Error('variables must be JSON object');
      }
      const res = await apiFetch<{
        key: string;
        chars: number;
        cache: string;
        body: string;
      }>('/v1/prompt-runtime/execute', {
        token,
        method: 'POST',
        body: JSON.stringify({ key, variables, useCache: true }),
      });
      setResult(`${res.key} · ${res.chars} chars · cache=${res.cache}\n\n${res.body.slice(0, 400)}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execute failed');
    }
  }, [getToken, key, variablesJson, load]);

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
        Prompt Runtime
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Kernel prompt execution over{' '}
        <Link href="/prompt-intelligence">Prompt Intelligence</Link> / versioned prompts.
        Resolve, variables, validate, opt-in cache — does not call an LLM or invent a research lab.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select value={key} onChange={(e) => setKey(e.target.value)} style={input}>
          <option value="chat">chat</option>
          <option value="rag">rag</option>
          <option value="voice_faq">voice_faq</option>
        </select>
        <input
          value={variablesJson}
          onChange={(e) => setVariablesJson(e.target.value)}
          placeholder='{"locale":"sw"}'
          style={{ ...input, minWidth: '14rem', flex: 1 }}
        />
        <button type="button" onClick={() => void execute()} style={btn}>
          Execute
        </button>
      </div>
      {result ? (
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.85rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          {result}
        </pre>
      ) : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>
          Events this month {analytics.events}
          {engine ? ` · max ${engine.ceilings.maxRenderedChars} chars` : null}
        </p>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Mode: {engine.mode} · callsLlmOnExecute=
            {String(engine.honesty.callsLlmOnExecute)} · autoPromptResearchLab=
            {String(engine.honesty.autoPromptResearchLab)} · extendsPromptIntelligence=
            {String(engine.honesty.extendsPromptIntelligence)}
          </p>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.45rem' }}>
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ marginTop: '2rem' }}>
        <Link href="/ai-kernel">AI Kernel</Link>
        {' · '}
        <Link href="/prompt-intelligence">Prompt Intelligence</Link>
        {' · '}
        <Link href="/memory-runtime">Memory Runtime</Link>
        {' · '}
        <Link href="/intelligent-cache">Intelligent Cache</Link>
      </p>
    </AppShell>
  );
}

const input: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.75rem',
  background: 'var(--surface)',
  color: 'inherit',
  font: 'inherit',
};

const btn: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  background: 'var(--fg)',
  color: 'var(--bg)',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
};
