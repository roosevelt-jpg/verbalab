import { VoiceBridgeJoinClient } from './join-client';

export default async function VoiceBridgeJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <VoiceBridgeJoinClient token={token} />;
}
