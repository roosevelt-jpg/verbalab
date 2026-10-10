import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AtlasClient } from './atlas-client';

export default function AtlasPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AtlasClient />;
}
