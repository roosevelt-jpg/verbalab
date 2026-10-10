import type { BridgeHeaders, BridgeTransport } from './bridge-transport.js';
import { actorHeaders } from './bridge-transport.js';

export type AccessLineClientOptions = {
  transport: BridgeTransport;
  headers: Omit<BridgeHeaders, 'actorHeaderName'> & { actorId?: string | null };
};

export class AccessLineClient {
  private readonly transport: BridgeTransport;
  private headers: BridgeHeaders;

  constructor(options: AccessLineClientOptions) {
    this.transport = options.transport;
    this.headers = {
      actorHeaderName: 'X-AccessLine-Actor-Id',
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
    return this.transport.requestJson<Record<string, unknown>>('/v1/accessline/catalog', {
      method: 'GET',
      headers: this.h(),
    });
  }

  capabilities() {
    return this.transport.requestJson<Record<string, unknown>>('/v1/accessline/capabilities', {
      method: 'GET',
      headers: this.h(),
    });
  }

  metrics() {
    return this.transport.requestJson<Record<string, unknown>>('/v1/accessline/metrics', {
      method: 'GET',
      headers: this.h(),
    });
  }

  listLines() {
    return this.transport.requestJson<{ lines?: unknown[] }>('/v1/accessline/lines', {
      method: 'GET',
      headers: this.h(),
    });
  }

  createLine(input: {
    name: string;
    inboundNumber: string;
    jurisdiction?: string;
    timeZone?: string;
    enabledLanguages?: string[];
    recordingEnabled?: boolean;
    knowledgeSnippet?: string;
    integrationMode?: 'simulated' | 'twilio';
  }) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/accessline/lines', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  getLine(lineId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/accessline/lines/${encodeURIComponent(lineId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  listCalls() {
    return this.transport.requestJson<{ calls?: unknown[] }>('/v1/accessline/calls', {
      method: 'GET',
      headers: this.h(),
    });
  }

  getCall(callId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/accessline/calls/${encodeURIComponent(callId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  callSummary(callId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/accessline/calls/${encodeURIComponent(callId)}/summary`,
      { method: 'GET', headers: this.h() },
    );
  }

  requestHandoff(
    callId: string,
    input: { reason?: string; destinationId?: string; idempotencyKey?: string } = {},
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/accessline/calls/${encodeURIComponent(callId)}/handoff`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  simulateStart(input: { lineId: string; callerId?: string }) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/accessline/simulate/start', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  simulateDtmf(callId: string, digits: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/accessline/simulate/${encodeURIComponent(callId)}/dtmf`,
      { method: 'POST', body: { digits }, headers: this.h() },
    );
  }

  simulateSpeech(callId: string, text: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/accessline/simulate/${encodeURIComponent(callId)}/speech`,
      { method: 'POST', body: { text }, headers: this.h() },
    );
  }

  simulateHangup(callId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/accessline/simulate/${encodeURIComponent(callId)}/hangup`,
      { method: 'POST', body: {}, headers: this.h() },
    );
  }
}
