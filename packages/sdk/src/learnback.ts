import {
  actorHeaders,
  type BridgeHeaders,
  type BridgeTransport,
} from './bridge-transport.js';

export type CreateLearnBackSessionInput = {
  corridorId?: string;
  situation?: string;
  scenarioPackId?: string;
  fictionalMode?: boolean;
  trainingConsent?: boolean;
  idempotencyKey?: string;
};

export type LearnBackClientOptions = {
  transport: BridgeTransport;
  headers: Omit<BridgeHeaders, 'actorHeaderName'> & { actorId?: string | null };
};

export class LearnBackClient {
  private readonly transport: BridgeTransport;
  private headers: BridgeHeaders;

  constructor(options: LearnBackClientOptions) {
    this.transport = options.transport;
    this.headers = {
      actorHeaderName: 'X-LearnBack-Actor-Id',
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
    return this.transport.requestJson<Record<string, unknown>>('/v1/learnback/catalog', {
      method: 'GET',
      headers: this.h(),
    });
  }

  listScenarios(filters?: { situation?: string; corridorId?: string }) {
    const q = new URLSearchParams();
    if (filters?.situation) q.set('situation', filters.situation);
    if (filters?.corridorId) q.set('corridorId', filters.corridorId);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return this.transport.requestJson<{ scenarios?: unknown[]; corridors?: unknown[] }>(
      `/v1/learnback/scenarios${suffix}`,
      { method: 'GET', headers: this.h() },
    );
  }

  getProfile() {
    return this.transport.requestJson<Record<string, unknown>>('/v1/learnback/profile', {
      method: 'GET',
      headers: this.h(),
    });
  }

  updateProfile(input: {
    explanationLanguage?: string;
    practiceLanguage?: string;
    optionalAccentTarget?: string | null;
    goal?: string | null;
    trainingConsent?: boolean;
    retentionDays?: number;
    accessibilityPrefs?: Record<string, unknown>;
  }) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/learnback/profile', {
      method: 'PATCH',
      body: input,
      headers: this.h(),
    });
  }

  listSessions() {
    return this.transport.requestJson<{ sessions?: unknown[] }>('/v1/learnback/sessions', {
      method: 'GET',
      headers: this.h(),
    });
  }

  createSession(input: CreateLearnBackSessionInput = {}) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/learnback/sessions', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  getSession(sessionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/learnback/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  deleteSession(sessionId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/learnback/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE', headers: this.h() },
    );
  }

  createAttempt(
    sessionId: string,
    input: {
      contentBase64?: string;
      mimeType?: string;
      textAnswer?: string;
      idempotencyKey: string;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/learnback/sessions/${encodeURIComponent(sessionId)}/attempts`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  correctTranscript(
    attemptId: string,
    input: { editedText: string; expectedTranscriptRevisionId?: string },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/learnback/attempts/${encodeURIComponent(attemptId)}/transcript-revisions`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  getFeedback(attemptId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/learnback/attempts/${encodeURIComponent(attemptId)}/feedback`,
      { method: 'GET', headers: this.h() },
    );
  }

  synthesizeAudio(input: {
    kind: 'question' | 'explanation' | 'example' | 'phrase';
    text: string;
    language: string;
  }) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/learnback/audio', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  listPhrasebook() {
    return this.transport.requestJson<{ entries?: unknown[] }>('/v1/learnback/phrasebook', {
      method: 'GET',
      headers: this.h(),
    });
  }

  savePhrase(input: {
    phrase: string;
    intendedMeaning: string;
    context?: string;
    practiceLanguage?: string;
    explanationLanguage?: string;
    sourceAttemptId?: string;
  }) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/learnback/phrasebook', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  updatePhrase(
    entryId: string,
    input: { phrase?: string; intendedMeaning?: string; context?: string | null },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/learnback/phrasebook/${encodeURIComponent(entryId)}`,
      { method: 'PATCH', body: input, headers: this.h() },
    );
  }

  deletePhrase(entryId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/learnback/phrasebook/${encodeURIComponent(entryId)}`,
      { method: 'DELETE', headers: this.h() },
    );
  }

  getProgress() {
    return this.transport.requestJson<Record<string, unknown>>('/v1/learnback/progress', {
      method: 'GET',
      headers: this.h(),
    });
  }

  updateReminderPreferences(input: {
    reminderOptIn?: boolean;
    reminderTimezone?: string | null;
    reminderChannel?: string | null;
    quietHoursStart?: number | null;
    quietHoursEnd?: number | null;
  }) {
    return this.transport.requestJson<Record<string, unknown>>(
      '/v1/learnback/reminder-preferences',
      { method: 'PATCH', body: input, headers: this.h() },
    );
  }
}
