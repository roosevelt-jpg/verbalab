import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EducationIntelligenceClient } from './education-intelligence-client';

export default function EducationIntelligencePage {
  if (!isClerkConfigured) redirect('/setup');
  return <EducationIntelligenceClient />;
}
