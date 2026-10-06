import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { TmClient } from './tm-client';

export default function TmPage {
  if (!isClerkConfigured) redirect('/setup');
  return <TmClient />;
}
