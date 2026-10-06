import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { CreatorEconomyClient } from './creator-economy-client';

export default function CreatorEconomyPage {
  if (!isClerkConfigured) redirect('/setup');
  return <CreatorEconomyClient />;
}
