import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { MarketingHome } from '@/components/marketing/marketing-home';

export default async function HomePage() {
  if (!isClerkConfigured()) {
    redirect('/setup');
  }

  const session = await auth();
  if (session.userId) {
    redirect('/dashboard');
  }

  return <MarketingHome />;
}
