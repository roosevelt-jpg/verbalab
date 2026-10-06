import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { BillingClient } from './billing-client';

export default function BillingPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <BillingClient />;
}
