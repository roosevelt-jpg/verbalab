import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AiKernelClient } from './ai-kernel-client';

export default function AiKernelPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AiKernelClient />;
}
