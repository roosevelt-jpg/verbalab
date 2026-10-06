import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { StyleClient } from './style-client';

export default function StylePage {
  if (!isClerkConfigured) redirect('/setup');
  return <StyleClient />;
}
