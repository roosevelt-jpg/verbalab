import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PromptRuntimeClient } from './prompt-runtime-client';

export default function PromptRuntimePage {
  if (!isClerkConfigured) redirect('/setup');
  return <PromptRuntimeClient />;
}
