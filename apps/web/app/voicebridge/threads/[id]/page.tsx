import { VoiceBridgeThreadClient } from './thread-client';

export default async function VoiceBridgeThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VoiceBridgeThreadClient threadId={id} />;
}
