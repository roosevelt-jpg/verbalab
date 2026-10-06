import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ConnectorsClient } from './connectors-client';

export default function ConnectorsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ConnectorsClient />;
}
