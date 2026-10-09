import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { afterClerkAuthPath } from '@/lib/auth-redirect';
import { lugemiClerkAppearance } from '@/lib/clerk-appearance';
import { isClerkConfigured } from '@/lib/clerk-config';

const afterAuth = afterClerkAuthPath();

export default function SignInPage() {
  if (!isClerkConfigured()) redirect('/setup');

  return (
    <AuthShell
      mode="sign-in"
      footer={
        <p>
          Stuck on email OTP?{' '}
          <Link href="/dev-login">Use local password/ticket login</Link>
        </p>
      }
    >
      <div id="clerk-captcha" />
      <SignIn
        appearance={lugemiClerkAppearance}
        forceRedirectUrl={afterAuth}
        fallbackRedirectUrl={afterAuth}
        signUpUrl="/sign-up"
      />
    </AuthShell>
  );
}
