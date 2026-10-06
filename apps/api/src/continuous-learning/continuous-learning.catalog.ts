/**
 * Library Phase 156 → Continuous Learning.
 * CRITICAL: never auto-promote. Requires humanApproval + drift clear + continuous eval pass + vetted feedback.
 */
import { continuousEvalGateStatus } from '../continuous-evaluation/continuous-evaluation.catalog';
import { driftClearStatus } from '../ai-drift-detection/ai-drift-detection.catalog';

export type LearningFeedbackItem = {
  id: string;
  source: string;
  vetted: boolean;
  poisonedSuspect: boolean;
  humanReviewed: boolean;
  notes: string;
};

export type PromoteCandidate = {
  id: string;
  name: string;
  artifactKind: 'model' | 'prompt' | 'knowledge';
  humanApproved: boolean;
  feedbackIds: string[];
  notes: string;
};

export function continuousLearningFeedback: LearningFeedbackItem[] {
  return [
    {
      id: 'fb-vetted-001',
      source: 'production-thumbs',
      vetted: true,
      poisonedSuspect: false,
      humanReviewed: true,
      notes: 'Human-reviewed production feedback.',
    },
    {
      id: 'fb-poison-001',
      source: 'anonymous-bulk',
      vetted: false,
      poisonedSuspect: true,
      humanReviewed: false,
      notes: 'Rejected — poisoned-input suspect; not usable for retrain.',
    },
    {
      id: 'fb-unvetted-001',
      source: 'raw-logs',
      vetted: false,
      poisonedSuspect: false,
      humanReviewed: false,
      notes: 'Unvetted — blocked by poisonedInputGuard until reviewed.',
    },
  ];
}

export function continuousLearningCandidates: PromoteCandidate[] {
  return [
    {
      id: 'promo-ready-001',
      name: 'Support agent LoRA v2',
      artifactKind: 'model',
      humanApproved: true,
      feedbackIds: ['fb-vetted-001'],
      notes: 'Human approved; uses only vetted feedback.',
    },
    {
      id: 'promo-blocked-human-001',
      name: 'Tone DPO candidate',
      artifactKind: 'model',
      humanApproved: false,
      feedbackIds: ['fb-vetted-001'],
      notes: 'Missing human approval — cannot promote.',
    },
    {
      id: 'promo-blocked-poison-001',
      name: 'Poisoned feedback retrain',
      artifactKind: 'model',
      humanApproved: true,
      feedbackIds: ['fb-poison-001'],
      notes: 'Includes poisoned feedback — blocked.',
    },
  ];
}

export type PromoteCheckResult = {
  allowed: boolean;
  reason: string;
  humanApprovalRequiredBeforePromote: true;
  poisonedInputGuard: true;
  requiresDriftClear: true;
  requiresContinuousEvalPass: true;
  humanApproved: boolean;
  driftClear: boolean;
  continuousEvalPass: boolean;
  feedbackVetted: boolean;
  autoPromote: false;
};

export function evaluatePromote(candidateId: string): PromoteCheckResult & { candidate?: PromoteCandidate } {
  const candidates = continuousLearningCandidates;
  const candidate = candidates.find((c) => c.id === candidateId);
  const drift = driftClearStatus;
  const evalStatus = continuousEvalGateStatus;
  const feedback = continuousLearningFeedback;

  const base = {
    humanApprovalRequiredBeforePromote: true as const,
    poisonedInputGuard: true as const,
    requiresDriftClear: true as const,
    requiresContinuousEvalPass: true as const,
    autoPromote: false as const,
    driftClear: drift.driftClear,
    continuousEvalPass: evalStatus.continuousEvalPass,
  };

  if (!candidate) {
    return {
      ...base,
      allowed: false,
      reason: `Unknown promote candidate: ${candidateId}`,
      humanApproved: false,
      feedbackVetted: false,
    };
  }

  const usedFeedback = feedback.filter((f) => candidate.feedbackIds.includes(f.id));
  const feedbackVetted =
    usedFeedback.length > 0 &&
    usedFeedback.every((f) => f.vetted && !f.poisonedSuspect && f.humanReviewed);

  if (!candidate.humanApproved) {
    return {
      ...base,
      candidate,
      allowed: false,
      reason: 'Human approval required before promote — auto-promote is disabled.',
      humanApproved: false,
      feedbackVetted,
    };
  }
  if (!feedbackVetted) {
    return {
      ...base,
      candidate,
      allowed: false,
      reason: 'Poisoned/unvetted feedback rejected — poisonedInputGuard blocked promote.',
      humanApproved: true,
      feedbackVetted: false,
    };
  }
  if (!drift.driftClear) {
    return {
      ...base,
      candidate,
      allowed: false,
      reason: 'Drift Detection alert — requiresDriftClear blocked promote.',
      humanApproved: true,
      feedbackVetted: true,
    };
  }
  if (!evalStatus.continuousEvalPass) {
    return {
      ...base,
      candidate,
      allowed: false,
      reason: 'Continuous Evaluation gates failed — requiresContinuousEvalPass blocked promote.',
      humanApproved: true,
      feedbackVetted: true,
    };
  }

  return {
    ...base,
    candidate,
    allowed: true,
    reason: 'All promote gates passed: human approval, drift clear, continuous eval pass, vetted feedback.',
    humanApproved: true,
    feedbackVetted: true,
  };
}

export function continuousLearningEngineCatalog {
  return {
    product: 'Lugemi Continuous Learning',
    capabilities: [
      { id: 'feedback-collection', name: 'Feedback collection', status: 'shipped', notes: 'Collect production feedback.' },
      { id: 'human-review', name: 'Human review', status: 'shipped', notes: 'Required before promote.' },
      { id: 'retrain-triggers', name: 'Retrain triggers', status: 'shipped', notes: 'Trigger catalog — promote still gated.' },
      { id: 'synthetic', name: 'Synthetic data', status: 'shipped', notes: 'Synthetic augment — labeled.' },
      { id: 'knowledge-updates', name: 'Knowledge updates', status: 'shipped', notes: 'Knowledge refresh candidates.' },
      { id: 'model-refresh', name: 'Model refresh', status: 'shipped', notes: 'Model candidates — gated promote.' },
      { id: 'prompt-updates', name: 'Prompt updates', status: 'shipped', notes: 'Prompt candidates — gated promote.' },
    ],
    feedback: continuousLearningFeedback,
    candidates: continuousLearningCandidates,
    honesty: {
      humanApprovalRequiredBeforePromote: true,
      poisonedInputGuard: true,
      requiresDriftClear: true,
      requiresContinuousEvalPass: true,
      autoPromote: false,
      trustCloudOs: false,
    },
    safety: {
      humanApprovalRequiredBeforePromote: true,
      poisonedInputGuard: true,
      requiresDriftClear: true,
      requiresContinuousEvalPass: true,
      autoPromote: false,
      note:
        'Never auto-promote. Promote requires human approval + drift clear + continuous eval pass + vetted non-poisoned feedback.',
    },
    docs: '/docs/CONTINUOUS_LEARNING.md',
    note: 'Continuous Learning. Feedback/review/retrain/synthetic/knowledge/model/prompt updates with hard promote gates.',
  };
}
