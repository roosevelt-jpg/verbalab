import { SignUp } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';

export default function SignUpPage() {
  if (!isClerkConfigured()) redirect('/setup');

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <SignUp />
    </main>
  );
}
