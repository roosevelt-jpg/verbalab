import { AssuranceRunClient } from './run-client';

export default async function LanguageAssuranceRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssuranceRunClient runId={id} />;
}
