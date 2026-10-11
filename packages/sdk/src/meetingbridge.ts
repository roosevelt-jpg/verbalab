import {
  actorHeaders,
  type BridgeHeaders,
  type BridgeTransport,
} from './bridge-transport.js';

export type CreateMeetingInput = {
  title: string;
  agenda?: string;
  timeZone?: string;
  corridor?: string;
  speakingLanguage?: string;
  listeningLanguage?: string;
  maxParticipants?: number;
  isDemo?: boolean;
  terminology?: Record<string, string>;
};

export type MeetingBridgeClientOptions = {
  transport: BridgeTransport;
  headers: Omit<BridgeHeaders, 'actorHeaderName'> & { actorId?: string | null };
};

export class MeetingBridgeClient {
  private readonly transport: BridgeTransport;
  private headers: BridgeHeaders;

  constructor(options: MeetingBridgeClientOptions) {
    this.transport = options.transport;
    this.headers = {
      actorHeaderName: 'X-MeetingBridge-Actor-Id',
      actorId: options.headers.actorId,
      organizationId: options.headers.organizationId,
      workspaceId: options.headers.workspaceId,
    };
  }

  setContext(next: Partial<Omit<BridgeHeaders, 'actorHeaderName'>>) {
    this.headers = { ...this.headers, ...next };
  }

  private h() {
    return actorHeaders(this.headers);
  }

  catalog() {
    return this.transport.requestJson<Record<string, unknown>>('/v1/meetingbridge/catalog', {
      method: 'GET',
      headers: this.h(),
    });
  }

  peekInvite(token: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/invites/${encodeURIComponent(token)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  listMeetings() {
    return this.transport.requestJson<{ meetings?: unknown[] }>('/v1/meetingbridge/meetings', {
      method: 'GET',
      headers: this.h(),
    });
  }

  createMeeting(input: CreateMeetingInput) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/meetingbridge/meetings', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  getMeeting(meetingId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  createInvite(meetingId: string, expiresInHours?: number) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/invites`,
      {
        method: 'POST',
        body: expiresInHours != null ? { expiresInHours } : {},
        headers: this.h(),
      },
    );
  }

  join(
    meetingId: string,
    input: {
      token: string;
      speakingLanguage: string;
      listeningLanguage: string;
      speakingVariety?: string;
      listeningVariety?: string;
      listeningMode?: 'original' | 'translated' | 'captions_only';
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/join`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  updatePreferences(
    meetingId: string,
    input: {
      speakingLanguage?: string;
      listeningLanguage?: string;
      speakingVariety?: string;
      listeningVariety?: string;
      listeningMode?: 'original' | 'translated' | 'captions_only';
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/members/me`,
      { method: 'PATCH', body: input, headers: this.h() },
    );
  }

  openLobby(meetingId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/lobby`,
      { method: 'POST', headers: this.h() },
    );
  }

  start(meetingId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/start`,
      { method: 'POST', headers: this.h() },
    );
  }

  commitUtterance(
    meetingId: string,
    input: { text: string; language?: string; targetLanguages?: string[] },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/utterances`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  correctUtterance(meetingId: string, input: { utteranceId: string; text: string; reason?: string }) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/utterance-corrections`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  proposeItem(
    meetingId: string,
    input: {
      kind: 'decision' | 'action' | 'proposal' | 'question';
      wording: string;
      ownerParticipantIds?: string[];
      requiredApproverIds?: string[];
      dueDate?: string;
      sourceRevisionIds?: string[];
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/items`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  confirmItem(
    itemId: string,
    input: {
      meetingId: string;
      action: 'confirm' | 'change_request' | 'decline';
      idempotencyKey: string;
      note?: string;
      presentationId?: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/items/${encodeURIComponent(itemId)}/confirmations`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  reviseItem(
    itemId: string,
    input: {
      meetingId: string;
      expectedRevision: number;
      wording?: string;
      ownerParticipantIds?: string[];
      requiredApproverIds?: string[];
      dueDate?: string | null;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/items/${encodeURIComponent(itemId)}/revisions`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  syncItem(
    itemId: string,
    input: { meetingId: string; destination?: 'private_download' | 'internal_queue'; idempotencyKey: string },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/items/${encodeURIComponent(itemId)}/sync`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  handoffDealBridge(meetingId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/handoff/dealbridge`,
      { method: 'POST', headers: this.h() },
    );
  }

  handoffVoiceBridge(meetingId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/handoff/voicebridge`,
      { method: 'POST', headers: this.h() },
    );
  }

  close(meetingId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/close`,
      { method: 'POST', headers: this.h() },
    );
  }

  issueMinutes(meetingId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/meetings/${encodeURIComponent(meetingId)}/minutes`,
      { method: 'POST', headers: this.h() },
    );
  }

  exportMinutes(
    minutesId: string,
    input: {
      meetingId: string;
      format?: 'markdown' | 'json' | 'csv_tasks';
      idempotencyKey: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/meetingbridge/minutes/${encodeURIComponent(minutesId)}/exports`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }
}
