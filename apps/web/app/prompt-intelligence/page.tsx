import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PromptIntelligenceClient } from './prompt-intelligence-client';

export default function PromptIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <PromptIntelligenceClient />;
}
