import { DealBridgeSessionClient } from './session-client';

export default async function DealBridgeSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DealBridgeSessionClient sessionId={id} />;
}
