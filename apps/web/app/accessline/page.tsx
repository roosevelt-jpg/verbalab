import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AccessLineClient } from './accessline-client';

export default function AccessLinePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AccessLineClient />;
}
