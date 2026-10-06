import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { SyntheticDataPlatformClient } from './synthetic-data-platform-client';

export default function SyntheticDataPlatformPage {
  if (!isClerkConfigured) redirect('/setup');
  return <SyntheticDataPlatformClient />;
}
