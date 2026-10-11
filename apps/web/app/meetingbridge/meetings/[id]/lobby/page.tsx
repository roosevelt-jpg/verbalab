import { MeetingBridgeLobbyClient } from './lobby-client';

export default async function MeetingBridgeLobbyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MeetingBridgeLobbyClient meetingId={id} />;
}
