import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelTrainingPlatformClient } from './model-training-platform-client';

export default function ModelTrainingPlatformPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ModelTrainingPlatformClient />;
}
