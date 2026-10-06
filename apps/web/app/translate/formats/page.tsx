import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { TranslateFormatsClient } from './formats-client';

export default function TranslateFormatsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <TranslateFormatsClient />;
}
