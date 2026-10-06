import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AccentIntelligenceClient } from './accent-intelligence-client';

export default function AccentIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <AccentIntelligenceClient />;
}
