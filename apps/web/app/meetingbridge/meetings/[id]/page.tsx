import { MeetingBridgeMeetingClient } from './meeting-client';

export default async function MeetingBridgeMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MeetingBridgeMeetingClient meetingId={id} />;
}
