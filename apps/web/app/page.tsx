import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { MarketingHome } from '@/components/marketing/marketing-home';
import { getCmsDocument } from '@/lib/cms';

export default async function HomePage() {
  if (!isClerkConfigured()) {
    redirect('/setup');
  }

  const session = await auth();
  if (session.userId) {
    redirect('/dashboard');
  }

  const content = await getCmsDocument();
  return <MarketingHome content={content} />;
}
