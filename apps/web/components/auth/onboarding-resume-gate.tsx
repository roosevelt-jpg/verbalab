'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import {
  loadOnboardingLocal,
  ONBOARDING_STORAGE_KEY,
} from '@/lib/onboarding';
import { setOnboardingStatusCookie } from '@/lib/onboarding-status';

/**
 * After Clerk auth, incomplete Lugemi onboarding must finish before product homes
 * (/creative, /chat, /dashboard). Cookie `pending` also backs middleware.
 */
export function OnboardingResumeGate({ children }: { children: ReactNode }) {
  if (!isClerkConfigured()) {
    return <>{children}</>;
  }
  return <OnboardingResumeGateAuthed>{children}</OnboardingResumeGateAuthed>;
}

function OnboardingResumeGateAuthed({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    void (async () => {
      if (!isSignedIn) {
        if (!cancelled) setAllowed(true);
        return;
      }

      try {
        const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (raw) {
          const local = loadOnboardingLocal();
          if (!local.completed) {
            setOnboardingStatusCookie('pending');
            router.replace('/onboarding');
            return;
          }
          setOnboardingStatusCookie('done');
        }
      } catch {
        /* ignore storage */
      }

      try {
        const token = await getToken();
        if (token) {
          const remote = await apiFetch<{
            completed?: boolean;
            step?: number;
            platform?: string | null;
            source?: string;
          }>('/v1/onboarding', { token });
          const started =
            remote.source !== 'empty' &&
            (Boolean(remote.platform) || (remote.step ?? 0) > 0);
          if (!cancelled && started && remote.completed === false) {
            setOnboardingStatusCookie('pending');
            router.replace('/onboarding');
            return;
          }
          if (remote.completed) {
            setOnboardingStatusCookie('done');
          }
        }
      } catch {
        /* API soft-fail — allow product */
      }

      if (!cancelled) setAllowed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, router]);

  if (!isLoaded || !allowed) {
    return (
      <main
        style={{
          minHeight: '40vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-ui), "Noto Sans", sans-serif',
        }}
      >
        <p>Loading workspace…</p>
      </main>
    );
  }

  return <>{children}</>;
}
