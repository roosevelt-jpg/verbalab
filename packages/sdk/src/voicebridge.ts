import type { UploadFile } from './types.js';
import { LugemiError } from './errors.js';
import {
  actorHeaders,
  toBlob,
  uploadMultipartWithRetry,
  type BridgeHeaders,
  type BridgeTransport,
  type UploadAuth,
  type UploadProgress,
} from './bridge-transport.js';

export type VoiceBridgeConsent = {
  purpose: 'processing' | 'recording' | 'training' | string;
  decision: 'granted' | 'denied';
};

export type CreateVoiceThreadInput = {
  title: string;
  language: string;
  category?: string;
  variety?: string;
  corridor?: string;
};

export type VoiceBridgeClientOptions = {
  transport: BridgeTransport;
  headers: Omit<BridgeHeaders, 'actorHeaderName'> & { actorId?: string | null };
};

export class VoiceBridgeClient {
  private readonly transport: BridgeTransport;
  private headers: BridgeHeaders;

  constructor(options: VoiceBridgeClientOptions) {
    this.transport = options.transport;
    this.headers = {
      actorHeaderName: 'X-VoiceBridge-Actor-Id',
      actorId: options.headers.actorId,
      organizationId: options.headers.organizationId,
      workspaceId: options.headers.workspaceId,
    };
  }

  /** Update actor / org / workspace context after construction. */
  setContext(next: Partial<Omit<BridgeHeaders, 'actorHeaderName'>>) {
    this.headers = { ...this.headers, ...next };
  }

  private h() {
    return actorHeaders(this.headers);
  }

  catalog() {
    return this.transport.requestJson<Record<string, unknown>>('/v1/voicebridge/catalog', {
      method: 'GET',
      headers: this.h(),
    });
  }

  peekInvite(token: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/invites/${encodeURIComponent(token)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  listThreads() {
    return this.transport.requestJson<{ threads: unknown[] }>('/v1/voicebridge/threads', {
      method: 'GET',
      headers: this.h(),
    });
  }

  createThread(input: CreateVoiceThreadInput) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/voicebridge/threads', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  getThread(threadId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/threads/${encodeURIComponent(threadId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  createInvite(threadId: string, expiresInHours?: number) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/threads/${encodeURIComponent(threadId)}/invites`,
      {
        method: 'POST',
        body: expiresInHours != null ? { expiresInHours } : {},
        headers: this.h(),
      },
    );
  }

  join(
    threadId: string,
    input: {
      token: string;
      language: string;
      variety?: string;
      consents?: VoiceBridgeConsent[];
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/threads/${encodeURIComponent(threadId)}/join`,
      {
        method: 'POST',
        body: {
          token: input.token,
          language: input.language,
          variety: input.variety,
          consents: input.consents ?? [{ purpose: 'processing', decision: 'granted' }],
        },
        headers: this.h(),
      },
    );
  }

  patchMemberMe(
    threadId: string,
    input: { language?: string; variety?: string | null; notificationsEnabled?: boolean },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/threads/${encodeURIComponent(threadId)}/members/me`,
      { method: 'PATCH', body: input, headers: this.h() },
    );
  }

  async issueUploadAuth(threadId: string): Promise<UploadAuth> {
    const json = await this.transport.requestJson<UploadAuth>(
      `/v1/voicebridge/threads/${encodeURIComponent(threadId)}/uploads`,
      { method: 'POST', body: {}, headers: this.h() },
    );
    return {
      maxBytes: Number(json.maxBytes ?? 0),
      maxRecordingSeconds: json.maxRecordingSeconds ?? null,
      allowedMimeTypes: json.allowedMimeTypes ?? [],
      uploadPath: json.uploadPath ?? '',
      expiresAt: json.expiresAt ?? null,
    };
  }

  createTextDraft(
    threadId: string,
    input: {
      text: string;
      language?: string;
      idempotencyKey?: string;
      replyToMessageId?: string;
      replyToRevisionId?: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/threads/${encodeURIComponent(threadId)}/messages`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  createAudioDraft(
    threadId: string,
    input: {
      file: UploadFile;
      language?: string;
      idempotencyKey?: string;
    },
  ) {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.language) form.append('language', input.language);
    if (input.idempotencyKey) form.append('idempotencyKey', input.idempotencyKey);
    return this.transport.requestForm<Record<string, unknown>>(
      `/v1/voicebridge/threads/${encodeURIComponent(threadId)}/messages`,
      form,
      { headers: this.h() },
    );
  }

  async createAudioDraftResumable(
    threadId: string,
    input: {
      file: UploadFile;
      language?: string;
      idempotencyKey?: string;
      onProgress?: (p: UploadProgress) => void;
    },
  ) {
    const auth = await this.issueUploadAuth(threadId);
    const mime = input.file.contentType ?? 'application/octet-stream';
    if (auth.allowedMimeTypes.length && !auth.allowedMimeTypes.includes(mime)) {
      throw new LugemiError(`Unsupported mime type ${mime}`, 'validation_error', 400);
    }
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.language) form.append('language', input.language);
    if (input.idempotencyKey) form.append('idempotencyKey', input.idempotencyKey);
    const path =
      auth.uploadPath || `/v1/voicebridge/threads/${encodeURIComponent(threadId)}/messages`;
    return uploadMultipartWithRetry<Record<string, unknown>>(this.transport, {
      path,
      form,
      headers: this.h(),
      maxBytes: auth.maxBytes,
      onProgress: input.onProgress,
    });
  }

  updateDraft(
    messageId: string,
    input: { reviewedTranscript: string; expectedDraftRevisionId: string },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/messages/${encodeURIComponent(messageId)}/draft`,
      { method: 'PATCH', body: input, headers: this.h() },
    );
  }

  publishMessage(
    messageId: string,
    input: { expectedDraftRevisionId: string; reviewedTranscript?: string },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/messages/${encodeURIComponent(messageId)}/publish`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  correctMessage(
    messageId: string,
    input: {
      expectedActiveRevisionId: string;
      reviewedTranscript: string;
      correctionReason?: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/messages/${encodeURIComponent(messageId)}/corrections`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  acknowledgeRevision(revisionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/revisions/${encodeURIComponent(revisionId)}/acknowledgments`,
      { method: 'POST', body: {}, headers: this.h() },
    );
  }

  recordPlayback(revisionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/revisions/${encodeURIComponent(revisionId)}/playback`,
      { method: 'POST', body: {}, headers: this.h() },
    );
  }

  createDealDraft(
    threadId: string,
    input: {
      selectedRevisionIds: string[];
      partyAUserId: string;
      partyBUserId: string;
      category?: string;
      idempotencyKey?: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/voicebridge/threads/${encodeURIComponent(threadId)}/deal-drafts`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }
}

export type { UploadAuth, UploadProgress };
