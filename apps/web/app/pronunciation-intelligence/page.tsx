import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PronunciationIntelligenceClient } from './pronunciation-intelligence-client';

export default function PronunciationIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <PronunciationIntelligenceClient />;
}
