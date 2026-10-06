import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { CostOptimizationClient } from './cost-optimization-client';

export default function CostOptimizationPage {
  if (!isClerkConfigured) redirect('/setup');
  return <CostOptimizationClient />;
}
