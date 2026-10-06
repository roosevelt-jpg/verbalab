'use client';

import Link from 'next/link';
import { CreativeShell } from '@/components/creative/creative-shell';
import { useCreativeCredits } from '@/hooks/use-creative-credits';
import { formatCredits } from '@/lib/creative-audio';
import { WEB_BILLING_PLANS } from '@/data/billing-plans';

export default function CreativeSubscriptionPage() {
  const credits = useCreativeCredits();

  return (
    <CreativeShell banner breadcrumb="Subscription">
      <div className="lg-creative-page-head">
        <div>
          <h1>Subscription</h1>
          <p>Character credits power LugemiCreative speech and related tools. Manage plan under Billing.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/billing" className="lg-creative-btn primary">
            Open Billing
          </Link>
          <Link href="/pricing" className="lg-creative-btn">
            Compare plans
          </Link>
        </div>
      </div>

      <div className="lg-creative-credits" style={{ marginBottom: '1.25rem' }}>
        <div>
          Current plan: <strong>{credits.planName}</strong>
        </div>
        <div>
          Credits used: <strong>{formatCredits(credits.used)}</strong> / {formatCredits(credits.quota)}
        </div>
        <div>
          Remaining: <strong>{formatCredits(credits.remaining)}</strong>
        </div>
        {credits.error ? <p className="lg-creative-error">{credits.error}</p> : null}
      </div>

      <div className="lg-creative-cards">
        {WEB_BILLING_PLANS.map((p) => (
          <article key={p.id} className="lg-creative-card" style={{ minHeight: '10rem' }}>
            <h3>{p.name}</h3>
            <p>
              {formatCredits(p.characterQuota)} characters / period
              {p.id === credits.plan ? ' · Active' : ''}
            </p>
            <Link
              href={p.id === 'enterprise' ? '/enterprise' : '/billing'}
              className={`lg-creative-btn${p.id === credits.plan ? ' primary' : ''}`}
              style={{ justifyContent: 'center' }}
            >
              {p.id === credits.plan ? 'Manage' : p.id === 'enterprise' ? 'Contact sales' : 'Upgrade'}
            </Link>
          </article>
        ))}
      </div>
    </CreativeShell>
  );
}
