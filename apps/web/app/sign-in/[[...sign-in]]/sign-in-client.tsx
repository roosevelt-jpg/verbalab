'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignInForm } from '@/components/auth/sign-in-form';
import { afterClerkAuthPath } from '@/lib/auth-redirect';

export function SignInClient({ hasSocial = false }: { hasSocial?: boolean }) {
  const router = useRouter();

  const handleSuccess = async (_sessionId: string) => {
    const target = afterClerkAuthPath();
    router.replace(target);
  };

  return (
    <AuthShell
      mode="sign-in"
      hasSocial={hasSocial}
      footer={
        <p>
          Stuck on email OTP?{' '}
          <Link href="/dev-login">Use local password/ticket login</Link>
        </p>
      }
    >
      <SignInForm hasSocial={hasSocial} onSuccess={handleSuccess} />
    </AuthShell>
  );
}
