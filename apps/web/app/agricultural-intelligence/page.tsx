import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AgriculturalIntelligenceClient } from './agricultural-intelligence-client';

export default function AgriculturalIntelligencePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AgriculturalIntelligenceClient />;
}
