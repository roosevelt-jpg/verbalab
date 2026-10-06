import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { CallIntelligenceClient } from './call-intelligence-client';

export default function CallIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <CallIntelligenceClient />;
}
