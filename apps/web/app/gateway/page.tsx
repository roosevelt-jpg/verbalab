import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { GatewayClient } from './gateway-client';

export default function GatewayPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <GatewayClient />;
}
