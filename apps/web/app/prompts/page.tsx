import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PromptsClient } from './prompts-client';

export default function PromptsPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <PromptsClient />;
}
