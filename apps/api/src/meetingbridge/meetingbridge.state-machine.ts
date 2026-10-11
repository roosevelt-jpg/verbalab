import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import type { ItemState, MeetingState } from './meetingbridge.types';

const MEETING_TRANSITIONS: Record<MeetingState, MeetingState[]> = {
  scheduled: ['lobby', 'cancelled'],
  lobby: ['live', 'cancelled'],
  live: ['processing', 'cancelled'],
  processing: ['reviewing', 'cancelled'],
  reviewing: ['minutes_issued', 'cancelled'],
  minutes_issued: [],
  cancelled: [],
};

const ITEM_TRANSITIONS: Record<ItemState, ItemState[]> = {
  proposed: ['reviewing', 'clarification_required', 'cancelled', 'superseded'],
  reviewing: [
    'partially_confirmed',
    'confirmed',
    'declined',
    'disputed',
    'clarification_required',
    'superseded',
    'cancelled',
  ],
  clarification_required: ['reviewing', 'superseded', 'cancelled'],
  partially_confirmed: ['confirmed', 'declined', 'disputed', 'superseded', 'cancelled'],
  confirmed: ['superseded'],
  declined: ['superseded'],
  disputed: ['reviewing', 'superseded', 'cancelled'],
  superseded: [],
  cancelled: [],
};

export function assertMeetingTransition(from: MeetingState, to: MeetingState) {
  if (!MEETING_TRANSITIONS[from]?.includes(to)) {
    throw new ApiException(
      'conflict',
      `Illegal MeetingBridge meeting transition ${from} → ${to}`,
      HttpStatus.CONFLICT,
    );
  }
}

export function assertItemTransition(from: ItemState, to: ItemState) {
  if (!ITEM_TRANSITIONS[from]?.includes(to)) {
    throw new ApiException(
      'conflict',
      `Illegal MeetingBridge item transition ${from} → ${to}`,
      HttpStatus.CONFLICT,
    );
  }
}
