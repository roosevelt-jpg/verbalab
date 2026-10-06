import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { GpuPlatformClient } from './gpu-platform-client';

export default function GpuPlatformPage {
  if (!isClerkConfigured) redirect('/setup');
  return <GpuPlatformClient />;
}
