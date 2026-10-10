import type { Metadata } from 'next';
import { RecorderClient } from './recorder-client';

export const metadata: Metadata = {
  title: 'Lugemi voice recording',
  robots: { index: false, follow: false },
};

export default async function RecordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <RecorderClient token={token} />;
}
