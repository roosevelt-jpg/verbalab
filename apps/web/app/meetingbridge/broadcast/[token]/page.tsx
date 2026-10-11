import { MeetingBridgeBroadcastClient } from './broadcast-client';

export default async function MeetingBridgeBroadcastPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <MeetingBridgeBroadcastClient token={token} />;
}
