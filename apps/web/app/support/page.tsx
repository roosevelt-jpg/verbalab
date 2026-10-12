import type { Metadata } from 'next';
import { SupportClient } from './support-client';

export const metadata: Metadata = {
  title: 'Support · Lugemi',
  description:
    'Message Lugemi Support, escalate from chat to a human, and join the community forum for API integration tips.',
};

export default function SupportPage() {
  return <SupportClient />;
}
