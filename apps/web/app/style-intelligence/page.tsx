import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { StyleIntelligenceClient } from './style-intelligence-client';

export default function StyleIntelligencePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <StyleIntelligenceClient />;
}
