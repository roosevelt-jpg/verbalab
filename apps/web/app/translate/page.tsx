import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { TranslateClient } from './translate-client';

export default function TranslatePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return (
    <Suspense fallback={null}>
      <TranslateClient />
    </Suspense>
  );
}
