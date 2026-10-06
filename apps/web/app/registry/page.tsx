import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { RegistryClient } from './registry-client';

export default function RegistryPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <RegistryClient />;
}
