import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { KeysClient } from './keys-client';

export default function KeysPage {
  if (!isClerkConfigured) redirect('/setup');
  return <KeysClient />;
}
