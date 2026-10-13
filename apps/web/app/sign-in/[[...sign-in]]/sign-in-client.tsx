'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignInForm } from '@/components/auth/sign-in-form';
import { afterClerkAuthPath } from '@/lib/auth-redirect';
import { authBackend } from '@/lib/auth/config';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { syncAuthSessionCookie } from '@/lib/auth/session-cookie';

export function SignInClient({ hasSocial = false }: { hasSocial?: boolean }) {
  const router = useRouter();
  const [redirectError, setRedirectError] = useState<string | null>(null);

  const handleSuccess = async (_sessionId: string) => {
    const target = afterClerkAuthPath();
    router.replace(target);
  };

  useEffect(() => {
    if (authBackend() !== 'firebase') return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await getRedirectResult(getFirebaseAuth());
        if (cancelled || !result?.user) return;
        const token = await result.user.getIdToken(true);
        if (token) await syncAuthSessionCookie(token);
        await handleSuccess(result.user.uid);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
        setRedirectError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for redirect return
  }, []);

  const clerkDevLogin = authBackend() === 'clerk';

  return (
    <AuthShell
      mode="sign-in"
      hasSocial={hasSocial}
      footer={
        clerkDevLogin ? (
          <p>
            Stuck on email OTP?{' '}
            <Link href="/dev-login">Use local password/ticket login</Link>
          </p>
        ) : (
          <p>New to Lugemi Auth? Create an account — previous Clerk logins do not carry over.</p>
        )
      }
    >
      {redirectError ? (
        <div className="lugemi-auth-error-alert" role="alert">
          {redirectError}
        </div>
      ) : null}
      <SignInForm hasSocial={hasSocial} onSuccess={handleSuccess} />
    </AuthShell>
  );
}
