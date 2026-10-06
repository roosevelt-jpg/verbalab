import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AiPublicationPlatformClient } from './ai-publication-platform-client';

export default function AiPublicationPlatformPage {
  if (!isClerkConfigured) redirect('/setup');
  return <AiPublicationPlatformClient />;
}
