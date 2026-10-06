import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { BuildersClient } from './builders-client';

export default function BuildersPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <BuildersClient />;
}
