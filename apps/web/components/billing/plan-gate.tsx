'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import {
  FEATURE_LABELS,
  FEATURE_MIN_PLAN,
  planById,
  type WebPlanId,
} from '@/data/billing-plans';
import { isClerkConfigured } from '@/lib/clerk-config';
import { usePlatformAdmin } from '@/lib/use-platform-admin';

type PlanGateProps = {
  /** Named plan feature required (e.g. marketplace, voiceClones). */
  feature?: string;
  /** Minimum plan id required by rank. */
  minPlan?: WebPlanId;
  /** Current org plan id from overview/billing. */
  currentPlan?: string | null;
  /** When true, feature is unlocked (from API flags). Overrides plan catalog. */
  allowed?: boolean | null;
  title?: string;
  children?: React.ReactNode;
  /** Compact inline banner instead of full card. */
  compact?: boolean;
};

function requiredPlanLabel(feature?: string, minPlan?: WebPlanId): string {
  if (minPlan) return planById(minPlan).name;
  if (feature && FEATURE_MIN_PLAN[feature]) return planById(FEATURE_MIN_PLAN[feature]).name;
  return 'a higher';
}

export function PlanGate(props: PlanGateProps) {
  if (!isClerkConfigured()) {
    return <PlanGateBody {...props} platformAdmin={false} />;
  }
  return <PlanGateAuthed {...props} />;
}

function PlanGateAuthed(props: PlanGateProps) {
  const { userId, getToken } = useAuth();
  const platformAdmin = usePlatformAdmin(userId, getToken);
  return <PlanGateBody {...props} platformAdmin={platformAdmin} />;
}

function PlanGateBody({
  feature,
  minPlan,
  currentPlan,
  allowed,
  title,
  children,
  compact,
  platformAdmin,
}: PlanGateProps & { platformAdmin: boolean }) {
  const plan = planById(currentPlan ?? 'free');
  let unlocked = platformAdmin || allowed === true;
  if (!unlocked && allowed == null) {
    if (feature) unlocked = plan.features.includes(feature);
    else if (minPlan) unlocked = plan.rank >= planById(minPlan).rank;
    else unlocked = true;
  }

  if (unlocked) return <>{children ?? null}</>;

  const need = requiredPlanLabel(feature, minPlan);
  const featureName = feature ? FEATURE_LABELS[feature] ?? feature : title ?? 'This feature';
  const headline = title ?? `${featureName} requires ${need}`;

  if (compact) {
    return (
      <p
        style={{
          margin: '0.5rem 0 0',
          fontSize: '0.85rem',
          color: 'var(--muted)',
          lineHeight: 1.5,
        }}
      >
        {headline}.{' '}
        <Link href="/pricing" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
          Upgrade →
        </Link>
      </p>
    );
  }

  return (
    <div
      className="vl-endpoint-card"
      role="status"
      style={{
        borderStyle: 'dashed',
        display: 'grid',
        gap: '0.65rem',
        alignContent: 'start',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--brand-navy)' }}>{headline}</h3>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
        Your workspace inherits the {plan.name} subscription. Unlock {featureName.toLowerCase()} by
        upgrading under Pricing.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link href="/pricing" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
          View plans
        </Link>
        {children}
      </div>
    </div>
  );
}

/** Nav/link lock badge when a route needs a higher plan. */
export function PlanLockBadge({
  feature,
  currentPlan,
  flags,
}: {
  feature?: string;
  currentPlan?: string | null;
  flags?: Record<string, boolean> | null;
}) {
  if (!isClerkConfigured()) {
    return <PlanLockBadgeBody feature={feature} currentPlan={currentPlan} flags={flags} platformAdmin={false} />;
  }
  return <PlanLockBadgeAuthed feature={feature} currentPlan={currentPlan} flags={flags} />;
}

function PlanLockBadgeAuthed({
  feature,
  currentPlan,
  flags,
}: {
  feature?: string;
  currentPlan?: string | null;
  flags?: Record<string, boolean> | null;
}) {
  const { userId, getToken } = useAuth();
  const platformAdmin = usePlatformAdmin(userId, getToken);
  return (
    <PlanLockBadgeBody
      feature={feature}
      currentPlan={currentPlan}
      flags={flags}
      platformAdmin={platformAdmin}
    />
  );
}

function PlanLockBadgeBody({
  feature,
  currentPlan,
  flags,
  platformAdmin,
}: {
  feature?: string;
  currentPlan?: string | null;
  flags?: Record<string, boolean> | null;
  platformAdmin: boolean;
}) {
  if (!feature || platformAdmin) return null;
  const fromFlag = flags?.[feature];
  const unlocked =
    fromFlag === true || (fromFlag == null && planById(currentPlan ?? 'free').features.includes(feature));
  if (unlocked) return null;
  return (
    <span
      title={`Requires ${requiredPlanLabel(feature)}`}
      style={{
        marginLeft: '0.35rem',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        opacity: 0.85,
      }}
    >
      {requiredPlanLabel(feature)}
    </span>
  );
}
