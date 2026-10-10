import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { DataClient } from './data-client';

export default function DataPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <DataClient />;
}
