import { CreativeVideoProjectClient } from './project-client';

export default async function CreativeVideoProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreativeVideoProjectClient projectId={id} />;
}
