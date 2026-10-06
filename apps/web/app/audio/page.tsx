import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AudioClient } from './audio-client';

export default function AudioPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AudioClient />;
}
