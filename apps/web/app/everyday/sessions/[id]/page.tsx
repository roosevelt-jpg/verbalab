import { EverydaySessionClient } from './session-client';

export default async function EverydaySessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EverydaySessionClient sessionId={id} />;
}
