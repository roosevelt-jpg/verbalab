import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { TourismHeritageIntelligenceClient } from './tourism-heritage-intelligence-client';

export default function TourismHeritageIntelligencePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <TourismHeritageIntelligenceClient />;
}
