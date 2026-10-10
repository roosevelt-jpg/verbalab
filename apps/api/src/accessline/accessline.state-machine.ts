import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { ACCESSLINE_STATES, type AccessLineState } from './accessline.types';

const ALLOWED: Record<AccessLineState, AccessLineState[]> = {
  ringing: ['disclosure', 'ended', 'failed'],
  disclosure: ['language_selection', 'ending', 'ended', 'failed'],
  language_selection: ['unauthenticated', 'ending', 'ended', 'failed'],
  unauthenticated: ['authenticating', 'assisting', 'handoff_pending', 'ending', 'ended', 'failed'],
  authenticating: ['assisting', 'unauthenticated', 'handoff_pending', 'ending', 'ended', 'failed'],
  assisting: ['clarifying', 'handoff_pending', 'ending', 'ended', 'failed', 'assisting'],
  clarifying: ['assisting', 'handoff_pending', 'ending', 'ended', 'failed'],
  handoff_pending: ['human_connected', 'ending', 'ended', 'failed', 'assisting'],
  human_connected: ['ending', 'ended', 'failed'],
  ending: ['ended', 'failed'],
  ended: [],
  failed: [],
};

export function assertAccessLineTransition(from: string, to: AccessLineState): void {
  if (!(ACCESSLINE_STATES as readonly string[]).includes(from)) {
    throw new ApiException('validation_error', `Unknown AccessLine state '${from}'`, HttpStatus.BAD_REQUEST);
  }
  if (from === to) return;
  const next = ALLOWED[from as AccessLineState] ?? [];
  if (!next.includes(to)) {
    throw new ApiException(
      'invalid_state_transition',
      `AccessLine cannot transition ${from} → ${to}`,
      HttpStatus.CONFLICT,
    );
  }
}
