import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { PlaygroundClient } from './playground-client';

export default function PlaygroundPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <PlaygroundClient />;
}
