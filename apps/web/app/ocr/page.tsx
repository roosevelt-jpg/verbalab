import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { OcrClient } from './ocr-client';

export default function OcrPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <OcrClient />;
}
