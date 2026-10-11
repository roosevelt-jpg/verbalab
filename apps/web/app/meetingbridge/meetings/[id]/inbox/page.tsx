import { MeetingBridgeInboxClient } from './inbox-client';

export default async function MeetingBridgeInboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MeetingBridgeInboxClient meetingId={id} />;
}
