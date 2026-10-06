'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

type Bundle = {
  product: string;
  note: string;
  products: Product[];
  honesty: Record<string, boolean>;
  safety?: { note?: string } & Record<string, unknown>;
};

export function MlopsLlmopsCloudClient() {
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Bundle>('/v1/mlops-llmops-cloud/products')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        MLOps & LLMOps Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Ops layer over Inference, Kernel, Foundation Models, RAG, Agent Runtime, and Prompt Runtime — not
        Kubeflow/SageMaker/Vertex/W&amp;B/MLflow/LangSmith/Ray OS. Trust Cloud deferred.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p>: null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p>: null}
      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{data.note}</p>
          {data.safety?.note ? (
            <p style={{ margin: 0, borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem', color: 'var(--muted)' }}>
              {String(data.safety.note)}
            </p>
          ): null}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.85rem' }}>
            {data.products.map((p) => (
              <li key={p.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  {p.console ? (
                    <Link href={p.console} style={{ color: 'var(--ink)', fontWeight: 600 }}>
                      {p.name}
                    </Link>
                  ): (
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  )}
                </div>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>{p.notes}</p>
              </li>
            ))}
          </ul>
        </div>
      ): null}
    </AppShell>
  );
}
