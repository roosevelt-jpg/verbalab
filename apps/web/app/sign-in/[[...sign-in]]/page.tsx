import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';

export default function SignInPage() {
  if (!isClerkConfigured()) redirect('/setup');

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', gap: '1rem' }}>
      <SignIn forceRedirectUrl="/onboarding" fallbackRedirectUrl="/onboarding" />
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        Stuck on email OTP?{' '}
        <Link href="/dev-login" style={{ color: 'var(--action-primary)', fontWeight: 650 }}>
          Use local password/ticket login
        </Link>
      </p>
    </main>
  );
}
