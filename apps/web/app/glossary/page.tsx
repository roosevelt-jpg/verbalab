import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { GlossaryClient } from './glossary-client';

export default function GlossaryPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <GlossaryClient />;
}
