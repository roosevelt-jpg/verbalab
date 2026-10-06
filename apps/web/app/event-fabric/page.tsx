import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { EventFabricClient } from './event-fabric-client';

export default function EventFabricPage {
  if (!isClerkConfigured) redirect('/setup');
  return <EventFabricClient />;
}
