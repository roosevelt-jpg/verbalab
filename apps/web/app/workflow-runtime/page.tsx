import { Suspense } from 'react';
import { WorkflowRuntimeClient } from './workflow-runtime-client';

export default function WorkflowRuntimePage {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading…</div>}>
      <WorkflowRuntimeClient />
    </Suspense>
  );
}
