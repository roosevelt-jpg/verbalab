import {
  actorHeaders,
  type BridgeHeaders,
  type BridgeTransport,
} from './bridge-transport.js';

export type CreateAssuranceRunInput = {
  product?: string;
  contentCategory?: string;
  corridor?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  sourceText: string;
  targetText: string;
  audioBase64?: string;
  audioMimeType?: string;
  modelVersion?: string;
  voiceVersion?: string;
  task?: string;
  policyVersion?: string;
  idempotencyKey: string;
  assignReviewerUserId?: string;
  terminology?: Record<string, string>;
};

export type LanguageAssuranceClientOptions = {
  transport: BridgeTransport;
  headers: Omit<BridgeHeaders, 'actorHeaderName'> & { actorId?: string | null };
};

export class LanguageAssuranceClient {
  private readonly transport: BridgeTransport;
  private headers: BridgeHeaders;

  constructor(options: LanguageAssuranceClientOptions) {
    this.transport = options.transport;
    this.headers = {
      actorHeaderName: 'X-LanguageAssurance-Actor-Id',
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
    return this.transport.requestJson<Record<string, unknown>>('/v1/language-assurance/catalog', {
      method: 'GET',
      headers: this.h(),
    });
  }

  listRuns() {
    return this.transport.requestJson<{ runs?: unknown[] }>('/v1/language-assurance/runs', {
      method: 'GET',
      headers: this.h(),
    });
  }

  createRun(input: CreateAssuranceRunInput) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/language-assurance/runs', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  getRun(runId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/language-assurance/runs/${encodeURIComponent(runId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  cancel(runId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/language-assurance/runs/${encodeURIComponent(runId)}/cancel`,
      { method: 'POST', headers: this.h() },
    );
  }

  report(runId: string, format: 'json' | 'markdown' = 'json') {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/language-assurance/runs/${encodeURIComponent(runId)}/report?format=${format}`,
      { method: 'GET', headers: this.h() },
    );
  }

  assignReview(runId: string, input: { reviewerUserId: string; scope?: string }) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/language-assurance/runs/${encodeURIComponent(runId)}/assignments`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  submitReview(
    assignmentId: string,
    input: {
      judgment: 'approve' | 'request_changes' | 'reject' | 'uncertain';
      sourceTextHash: string;
      targetTextHash: string;
      audioSha256?: string;
      meaningOk?: boolean;
      notes?: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/language-assurance/reviews/${encodeURIComponent(assignmentId)}/submit`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  releaseEvidence(runId: string, reason?: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/language-assurance/runs/${encodeURIComponent(runId)}/release-evidence`,
      { method: 'POST', body: reason ? { reason } : {}, headers: this.h() },
    );
  }

  reviewQueue() {
    return this.transport.requestJson<Record<string, unknown>>(
      '/v1/language-assurance/reviews/queue',
      { method: 'GET', headers: this.h() },
    );
  }

  verifyVoiceStudio(input: CreateAssuranceRunInput & { audioSha256?: string }) {
    return this.transport.requestJson<Record<string, unknown>>(
      '/v1/language-assurance/integrations/voice-studio',
      { method: 'POST', body: input, headers: this.h() },
    );
  }
}
