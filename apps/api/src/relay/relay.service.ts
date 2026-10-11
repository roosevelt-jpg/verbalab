import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import { RelayAdapters } from './relay.adapters';
import { relayCatalog } from './relay.catalog';
import {
  assertGeneralDomain,
  corridorOrNull,
  intervalsOverlap,
  quoteHash,
  resolvePreferredWindow,
  selectMatch,
} from './relay.checks';
import { hashText, mintEventId, mintRoomId } from './relay.hash';
import {
  RELAY_FEATURE,
  RELAY_POLICY_VERSION,
  defaultQuoteMinor,
  demoInterpretersAllowed,
  relayOfferTtlMs,
} from './relay.types';

export type RelayActor = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  apiKeyId?: string;
  ip?: string;
};

const CANCELLATION_TERMS =
  'Cancel ≥24h before start for full credit on unpaid/manual invoices. Inside 24h or no-show may be billed the minimum duration per the accepted quote. Disputes are human-operated.';

@Injectable()
export class RelayService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly adapters: RelayAdapters,
  ) {}

  async onModuleInit() {
    // Seed happens per-org on first coverage/request call.
  }

  catalog() {
    return relayCatalog();
  }

  private async assertEnabled(organizationId: string) {
    if (process.env.RELAY_DISABLED === '1') {
      throw new ApiException('feature_disabled', 'Relay is disabled by RELAY_DISABLED=1', HttpStatus.FORBIDDEN);
    }
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { featureOverrides: true },
    });
    const overrides = (org?.featureOverrides ?? {}) as Record<string, unknown>;
    if (typeof overrides.relay === 'boolean' && !overrides.relay) {
      throw new ApiException(
        'feature_disabled',
        'Relay is disabled for this organization',
        HttpStatus.FORBIDDEN,
      );
    }
    if (process.env.RELAY_OPEN === '1') return;
    await this.billing.assertFeature(
      organizationId,
      RELAY_FEATURE,
      'Relay requires a plan with the relay entitlement (Pro+), or set featureOverrides.relay=true / RELAY_OPEN=1.',
    );
  }

  private async audit(
    actor: RelayActor,
    operation: string,
    meta?: Record<string, unknown>,
    ids?: { bookingId?: string; requestId?: string },
  ) {
    await this.prisma.relayAuditEvent.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.userId,
        operation,
        bookingId: ids?.bookingId,
        requestId: ids?.requestId,
        meta: (meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async appendEvent(requestId: string, type: string, payload?: Record<string, unknown>) {
    const last = await this.prisma.relayEvent.findFirst({
      where: { requestId },
      orderBy: { sequence: 'desc' },
    });
    return this.prisma.relayEvent.create({
      data: {
        requestId,
        sequence: (last?.sequence ?? 0) + 1,
        eventId: mintEventId(),
        type,
        payload: (payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  /** Ensure demo staffed interpreters exist when allowed — clearly labeled. */
  async ensureDemoSupply(actor: RelayActor) {
    if (!demoInterpretersAllowed()) return { seeded: false };
    const existing = await this.prisma.relayInterpreterProfile.findFirst({
      where: { organizationId: actor.organizationId, supplyKind: 'demo_staffed' },
    });
    if (existing) return { seeded: false, interpreterId: existing.id };

    const interpreter = await this.prisma.relayInterpreterProfile.create({
      data: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        ownerUserId: `demo-interpreter-${actor.organizationId.slice(0, 8)}`,
        displayName: 'Demo staffed interpreter (Accra)',
        supplyKind: 'demo_staffed',
        status: 'approved',
        identityVerification: 'demo_labeled',
        languagePairs: [
          { source: 'ak', target: 'en' },
          { source: 'en', target: 'ak' },
        ] as unknown as Prisma.InputJsonValue,
        domains: ['general_business'] as unknown as Prisma.InputJsonValue,
        directionality: 'bidirectional',
        qualifications: [
          {
            kind: 'demo_sample_review',
            note: 'Labeled demo supply for local/test — not a hired interpreter pool.',
          },
        ] as unknown as Prisma.InputJsonValue,
        reviewerNote: 'System demo profile for Relay scheduling tests. Distinguish from reviewed_human supply.',
        reviewedAt: new Date(),
        reviewedById: 'system',
        timezone: 'Africa/Accra',
        confidentialityAccepted: true,
      },
    });

    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    for (let i = 0; i < 6; i++) {
      const slotStart = new Date(start.getTime() + i * 2 * 60 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 90 * 60 * 1000);
      await this.prisma.relayAvailabilitySlot.create({
        data: {
          interpreterId: interpreter.id,
          startAt: slotStart,
          endAt: slotEnd,
          displayTimezone: 'Africa/Accra',
          capacity: 1,
          state: 'open',
        },
      });
    }
    return { seeded: true, interpreterId: interpreter.id };
  }

  async coverage(actor: RelayActor) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureDemoSupply(actor);
    const interpreters = await this.prisma.relayInterpreterProfile.findMany({
      where: { organizationId: actor.organizationId, status: 'approved' },
      include: {
        slots: {
          where: { state: 'open', endAt: { gt: new Date() } },
          orderBy: { startAt: 'asc' },
          take: 20,
        },
      },
    });
    return {
      corridors: relayCatalog().corridors,
      interpreters: interpreters.map((i) => ({
        id: i.id,
        displayName: i.displayName,
        supplyKind: i.supplyKind,
        status: i.status,
        languagePairs: i.languagePairs,
        domains: i.domains,
        timezone: i.timezone,
        openSlots: i.slots.length,
        badge:
          i.supplyKind === 'demo_staffed'
            ? 'Demo staffed profile — not a hired continent-wide pool'
            : 'Reviewed interpreter (org-scoped)',
      })),
      unmatchedPolicy: 'If no slot matches, the request stays unmatched without charging or inventing a connection.',
    };
  }

  async listSlots(actor: RelayActor, corridorId?: string) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureDemoSupply(actor);
    const corridor = corridorId ? corridorOrNull(corridorId) : null;
    const slots = await this.prisma.relayAvailabilitySlot.findMany({
      where: {
        state: 'open',
        endAt: { gt: new Date() },
        interpreter: {
          organizationId: actor.organizationId,
          status: 'approved',
        },
      },
      include: {
        interpreter: {
          select: {
            id: true,
            displayName: true,
            supplyKind: true,
            languagePairs: true,
            domains: true,
            timezone: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
      take: 50,
    });
    const filtered = corridor
      ? slots.filter((s) => {
          const pairs = s.interpreter.languagePairs as { source: string; target: string }[];
          return pairs.some(
            (p) =>
              (p.source === corridor.sourceLanguage && p.target === corridor.targetLanguage) ||
              (p.source === corridor.targetLanguage && p.target === corridor.sourceLanguage),
          );
        })
      : slots;
    return { slots: filtered, corridor: corridor ?? null };
  }

  async createRequest(
    actor: RelayActor,
    input: {
      corridorId?: string;
      category?: string;
      preferredStartAt?: string;
      preferredTimezone?: string;
      durationMinutes?: number;
      originProduct?: string;
      originRefs?: Record<string, unknown>;
      notes?: string;
      idempotencyKey: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureDemoSupply(actor);
    if (!input.idempotencyKey?.trim()) {
      throw new ApiException('validation_error', 'idempotencyKey is required', HttpStatus.BAD_REQUEST);
    }
    const existing = await this.prisma.relayRequest.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId: actor.organizationId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: { offers: true, quotes: true },
    });
    if (existing) return { request: existing, reused: true };

    const corridor = corridorOrNull(input.corridorId ?? 'ak-en-business');
    if (!corridor) {
      throw new ApiException('unsupported_corridor', 'Unknown Relay corridor', HttpStatus.BAD_REQUEST);
    }
    const category = input.category ?? 'general_business';
    const domainCheck = assertGeneralDomain(category);
    if (!domainCheck.ok) {
      throw new ApiException('domain_disabled', domainCheck.reason, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const durationMinutes = Math.min(180, Math.max(30, input.durationMinutes ?? 30));
    const preferredStartAt = input.preferredStartAt
      ? new Date(input.preferredStartAt)
      : new Date(Date.now() + 3 * 60 * 60 * 1000);
    let window: { startAt: Date; endAt: Date; displayTimezone: string };
    try {
      window = resolvePreferredWindow({
        preferredStartAt,
        durationMinutes,
        timezone: input.preferredTimezone ?? corridor.timezone,
      });
    } catch {
      throw new ApiException('validation_error', 'preferredStartAt is invalid', HttpStatus.BAD_REQUEST);
    }

    const request = await this.prisma.relayRequest.create({
      data: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        requesterUserId: actor.userId,
        corridorId: corridor.id,
        sourceLanguage: corridor.sourceLanguage,
        targetLanguage: corridor.targetLanguage,
        category,
        preferredStartAt: window.startAt,
        preferredTimezone: window.displayTimezone,
        durationMinutes,
        originProduct: input.originProduct,
        originRefs: (input.originRefs ?? undefined) as Prisma.InputJsonValue | undefined,
        notes: input.notes,
        status: 'seeking_match',
        idempotencyKey: input.idempotencyKey,
      },
    });
    await this.appendEvent(request.id, 'request.created', { corridorId: corridor.id });
    await this.audit(actor, 'request.create', { requestId: request.id }, { requestId: request.id });

    const matched = await this.attemptMatch(actor, request.id);
    return { request: matched.request, offer: matched.offer, quote: matched.quote, reused: false };
  }

  private async attemptMatch(actor: RelayActor, requestId: string) {
    const request = await this.prisma.relayRequest.findFirstOrThrow({
      where: { id: requestId, organizationId: actor.organizationId },
    });
    const windowEnd = new Date(
      request.preferredStartAt.getTime() + request.durationMinutes * 60_000,
    );

    // Release expired holds first
    await this.prisma.relayAvailabilitySlot.updateMany({
      where: {
        state: 'held',
        holdExpiresAt: { lt: new Date() },
      },
      data: { state: 'open', holdExpiresAt: null, heldByRequestId: null },
    });
    await this.prisma.relayOffer.updateMany({
      where: { state: 'pending', expiresAt: { lt: new Date() } },
      data: { state: 'expired' },
    });

    const slots = await this.prisma.relayAvailabilitySlot.findMany({
      where: {
        state: 'open',
        interpreter: { organizationId: actor.organizationId, status: 'approved' },
      },
      include: { interpreter: true },
    });

    const candidates = slots.map((s) => ({
      interpreterId: s.interpreterId,
      slotId: s.id,
      supplyKind: s.interpreter.supplyKind,
      status: s.interpreter.status,
      domains: s.interpreter.domains as string[],
      languagePairs: s.interpreter.languagePairs as { source: string; target: string }[],
      startAt: s.startAt,
      endAt: s.endAt,
      state: s.state,
    }));

    const chosen = selectMatch({
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      category: request.category,
      windowStart: request.preferredStartAt,
      windowEnd,
      candidates,
    });

    if (!chosen) {
      const unmatched = await this.prisma.relayRequest.update({
        where: { id: requestId },
        data: {
          status: 'unmatched',
          unmatchedReason: 'No approved interpreter with an open slot covering the requested window.',
        },
        include: { offers: true, quotes: true },
      });
      await this.appendEvent(requestId, 'request.unmatched', {});
      return { request: unmatched, offer: null, quote: null };
    }

    // Check no overlapping reserved booking for this interpreter
    const conflicts = await this.prisma.relayBooking.findMany({
      where: {
        interpreterId: chosen.interpreterId,
        status: { in: ['awaiting_payment', 'confirmed', 'in_progress'] },
      },
    });
    for (const c of conflicts) {
      if (
        intervalsOverlap(
          request.preferredStartAt,
          windowEnd,
          c.reservedStartAt,
          c.reservedEndAt,
        )
      ) {
        const unmatched = await this.prisma.relayRequest.update({
          where: { id: requestId },
          data: {
            status: 'unmatched',
            unmatchedReason: 'Candidate slot conflicted with an existing reservation (including setup buffer).',
          },
          include: { offers: true, quotes: true },
        });
        return { request: unmatched, offer: null, quote: null };
      }
    }

    const expiresAt = new Date(Date.now() + relayOfferTtlMs());
    const result = await this.prisma.$transaction(async (tx) => {
      const slot = await tx.relayAvailabilitySlot.findUniqueOrThrow({
        where: { id: chosen.slotId },
      });
      if (slot.state !== 'open' || slot.revision !== (candidates.find((c) => c.slotId === slot.id) ? slot.revision : slot.revision)) {
        // optimistic: re-check open
      }
      if (slot.state !== 'open') {
        throw new ApiException('slot_unavailable', 'Slot no longer open', HttpStatus.CONFLICT);
      }
      await tx.relayAvailabilitySlot.update({
        where: { id: slot.id, revision: slot.revision },
        data: {
          state: 'held',
          holdExpiresAt: expiresAt,
          heldByRequestId: requestId,
          revision: { increment: 1 },
        },
      });
      const offer = await tx.relayOffer.create({
        data: {
          requestId,
          interpreterId: chosen.interpreterId,
          slotId: chosen.slotId,
          state: 'pending',
          expiresAt,
        },
      });
      const pricing = defaultQuoteMinor(request.durationMinutes);
      const version = 'relay-quote-v1';
      const cancellationTerms = CANCELLATION_TERMS;
      const contentHash = hashText(
        quoteHash({
          currency: 'GHS',
          amountMinor: pricing.amountMinor,
          minimumMinutes: pricing.minimumMinutes,
          billingIncrementMin: 15,
          includedMinutes: pricing.includedMinutes,
          overrunCeilingMinor: pricing.overrunCeilingMinor,
          taxesFeesMinor: pricing.taxesFeesMinor,
          cancellationTerms,
          version,
        }),
      );
      const quote = await tx.relayQuoteSnapshot.create({
        data: {
          requestId,
          offerId: offer.id,
          currency: 'GHS',
          amountMinor: pricing.amountMinor,
          minimumMinutes: pricing.minimumMinutes,
          billingIncrementMin: 15,
          includedMinutes: pricing.includedMinutes,
          overrunCeilingMinor: pricing.overrunCeilingMinor,
          taxesFeesMinor: pricing.taxesFeesMinor,
          cancellationTerms,
          version,
          contentHash,
        },
      });
      const updated = await tx.relayRequest.update({
        where: { id: requestId },
        data: { status: 'offer_pending' },
        include: { offers: true, quotes: true },
      });
      return { request: updated, offer, quote };
    });

    await this.appendEvent(requestId, 'offer.created', { offerId: result.offer.id });
    this.adapters.notifyInApp({
      organizationId: actor.organizationId,
      userId: chosen.interpreterId,
      title: 'Relay offer pending',
      body: 'A requester needs an interpreter. Accept before the offer expires.',
    });
    return result;
  }

  async getRequest(actor: RelayActor, requestId: string) {
    await this.assertEnabled(actor.organizationId);
    const request = await this.prisma.relayRequest.findFirst({
      where: {
        id: requestId,
        organizationId: actor.organizationId,
        OR: [
          { requesterUserId: actor.userId },
          { offers: { some: { interpreter: { ownerUserId: actor.userId } } } },
        ],
      },
      include: {
        offers: { include: { interpreter: true, slot: true } },
        quotes: true,
        bookings: true,
        events: { orderBy: { sequence: 'asc' }, take: 50 },
      },
    });
    if (!request) {
      throw new ApiException('not_found', 'Relay request not found', HttpStatus.NOT_FOUND);
    }
    return { request };
  }

  async acceptOffer(actor: RelayActor, offerId: string) {
    await this.assertEnabled(actor.organizationId);
    const offer = await this.prisma.relayOffer.findFirst({
      where: { id: offerId },
      include: {
        interpreter: true,
        request: true,
        slot: true,
        quotes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!offer || offer.interpreter.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Offer not found', HttpStatus.NOT_FOUND);
    }
    const canAccept =
      offer.interpreter.ownerUserId === actor.userId ||
      offer.interpreter.supplyKind === 'demo_staffed';
    if (!canAccept) {
      throw new ApiException('forbidden', 'Only the assigned interpreter can accept', HttpStatus.FORBIDDEN);
    }
    if (offer.state !== 'pending' || offer.expiresAt.getTime() < Date.now()) {
      throw new ApiException('offer_expired', 'Offer is not pending or has expired', HttpStatus.CONFLICT);
    }
    if (offer.interpreter.status === 'suspended') {
      throw new ApiException(
        'interpreter_suspended',
        'Suspended interpreters cannot accept offers',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Only one accepted offer per request
      const already = await tx.relayOffer.findFirst({
        where: { requestId: offer.requestId, state: 'accepted' },
      });
      if (already) {
        throw new ApiException('offer_conflict', 'Request already has an accepted offer', HttpStatus.CONFLICT);
      }
      const slot = await tx.relayAvailabilitySlot.findUniqueOrThrow({ where: { id: offer.slotId } });
      if (slot.state !== 'held' && slot.state !== 'open') {
        throw new ApiException('slot_unavailable', 'Slot is not available', HttpStatus.CONFLICT);
      }
      await tx.relayOffer.update({
        where: { id: offerId },
        data: { state: 'accepted', acceptedAt: new Date() },
      });
      await tx.relayOffer.updateMany({
        where: { requestId: offer.requestId, id: { not: offerId }, state: 'pending' },
        data: { state: 'declined', declinedAt: new Date() },
      });
      await tx.relayAvailabilitySlot.update({
        where: { id: slot.id },
        data: { state: 'held', holdExpiresAt: offer.expiresAt, revision: { increment: 1 } },
      });
      return tx.relayRequest.update({
        where: { id: offer.requestId },
        data: { status: 'awaiting_user_acceptance' },
        include: { offers: true, quotes: true },
      });
    });

    await this.appendEvent(offer.requestId, 'offer.accepted', { offerId });
    await this.audit(actor, 'offer.accept', { offerId }, { requestId: offer.requestId });
    return { request: updated, quote: offer.quotes[0] ?? null };
  }

  async declineOffer(actor: RelayActor, offerId: string) {
    await this.assertEnabled(actor.organizationId);
    const offer = await this.prisma.relayOffer.findFirst({
      where: { id: offerId },
      include: { interpreter: true, slot: true },
    });
    if (!offer || offer.interpreter.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Offer not found', HttpStatus.NOT_FOUND);
    }
    if (offer.state !== 'pending') {
      throw new ApiException('offer_conflict', 'Offer is not pending', HttpStatus.CONFLICT);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.relayOffer.update({
        where: { id: offerId },
        data: { state: 'declined', declinedAt: new Date() },
      });
      await tx.relayAvailabilitySlot.update({
        where: { id: offer.slotId },
        data: {
          state: 'open',
          holdExpiresAt: null,
          heldByRequestId: null,
          revision: { increment: 1 },
        },
      });
      await tx.relayRequest.update({
        where: { id: offer.requestId },
        data: { status: 'seeking_match' },
      });
    });
    const rematch = await this.attemptMatch(actor, offer.requestId);
    await this.appendEvent(offer.requestId, 'offer.declined', { offerId });
    return rematch;
  }

  async acceptQuote(actor: RelayActor, requestId: string, quoteId: string) {
    await this.assertEnabled(actor.organizationId);
    const request = await this.prisma.relayRequest.findFirst({
      where: { id: requestId, organizationId: actor.organizationId, requesterUserId: actor.userId },
      include: {
        quotes: true,
        offers: { where: { state: 'accepted' }, include: { slot: true, interpreter: true } },
      },
    });
    if (!request) {
      throw new ApiException('not_found', 'Request not found', HttpStatus.NOT_FOUND);
    }
    if (request.status !== 'awaiting_user_acceptance' && request.status !== 'offer_pending') {
      // allow awaiting_user_acceptance primarily
    }
    const quote = request.quotes.find((q) => q.id === quoteId);
    if (!quote) {
      throw new ApiException('not_found', 'Quote not found', HttpStatus.NOT_FOUND);
    }
    const offer = request.offers[0];
    if (!offer) {
      throw new ApiException('offer_required', 'Interpreter must accept the offer first', HttpStatus.CONFLICT);
    }
    if (offer.expiresAt.getTime() < Date.now()) {
      throw new ApiException('offer_expired', 'Offer expired before quote acceptance', HttpStatus.CONFLICT);
    }
    if (offer.interpreter.status !== 'approved') {
      throw new ApiException(
        'interpreter_ineligible',
        'Interpreter is no longer eligible',
        HttpStatus.CONFLICT,
      );
    }

    const expectedHash = hashText(
      quoteHash({
        currency: quote.currency,
        amountMinor: quote.amountMinor,
        minimumMinutes: quote.minimumMinutes,
        billingIncrementMin: quote.billingIncrementMin,
        includedMinutes: quote.includedMinutes,
        overrunCeilingMinor: quote.overrunCeilingMinor,
        taxesFeesMinor: quote.taxesFeesMinor,
        cancellationTerms: quote.cancellationTerms,
        version: quote.version,
      }),
    );
    if (expectedHash !== quote.contentHash) {
      throw new ApiException(
        'quote_tampered',
        'Quote hash mismatch — request a fresh quote',
        HttpStatus.CONFLICT,
      );
    }

    const payment = this.adapters.paymentMode();
    const windowEnd = new Date(
      request.preferredStartAt.getTime() + request.durationMinutes * 60_000,
    );

    const booking = await this.prisma.$transaction(async (tx) => {
      // Atomic slot reserve
      const slot = await tx.relayAvailabilitySlot.findUniqueOrThrow({ where: { id: offer.slotId } });
      if (slot.state === 'reserved') {
        throw new ApiException('slot_unavailable', 'Slot already reserved', HttpStatus.CONFLICT);
      }
      // Double-book guard
      const existing = await tx.relayBooking.findMany({
        where: {
          interpreterId: offer.interpreterId,
          status: { in: ['awaiting_payment', 'confirmed', 'in_progress'] },
        },
      });
      for (const e of existing) {
        if (
          intervalsOverlap(request.preferredStartAt, windowEnd, e.reservedStartAt, e.reservedEndAt)
        ) {
          throw new ApiException(
            'double_book_prevented',
            'Interpreter interval already reserved',
            HttpStatus.CONFLICT,
          );
        }
      }
      await tx.relayAvailabilitySlot.update({
        where: { id: slot.id },
        data: { state: 'reserved', holdExpiresAt: null, revision: { increment: 1 } },
      });
      const row = await tx.relayBooking.create({
        data: {
          organizationId: actor.organizationId,
          workspaceId: actor.workspaceId,
          requestId,
          interpreterId: offer.interpreterId,
          slotId: offer.slotId,
          quoteId: quote.id,
          requesterUserId: actor.userId,
          status: 'awaiting_payment',
          paymentMode: payment.mode,
          paymentState: 'invoiced',
          reservedStartAt: request.preferredStartAt,
          reservedEndAt: windowEnd,
          cancellationTerms: quote.cancellationTerms,
        },
      });
      await tx.relayPaymentRecord.create({
        data: {
          bookingId: row.id,
          mode: payment.mode,
          currency: quote.currency,
          amountMinor: quote.amountMinor,
          state: 'invoiced',
          idempotencyKey: `invoice-${row.id}`,
          note: payment.note,
        },
      });
      await tx.relayRequest.update({
        where: { id: requestId },
        data: { status: 'awaiting_payment' },
      });
      return row;
    });

    await this.appendEvent(requestId, 'booking.created', { bookingId: booking.id });
    await this.audit(actor, 'quote.accept', { quoteId, bookingId: booking.id }, {
      requestId,
      bookingId: booking.id,
    });
    return { booking, payment };
  }

  async markPaid(actor: RelayActor, bookingId: string, idempotencyKey: string) {
    await this.assertEnabled(actor.organizationId);
    if (!idempotencyKey?.trim()) {
      throw new ApiException('validation_error', 'idempotencyKey is required', HttpStatus.BAD_REQUEST);
    }
    const booking = await this.loadBooking(actor, bookingId, { asRequester: true });
    const dup = await this.prisma.relayPaymentRecord.findUnique({
      where: { bookingId_idempotencyKey: { bookingId, idempotencyKey } },
    });
    if (dup) return { booking, payment: dup, reused: true };

    if (booking.status !== 'awaiting_payment') {
      // Late payment after conflict → reconciliation, never resurrect conflicted reservation
      if (booking.slot.state !== 'reserved' && booking.status === 'cancelled') {
        const payment = await this.prisma.relayPaymentRecord.create({
          data: {
            bookingId,
            mode: booking.paymentMode,
            currency: 'GHS',
            amountMinor: 0,
            state: 'reconciliation_required',
            idempotencyKey,
            note: 'Payment arrived after hold/booking was cancelled — reconciliation required; booking not resurrected.',
          },
        });
        await this.prisma.relayBooking.update({
          where: { id: bookingId },
          data: { paymentState: 'reconciliation_required' },
        });
        return { booking, payment, reused: false };
      }
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.relayPaymentRecord.create({
        data: {
          bookingId,
          mode: booking.paymentMode,
          currency: booking.quote.currency,
          amountMinor: booking.quote.amountMinor,
          state: 'marked_paid',
          idempotencyKey,
          note: 'Manual invoice marked paid by authorized requester/admin.',
        },
      });
      await tx.relayBooking.update({
        where: { id: bookingId },
        data: { paymentState: 'marked_paid', status: 'confirmed' },
      });
      await tx.relayRequest.update({
        where: { id: booking.requestId },
        data: { status: 'confirmed' },
      });
      return p;
    });
    await this.appendEvent(booking.requestId, 'booking.confirmed', { bookingId });
    await this.audit(actor, 'payment.mark_paid', { paymentId: payment.id }, { bookingId });
    return { booking: await this.loadBooking(actor, bookingId), payment, reused: false };
  }

  private async loadBooking(
    actor: RelayActor,
    bookingId: string,
    opts?: { asRequester?: boolean; asInterpreter?: boolean },
  ) {
    const booking = await this.prisma.relayBooking.findFirst({
      where: {
        id: bookingId,
        organizationId: actor.organizationId,
      },
      include: {
        quote: true,
        slot: true,
        interpreter: true,
        request: true,
        contextGrants: { orderBy: { createdAt: 'desc' } },
        sessions: true,
        payments: true,
        disputes: true,
        feedback: true,
        usage: true,
        corrections: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!booking) {
      throw new ApiException('not_found', 'Booking not found', HttpStatus.NOT_FOUND);
    }
    const isRequester = booking.requesterUserId === actor.userId;
    const isInterpreter = booking.interpreter.ownerUserId === actor.userId;
    const isDemo = booking.interpreter.supplyKind === 'demo_staffed';
    if (opts?.asRequester && !isRequester) {
      throw new ApiException('forbidden', 'Requester only', HttpStatus.FORBIDDEN);
    }
    if (opts?.asInterpreter && !isInterpreter && !isDemo) {
      throw new ApiException('forbidden', 'Interpreter only', HttpStatus.FORBIDDEN);
    }
    if (!isRequester && !isInterpreter && !isDemo) {
      throw new ApiException('not_found', 'Booking not found', HttpStatus.NOT_FOUND);
    }
    return booking;
  }

  async listBookings(actor: RelayActor) {
    await this.assertEnabled(actor.organizationId);
    const bookings = await this.prisma.relayBooking.findMany({
      where: {
        organizationId: actor.organizationId,
        OR: [
          { requesterUserId: actor.userId },
          { interpreter: { ownerUserId: actor.userId } },
          { interpreter: { supplyKind: 'demo_staffed' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        interpreter: { select: { id: true, displayName: true, supplyKind: true } },
        quote: true,
        request: { select: { corridorId: true, category: true, status: true } },
      },
    });
    return { bookings };
  }

  async getBooking(actor: RelayActor, bookingId: string) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId);
    return {
      booking: {
        ...booking,
        authorityNote:
          'Interpreter may clarify meaning only. Participants confirm their own business terms.',
      },
    };
  }

  async createContextGrant(
    actor: RelayActor,
    bookingId: string,
    input: {
      purpose: string;
      evidence: unknown[];
      originProduct?: string;
      scopeNote?: string;
      expiresInHours?: number;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId, { asRequester: true });
    if (!['confirmed', 'in_progress', 'awaiting_payment'].includes(booking.status)) {
      throw new ApiException(
        'booking_state',
        'Context grants require an active booking',
        HttpStatus.CONFLICT,
      );
    }
    const grant = await this.prisma.relayContextGrant.create({
      data: {
        bookingId,
        ownerUserId: actor.userId,
        purpose: input.purpose || 'session_interpretation',
        evidence: (input.evidence ?? []) as Prisma.InputJsonValue,
        originProduct: input.originProduct,
        scopeNote:
          input.scopeNote ||
          'Interpreter sees only this granted evidence. Cannot confirm business terms for participants.',
        expiresAt: new Date(Date.now() + (input.expiresInHours ?? 24) * 3600_000),
      },
    });
    await this.appendEvent(booking.requestId, 'context.granted', { grantId: grant.id });
    await this.audit(actor, 'context.grant', { grantId: grant.id }, { bookingId });
    return { grant };
  }

  async revokeContextGrant(actor: RelayActor, bookingId: string, grantId: string) {
    await this.assertEnabled(actor.organizationId);
    await this.loadBooking(actor, bookingId, { asRequester: true });
    const grant = await this.prisma.relayContextGrant.findFirst({
      where: { id: grantId, bookingId, ownerUserId: actor.userId },
    });
    if (!grant) throw new ApiException('not_found', 'Grant not found', HttpStatus.NOT_FOUND);
    const updated = await this.prisma.relayContextGrant.update({
      where: { id: grantId },
      data: { revokedAt: new Date(), revision: { increment: 1 } },
    });
    await this.audit(actor, 'context.revoke', { grantId }, { bookingId });
    return {
      grant: updated,
      note: 'Future reads blocked. Information already heard/downloaded cannot be erased.',
    };
  }

  async join(actor: RelayActor, bookingId: string, input?: { recordingOptIn?: boolean }) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId);
    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      throw new ApiException(
        'booking_not_ready',
        'Booking must be confirmed (payment marked) before join',
        HttpStatus.CONFLICT,
      );
    }
    if (booking.interpreter.status === 'suspended') {
      throw new ApiException(
        'interpreter_suspended',
        'Interpreter suspended — reassignment/refund workflow required',
        HttpStatus.CONFLICT,
      );
    }

    const isRequester = booking.requesterUserId === actor.userId;
    const role = isRequester ? 'requester' : 'interpreter';
    let session = booking.sessions[0];
    if (!session) {
      session = await this.prisma.relaySession.create({
        data: {
          bookingId,
          roomId: mintRoomId(),
          state: 'lobby',
          recordingOptIn: Boolean(input?.recordingOptIn),
          participants: [] as unknown as Prisma.InputJsonValue,
        },
      });
    }

    const activeGrants = booking.contextGrants.filter((g) => !g.revokedAt && g.expiresAt > new Date());
    const media = this.adapters.issueJoinToken({
      bookingId,
      roomId: session.roomId,
      actorId: actor.userId,
      role,
    });

    const participants = Array.isArray(session.participants)
      ? [...(session.participants as { userId: string; role: string; joinedAt: string }[])]
      : [];
    if (!participants.some((p) => p.userId === actor.userId)) {
      participants.push({ userId: actor.userId, role, joinedAt: new Date().toISOString() });
    }

    const updated = await this.prisma.relaySession.update({
      where: { id: session.id },
      data: {
        state: participants.length >= 2 ? 'live' : 'lobby',
        startedAt: session.startedAt ?? new Date(),
        participants: participants as unknown as Prisma.InputJsonValue,
        recordingOptIn: input?.recordingOptIn ?? session.recordingOptIn,
      },
    });
    if (updated.state === 'live' && booking.status === 'confirmed') {
      await this.prisma.relayBooking.update({
        where: { id: bookingId },
        data: { status: 'in_progress' },
      });
      await this.prisma.relayRequest.update({
        where: { id: booking.requestId },
        data: { status: 'in_progress' },
      });
      await this.appendEvent(booking.requestId, 'session.started', { sessionId: updated.id });
    }

    await this.audit(actor, 'session.join', { role }, { bookingId });
    return {
      session: updated,
      media,
      contextGrants: role === 'interpreter' ? activeGrants : activeGrants,
      authority: {
        canConfirmBusinessTerms: false,
        canImpersonateUser: false,
        note: 'Interpreter may clarify meaning only. Participants confirm their own DealBridge/MeetingBridge terms.',
      },
    };
  }

  async complete(
    actor: RelayActor,
    bookingId: string,
    input?: { connectedSeconds?: number },
  ) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId);
    const connectedSeconds = Math.max(0, Math.min(input?.connectedSeconds ?? 0, 6 * 3600));
    const billableSeconds = Math.max(
      booking.quote.minimumMinutes * 60,
      Math.ceil(connectedSeconds / (booking.quote.billingIncrementMin * 60)) *
        booking.quote.billingIncrementMin *
        60,
    );
    const quoteMoneyCeilingSeconds =
      ((booking.quote.overrunCeilingMinor ?? booking.quote.amountMinor) /
        Math.max(1, booking.quote.amountMinor)) *
      booking.quote.includedMinutes *
      60;
    const ceilingSeconds =
      quoteMoneyCeilingSeconds + (booking.extensionApprovedMinutes ?? 0) * 60;

    if (billableSeconds > ceilingSeconds + 1) {
      throw new ApiException(
        'overrun_ceiling',
        'Billable duration exceeds quote overrun ceiling — request explicit extension approval first',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.relayUsageLedger.create({
        data: {
          bookingId,
          connectedSeconds,
          billableSeconds,
          rateSnapshotHash: booking.quote.contentHash,
          evidence: {
            source: 'server_session_intervals',
            note: 'Browser client timers are not billing authority.',
          } as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.relaySession.updateMany({
        where: { bookingId },
        data: { state: 'ended', endedAt: new Date() },
      });
      await tx.relayBooking.update({
        where: { id: bookingId },
        data: { status: 'completed', completedAt: new Date() },
      });
      await tx.relayRequest.update({
        where: { id: booking.requestId },
        data: { status: 'completed' },
      });
    });
    await this.appendEvent(booking.requestId, 'session.ended', { bookingId });
    await this.appendEvent(booking.requestId, 'usage.finalized', { billableSeconds });
    await this.audit(actor, 'booking.complete', { billableSeconds }, { bookingId });
    return { booking: await this.loadBooking(actor, bookingId) };
  }

  async cancel(actor: RelayActor, bookingId: string, reason?: string) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId);
    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new ApiException('booking_state', 'Booking already finished', HttpStatus.CONFLICT);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.relayBooking.update({
        where: { id: bookingId },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      await tx.relayAvailabilitySlot.update({
        where: { id: booking.slotId },
        data: {
          state: 'open',
          heldByRequestId: null,
          holdExpiresAt: null,
          revision: { increment: 1 },
        },
      });
      await tx.relayRequest.update({
        where: { id: booking.requestId },
        data: { status: 'cancelled' },
      });
      await tx.relaySession.updateMany({
        where: { bookingId, state: { not: 'ended' } },
        data: { state: 'ended', endedAt: new Date() },
      });
    });
    await this.appendEvent(booking.requestId, 'booking.cancelled', { reason });
    await this.audit(actor, 'booking.cancel', { reason }, { bookingId });
    return {
      booking: await this.loadBooking(actor, bookingId),
      note: 'Historical evidence preserved. Slot released for future matching.',
    };
  }

  async feedback(
    actor: RelayActor,
    bookingId: string,
    input: { rating?: number; comment?: string; role?: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId);
    const role =
      input.role ||
      (booking.requesterUserId === actor.userId ? 'requester' : 'interpreter');
    const row = await this.prisma.relayFeedback.create({
      data: {
        bookingId,
        authorId: actor.userId,
        role,
        rating: input.rating == null ? null : Math.min(5, Math.max(1, input.rating)),
        comment: input.comment,
      },
    });
    return {
      feedback: row,
      note: 'Ratings supplement qualification; they do not automatically decide disputes or payouts.',
    };
  }

  async approveExtension(
    actor: RelayActor,
    bookingId: string,
    input: { additionalMinutes: number; expectedRevision?: number },
  ) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId, { asRequester: true });
    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      throw new ApiException(
        'booking_state',
        'Extensions require a confirmed or in-progress booking',
        HttpStatus.CONFLICT,
      );
    }
    const additionalMinutes = Math.min(120, Math.max(15, Math.round(input.additionalMinutes || 0)));
    if (input.expectedRevision != null && input.expectedRevision !== booking.revision) {
      throw new ApiException(
        'revision_conflict',
        'Booking revision changed — refresh and re-approve extension',
        HttpStatus.CONFLICT,
      );
    }
    const updated = await this.prisma.relayBooking.update({
      where: { id: bookingId },
      data: {
        extensionApprovedMinutes: { increment: additionalMinutes },
        revision: { increment: 1 },
      },
    });
    await this.appendEvent(booking.requestId, 'booking.extension_approved', {
      additionalMinutes,
      totalApproved: updated.extensionApprovedMinutes,
    });
    await this.audit(
      actor,
      'booking.extension',
      { additionalMinutes, total: updated.extensionApprovedMinutes },
      { bookingId },
    );
    return {
      booking: await this.loadBooking(actor, bookingId),
      note: 'Overrun ceiling raised only by this explicit approval. Client timers remain non-authoritative.',
    };
  }

  async submitCorrection(
    actor: RelayActor,
    bookingId: string,
    input: {
      suggestion: string;
      grantId?: string;
      sourceEvidenceNote?: string;
      trainingRightsGranted?: boolean;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId);
    if (!input.suggestion?.trim()) {
      throw new ApiException('validation_error', 'suggestion is required', HttpStatus.BAD_REQUEST);
    }
    if (input.grantId) {
      const grant = booking.contextGrants.find((g) => g.id === input.grantId);
      if (!grant) {
        throw new ApiException('not_found', 'Context grant not found', HttpStatus.NOT_FOUND);
      }
      await this.prisma.relayContextGrant.update({
        where: { id: grant.id },
        data: { stale: true, revision: { increment: 1 } },
      });
    } else {
      await this.prisma.relayContextGrant.updateMany({
        where: { bookingId, revokedAt: null },
        data: { stale: true },
      });
    }
    const correction = await this.prisma.relayCorrectionRecord.create({
      data: {
        bookingId,
        grantId: input.grantId,
        authorId: actor.userId,
        suggestion: input.suggestion.trim(),
        sourceEvidenceNote: input.sourceEvidenceNote,
        trainingRightsGranted: Boolean(input.trainingRightsGranted),
        reviewStatus: 'pending_review',
      },
    });
    await this.appendEvent(booking.requestId, 'context.changed', {
      correctionId: correction.id,
      stale: true,
    });
    await this.audit(actor, 'correction.submit', { correctionId: correction.id }, { bookingId });
    return {
      correction,
      note: 'Source correction flags handoff context stale. Training use stays off unless separately granted.',
    };
  }

  async reviewCorrection(
    actor: RelayActor,
    bookingId: string,
    correctionId: string,
    input: { reviewStatus: 'accepted' | 'rejected' },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.loadBooking(actor, bookingId, { asRequester: true });
    const row = await this.prisma.relayCorrectionRecord.findFirst({
      where: { id: correctionId, bookingId },
    });
    if (!row) throw new ApiException('not_found', 'Correction not found', HttpStatus.NOT_FOUND);
    const updated = await this.prisma.relayCorrectionRecord.update({
      where: { id: correctionId },
      data: {
        reviewStatus: input.reviewStatus,
        reviewedAt: new Date(),
        reviewedById: actor.userId,
      },
    });
    await this.audit(
      actor,
      'correction.review',
      { correctionId, status: input.reviewStatus },
      { bookingId },
    );
    return { correction: updated };
  }

  async openDispute(
    actor: RelayActor,
    bookingId: string,
    input: { issue: string; evidence?: unknown[] },
  ) {
    await this.assertEnabled(actor.organizationId);
    const booking = await this.loadBooking(actor, bookingId);
    if (!input.issue?.trim()) {
      throw new ApiException('validation_error', 'issue is required', HttpStatus.BAD_REQUEST);
    }
    const dispute = await this.prisma.$transaction(async (tx) => {
      const d = await tx.relayDispute.create({
        data: {
          bookingId,
          openedById: actor.userId,
          issue: input.issue.trim(),
          evidence: (input.evidence ?? []) as Prisma.InputJsonValue,
          status: 'open',
        },
      });
      await tx.relayBooking.update({
        where: { id: bookingId },
        data: { status: 'disputed' },
      });
      await tx.relayRequest.update({
        where: { id: booking.requestId },
        data: { status: 'disputed' },
      });
      return d;
    });
    await this.appendEvent(booking.requestId, 'dispute.opened', { disputeId: dispute.id });
    await this.audit(actor, 'dispute.open', { disputeId: dispute.id }, { bookingId });
    return {
      dispute,
      note: 'Human-operated process. Service evidence is preserved; dispute does not erase completion records.',
    };
  }

  async registerInterpreter(
    actor: RelayActor,
    input: {
      displayName?: string;
      languagePairs?: { source: string; target: string }[];
      timezone?: string;
      confidentialityAccepted?: boolean;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    if (!input.confidentialityAccepted) {
      throw new ApiException(
        'confidentiality_required',
        'Confidentiality acceptance is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const profile = await this.prisma.relayInterpreterProfile.upsert({
      where: {
        organizationId_ownerUserId: {
          organizationId: actor.organizationId,
          ownerUserId: actor.userId,
        },
      },
      create: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        ownerUserId: actor.userId,
        displayName: input.displayName?.trim() || 'Interpreter',
        supplyKind: 'reviewed_human',
        status: 'pending_review',
        identityVerification: 'unverified',
        languagePairs: (input.languagePairs ?? [
          { source: 'ak', target: 'en' },
          { source: 'en', target: 'ak' },
        ]) as unknown as Prisma.InputJsonValue,
        domains: ['general_business'] as unknown as Prisma.InputJsonValue,
        timezone: input.timezone ?? 'Africa/Accra',
        confidentialityAccepted: true,
      },
      update: {
        displayName: input.displayName?.trim(),
        languagePairs: input.languagePairs
          ? (input.languagePairs as unknown as Prisma.InputJsonValue)
          : undefined,
        timezone: input.timezone,
        confidentialityAccepted: true,
      },
    });
    await this.audit(actor, 'interpreter.register', { profileId: profile.id });
    return {
      profile,
      note: 'Pending human credential review. Fluent bilingual is not automatic qualification.',
    };
  }

  async reviewInterpreter(
    actor: RelayActor,
    profileId: string,
    input: { status: 'approved' | 'suspended'; reviewerNote?: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    // Org owner/admin path — TranslateAuthGuard already scoped to org
    const profile = await this.prisma.relayInterpreterProfile.findFirst({
      where: { id: profileId, organizationId: actor.organizationId },
    });
    if (!profile) throw new ApiException('not_found', 'Profile not found', HttpStatus.NOT_FOUND);
    const updated = await this.prisma.relayInterpreterProfile.update({
      where: { id: profileId },
      data: {
        status: input.status,
        reviewerNote: input.reviewerNote,
        reviewedAt: new Date(),
        reviewedById: actor.userId,
        identityVerification:
          input.status === 'approved' ? 'org_reviewed' : profile.identityVerification,
      },
    });
    await this.audit(actor, 'interpreter.review', { profileId, status: input.status });
    return { profile: updated };
  }

  async createSlot(
    actor: RelayActor,
    interpreterId: string,
    input: { startAt: string; endAt: string; displayTimezone?: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    const profile = await this.prisma.relayInterpreterProfile.findFirst({
      where: { id: interpreterId, organizationId: actor.organizationId },
    });
    if (!profile) throw new ApiException('not_found', 'Interpreter not found', HttpStatus.NOT_FOUND);
    if (profile.ownerUserId !== actor.userId && profile.supplyKind !== 'demo_staffed') {
      throw new ApiException('forbidden', 'Not your interpreter profile', HttpStatus.FORBIDDEN);
    }
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (!(startAt < endAt)) {
      throw new ApiException('validation_error', 'endAt must be after startAt', HttpStatus.BAD_REQUEST);
    }
    const overlaps = await this.prisma.relayAvailabilitySlot.findMany({
      where: { interpreterId, state: { in: ['open', 'held', 'reserved'] } },
    });
    for (const s of overlaps) {
      if (intervalsOverlap(startAt, endAt, s.startAt, s.endAt, 0)) {
        throw new ApiException('slot_conflict', 'Overlapping availability slot', HttpStatus.CONFLICT);
      }
    }
    const slot = await this.prisma.relayAvailabilitySlot.create({
      data: {
        interpreterId,
        startAt,
        endAt,
        displayTimezone: input.displayTimezone ?? profile.timezone,
        state: 'open',
      },
    });
    return { slot };
  }

  async listOffersForInterpreter(actor: RelayActor) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureDemoSupply(actor);
    const offers = await this.prisma.relayOffer.findMany({
      where: {
        state: 'pending',
        expiresAt: { gt: new Date() },
        interpreter: {
          organizationId: actor.organizationId,
          OR: [{ ownerUserId: actor.userId }, { supplyKind: 'demo_staffed' }],
        },
      },
      include: {
        request: true,
        slot: true,
        quotes: true,
        interpreter: { select: { id: true, displayName: true, supplyKind: true } },
      },
      orderBy: { expiresAt: 'asc' },
      take: 50,
    });
    return { offers };
  }

  async opsOverview(actor: RelayActor) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureDemoSupply(actor);
    const [approved, pendingReview, unmatched, upcoming, disputes, reconciliations] =
      await Promise.all([
        this.prisma.relayInterpreterProfile.count({
          where: { organizationId: actor.organizationId, status: 'approved' },
        }),
        this.prisma.relayInterpreterProfile.count({
          where: { organizationId: actor.organizationId, status: 'pending_review' },
        }),
        this.prisma.relayRequest.count({
          where: { organizationId: actor.organizationId, status: 'unmatched' },
        }),
        this.prisma.relayBooking.count({
          where: {
            organizationId: actor.organizationId,
            status: { in: ['confirmed', 'awaiting_payment'] },
            reservedStartAt: { gt: new Date() },
          },
        }),
        this.prisma.relayDispute.count({
          where: { booking: { organizationId: actor.organizationId }, status: 'open' },
        }),
        this.prisma.relayPaymentRecord.count({
          where: {
            state: 'reconciliation_required',
            booking: { organizationId: actor.organizationId },
          },
        }),
      ]);
    return {
      overview: {
        approvedInterpreters: approved,
        pendingReview,
        unmatchedRequests: unmatched,
        upcomingBookings: upcoming,
        openDisputes: disputes,
        paymentReconciliations: reconciliations,
      },
      slaNote:
        'SLA expectations follow staffed availability only — no 24/7 or instant coverage claim without evidence.',
      policyVersion: RELAY_POLICY_VERSION,
    };
  }
}
