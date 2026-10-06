import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PatentInnovationPlatformClient } from './patent-innovation-platform-client';

export default function PatentInnovationPlatformPage {
  if (!isClerkConfigured) redirect('/setup');
  return <PatentInnovationPlatformClient />;
}
