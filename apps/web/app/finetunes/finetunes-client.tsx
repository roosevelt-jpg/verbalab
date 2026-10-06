'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Candidate = {
  sourceLang: string;
  targetLang: string;
  pairKey: string;
  failed: boolean;
  reason: string | null;
  exactMatchRate: number | null;
  meanCharSimilarity: number | null;
};

type Job = {
  id: string;
  sourceLang: string;
  targetLang: string;
  status: string;
  launcher: string;
  errorMessage: string | null;
  artifactKind: string | null;
};

type Model = {
  id: string;
  slug: string;
  displayName: string;
  sourceLang: string;
  targetLang: string;
  status: string;
  artifactKind: string;
  baseModel: string;
};

export function FinetunesClient {
  const { getToken, isLoaded } = useAuth;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh(token: string) {
    const [cand, jobList, modelList] = await Promise.all([
      apiFetch<{ candidates: Candidate[]; disclaimer: string }>('/v1/finetunes/candidates', {
        token,
      }),
      apiFetch<Job[]>('/v1/finetunes/jobs', { token }),
      apiFetch<Model[]>('/v1/finetunes/models', { token }),
    ]);
    setCandidates(cand.candidates);
    setDisclaimer(cand.disclaimer);
    setJobs(jobList);
    setModels(modelList);
  }

  useEffect( => {
    if (!isLoaded) return;
    void (async  => {
      try {
        const token = await getToken;
        if (!token) throw new Error('Not signed in');
        await refresh(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fine-tunes');
      }
    });
  }, [getToken, isLoaded]);

  async function createAndComplete(sourceLang: string, targetLang: string) {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const job = await apiFetch<{ id: string }>('/v1/finetunes/jobs', {
        method: 'POST',
        token,
        body: JSON.stringify({ sourceLang, targetLang, launcher: 'manual' }),
      });
      await apiFetch(`/v1/finetunes/jobs/${job.id}/launch`, { method: 'POST', token });
      await apiFetch(`/v1/finetunes/jobs/${job.id}/complete`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          artifactKind: 'phrase_map',
          useGoldenPhraseMap: true,
          promote: true,
        }),
      });
      setMessage(
        `Promoted golden phrase-map for ${sourceLang}→${targetLang}. Gateway will prefer it for exact phrases; GPU training remains manual/rented.`,
      );
      await refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fine-tune flow failed (Pro required)');
    } finally {
      setLoading(false);
    }
  }

  async function retire(id: string) {
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/finetunes/models/${id}/retire`, { method: 'POST', token });
      await refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retire failed');
    }
  }

  if (!isLoaded) {
    return (
      <AppShell>
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 style={titleStyle}>Fine-tunes</h1>
      <p style={ledeStyle}>
        Where coverage goldens show weak vendor scores, queue a narrow pair fine-tune. Use
        `/v1/training-jobs` launchers (manual default; Modal/Vertex via launch webhooks). GPU
        success only after a real callback or manual artifact attach — never invented.
      </p>
      {disclaimer ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.75rem' }}>{disclaimer}</p>
      ) : null}

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--good, #0a7a3e)', marginTop: '1rem' }}>{message}</p> : null}

      <section style={{ marginTop: '1.75rem' }}>
        <h2 style={sectionTitle}>Failed-pair candidates</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {candidates.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No candidates from the latest coverage snapshot.</p>
          ) : (
            candidates.map((c) => (
              <div key={c.pairKey} className="vl-panel" style={{ padding: '1rem 1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>
                      {c.sourceLang} → {c.targetLang}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      exact {c.exactMatchRate ?? '—'} · charSim {c.meanCharSimilarity ?? '—'}
                    </div>
                    {c.reason ? (
                      <div style={{ color: '#555', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                        {c.reason}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="vl-btn"
                    disabled={loading}
                    onClick={ => void createAndComplete(c.sourceLang, c.targetLang)}
                  >
                    {loading ? 'Working…' : 'Queue + attach golden map (Pro)'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: '1.75rem' }}>
        <h2 style={sectionTitle}>Jobs</h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {jobs.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No jobs yet.</p>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="vl-panel" style={{ padding: '0.85rem 1.1rem' }}>
                <strong>
                  {j.sourceLang}→{j.targetLang}
                </strong>{' '}
                <span style={{ color: 'var(--muted)' }}>
                  {j.status} · {j.launcher}
                  {j.errorMessage ? ` · ${j.errorMessage}` : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: '1.75rem' }}>
        <h2 style={sectionTitle}>Ready models</h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {models.filter((m) => m.status === 'ready').length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No promoted models.</p>
          ) : (
            models
              .filter((m) => m.status === 'ready')
              .map((m) => (
                <div
                  key={m.id}
                  className="vl-panel"
                  style={{
                    padding: '0.85rem 1.1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>
                      {m.displayName}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {m.sourceLang}→{m.targetLang} · {m.artifactKind} · {m.baseModel}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="vl-btn vl-btn-secondary"
                    onClick={ => void retire(m.id)}
                  >
                    Retire
                  </button>
                </div>
              ))
          )}
        </div>
      </section>
    </AppShell>
  );
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.03em',
  fontSize: '2rem',
};

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0.5rem 0 0',
  lineHeight: 1.55,
};

const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  margin: '0 0 0.75rem',
};
