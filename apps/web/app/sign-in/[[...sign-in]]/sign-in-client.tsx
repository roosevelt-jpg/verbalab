'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignInForm } from '@/components/auth/sign-in-form';
import { afterClerkAuthPath } from '@/lib/auth-redirect';
import { authBackend } from '@/lib/auth/config';

export function SignInClient({ hasSocial = false }: { hasSocial?: boolean }) {
  const router = useRouter();

  const handleSuccess = async (_sessionId: string) => {
    const target = afterClerkAuthPath();
    router.replace(target);
  };

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
        ) : undefined
      }
    >
      <SignInForm hasSocial={hasSocial} onSuccess={handleSuccess} />
    </AuthShell>
  );
}
