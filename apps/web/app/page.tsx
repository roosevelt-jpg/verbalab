import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { authBackend, LUGEMI_SESSION_COOKIE } from '@/lib/auth/config';
import { MarketingHome } from '@/components/marketing/marketing-home';
import { getCmsDocument } from '@/lib/cms';
import { buildCmsMetadata } from '@/lib/cms-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata('/', { absoluteTitle: true });
}

export default async function HomePage() {
  if (!isClerkConfigured()) {
    redirect('/setup');
  }

  const backend = authBackend();
  if (backend === 'firebase') {
    const jar = await cookies();
    if (jar.get(LUGEMI_SESSION_COOKIE)?.value) {
      redirect('/dashboard');
    }
  } else if (backend === 'clerk') {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    if (session.userId) {
      redirect('/dashboard');
    }
  }

  const content = await getCmsDocument();
  return <MarketingHome content={content} />;
}
