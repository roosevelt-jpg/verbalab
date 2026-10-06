import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DevelopersClient } from './developers-client';

export default function DevelopersPage {
  if (!isClerkConfigured) redirect('/setup');
  return <DevelopersClient />;
}
