import { SignUp } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';

const afterAuth =
  process.env.NEXT_PUBLIC_SKIP_ONBOARDING === '1'
    ? '/onboarding?skipOnboarding=1'
    : '/onboarding';

export default function SignUpPage() {
  if (!isClerkConfigured()) redirect('/setup');

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <SignUp forceRedirectUrl={afterAuth} fallbackRedirectUrl={afterAuth} />
    </main>
  );
}
