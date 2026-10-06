import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { FinancialIntelligenceClient } from './financial-intelligence-client';

export default function FinancialIntelligencePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <FinancialIntelligenceClient />;
}
