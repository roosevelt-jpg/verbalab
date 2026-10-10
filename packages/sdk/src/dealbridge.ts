import type { UploadFile } from './types.js';
import {
  actorHeaders,
  toBlob,
  uploadMultipartWithRetry,
  type BridgeHeaders,
  type BridgeTransport,
  type UploadAuth,
  type UploadProgress,
} from './bridge-transport.js';

export type CreateDealSessionInput = {
  merchantLanguage: string;
  buyerLanguage: string;
  category?: string;
  timeZone?: string;
  expiresInHours?: number;
  idempotencyKey?: string;
  pilotCohort?: 'baseline' | 'dealbridge';
  isDemo?: boolean;
};

export type DealBridgeClientOptions = {
  transport: BridgeTransport;
  headers: Omit<BridgeHeaders, 'actorHeaderName'> & { actorId?: string | null };
};

export class DealBridgeClient {
  private readonly transport: BridgeTransport;
  private headers: BridgeHeaders;

  constructor(options: DealBridgeClientOptions) {
    this.transport = options.transport;
    this.headers = {
      actorHeaderName: 'X-DealBridge-Actor-Id',
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
    return this.transport.requestJson<Record<string, unknown>>('/v1/dealbridge/catalog', {
      method: 'GET',
      headers: this.h(),
    });
  }

  peekInvite(token: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/invites/${encodeURIComponent(token)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  listSessions() {
    return this.transport.requestJson<{ sessions?: unknown[]; data?: unknown[] }>(
      '/v1/dealbridge/sessions',
      { method: 'GET', headers: this.h() },
    );
  }

  createSession(input: CreateDealSessionInput) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/dealbridge/sessions', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  getSession(sessionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  createInvite(sessionId: string, expiresInHours?: number) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/invites`,
      {
        method: 'POST',
        body: expiresInHours != null ? { expiresInHours } : {},
        headers: this.h(),
      },
    );
  }

  join(sessionId: string, input: { token: string; language: string; variety?: string }) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/join`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  recordConsent(
    sessionId: string,
    input: { purpose: string; decision: 'granted' | 'denied'; noticeVersion?: string },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/consents`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  async issueUploadAuth(sessionId: string): Promise<UploadAuth> {
    const json = await this.transport.requestJson<UploadAuth>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/turns/uploads`,
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

  createTextTurn(
    sessionId: string,
    input: { text: string; language?: string; expectedRevision?: number },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/turns`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  createAudioTurn(
    sessionId: string,
    input: {
      file: UploadFile;
      language?: string;
      expectedRevision?: number;
    },
  ) {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.language) form.append('language', input.language);
    if (input.expectedRevision != null) form.append('expectedRevision', String(input.expectedRevision));
    return this.transport.requestForm<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/turns`,
      form,
      { headers: this.h() },
    );
  }

  async createAudioTurnResumable(
    sessionId: string,
    input: {
      file: UploadFile;
      language?: string;
      expectedRevision?: number;
      onProgress?: (p: UploadProgress) => void;
    },
  ) {
    const auth = await this.issueUploadAuth(sessionId);
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.language) form.append('language', input.language);
    if (input.expectedRevision != null) form.append('expectedRevision', String(input.expectedRevision));
    return uploadMultipartWithRetry<Record<string, unknown>>(this.transport, {
      path: `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/turns`,
      form,
      headers: this.h(),
      maxBytes: auth.maxBytes || undefined,
      onProgress: input.onProgress,
    });
  }

  correctTurn(
    sessionId: string,
    turnId: string,
    input: { text: string; expectedRevision?: number },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/turns/${encodeURIComponent(turnId)}`,
      { method: 'PATCH', body: input, headers: this.h() },
    );
  }

  proposeSnapshot(
    sessionId: string,
    input?: { expectedRevision?: number; overrides?: Record<string, unknown> },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/snapshots`,
      { method: 'POST', body: input ?? {}, headers: this.h() },
    );
  }

  submitCheck(
    sessionId: string,
    input: {
      snapshotId: string;
      presentationHash: string;
      responseText: string;
      responseTurnId?: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/checks`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  confirm(
    sessionId: string,
    input: {
      snapshotId: string;
      contentHash: string;
      presentationHash: string;
      action: 'confirm' | 'change' | 'decline';
      idempotencyKey: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/confirmations`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  getReceipt(sessionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/receipt`,
      { method: 'GET', headers: this.h() },
    );
  }

  startRevision(sessionId: string, input?: { reason?: string; expectedRevision?: number }) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/revisions`,
      { method: 'POST', body: input ?? {}, headers: this.h() },
    );
  }

  requestDeletion(sessionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE', headers: this.h() },
    );
  }

  listEvents(sessionId: string, cursor?: string) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/dealbridge/sessions/${encodeURIComponent(sessionId)}/events${q}`,
      { method: 'GET', headers: this.h() },
    );
  }
}

export type { UploadAuth, UploadProgress };
