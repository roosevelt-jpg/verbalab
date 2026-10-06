import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DialectsClient } from './dialects-client';

export default function DialectsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <DialectsClient />;
}
