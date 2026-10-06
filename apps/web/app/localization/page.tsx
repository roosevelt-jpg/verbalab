import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { LocalizationClient } from './localization-client';

export default function LocalizationPage {
  if (!isClerkConfigured) redirect('/setup');
  return <LocalizationClient />;
}
