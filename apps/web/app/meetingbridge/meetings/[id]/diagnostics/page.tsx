import { MeetingBridgeDiagnosticsClient } from './diagnostics-client';

export default async function MeetingBridgeDiagnosticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MeetingBridgeDiagnosticsClient meetingId={id} />;
}
