import { EverydaySessionClient } from './session-client';

export default async function EverydaySessionPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  return <EverydaySessionClient sessionId={resolved.id} />;
}
