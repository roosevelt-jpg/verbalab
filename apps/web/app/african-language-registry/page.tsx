import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AfricanLanguageRegistryClient } from './african-language-registry-client';

export default function AfricanLanguageRegistryPage {
  if (!isClerkConfigured) redirect('/setup');
  return <AfricanLanguageRegistryClient />;
}
