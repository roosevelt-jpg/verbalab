import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { CountriesClient } from './countries-client';

export default function CountriesPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <CountriesClient />;
}
