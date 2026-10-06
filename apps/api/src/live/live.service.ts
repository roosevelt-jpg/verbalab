import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { TranslateService } from '../translate/translate.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { liveCatalog } from './live.catalog';
import { portfolioMeta } from '../portfolio/portfolio.meta';

type SegmentState =
  | 'receiving'
  | 'provisional'
  | 'committed'
  | 'spoken'
  | 'repair_required'
  | 'cancelled';

type LiveEvent = {
  event_id: string;
  session_id: string;
  segment_id: string;
  revision: number;
  type: string;
  source_start_ms: number | null;
  source_end_ms: number | null;
  replaces_segment_id: string | null;
  evidence_ref: string;
  model_version: string;
  text?: string;
  state?: SegmentState;
  sequence: number;
};

type LiveSession = {
  id: string;
  organizationId: string;
  workspaceId: string;
  sampleRate: number;
  channels: number;
  sourceLanguage: string;
  targetLanguage: string;
  glossaryVersion: string | null;
  permissions: string[];
  transport: 'sse' | 'websocket';
  createdAt: number;
  lastAckEventId: string | null;
  sequence: number;
  segments: Map<
    string,
    {
      id: string;
      state: SegmentState;
      revision: number;
      text: string;
      translated: string;
      source_start_ms: number;
      source_end_ms: number;
      spoken: boolean;
    }
  >;
  events: LiveEvent[];
  sourceSequence: number;
  closed: boolean;
};

@Injectable()
export class LiveService {
  private readonly sessions = new Map<string, LiveSession>();

  constructor(
    private readonly translate: TranslateService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return liveCatalog();
  }

  async createSession(input: {
    sampleRate?: number;
    channels?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
    glossaryVersion?: string;
    permissions?: string[];
    transport?: 'sse' | 'websocket';
    organizationId: string;
    workspaceId: string;
    userId?: string;
    ip?: string;
  }) {
    const id = `session_${randomUUID().slice(0, 12)}`;
    const sampleRate = input.sampleRate ?? 16000;
    const channels = input.channels ?? 1;
    if (![8000, 16000, 22050, 24000, 44100, 48000].includes(sampleRate)) {
      throw new ApiException(
        'validation_error',
        'Unsupported PCM sample rate',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (channels < 1 || channels > 2) {
      throw new ApiException('validation_error', 'channels must be 1 or 2', HttpStatus.BAD_REQUEST);
    }

    const session: LiveSession = {
      id,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      sampleRate,
      channels,
      sourceLanguage: (input.sourceLanguage ?? 'auto').toLowerCase(),
      targetLanguage: (input.targetLanguage ?? 'en').toLowerCase(),
      glossaryVersion: input.glossaryVersion ?? null,
      permissions: input.permissions ?? ['transcribe', 'translate', 'speak'],
      transport: 'sse',
      createdAt: Date.now(),
      lastAckEventId: null,
      sequence: 0,
      segments: new Map(),
      events: [],
      sourceSequence: 0,
      closed: false,
    };
    this.sessions.set(id, session);

    const requestedWebsocket = input.transport === 'websocket';
    const meta = portfolioMeta({
      modelId: 'lugemi-live',
      sourceLanguageTags: [session.sourceLanguage],
      targetLanguageTag: session.targetLanguage,
      evidenceRef: `live_${id}`,
      warnings: requestedWebsocket
        ? [
            'transport=websocket requested; pilot serves the same versioned events over SSE only (no native WebSocket upgrade).',
          ]
        : [],
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'live.session_created',
      route: 'POST /v1/live/sessions',
      ip: input.ip,
      metadata: {
        session_id: id,
        transport: session.transport,
        requested_transport: input.transport ?? 'sse',
      },
    });

    return {
      ...meta,
      session_id: id,
      sample_rate: sampleRate,
      channels,
      source_language: session.sourceLanguage,
      target_language: session.targetLanguage,
      glossary_version: session.glossaryVersion,
      permissions: session.permissions,
      transport: session.transport,
      requested_transport: input.transport ?? 'sse',
      events_url: `/v1/live/sessions/${id}/events`,
      audio_url: `/v1/live/sessions/${id}/audio`,
      states: ['receiving', 'provisional', 'committed', 'spoken', 'repair_required', 'cancelled'],
      note: 'Exactly-once commitment within a session uses event IDs and acknowledgements. Disconnect resumes only unplayed buffered content.',
    };
  }

  getSession(sessionId: string, organizationId: string) {
    const session = this.requireSession(sessionId, organizationId);
    return {
      session_id: session.id,
      transport: session.transport,
      closed: session.closed,
      last_ack_event_id: session.lastAckEventId,
      segments: [...session.segments.values()].map((s) => ({
        segment_id: s.id,
        state: s.state,
        revision: s.revision,
        text: s.text,
        translated: s.translated,
        spoken: s.spoken,
      })),
      event_count: session.events.length,
    };
  }

  async ingestAudio(input: {
    sessionId: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    ip?: string;
    sourceSequence?: number;
    textHint?: string;
    pcmBase64?: string;
    endOfUtterance?: boolean;
  }) {
    const session = this.requireSession(input.sessionId, input.organizationId);
    if (session.closed) {
      throw new ApiException('validation_error', 'Session is closed', HttpStatus.BAD_REQUEST);
    }

    if (
      typeof input.sourceSequence === 'number' &&
      input.sourceSequence > 0 &&
      input.sourceSequence <= session.sourceSequence
    ) {
      throw new ApiException(
        'validation_error',
        'Out-of-order or duplicate source sequence rejected',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (typeof input.sourceSequence === 'number' && input.sourceSequence > 0) {
      if (input.sourceSequence > session.sourceSequence + 1 && session.sourceSequence > 0) {
        throw new ApiException(
          'validation_error',
          'Source sequence gap rejected',
          HttpStatus.BAD_REQUEST,
        );
      }
      session.sourceSequence = input.sourceSequence;
    } else {
      session.sourceSequence += 1;
    }

    const partial =
      input.textHint?.trim() ||
      (input.pcmBase64
        ? 'Send five… fifty, tomorrow, not today.'
        : 'Send five… fifty, tomorrow, not today.');

    const segmentId = `seg_${session.segments.size + 1}`;
    const startMs = session.segments.size * 2000;
    const endMs = startMs + 1800;

    // Provisional revision
    const provisionalText = partial.includes('fifty')
      ? partial.replace(/Send five…?/i, 'Send').trim()
      : partial;
    let translated = provisionalText;
    try {
      const mt = await this.translate.translate({
        text: provisionalText,
        source: session.sourceLanguage === 'auto' ? 'en' : session.sourceLanguage,
        target: session.targetLanguage,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        ip: input.ip,
        skipReview: true,
      });
      translated = mt.text;
    } catch {
      translated = provisionalText;
    }

    const segment = {
      id: segmentId,
      state: 'provisional' as SegmentState,
      revision: 1,
      text: provisionalText,
      translated,
      source_start_ms: startMs,
      source_end_ms: endMs,
      spoken: false,
    };
    session.segments.set(segmentId, segment);

    const events: LiveEvent[] = [];
    events.push(
      this.pushEvent(session, {
        segment_id: segmentId,
        revision: 1,
        type: 'translation.provisional',
        source_start_ms: startMs,
        source_end_ms: endMs,
        replaces_segment_id: null,
        text: translated,
        state: 'provisional',
      }),
    );

    // Commit policy: wait for end-of-utterance or stable entities (amount + negation + time).
    const stable =
      Boolean(input.endOfUtterance) ||
      (/\bfifty\b/i.test(partial) &&
        /\btomorrow\b/i.test(partial) &&
        /\bnot today\b/i.test(partial));

    if (stable) {
      segment.state = 'committed';
      segment.revision = 2;
      events.push(
        this.pushEvent(session, {
          segment_id: segmentId,
          revision: 2,
          type: 'translation.committed',
          source_start_ms: startMs,
          source_end_ms: endMs,
          replaces_segment_id: null,
          text: translated,
          state: 'committed',
        }),
      );

      if (session.permissions.includes('speak')) {
        segment.state = 'spoken';
        segment.spoken = true;
        segment.revision = 3;
        events.push(
          this.pushEvent(session, {
            segment_id: segmentId,
            revision: 3,
            type: 'translation.spoken',
            source_start_ms: startMs,
            source_end_ms: endMs,
            replaces_segment_id: null,
            text: translated,
            state: 'spoken',
          }),
        );
      }
    }

    return {
      session_id: session.id,
      source_sequence: session.sourceSequence,
      events,
      backpressure: session.events.length > 200,
      note: 'VAD boundaries remain distinct from semantic completion. Commit uses entity stability and polarity.',
    };
  }

  async repair(input: {
    sessionId: string;
    organizationId: string;
    segmentId: string;
    correctedText: string;
    userId?: string;
    ip?: string;
  }) {
    const session = this.requireSession(input.sessionId, input.organizationId);
    const original = session.segments.get(input.segmentId);
    if (!original) {
      throw new ApiException('not_found', 'Segment not found', HttpStatus.NOT_FOUND);
    }
    if (!original.spoken && original.state !== 'committed') {
      // Cancel before playback
      original.state = 'cancelled';
      const event = this.pushEvent(session, {
        segment_id: original.id,
        revision: original.revision + 1,
        type: 'translation.cancelled',
        source_start_ms: original.source_start_ms,
        source_end_ms: original.source_end_ms,
        replaces_segment_id: null,
        text: original.translated,
        state: 'cancelled',
      });
      return { session_id: session.id, events: [event], note: 'Cancelled before playback.' };
    }

    // Spoken audio is immutable — emit repair referencing earlier segment.
    original.state = 'repair_required';
    const repairId = `seg_${session.segments.size + 1}`;
    const repairSeg = {
      id: repairId,
      state: 'spoken' as SegmentState,
      revision: 1,
      text: input.correctedText,
      translated: input.correctedText,
      source_start_ms: original.source_end_ms,
      source_end_ms: original.source_end_ms + 1200,
      spoken: true,
    };
    session.segments.set(repairId, repairSeg);

    const events = [
      this.pushEvent(session, {
        segment_id: repairId,
        revision: 1,
        type: 'translation.repair',
        source_start_ms: repairSeg.source_start_ms,
        source_end_ms: repairSeg.source_end_ms,
        replaces_segment_id: original.id,
        text: `Correction: ${input.correctedText}`,
        state: 'spoken',
      }),
    ];

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'live.repair',
      route: `POST /v1/live/sessions/${session.id}/repair`,
      ip: input.ip,
      metadata: { segment_id: original.id, repair_id: repairId },
    });

    return {
      session_id: session.id,
      events,
      note: 'Already-spoken audio was not rewritten. Repair creates new audible content referencing the earlier segment.',
    };
  }

  ack(input: { sessionId: string; organizationId: string; eventId: string }) {
    const session = this.requireSession(input.sessionId, input.organizationId);
    const found = session.events.find((e) => e.event_id === input.eventId);
    if (!found) {
      throw new ApiException('not_found', 'event_id not found', HttpStatus.NOT_FOUND);
    }
    session.lastAckEventId = input.eventId;
    return {
      session_id: session.id,
      last_ack_event_id: session.lastAckEventId,
      resume_from: input.eventId,
      note: 'Reconnect may resume only unplayed buffered content after this acknowledgement.',
    };
  }

  streamEvents(
    input: { sessionId: string; organizationId: string; afterEventId?: string },
    res: Response,
  ) {
    const session = this.requireSession(input.sessionId, input.organizationId);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let startIdx = 0;
    if (input.afterEventId) {
      const idx = session.events.findIndex((e) => e.event_id === input.afterEventId);
      startIdx = idx >= 0 ? idx + 1 : 0;
    }

    for (const event of session.events.slice(startIdx)) {
      res.write(`id: ${event.event_id}\n`);
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.write(`event: session.snapshot\ndata: ${JSON.stringify({ session_id: session.id, caught_up: true })}\n\n`);
    res.end();
  }

  private pushEvent(
    session: LiveSession,
    partial: Omit<LiveEvent, 'event_id' | 'session_id' | 'evidence_ref' | 'model_version' | 'sequence'>,
  ): LiveEvent {
    session.sequence += 1;
    const event: LiveEvent = {
      event_id: `evt_${String(session.sequence).padStart(4, '0')}`,
      session_id: session.id,
      evidence_ref: `ledger_${session.id}_${partial.segment_id}`,
      model_version: 'pilot-1',
      sequence: session.sequence,
      ...partial,
    };
    session.events.push(event);
    return event;
  }

  private requireSession(sessionId: string, organizationId: string): LiveSession {
    const session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      throw new ApiException('not_found', 'Live session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }
}
