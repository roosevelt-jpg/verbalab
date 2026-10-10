import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { GovernmentIntelligenceClient } from './government-intelligence-client';

export default function GovernmentIntelligencePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <GovernmentIntelligenceClient />;
}
