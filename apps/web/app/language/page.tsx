import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { LanguageClient } from './language-client';

export default function LanguagePage {
  if (!isClerkConfigured) redirect('/setup');
  return <LanguageClient />;
}
