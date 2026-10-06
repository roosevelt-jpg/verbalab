import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { OpenSciencePlatformClient } from './open-science-platform-client';

export default function OpenSciencePlatformPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <OpenSciencePlatformClient />;
}
