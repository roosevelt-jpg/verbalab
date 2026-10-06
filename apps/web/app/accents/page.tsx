import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AccentsClient } from './accents-client';

export default function AccentsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <AccentsClient />;
}
