import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { LanguageIntelligenceClient } from './language-intelligence-client';

export default function LanguageIntelligencePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <LanguageIntelligenceClient />;
}
