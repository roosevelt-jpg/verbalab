import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { GrammarIntelligenceClient } from './grammar-intelligence-client';

export default function GrammarIntelligencePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <GrammarIntelligenceClient />;
}
