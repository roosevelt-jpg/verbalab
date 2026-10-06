import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { LocalesClient } from './locales-client';

export default function LocalesPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <LocalesClient />;
}
