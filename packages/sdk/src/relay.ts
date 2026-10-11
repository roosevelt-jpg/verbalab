import {
  actorHeaders,
  type BridgeHeaders,
  type BridgeTransport,
} from './bridge-transport.js';

export type CreateRelayRequestInput = {
  corridorId?: string;
  category?: string;
  preferredStartAt?: string;
  preferredTimezone?: string;
  durationMinutes?: number;
  originProduct?: string;
  originRefs?: Record<string, unknown>;
  notes?: string;
  idempotencyKey: string;
};

export type RelayClientOptions = {
  transport: BridgeTransport;
  headers: Omit<BridgeHeaders, 'actorHeaderName'> & { actorId?: string | null };
};

export class RelayClient {
  private readonly transport: BridgeTransport;
  private headers: BridgeHeaders;

  constructor(options: RelayClientOptions) {
    this.transport = options.transport;
    this.headers = {
      actorHeaderName: 'X-Relay-Actor-Id',
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
    return this.transport.requestJson<Record<string, unknown>>('/v1/relay/catalog', {
      method: 'GET',
      headers: this.h(),
    });
  }

  coverage() {
    return this.transport.requestJson<Record<string, unknown>>('/v1/relay/coverage', {
      method: 'GET',
      headers: this.h(),
    });
  }

  listSlots(corridorId?: string) {
    const q = corridorId ? `?corridorId=${encodeURIComponent(corridorId)}` : '';
    return this.transport.requestJson<Record<string, unknown>>(`/v1/relay/slots${q}`, {
      method: 'GET',
      headers: this.h(),
    });
  }

  createRequest(input: CreateRelayRequestInput) {
    return this.transport.requestJson<Record<string, unknown>>('/v1/relay/requests', {
      method: 'POST',
      body: input,
      headers: this.h(),
    });
  }

  getRequest(requestId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/requests/${encodeURIComponent(requestId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  acceptOffer(offerId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/offers/${encodeURIComponent(offerId)}/accept`,
      { method: 'POST', headers: this.h() },
    );
  }

  declineOffer(offerId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/offers/${encodeURIComponent(offerId)}/decline`,
      { method: 'POST', headers: this.h() },
    );
  }

  listOffers() {
    return this.transport.requestJson<{ offers?: unknown[] }>('/v1/relay/offers', {
      method: 'GET',
      headers: this.h(),
    });
  }

  acceptQuote(requestId: string, quoteId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/requests/${encodeURIComponent(requestId)}/quotes/${encodeURIComponent(quoteId)}/accept`,
      { method: 'POST', headers: this.h() },
    );
  }

  listBookings() {
    return this.transport.requestJson<{ bookings?: unknown[] }>('/v1/relay/bookings', {
      method: 'GET',
      headers: this.h(),
    });
  }

  getBooking(bookingId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}`,
      { method: 'GET', headers: this.h() },
    );
  }

  createContextGrant(
    bookingId: string,
    input: {
      purpose?: string;
      evidence?: unknown[];
      originProduct?: string;
      scopeNote?: string;
      expiresInHours?: number;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/context-grants`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  join(bookingId: string, input: { recordingOptIn?: boolean } = {}) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/join`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  complete(bookingId: string, input: { connectedSeconds?: number } = {}) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/complete`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  cancel(bookingId: string, reason?: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/cancel`,
      { method: 'POST', body: { reason }, headers: this.h() },
    );
  }

  approveExtension(
    bookingId: string,
    input: { additionalMinutes: number; expectedRevision?: number },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/extensions`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  submitCorrection(
    bookingId: string,
    input: {
      suggestion: string;
      grantId?: string;
      sourceEvidenceNote?: string;
      trainingRightsGranted?: boolean;
    },
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/corrections`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  reviewCorrection(
    bookingId: string,
    correctionId: string,
    reviewStatus: 'accepted' | 'rejected',
  ) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/corrections/${encodeURIComponent(correctionId)}/review`,
      { method: 'POST', body: { reviewStatus }, headers: this.h() },
    );
  }

  revokeContextGrant(bookingId: string, grantId: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/context-grants/${encodeURIComponent(grantId)}/revoke`,
      { method: 'POST', headers: this.h() },
    );
  }

  markPaid(bookingId: string, idempotencyKey: string) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/payments/mark-paid`,
      { method: 'POST', body: { idempotencyKey }, headers: this.h() },
    );
  }

  feedback(bookingId: string, input: { rating?: number; comment?: string; role?: string }) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/feedback`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  openDispute(bookingId: string, input: { issue: string; evidence?: unknown[] }) {
    return this.transport.requestJson<Record<string, unknown>>(
      `/v1/relay/bookings/${encodeURIComponent(bookingId)}/disputes`,
      { method: 'POST', body: input, headers: this.h() },
    );
  }

  opsOverview() {
    return this.transport.requestJson<Record<string, unknown>>('/v1/relay/ops/overview', {
      method: 'GET',
      headers: this.h(),
    });
  }
}
