import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EmotionIntelligenceClient } from './emotion-intelligence-client';

export default function EmotionIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <EmotionIntelligenceClient />;
}
