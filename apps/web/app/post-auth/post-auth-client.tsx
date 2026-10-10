'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import {
  destinationForPlatform,
  loadOnboardingLocal,
  type OnboardingPlatform,
} from '@/lib/onboarding';
import {
  setOnboardingStatusCookie,
  setPlatformAdminCookie,
} from '@/lib/onboarding-status';
import { ONBOARDING_PATH } from '@/lib/auth-redirect';

/**
 * Post-Clerk landing: resolve platform admin vs product onboarding before
 * painting the onboarding wizard (avoids a flash of setup UI for admins).
 */
export function PostAuthClient() {
  if (!isClerkConfigured()) {
    return <PostAuthRouter getToken={async () => null} isLoaded isSignedIn={false} />;
  }
  return <PostAuthClientAuthed />;
}

function PostAuthClientAuthed() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return (
    <PostAuthRouter
      getToken={async () => (await getToken()) ?? null}
      isLoaded={isLoaded}
      isSignedIn={Boolean(isSignedIn)}
    />
  );
}

function PostAuthRouter({
  getToken,
  isLoaded,
  isSignedIn,
}: {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const ran = useRef(false);
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    if (!isLoaded || ran.current) return;
    ran.current = true;

    void (async () => {
      if (!isSignedIn) {
        router.replace('/sign-in');
        return;
      }

      const token = await getToken();
      if (!token) {
        router.replace(ONBOARDING_PATH);
        return;
      }

      try {
        setMessage('Checking admin access…');
        const adminRes = await apiFetch<{ admin: boolean }>('/v1/admin/status', { token });
        if (adminRes?.admin) {
          setPlatformAdminCookie(true);
          setOnboardingStatusCookie('done');
          setMessage('Opening admin…');
          router.replace('/admin');
          return;
        }
        setPlatformAdminCookie(false);
      } catch {
        setPlatformAdminCookie(false);
      }

      try {
        const remote = await apiFetch<{
          completed: boolean;
          platform: OnboardingPlatform | null;
        }>('/v1/onboarding', { token });
        if (remote.completed) {
          setOnboardingStatusCookie('done');
          setMessage('Opening workspace…');
          router.replace(destinationForPlatform(remote.platform));
          return;
        }
      } catch {
        /* fall through */
      }

      const local = loadOnboardingLocal();
      if (local.completed) {
        setOnboardingStatusCookie('done');
        router.replace(destinationForPlatform(local.platform));
        return;
      }

      setOnboardingStatusCookie('pending');
      setMessage('Continuing setup…');
      router.replace(ONBOARDING_PATH);
    })();
  }, [getToken, isLoaded, isSignedIn, router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(165deg, #f0f7f6 0%, #f8fafc 55%, #eef2f7 100%)',
        padding: '2rem',
      }}
    >
      <p style={{ color: '#52647a', fontWeight: 600, margin: 0 }}>{message}</p>
    </main>
  );
}
