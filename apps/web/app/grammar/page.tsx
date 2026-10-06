import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { GrammarClient } from './grammar-client';

export default function GrammarPage {
  if (!isClerkConfigured) redirect('/setup');
  return <GrammarClient />;
}
