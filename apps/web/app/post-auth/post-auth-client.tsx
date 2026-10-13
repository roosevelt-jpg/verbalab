'use client';

import { useAuth, isAuthConfigured, authBackend } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
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
 * Post-auth landing: resolve platform admin vs product onboarding before
 * painting the onboarding wizard (avoids a flash of setup UI for admins).
 *
 * Firebase: wait for AuthProvider to observe onAuthStateChanged after
 * sign-in redirects here — do not bounce to /sign-in on the first tick.
 */
export function PostAuthClient() {
  if (!isAuthConfigured()) {
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

  // Wait for session propagation (Firebase onAuthStateChanged) before failing.
  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    const waitMs = authBackend() === 'firebase' ? 4000 : 800;
    const timer = window.setTimeout(() => {
      if (!ran.current) {
        router.replace('/sign-in');
      }
    }, waitMs);
    return () => window.clearTimeout(timer);
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || ran.current) return;
    ran.current = true;

    void (async () => {
      const token = await getToken();
      if (!token) {
        // One more try — Firebase ID token can lag a frame behind isSignedIn.
        await new Promise((r) => setTimeout(r, 300));
        const retry = await getToken();
        if (!retry) {
          router.replace(ONBOARDING_PATH);
          return;
        }
        return routeAfterAuth(retry);
      }
      return routeAfterAuth(token);
    })();

    async function routeAfterAuth(token: string) {
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
    }
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
