import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { InterpretClient } from './interpret-client';

export default function InterpretPage {
  if (!isClerkConfigured) redirect('/setup');
  return <InterpretClient />;
}
