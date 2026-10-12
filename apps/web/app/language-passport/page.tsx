import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { LanguagePassportClient } from './language-passport-client';

export default function LanguagePassportPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <LanguagePassportClient />;
}
