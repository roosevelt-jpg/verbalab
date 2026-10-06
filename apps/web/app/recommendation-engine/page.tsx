import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { RecommendationEngineClient } from './recommendation-engine-client';

export default function RecommendationEnginePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <RecommendationEngineClient />;
}
