import { DealBridgeJoinClient } from './join-client';

export default async function DealBridgeJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <DealBridgeJoinClient token={token} />;
}
