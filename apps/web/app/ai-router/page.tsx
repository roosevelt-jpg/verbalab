import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AiRouterClient } from './ai-router-client';

export default function AiRouterPage {
  if (!isClerkConfigured) redirect('/setup');
  return <AiRouterClient />;
}
