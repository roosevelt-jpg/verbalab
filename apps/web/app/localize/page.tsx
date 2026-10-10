import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { LocalizeClient } from './localize-client';

export default function LocalizePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <LocalizeClient />;
}
