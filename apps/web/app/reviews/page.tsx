import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ReviewsClient } from './reviews-client';

export default function ReviewsPage {
  if (!isClerkConfigured) redirect('/setup');
  return <ReviewsClient />;
}
