import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EvaluationPlatformClient } from './evaluation-platform-client';

export default function EvaluationPlatformPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <EvaluationPlatformClient />;
}
