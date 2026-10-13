'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { afterClerkAuthPath } from '@/lib/auth-redirect';
import { authBackend } from '@/lib/auth/config';
import { firebaseAuthErrorMessage } from '@/lib/auth/firebase-errors';
import { getFirebaseAuth } from '@/lib/firebase-client';
import { syncAuthSessionCookie } from '@/lib/auth/session-cookie';

export function SignUpClient({ hasSocial = false }: { hasSocial?: boolean }) {
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
        setRedirectError(firebaseAuthErrorMessage(err, { action: 'sign-up' }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell
      mode="sign-up"
      hasSocial={hasSocial}
      footer={
        authBackend() === 'clerk' ? (
          <p>
            Local review without email OTP? <Link href="/dev-login">Use /dev-login</Link>
          </p>
        ) : (
          <p>Use a new email and password — previous Clerk accounts do not carry over.</p>
        )
      }
    >
      {redirectError ? (
        <div className="lugemi-auth-error-alert" role="alert">
          {redirectError}
        </div>
      ) : null}
      <SignUpForm hasSocial={hasSocial} onSuccess={handleSuccess} />
    </AuthShell>
  );
}
