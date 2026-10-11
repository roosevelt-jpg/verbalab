import { MeetingBridgeJoinClient } from './join-client';

export default async function MeetingBridgeJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <MeetingBridgeJoinClient token={token} />;
}
