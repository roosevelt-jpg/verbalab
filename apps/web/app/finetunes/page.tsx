import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { FinetunesClient } from './finetunes-client';

export default function FinetunesPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <FinetunesClient />;
}
