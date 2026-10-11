import { EmbedPlayerClient } from './embed-player-client';

export default async function EmbedPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmbedPlayerClient id={id} />;
}
