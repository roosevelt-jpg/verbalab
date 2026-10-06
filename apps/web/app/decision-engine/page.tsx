import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DecisionEngineClient } from './decision-engine-client';

export default function DecisionEnginePage {
  if (!isClerkConfigured) redirect('/setup');
  return <DecisionEngineClient />;
}
