import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelEvaluationPlatformClient } from './model-evaluation-platform-client';

export default function ModelEvaluationPlatformPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ModelEvaluationPlatformClient />;
}
