import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { VectorCloudClient } from './vector-cloud-client';

export default function VectorCloudPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <VectorCloudClient />;
}
