'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { afterClerkAuthPath } from '@/lib/auth-redirect';

export function SignUpClient({ hasSocial = false }: { hasSocial?: boolean }) {
  const router = useRouter();

  const handleSuccess = async (_sessionId: string) => {
    const target = afterClerkAuthPath();
    router.replace(target);
  };

  return (
    <AuthShell
      mode="sign-up"
      hasSocial={hasSocial}
      footer={
        <p>
          Local review without email OTP?{' '}
          <Link href="/dev-login">Use /dev-login</Link>
        </p>
      }
    >
      <SignUpForm hasSocial={hasSocial} onSuccess={handleSuccess} />
    </AuthShell>
  );
}
