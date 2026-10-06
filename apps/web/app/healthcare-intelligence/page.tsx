import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { HealthcareIntelligenceClient } from './healthcare-intelligence-client';

export default function HealthcareIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <HealthcareIntelligenceClient />;
}
