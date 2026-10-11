import { LearnBackSessionClient } from './session-client';

export default async function LearnBackSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LearnBackSessionClient sessionId={id} />;
}
