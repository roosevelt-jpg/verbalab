import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { DealState } from './dealbridge.types';

const TRANSITIONS: Record<DealState, DealState[]> = {
  draft: ['invited', 'active', 'cancelled', 'expired'],
  invited: ['active', 'cancelled', 'expired'],
  active: ['reviewing', 'clarifying', 'cancelled', 'expired', 'declined'],
  reviewing: ['clarifying', 'awaiting_confirmations', 'active', 'cancelled', 'expired', 'declined'],
  clarifying: [
    'reviewing',
    'awaiting_confirmations',
    'active',
    'cancelled',
    'expired',
    'declined',
  ],
  awaiting_confirmations: ['issued', 'clarifying', 'reviewing', 'active', 'declined', 'cancelled', 'expired'],
  issued: ['reviewing', 'active'], // amendment starts a new review cycle; prior receipt stays historical
  declined: [],
  cancelled: [],
  expired: [],
};

export function assertTransition(from: DealState, to: DealState) {
  if (from === to) return;
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ApiException(
      'invalid_state_transition',
      `DealBridge cannot move from "${from}" to "${to}"`,
      HttpStatus.CONFLICT,
    );
  }
}

export function isTerminal(state: DealState): boolean {
  return state === 'declined' || state === 'cancelled' || state === 'expired';
}

export function canAcceptTurns(state: DealState): boolean {
  return state === 'active' || state === 'reviewing' || state === 'clarifying';
}

export function canConfirm(state: DealState): boolean {
  return state === 'awaiting_confirmations';
}
