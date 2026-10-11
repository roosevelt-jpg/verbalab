import {
  actorHeaders,
  type BridgeHeaders,
  type BridgeTransport,
} from './bridge-transport.js';

export type CreateEverydaySessionInput = {
  mode?: 'read_this_to_me' | 'help_me_reply' | 'explain_this_word';
  corridor?: string;
  preferredVariety?: string;
  documentCategory?: string;
  trainingConsent?: boolean;
  sensitivePolicyOk?: boolean;
  retentionDays?: number;
};

export type EverydayClientOptions = {
  transport: BridgeTransport;
  headers: Omit<BridgeHeaders, 'actorHeaderName'> & { actorId?: string | null };
};

export class EverydayClient {
  private readonly transport: BridgeTransport;
  private headers: BridgeHeaders;

  constructor(options: EverydayClientOptions) {
    this.transport = options.transport;
    this.headers = {
      actorHeaderName: 'X-Everyday-Actor-Id',
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
    return this.transport.requestJson<Record<string, unknown>>('/v1/everyday/catalog', {
      method: 'GET',
      headers: this.h(),
    });
  }

  listSessions() {
    return this.transport.requestJson<{ sessions?: unknown[] }>('/v1/everyday/sessions', {
      method: 'GET',
      headers: this.h(),
    });
  }

  createSession(input: CreateEverydaySessionInput = {}) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/everyday/sessions', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  getSession(sessionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  deleteSession(sessionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE', headers: this.h() },
    );
  }

  upload(
    sessionId: string,
    input: {
      filename: string;
      mimeType: string;
      contentBase64: string;
      pageCountHint?: number;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sessions/${encodeURIComponent(sessionId)}/uploads`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  correctSource(
    documentId: string,
    input: { fullText: string; expectedSourceRevisionId?: string },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/documents/${encodeURIComponent(documentId)}/source-revisions`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  translate(sourceRevisionId: string, input: { targetVariety?: string } = {}) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sources/${encodeURIComponent(sourceRevisionId)}/translations`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  explain(sourceRevisionId: string, input: { translationRevisionId?: string } = {}) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sources/${encodeURIComponent(sourceRevisionId)}/explanations`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  ask(sourceRevisionId: string, question: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sources/${encodeURIComponent(sourceRevisionId)}/questions`,
      { method: 'POST', body: { question }, headers: this.h() },
    );
  }

  createAudio(input: {
    kind: 'translation' | 'explanation' | 'reply' | 'source';
    translationRevisionId?: string;
    explanationRevisionId?: string;
    replyRevisionId?: string;
    sourceRevisionId?: string;
  }) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/everyday/audio', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  createReply(
    sessionId: string,
    input: { userSourceText: string; targetVariety?: string; sourceRevisionId?: string },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sessions/${encodeURIComponent(sessionId)}/replies`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  approveReply(
    replyId: string,
    input: {
      action: 'approve_copy' | 'approve_download' | 'approve_share_sheet';
      sourcePresentationHash: string;
      targetPresentationHash: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/replies/${encodeURIComponent(replyId)}/approvals`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  explainTerm(
    sessionId: string,
    input: {
      selectedSpan: string;
      sourceRevisionId?: string;
      scope?: 'document' | 'general';
      language?: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sessions/${encodeURIComponent(sessionId)}/terms`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  events(sessionId: string, after = 0) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/everyday/sessions/${encodeURIComponent(sessionId)}/events?after=${after}`,
      { method: 'GET', headers: this.h() },
    );
  }
}
