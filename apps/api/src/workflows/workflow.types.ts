export const WORKFLOW_OPS = ['transcribe', 'translate', 'notify'] as const;
export type WorkflowOp = (typeof WORKFLOW_OPS)[number];

export const WORKFLOW_MAX_STEPS = 10;

export type WorkflowStepBase = {
  id: string;
  op: WorkflowOp;
};

export type TranscribeStep = WorkflowStepBase & {
  op: 'transcribe';
  documentId: string;
  language?: string;
};

export type TranslateStep = WorkflowStepBase & {
  op: 'translate';
  source: string;
  target: string;
  /** Literal text and/or `{{stepId.field}}` placeholders. */
  text: string;
};

export type NotifyStep = WorkflowStepBase & {
  op: 'notify';
  channel: 'email' | 'webhook';
  message: string;
  subject?: string;
  /** Required when channel=webhook. */
  webhookUrl?: string;
};

export type WorkflowStep = TranscribeStep | TranslateStep | NotifyStep;

export type WorkflowInput = {
  workflowId?: string;
  name?: string;
  steps: WorkflowStep[];
};

export type WorkflowStepResult = {
  id: string;
  op: WorkflowOp;
  output: Record<string, unknown>;
};

export type WorkflowResult = {
  workflowId: string | null;
  name: string | null;
  steps: WorkflowStepResult[];
};
