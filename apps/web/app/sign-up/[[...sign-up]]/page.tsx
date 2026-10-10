import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { afterClerkAuthPath } from '@/lib/auth-redirect';
import { lugemiClerkAppearance } from '@/lib/clerk-appearance';
import { isClerkConfigured, isClerkGoogleOAuthEnabled } from '@/lib/clerk-config';

const afterAuth = afterClerkAuthPath();

export default function SignUpPage() {
  if (!isClerkConfigured()) redirect('/setup');

  const hasSocial = isClerkGoogleOAuthEnabled();

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
      <div id="clerk-captcha" />
      <SignUp
        appearance={lugemiClerkAppearance}
        forceRedirectUrl={afterAuth}
        fallbackRedirectUrl={afterAuth}
        signInUrl="/sign-in"
      />
    </AuthShell>
  );
}
