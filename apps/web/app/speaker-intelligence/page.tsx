import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { SpeakerIntelligenceClient } from './speaker-intelligence-client';

export default function SpeakerIntelligencePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <SpeakerIntelligenceClient />;
}
