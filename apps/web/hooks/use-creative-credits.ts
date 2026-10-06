'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { WEB_BILLING_PLANS, planById } from '@/data/billing-plans';
import { isClerkConfigured } from '@/lib/clerk-config';

export type CreativeCredits = {
  plan: string;
  planName: string;
  used: number;
  quota: number;
  remaining: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type BillingSummary = {
  plan: string;
  planName: string;
  characterQuota: number;
  charactersUsed: number;
  charactersRemaining: number;
};

function guestCredits(): CreativeCredits {
  const free = WEB_BILLING_PLANS[0]!;
  return {
    plan: free.id,
    planName: free.name,
    used: 0,
    quota: free.characterQuota,
    remaining: free.characterQuota,
    loading: false,
    error: null,
    refresh: async () => undefined,
  };
}

/** Character credits from `/v1/billing/summary` (Free mock when unsigned / unreachable). */
export function useCreativeCredits(): CreativeCredits {
  if (!isClerkConfigured()) return guestCredits();
  // NEXT_PUBLIC flag is compile-time constant — Authed path only when ClerkProvider mounts.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCreativeCreditsAuthed();
}

function useCreativeCreditsAuthed(): CreativeCredits {
  const { getToken, isLoaded } = useAuth();
  const free = WEB_BILLING_PLANS[0]!;
  const [plan, setPlan] = useState(free.id);
  const [planName, setPlanName] = useState(free.name);
  const [used, setUsed] = useState(0);
  const [quota, setQuota] = useState(free.characterQuota);
  const [remaining, setRemaining] = useState(free.characterQuota);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setPlan(free.id);
        setPlanName(free.name);
        setUsed(0);
        setQuota(free.characterQuota);
        setRemaining(free.characterQuota);
        setError(null);
        return;
      }
      const billing = await apiFetch<BillingSummary>('/v1/billing/summary', { token });
      const canonical = planById(billing.plan);
      setPlan(canonical.id);
      setPlanName(billing.planName || canonical.name);
      setUsed(billing.charactersUsed);
      setQuota(billing.characterQuota);
      setRemaining(billing.charactersRemaining);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Billing unavailable');
    } finally {
      setLoading(false);
    }
  }, [getToken, free.characterQuota, free.id, free.name]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh();
  }, [isLoaded, refresh]);

  return { plan, planName, used, quota, remaining, loading, error, refresh };
}
