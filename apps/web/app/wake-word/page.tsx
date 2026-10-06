import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { WakeWordClient } from './wake-word-client';

export default function WakeWordPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <WakeWordClient />;
}
