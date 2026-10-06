'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Review = {
  id: string;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  targetText: string;
  provider: string;
  qualityScore: number;
  needsReview: boolean;
  status: string;
};

export function ReviewsClient {
  const { getToken, isLoaded } = useAuth;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  async function load(token: string) {
    const q = filter === 'pending' ? '?status=pending' : '';
    const data = await apiFetch<Review[]>(`/v1/reviews${q}`, { token });
    setReviews(data);
  }

  useEffect( => {
    if (!isLoaded) return;
    void (async  => {
      try {
        const token = await getToken;
        if (!token) throw new Error('Not signed in');
        await load(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
      }
    });
  }, [getToken, isLoaded, filter]);

  async function decide(id: string, action: 'accept' | 'reject') {
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/reviews/${id}/${action}`, {
        method: 'POST',
        token,
        body: JSON.stringify(action === 'accept' ? { addToTm: true } : {}),
      });
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
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
      <h1 style={titleStyle}>Quality reviews</h1>
      <p style={ledeStyle}>
        Heuristic scores flag risky translations for human accept/reject. Accept can add the segment to TM.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
        <button
          type="button"
          className={filter === 'pending' ? 'vl-btn' : 'vl-btn vl-btn-secondary'}
          onClick={ => setFilter('pending')}
        >
          Pending
        </button>
        <button
          type="button"
          className={filter === 'all' ? 'vl-btn' : 'vl-btn vl-btn-secondary'}
          onClick={ => setFilter('all')}
        >
          All
        </button>
      </div>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem' }}>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No reviews.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="vl-panel" style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {review.sourceLang} → {review.targetLang} · {review.provider} · score {review.qualityScore}
                  {review.needsReview ? ' · needs review' : ''} · {review.status}
                </div>
                {review.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="vl-btn" onClick={ => void decide(review.id, 'accept')}>
                      Accept → TM
                    </button>
                    <button
                      type="button"
                      className="vl-btn vl-btn-secondary"
                      onClick={ => void decide(review.id, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
              <div style={{ marginTop: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 650 }}>
                {review.sourceText}
              </div>
              <div style={{ marginTop: '0.35rem' }}>{review.targetText}</div>
            </div>
          ))
        )}
      </div>
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
