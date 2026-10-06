import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { CulturalIntelligenceClient } from './cultural-intelligence-client';

export default function CulturalIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <CulturalIntelligenceClient />;
}
