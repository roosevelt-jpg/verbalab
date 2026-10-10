import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import type { MessageState, VariantState } from './voicebridge.types';

const MESSAGE_TRANSITIONS: Record<MessageState, MessageState[]> = {
  draft: ['uploading', 'transcribing', 'awaiting_review', 'deleted'],
  uploading: ['transcribing', 'awaiting_review', 'deleted'],
  transcribing: ['awaiting_review', 'deleted'],
  awaiting_review: ['published', 'deleted'],
  published: ['withdrawn', 'deleted'],
  withdrawn: ['deleted'],
  deleted: [],
};

const VARIANT_TRANSITIONS: Record<VariantState, VariantState[]> = {
  queued: ['translating', 'failed', 'unsupported'],
  translating: ['verifying', 'text_ready', 'failed', 'unsupported'],
  verifying: ['text_ready', 'needs_clarification', 'failed'],
  text_ready: ['synthesizing', 'ready', 'failed'],
  synthesizing: ['ready', 'failed'],
  ready: [],
  needs_clarification: ['translating', 'failed'],
  failed: ['queued'],
  unsupported: [],
};

export function assertMessageTransition(from: MessageState, to: MessageState) {
  if (!MESSAGE_TRANSITIONS[from]?.includes(to)) {
    throw new ApiException(
      'conflict',
      `Illegal VoiceBridge message transition ${from} → ${to}`,
      HttpStatus.CONFLICT,
    );
  }
}

export function assertVariantTransition(from: VariantState, to: VariantState) {
  if (!VARIANT_TRANSITIONS[from]?.includes(to)) {
    throw new ApiException(
      'conflict',
      `Illegal VoiceBridge variant transition ${from} → ${to}`,
      HttpStatus.CONFLICT,
    );
  }
}
