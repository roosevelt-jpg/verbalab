import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { LocalStorageService } from '../documents/local-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { DealBridgeAdapters } from './dealbridge.adapters';
import { dealbridgeCatalog } from './dealbridge.catalog';
import { extractTermCandidates } from './dealbridge.extractor';
import { contentHash, hashToken, mintToken, sha256Hex } from './dealbridge.hash';
import { signReceiptPayload, verifyReceiptSignature } from './dealbridge.receipt-signer';
import {
  assertTransition,
  canAcceptTurns,
  canConfirm,
  isTerminal,
} from './dealbridge.state-machine';
import {
  recomputeUnresolved,
  setByPath,
  summarizeTerms,
  validateMoneyAndUnits,
} from './dealbridge.terms';
import {
  CONSENT_PURPOSES,
  DEALBRIDGE_CORRIDORS,
  DEALBRIDGE_FEATURE,
  DEALBRIDGE_NOTICE_VERSION,
  DEALBRIDGE_SCHEMA_VERSION,
  DealState,
  NormalizedTerms,
  REQUIRED_FIELDS_BY_CATEGORY,
} from './dealbridge.types';
import { verifyExplainBack } from './dealbridge.verifier';

type Actor = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  apiKeyId?: string;
  authContext: string;
  ip?: string;
};

const MAX_AUDIO_BYTES = Number(process.env.DEALBRIDGE_MAX_AUDIO_BYTES ?? 5_000_000);
const ALLOWED_AUDIO = new Set([
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'application/octet-stream',
]);

@Injectable()
export class DealBridgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly audit: AuditService,
    private readonly storage: LocalStorageService,
    private readonly adapters: DealBridgeAdapters,
  ) {}

  catalog() {
    return dealbridgeCatalog();
  }

  async assertEnabled(organizationId: string) {
    if (process.env.DEALBRIDGE_DISABLED === '1') {
      throw new ApiException(
        'feature_disabled',
        'DealBridge is disabled by DEALBRIDGE_DISABLED=1',
        HttpStatus.FORBIDDEN,
      );
    }
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true, featureOverrides: true, disabledAt: true },
    });
    if (org.disabledAt) {
      throw new ApiException('org_disabled', 'Organization is disabled', HttpStatus.FORBIDDEN);
    }
    const overrides = (org.featureOverrides ?? {}) as Record<string, unknown>;
    if (typeof overrides.dealBridge === 'boolean') {
      if (!overrides.dealBridge) {
        throw new ApiException(
          'feature_disabled',
          'DealBridge is disabled for this organization',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }
    // Pilot default: available when commercial entitlement exists, or DEALBRIDGE_OPEN=1.
    if (process.env.DEALBRIDGE_OPEN === '1') return;
    await this.billing.assertFeature(
      organizationId,
      DEALBRIDGE_FEATURE,
      'DealBridge requires a plan with the dealBridge entitlement (Pro+), or set featureOverrides.dealBridge=true / DEALBRIDGE_OPEN=1 for pilot.',
    );
  }

  private resolveCorridor(merchantLanguage: string, buyerLanguage: string, category: string) {
    const corridor = DEALBRIDGE_CORRIDORS.find(
      (c) =>
        c.merchantLanguage === merchantLanguage &&
        c.buyerLanguage === buyerLanguage &&
        c.category === category,
    );
    if (!corridor) {
      throw new ApiException(
        'unsupported_corridor',
        `No DealBridge corridor for ${merchantLanguage}↔${buyerLanguage} / ${category}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return corridor;
  }

  async listSessions(actor: Actor) {
    await this.assertEnabled(actor.organizationId);
    const sessions = await this.prisma.dealSession.findMany({
      where: {
        deletedAt: null,
        OR: [
          { organizationId: actor.organizationId },
          { participants: { some: { userId: actor.userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        participants: true,
        receipts: { orderBy: { issuedAt: 'desc' }, take: 1 },
      },
    });
    return {
      headline: 'Speak your language. Confirm the same deal.',
      sessions: sessions.map((s) => ({
        id: s.id,
        state: s.state,
        category: s.category,
        corridor: s.corridor,
        merchantLanguage: s.merchantLanguage,
        buyerLanguage: s.buyerLanguage,
        activeRevision: s.activeRevision,
        expiresAt: s.expiresAt,
        isDemo: s.isDemo,
        isFixture: s.isFixture,
        participants: s.participants.map((p) => ({
          id: p.id,
          role: p.role,
          language: p.language,
          userId: p.userId,
        })),
        latestReceiptId: s.receipts[0]?.id ?? null,
        superseded: Boolean(s.receipts[0]?.supersededByReceiptId),
      })),
    };
  }

  async createSession(
    actor: Actor,
    body: {
      category?: string;
      merchantLanguage: string;
      buyerLanguage: string;
      timeZone?: string;
      expiresInHours?: number;
      idempotencyKey?: string;
      pilotCohort?: 'baseline' | 'dealbridge';
      isDemo?: boolean;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const category = body.category ?? 'wholesale_rice';
    const corridor = this.resolveCorridor(body.merchantLanguage, body.buyerLanguage, category);
    if (body.idempotencyKey) {
      const existing = await this.prisma.dealSession.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: actor.organizationId,
            idempotencyKey: body.idempotencyKey,
          },
        },
        include: { participants: true },
      });
      if (existing) return this.sessionView(existing.id, actor);
    }

    const expiresAt = new Date(
      Date.now() + Math.max(1, Math.min(body.expiresInHours ?? 72, 24 * 14)) * 3600_000,
    );
    const session = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dealSession.create({
        data: {
          organizationId: actor.organizationId,
          workspaceId: actor.workspaceId,
          category,
          corridor: corridor.id,
          merchantLanguage: body.merchantLanguage,
          buyerLanguage: body.buyerLanguage,
          timeZone: body.timeZone ?? 'Africa/Accra',
          state: 'draft',
          expiresAt,
          idempotencyKey: body.idempotencyKey,
          isDemo: Boolean(body.isDemo),
          isFixture: Boolean(body.isDemo),
          pilotCohort: body.pilotCohort,
          participants: {
            create: {
              userId: actor.userId,
              role: 'merchant',
              language: body.merchantLanguage,
              authContext: actor.authContext,
            },
          },
        },
      });
      await this.appendEvent(tx, created.id, actor.organizationId, 'deal.started', {
        category,
        corridor: corridor.id,
      });
      await tx.dealAuditEvent.create({
        data: {
          organizationId: actor.organizationId,
          sessionId: created.id,
          actorUserId: actor.userId,
          operation: 'session.created',
        },
      });
      return created;
    });

    if (body.pilotCohort) {
      await this.recordPilotEvent({
        organizationId: actor.organizationId,
        sessionId: session.id,
        merchantPseudoId: sha256Hex(actor.userId).slice(0, 16),
        cohort: body.pilotCohort,
        corridor: corridor.id,
        type: 'pilot.enrolled',
        payload: { category },
      });
      await this.recordPilotEvent({
        organizationId: actor.organizationId,
        sessionId: session.id,
        merchantPseudoId: sha256Hex(actor.userId).slice(0, 16),
        cohort: body.pilotCohort,
        corridor: corridor.id,
        type: 'deal.started',
        payload: {},
      });
    }

    await this.safeAudit(actor, 'dealbridge.session_created', 'POST /v1/dealbridge/sessions', {
      sessionId: session.id,
      corridor: corridor.id,
    });

    return this.sessionView(session.id, actor);
  }

  async peekInvite(token: string) {
    const invite = await this.prisma.dealInvite.findFirst({
      where: { tokenHash: hashToken(token) },
      include: {
        session: {
          select: {
            id: true,
            category: true,
            corridor: true,
            merchantLanguage: true,
            buyerLanguage: true,
            expiresAt: true,
            state: true,
            isDemo: true,
            isFixture: true,
          },
        },
      },
    });
    if (!invite) {
      throw new ApiException('invalid_invite', 'Invite not found', HttpStatus.NOT_FOUND);
    }
    return {
      sessionId: invite.session.id,
      category: invite.session.category,
      corridor: invite.session.corridor,
      merchantLanguage: invite.session.merchantLanguage,
      buyerLanguage: invite.session.buyerLanguage,
      sessionExpiresAt: invite.session.expiresAt,
      inviteExpiresAt: invite.expiresAt,
      redeemed: Boolean(invite.redeemedAt),
      state: invite.session.state,
      demoLabel:
        invite.session.isDemo || invite.session.isFixture ? 'SIMULATED / FIXTURE DEMO' : null,
      noticeVersion: DEALBRIDGE_NOTICE_VERSION,
      recordingNotice:
        'Joining records your identity and requires explicit consent for processing and recording before voice turns. Training consent is separate and optional.',
    };
  }

  async createInvite(actor: Actor, sessionId: string, expiresInHours = 48) {
    const session = await this.requireMemberSession(sessionId, actor, 'merchant');
    this.assertNotExpired(session);
    const token = mintToken();
    const invite = await this.prisma.dealInvite.create({
      data: {
        sessionId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + Math.max(1, Math.min(expiresInHours, 168)) * 3600_000),
      },
    });
    if (session.state === 'draft') {
      await this.transition(sessionId, 'draft', 'invited', actor.userId);
    }
    await this.prisma.dealAuditEvent.create({
      data: {
        organizationId: actor.organizationId,
        sessionId,
        actorUserId: actor.userId,
        operation: 'invite.created',
        metadata: { inviteId: invite.id },
      },
    });
    return {
      inviteId: invite.id,
      token,
      expiresAt: invite.expiresAt,
      joinPath: `/dealbridge/join/${token}`,
      notice: 'Token is single-use and shown once. Hash stored at rest.',
    };
  }

  async join(
    actor: Actor,
    sessionId: string,
    body: { token: string; language: string; variety?: string },
  ) {
    // Invite redemption is cross-tenant: buyer authenticates independently, then binds to the merchant session.
    const tokenHash = hashToken(body.token);
    const invite = await this.prisma.dealInvite.findFirst({
      where: { tokenHash, sessionId },
      include: {
        session: { include: { participants: true } },
      },
    });
    if (!invite || invite.session.deletedAt) {
      throw new ApiException('invalid_invite', 'Invite token is invalid', HttpStatus.FORBIDDEN);
    }
    const session = invite.session;
    this.assertNotExpired(session);
    if (invite.redeemedAt) {
      throw new ApiException('invite_used', 'Invite token already redeemed', HttpStatus.CONFLICT);
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new ApiException('invite_expired', 'Invite token expired', HttpStatus.GONE);
    }
    if (session.participants.some((p) => p.userId === actor.userId)) {
      return this.sessionView(sessionId, actor);
    }
    if (session.participants.some((p) => p.role === 'buyer')) {
      throw new ApiException(
        'buyer_exists',
        'This session already has a buyer participant',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.dealInvite.update({
        where: { id: invite.id },
        data: { redeemedAt: new Date(), redeemedByUserId: actor.userId },
      });
      await tx.dealParticipant.create({
        data: {
          sessionId,
          userId: actor.userId,
          role: 'buyer',
          language: body.language,
          variety: body.variety,
          authContext: actor.authContext,
        },
      });
      if (session.state === 'invited' || session.state === 'draft') {
        assertTransition(session.state as DealState, 'active');
        await tx.dealSession.update({
          where: { id: sessionId },
          data: { state: 'active' },
        });
      }
      await this.appendEvent(tx, sessionId, session.organizationId, 'turn.received', {
        kind: 'buyer_joined',
      });
    });

    return this.sessionView(sessionId, actor);
  }

  async recordConsent(
    actor: Actor,
    sessionId: string,
    body: { purpose: string; decision: 'granted' | 'denied'; noticeVersion?: string },
  ) {
    const session = await this.requireMemberSession(sessionId, actor);
    if (!CONSENT_PURPOSES.includes(body.purpose as never)) {
      throw new ApiException(
        'validation_error',
        `purpose must be one of ${CONSENT_PURPOSES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const participant = session.participants.find((p) => p.userId === actor.userId)!;
    const event = await this.prisma.dealConsentEvent.create({
      data: {
        sessionId,
        participantId: participant.id,
        purpose: body.purpose,
        noticeVersion: body.noticeVersion ?? DEALBRIDGE_NOTICE_VERSION,
        decision: body.decision,
      },
    });
    return { consent: event, noticeVersion: DEALBRIDGE_NOTICE_VERSION };
  }

  async issueUploadAuth(actor: Actor, sessionId: string) {
    const session = await this.requireMemberSession(sessionId, actor);
    this.assertNotExpired(session);
    if (!canAcceptTurns(session.state as DealState)) {
      throw new ApiException(
        'invalid_state',
        `Cannot upload turns while session is ${session.state}`,
        HttpStatus.CONFLICT,
      );
    }
    const participant = session.participants.find((p) => p.userId === actor.userId)!;
    const processing = await this.prisma.dealConsentEvent.findFirst({
      where: {
        sessionId,
        participantId: participant.id,
        purpose: 'processing',
        decision: 'granted',
      },
    });
    const recording = await this.prisma.dealConsentEvent.findFirst({
      where: {
        sessionId,
        participantId: participant.id,
        purpose: 'recording',
        decision: 'granted',
      },
    });
    if (!processing || !recording) {
      throw new ApiException(
        'consent_required',
        'Processing and recording consents are required before audio upload',
        HttpStatus.FORBIDDEN,
      );
    }
    return {
      maxBytes: MAX_AUDIO_BYTES,
      allowedMimeTypes: [...ALLOWED_AUDIO],
      uploadPath: `/v1/dealbridge/sessions/${sessionId}/turns`,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    };
  }

  async createTurn(
    actor: Actor,
    sessionId: string,
    body: {
      text?: string;
      language?: string;
      expectedRevision?: number;
      file?: Express.Multer.File;
    },
  ) {
    const session = await this.requireMemberSession(sessionId, actor);
    this.assertNotExpired(session);
    if (!canAcceptTurns(session.state as DealState) && session.state !== 'active') {
      if (!canAcceptTurns(session.state as DealState)) {
        throw new ApiException(
          'invalid_state',
          `Cannot add turns while session is ${session.state}`,
          HttpStatus.CONFLICT,
        );
      }
    }
    if (
      body.expectedRevision != null &&
      body.expectedRevision !== session.activeRevision
    ) {
      throw new ApiException(
        'revision_conflict',
        `expectedRevision ${body.expectedRevision} != active ${session.activeRevision}`,
        HttpStatus.CONFLICT,
      );
    }
    const speaker = session.participants.find((p) => p.userId === actor.userId)!;
    const peer = session.participants.find((p) => p.id !== speaker.id);
    if (!peer) {
      throw new ApiException(
        'buyer_required',
        'Both participants must join before conversation turns',
        HttpStatus.CONFLICT,
      );
    }

    let text = body.text?.trim() ?? '';
    let audioStorageKey: string | null = null;
    let audioMimeType: string | null = null;
    let audioBytes: number | null = null;
    let asrProvider: string | null = null;
    let asrModelVersion: string | null = null;
    let status = 'ready';
    let processingError: string | null = null;

    if (body.file) {
      this.assertAudio(body.file);
      const processing = await this.prisma.dealConsentEvent.findFirst({
        where: {
          sessionId,
          participantId: speaker.id,
          purpose: 'processing',
          decision: 'granted',
        },
      });
      if (!processing) {
        throw new ApiException(
          'consent_required',
          'Processing consent required for audio turns',
          HttpStatus.FORBIDDEN,
        );
      }
      audioStorageKey = `dealbridge/${sessionId}/${mintToken(16)}.bin`;
      await this.storage.writeBuffer(audioStorageKey, body.file.buffer);
      audioMimeType = body.file.mimetype || 'application/octet-stream';
      audioBytes = body.file.size;
      const asr = await this.adapters.recognize({
        file: body.file,
        language: body.language ?? speaker.language,
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        apiKeyId: actor.apiKeyId,
        userId: actor.userId,
        ip: actor.ip,
      });
      asrProvider = asr.provider;
      asrModelVersion = asr.modelVersion;
      if (asr.status === 'unavailable') {
        status = 'failed';
        processingError = 'ASR unavailable';
      } else {
        text = asr.text;
        if (asr.status === 'fixture') {
          // labeled in response / event payload
        }
      }
      await this.recordCost(sessionId, session.organizationId, 'asr', 2500);
    }

    if (!text && status !== 'failed') {
      throw new ApiException(
        'validation_error',
        'text or audio file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const seq = (await this.prisma.dealConversationTurn.count({ where: { sessionId } })) + 1;
    const turn = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dealConversationTurn.create({
        data: {
          sessionId,
          speakerId: speaker.id,
          sequence: seq,
          sourceLanguage: body.language ?? speaker.language,
          audioStorageKey,
          audioMimeType,
          audioBytes,
          status,
          asrProvider,
          asrModelVersion,
          processingError,
          transcripts: text
            ? { create: { text, editor: body.file ? 'asr' : 'participant' } }
            : undefined,
        },
        include: { transcripts: true },
      });
      await this.appendEvent(tx, sessionId, session.organizationId, 'turn.received', {
        turnId: created.id,
        sequence: seq,
      });
      if (text) {
        await this.appendEvent(tx, sessionId, session.organizationId, 'transcript.ready', {
          turnId: created.id,
          fixture: asrProvider?.includes('fixture') ?? false,
        });
      }
      if (status === 'failed') {
        await this.appendEvent(tx, sessionId, session.organizationId, 'processing.failed', {
          turnId: created.id,
          stage: 'asr',
        });
      }
      return created;
    });

    if (text && status !== 'failed') {
      const mt = await this.adapters.translateText({
        text,
        source: body.language ?? speaker.language,
        target: peer.language,
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        apiKeyId: actor.apiKeyId,
        userId: actor.userId,
        ip: actor.ip,
      });
      if (mt.status === 'unsupported') {
        await this.prisma.dealConversationTurn.update({
          where: { id: turn.id },
          data: { status: 'failed', processingError: 'Translation unsupported for corridor' },
        });
        throw new ApiException(
          'unsupported_language',
          'Translation is not available for this language pair. No simulated translation was applied.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const sourceRevisionId = turn.transcripts[0]?.id;
      if (sourceRevisionId) {
        await this.prisma.dealTranslationRevision.create({
          data: {
            turnId: turn.id,
            sourceRevisionId,
            targetLanguage: peer.language,
            text: mt.text,
            modelVersion: mt.modelVersion,
            provider: mt.provider,
            status: 'draft',
          },
        });
        await this.prisma.dealSessionEvent.create({
          data: {
            sessionId,
            organizationId: session.organizationId,
            serverSequence: await this.nextSeq(sessionId),
            type: 'translation.ready',
            payload: { turnId: turn.id, fixture: mt.status === 'fixture' },
          },
        });
        await this.recordCost(sessionId, session.organizationId, 'translation', 800);
      }
    }

    if (session.state === 'draft' || session.state === 'invited') {
      await this.transition(sessionId, session.state as DealState, 'active', actor.userId);
    }

    return this.sessionView(sessionId, actor);
  }

  async correctTurn(
    actor: Actor,
    sessionId: string,
    turnId: string,
    body: { text: string; expectedRevision?: number },
  ) {
    const session = await this.requireMemberSession(sessionId, actor);
    if (
      body.expectedRevision != null &&
      body.expectedRevision !== session.activeRevision
    ) {
      throw new ApiException('revision_conflict', 'Stale revision', HttpStatus.CONFLICT);
    }
    const turn = await this.prisma.dealConversationTurn.findFirst({
      where: { id: turnId, sessionId },
      include: { transcripts: { orderBy: { createdAt: 'desc' } }, speaker: true },
    });
    if (!turn) throw new ApiException('not_found', 'Turn not found', HttpStatus.NOT_FOUND);
    if (turn.speaker.userId !== actor.userId) {
      throw new ApiException(
        'forbidden',
        'Participants may only correct their own transcripts',
        HttpStatus.FORBIDDEN,
      );
    }
    const latest = turn.transcripts[0];
    await this.prisma.dealTranscriptRevision.create({
      data: {
        turnId,
        text: body.text.trim(),
        editor: 'participant',
        supersedesId: latest?.id,
      },
    });
    // Invalidate outstanding confirmations/checks by bumping into active conversation.
    if (
      session.state === 'awaiting_confirmations' ||
      session.state === 'reviewing' ||
      session.state === 'clarifying'
    ) {
      await this.transition(sessionId, session.state as DealState, 'active', actor.userId);
    }
    await this.prisma.dealAuditEvent.create({
      data: {
        organizationId: actor.organizationId,
        sessionId,
        actorUserId: actor.userId,
        operation: 'transcript.corrected',
        affectedRevision: session.activeRevision,
        metadata: { turnId },
      },
    });
    return this.sessionView(sessionId, actor);
  }

  async proposeSnapshot(
    actor: Actor,
    sessionId: string,
    body: {
      expectedRevision?: number;
      overrides?: Record<string, unknown>;
    },
  ) {
    const session = await this.requireMemberSession(sessionId, actor);
    this.assertNotExpired(session);
    if (
      body.expectedRevision != null &&
      body.expectedRevision !== session.activeRevision
    ) {
      throw new ApiException('revision_conflict', 'Stale revision', HttpStatus.CONFLICT);
    }
    if (session.participants.length < 2) {
      throw new ApiException(
        'buyer_required',
        'Both participants required before review',
        HttpStatus.CONFLICT,
      );
    }

    const turns = await this.prisma.dealConversationTurn.findMany({
      where: { sessionId, status: 'ready' },
      include: { transcripts: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { sequence: 'asc' },
    });
    const texts = turns
      .filter((t) => t.transcripts[0])
      .map((t) => ({
        turnId: t.id,
        speakerId: t.speakerId,
        text: t.transcripts[0]!.text,
      }));
    const extracted = extractTermCandidates({
      texts,
      timeZone: session.timeZone,
      category: session.category,
    });
    let terms = extracted.terms;
    for (const [field, value] of Object.entries(body.overrides ?? {})) {
      terms = setByPath(terms, field, value);
    }
    terms = recomputeUnresolved(terms, session.category);
    const moneyErrors = validateMoneyAndUnits(terms);
    if (moneyErrors.includes('arithmetic_mismatch')) {
      throw new ApiException(
        'terms_invalid',
        'Quantity × unit price does not equal total. Clarify before review.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const required =
      REQUIRED_FIELDS_BY_CATEGORY[session.category] ?? REQUIRED_FIELDS_BY_CATEGORY.wholesale_rice!;
    const missingRequired = required.filter((f) => terms.unresolvedFields.includes(f));

    const revision = session.revisionCounter + 1;
    const provenance = {
      candidates: extracted.candidates.map((c) => ({
        field: c.field,
        sourceSpanIds: c.sourceSpanIds,
        confidence: c.confidence,
        uncertaintyReason: c.uncertaintyReason,
      })),
      rejectedInstructionTurns: extracted.rejectedInstructions,
      overrides: body.overrides ?? {},
    };
    const hash = contentHash(terms);

    const presentationDrafts: Array<{
      participantId: string;
      language: string;
      summaryText: string;
      audioStorageKey: string | null;
      audioHash: string | null;
      translationVersion: string;
      modelVersion: string;
    }> = [];
    for (const participant of session.participants) {
      const summary = summarizeTerms(terms, participant.language);
      const tts = await this.adapters.synthesize({
        text: summary,
        language: participant.language,
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        apiKeyId: actor.apiKeyId,
        userId: actor.userId,
        ip: actor.ip,
      });
      let audioStorageKey: string | null = null;
      let audioHash: string | null = null;
      if (tts.audio && tts.status !== 'unsupported') {
        audioStorageKey = `dealbridge/${sessionId}/presentation-${participant.id}-${revision}.bin`;
        await this.storage.writeBuffer(audioStorageKey, tts.audio);
        audioHash = sha256Hex(tts.audio);
        await this.recordCost(sessionId, session.organizationId, 'tts', 1200);
      }
      presentationDrafts.push({
        participantId: participant.id,
        language: participant.language,
        summaryText: summary,
        audioStorageKey,
        audioHash,
        translationVersion: tts.provider,
        modelVersion: tts.modelVersion,
      });
    }

    const snapshot = await this.prisma.$transaction(async (tx) => {
      await tx.dealTermCandidate.createMany({
        data: extracted.candidates.map((c) => ({
          sessionId,
          field: c.field,
          value: c.value as Prisma.InputJsonValue,
          sourceSpanIds: c.sourceSpanIds,
          speakerId: c.speakerId,
          confidence: c.confidence,
          uncertaintyReason: c.uncertaintyReason,
          extractorVersion: c.extractorVersion,
        })),
      });
      const snap = await tx.dealTermSnapshot.create({
        data: {
          sessionId,
          revision,
          normalizedTerms: terms as unknown as Prisma.InputJsonValue,
          provenance: provenance as unknown as Prisma.InputJsonValue,
          unresolvedFields: terms.unresolvedFields,
          schemaVersion: DEALBRIDGE_SCHEMA_VERSION,
          contentHash: hash,
        },
      });
      await tx.dealSession.update({
        where: { id: sessionId },
        data: {
          revisionCounter: revision,
          activeRevision: revision,
          state: missingRequired.length ? 'clarifying' : 'reviewing',
        },
      });
      for (const draft of presentationDrafts) {
        const presentationHash = contentHash({
          snapshotId: snap.id,
          participantId: draft.participantId,
          language: draft.language,
          summaryText: draft.summaryText,
          audioHash: draft.audioHash,
          modelVersion: draft.modelVersion,
        });
        await tx.dealReviewPresentation.create({
          data: {
            snapshotId: snap.id,
            participantId: draft.participantId,
            language: draft.language,
            summaryText: draft.summaryText,
            audioStorageKey: draft.audioStorageKey,
            audioHash: draft.audioHash,
            translationVersion: draft.translationVersion,
            modelVersion: draft.modelVersion,
            presentationHash,
          },
        });
      }
      await this.appendEvent(tx, sessionId, actor.organizationId, 'terms.proposed', {
        snapshotId: snap.id,
        revision,
        unresolvedFields: terms.unresolvedFields,
      });
      await this.appendEvent(tx, sessionId, actor.organizationId, 'review.ready', {
        snapshotId: snap.id,
        revision,
      });
      return snap;
    });

    await this.recordCost(sessionId, actor.organizationId, 'extraction', 500);
    if (session.pilotCohort) {
      await this.recordPilotEvent({
        organizationId: actor.organizationId,
        sessionId,
        merchantPseudoId: sha256Hex(
          session.participants.find((p) => p.role === 'merchant')!.userId,
        ).slice(0, 16),
        cohort: session.pilotCohort,
        corridor: session.corridor,
        type: 'review.presented',
        revision,
        payload: {},
      });
    }

    return {
      snapshotId: snapshot.id,
      revision,
      contentHash: hash,
      unresolvedFields: terms.unresolvedFields,
      missingRequired,
      moneyErrors,
      ...(await this.sessionView(sessionId, actor)),
    };
  }

  async submitCheck(
    actor: Actor,
    sessionId: string,
    body: {
      snapshotId: string;
      presentationHash: string;
      responseText: string;
      responseTurnId?: string;
    },
  ) {
    const session = await this.requireMemberSession(sessionId, actor);
    const participant = session.participants.find((p) => p.userId === actor.userId)!;
    const snapshot = await this.prisma.dealTermSnapshot.findFirst({
      where: { id: body.snapshotId, sessionId },
    });
    if (!snapshot) {
      throw new ApiException('not_found', 'Snapshot not found', HttpStatus.NOT_FOUND);
    }
    if (snapshot.revision !== session.activeRevision) {
      throw new ApiException(
        'revision_conflict',
        'Explain-back must target the active revision',
        HttpStatus.CONFLICT,
      );
    }
    const presentation = await this.prisma.dealReviewPresentation.findFirst({
      where: {
        snapshotId: snapshot.id,
        participantId: participant.id,
        presentationHash: body.presentationHash,
      },
    });
    if (!presentation) {
      throw new ApiException(
        'presentation_mismatch',
        'presentationHash does not match this participant review presentation',
        HttpStatus.CONFLICT,
      );
    }

    const terms = snapshot.normalizedTerms as unknown as NormalizedTerms;
    const result = verifyExplainBack({
      terms,
      responseText: body.responseText,
      language: participant.language,
    });

    const check = await this.prisma.dealUnderstandingCheck.create({
      data: {
        sessionId,
        participantId: participant.id,
        snapshotId: snapshot.id,
        presentationId: presentation.id,
        presentationHash: presentation.presentationHash,
        responseText: body.responseText,
        responseTurnId: body.responseTurnId,
        comparisons: result.comparisons as unknown as Prisma.InputJsonValue,
        state: result.status,
        verifierVersion: result.verifierVersion,
        clarificationField: result.clarification?.field,
        clarificationQuestion: result.clarification?.question,
      },
    });

    await this.recordCost(sessionId, actor.organizationId, 'verification', 400);

    if (result.status === 'needs_clarification') {
      await this.transition(
        sessionId,
        session.state as DealState,
        'clarifying',
        actor.userId,
      );
      await this.prisma.dealSessionEvent.create({
        data: {
          sessionId,
          organizationId: actor.organizationId,
          serverSequence: await this.nextSeq(sessionId),
          type: 'clarification.required',
          activeRevision: session.activeRevision,
          payload: {
            field: result.clarification?.field,
            checkId: check.id,
          },
        },
      });
      if (session.pilotCohort) {
        await this.recordPilotEvent({
          organizationId: actor.organizationId,
          sessionId,
          merchantPseudoId: sha256Hex(
            session.participants.find((p) => p.role === 'merchant')!.userId,
          ).slice(0, 16),
          cohort: session.pilotCohort,
          corridor: session.corridor,
          type: 'clarification.opened',
          revision: session.activeRevision,
          payload: { field: result.clarification?.field },
        });
      }
    } else if (result.status === 'check_completed') {
      if (session.pilotCohort) {
        await this.recordPilotEvent({
          organizationId: actor.organizationId,
          sessionId,
          merchantPseudoId: sha256Hex(
            session.participants.find((p) => p.role === 'merchant')!.userId,
          ).slice(0, 16),
          cohort: session.pilotCohort,
          corridor: session.corridor,
          type: 'check.completed',
          revision: session.activeRevision,
          payload: {},
        });
      }
      await this.maybeEnterAwaitingConfirmations(sessionId, actor);
    }

    return {
      checkId: check.id,
      snapshotId: snapshot.id,
      participantId: participant.id,
      status: result.status,
      comparisons: result.comparisons,
      clarification: result.clarification,
      verifierVersion: result.verifierVersion,
    };
  }

  async confirm(
    actor: Actor,
    sessionId: string,
    body: {
      snapshotId: string;
      contentHash: string;
      presentationHash: string;
      action: 'confirm' | 'change' | 'decline';
      idempotencyKey: string;
    },
  ) {
    const session = await this.requireMemberSession(sessionId, actor);
    this.assertNotExpired(session);
    const participant = session.participants.find((p) => p.userId === actor.userId)!;

    // Idempotency short-circuit before revision gates so safe retries remain stable
    // even after a later amendment advances activeRevision.
    const existing = await this.prisma.dealConfirmation.findFirst({
      where: {
        sessionId,
        participantId: participant.id,
        snapshotId: body.snapshotId,
        action: body.action,
        idempotencyKey: body.idempotencyKey,
        contentHash: body.contentHash,
        presentationHash: body.presentationHash,
      },
    });
    if (existing) {
      const existingReceiptId =
        (
          await this.prisma.dealReceipt.findFirst({
            where: { sessionId, snapshotId: body.snapshotId },
            select: { id: true },
          })
        )?.id ?? null;
      return {
        ...(await this.sessionView(sessionId, actor)),
        confirmationId: existing.id,
        receiptId: existingReceiptId,
      };
    }
    const conflict = await this.prisma.dealConfirmation.findFirst({
      where: {
        sessionId,
        participantId: participant.id,
        idempotencyKey: body.idempotencyKey,
      },
    });
    if (conflict) {
      throw new ApiException(
        'idempotency_conflict',
        'Idempotency key reused with a different payload',
        HttpStatus.CONFLICT,
      );
    }

    const snapshot = await this.prisma.dealTermSnapshot.findFirst({
      where: { id: body.snapshotId, sessionId },
    });
    if (!snapshot) {
      throw new ApiException('not_found', 'Snapshot not found', HttpStatus.NOT_FOUND);
    }
    if (snapshot.revision !== session.activeRevision) {
      throw new ApiException(
        'revision_conflict',
        'Confirmation bound to stale snapshot revision',
        HttpStatus.CONFLICT,
      );
    }
    if (snapshot.contentHash !== body.contentHash) {
      throw new ApiException(
        'content_hash_mismatch',
        'contentHash does not match active snapshot',
        HttpStatus.CONFLICT,
      );
    }
    const presentation = await this.prisma.dealReviewPresentation.findFirst({
      where: {
        snapshotId: snapshot.id,
        participantId: participant.id,
        presentationHash: body.presentationHash,
      },
    });
    if (!presentation) {
      throw new ApiException(
        'presentation_mismatch',
        'Confirmation must reference this participant exact review presentation',
        HttpStatus.CONFLICT,
      );
    }

    if (body.action === 'decline') {
      const confirmation = await this.prisma.dealConfirmation.create({
        data: {
          sessionId,
          participantId: participant.id,
          snapshotId: snapshot.id,
          presentationId: presentation.id,
          contentHash: body.contentHash,
          presentationHash: body.presentationHash,
          action: 'decline',
          authContext: actor.authContext,
          idempotencyKey: body.idempotencyKey,
        },
      });
      await this.transition(sessionId, session.state as DealState, 'declined', actor.userId);
      return {
        ...(await this.sessionView(sessionId, actor)),
        confirmationId: confirmation.id,
        receiptId: null as string | null,
      };
    }

    if (body.action === 'change') {
      const confirmation = await this.prisma.dealConfirmation.create({
        data: {
          sessionId,
          participantId: participant.id,
          snapshotId: snapshot.id,
          presentationId: presentation.id,
          contentHash: body.contentHash,
          presentationHash: body.presentationHash,
          action: 'change',
          authContext: actor.authContext,
          idempotencyKey: body.idempotencyKey,
        },
      });
      await this.transition(sessionId, session.state as DealState, 'active', actor.userId);
      return {
        ...(await this.sessionView(sessionId, actor)),
        confirmationId: confirmation.id,
        receiptId: null as string | null,
      };
    }

    // confirm
    if (!canConfirm(session.state as DealState)) {
      // Allow confirm only after checks complete for both; try promote first.
      await this.maybeEnterAwaitingConfirmations(sessionId, actor);
      const refreshed = await this.prisma.dealSession.findUniqueOrThrow({
        where: { id: sessionId },
      });
      if (!canConfirm(refreshed.state as DealState)) {
        throw new ApiException(
          'invalid_state',
          'Both parties must complete explain-back checks before confirmation',
          HttpStatus.CONFLICT,
        );
      }
    }

    const check = await this.prisma.dealUnderstandingCheck.findFirst({
      where: {
        sessionId,
        participantId: participant.id,
        snapshotId: snapshot.id,
        presentationHash: body.presentationHash,
        state: 'check_completed',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!check) {
      throw new ApiException(
        'check_required',
        'Explain-back check_completed is required before Confirm these terms',
        HttpStatus.CONFLICT,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const confirmation = await tx.dealConfirmation.create({
        data: {
          sessionId,
          participantId: participant.id,
          snapshotId: snapshot.id,
          presentationId: presentation.id,
          contentHash: body.contentHash,
          presentationHash: body.presentationHash,
          action: 'confirm',
          authContext: actor.authContext,
          idempotencyKey: body.idempotencyKey,
        },
      });
      await this.appendEvent(tx, sessionId, actor.organizationId, 'confirmation.recorded', {
        confirmationId: confirmation.id,
        participantId: participant.id,
      });

      const confirms = await tx.dealConfirmation.findMany({
        where: {
          sessionId,
          snapshotId: snapshot.id,
          action: 'confirm',
        },
        include: { participant: true },
      });
      const merchantConf = confirms.find((c) => c.participant.role === 'merchant');
      const buyerConf = confirms.find((c) => c.participant.role === 'buyer');
      if (!merchantConf || !buyerConf) {
        return { confirmation, receipt: null };
      }
      if (
        merchantConf.contentHash !== snapshot.contentHash ||
        buyerConf.contentHash !== snapshot.contentHash
      ) {
        throw new ApiException(
          'hash_mismatch',
          'Both confirmations must bind the same snapshot contentHash',
          HttpStatus.CONFLICT,
        );
      }

      // Race-safe issuance: validate state + revision inside transaction.
      const fresh = await tx.dealSession.findUniqueOrThrow({ where: { id: sessionId } });
      if (fresh.activeRevision !== snapshot.revision) {
        throw new ApiException(
          'revision_conflict',
          'Active revision changed during confirmation',
          HttpStatus.CONFLICT,
        );
      }
      if (fresh.expiresAt.getTime() < Date.now()) {
        throw new ApiException('session_expired', 'Session expired', HttpStatus.GONE);
      }
      const activeParticipants = await tx.dealParticipant.count({
        where: { sessionId, active: true },
      });
      if (activeParticipants !== 2) {
        throw new ApiException(
          'participants_required',
          'Two active participants required to issue a receipt',
          HttpStatus.CONFLICT,
        );
      }

      const presentations = await tx.dealReviewPresentation.findMany({
        where: { snapshotId: snapshot.id },
      });
      const terms = snapshot.normalizedTerms as unknown as NormalizedTerms;
      const prior = await tx.dealReceipt.findFirst({
        where: { sessionId, supersededByReceiptId: null },
        orderBy: { issuedAt: 'desc' },
      });
      const payload = {
        schemaVersion: DEALBRIDGE_SCHEMA_VERSION,
        receiptType: 'dealbridge.shared_receipt',
        sessionId,
        snapshotId: snapshot.id,
        revision: snapshot.revision,
        contentHash: snapshot.contentHash,
        terms,
        unresolvedAtIssue: snapshot.unresolvedFields,
        languages: {
          merchant: session.merchantLanguage,
          buyer: session.buyerLanguage,
        },
        presentations: presentations.map((p) => ({
          participantId: p.participantId,
          language: p.language,
          summaryText: p.summaryText,
          presentationHash: p.presentationHash,
          audioHash: p.audioHash,
          modelVersion: p.modelVersion,
        })),
        confirmations: {
          merchantConfirmationId: merchantConf.id,
          buyerConfirmationId: buyerConf.id,
          merchantConfirmedAt: merchantConf.serverTimestamp.toISOString(),
          buyerConfirmedAt: buyerConf.serverTimestamp.toISOString(),
        },
        identityAssurance: 'authenticated_session',
        isDemo: session.isDemo,
        isFixture: session.isFixture,
        issuedAt: new Date().toISOString(),
        supersedesReceiptId: prior?.id ?? null,
        limitations: [
          'Signature verifies integrity of this issued record only.',
          'Does not prove translation accuracy, payment, fulfillment, or legal enforceability.',
        ],
      };
      const signed = signReceiptPayload(payload);
      const receipt = await tx.dealReceipt.create({
        data: {
          sessionId,
          snapshotId: snapshot.id,
          merchantConfirmationId: merchantConf.id,
          buyerConfirmationId: buyerConf.id,
          payload: payload as unknown as Prisma.InputJsonValue,
          contentHash: signed.contentHash,
          signature: signed.signature,
          keyId: signed.keyId,
          supersedesReceiptId: prior?.id,
          retentionPolicy: session.retentionPolicy,
        },
      });
      if (prior) {
        await tx.dealReceipt.update({
          where: { id: prior.id },
          data: { supersededByReceiptId: receipt.id },
        });
      }
      assertTransition(fresh.state as DealState, 'issued');
      await tx.dealSession.update({
        where: { id: sessionId },
        data: { state: 'issued' },
      });
      await this.appendEvent(tx, sessionId, actor.organizationId, 'receipt.issued', {
        receiptId: receipt.id,
        snapshotId: snapshot.id,
        fixtureSigning: signed.fixtureSigning,
      });
      return { confirmation, receipt };
    });

    if (result.receipt && session.pilotCohort) {
      await this.recordPilotEvent({
        organizationId: actor.organizationId,
        sessionId,
        merchantPseudoId: sha256Hex(
          session.participants.find((p) => p.role === 'merchant')!.userId,
        ).slice(0, 16),
        cohort: session.pilotCohort,
        corridor: session.corridor,
        type: 'deal.confirmed',
        revision: snapshot.revision,
        payload: {},
      });
      await this.recordPilotEvent({
        organizationId: actor.organizationId,
        sessionId,
        merchantPseudoId: sha256Hex(
          session.participants.find((p) => p.role === 'merchant')!.userId,
        ).slice(0, 16),
        cohort: session.pilotCohort,
        corridor: session.corridor,
        type: 'receipt.issued',
        revision: snapshot.revision,
        payload: { receiptId: result.receipt.id },
      });
    }

    await this.safeAudit(
      actor,
      result.receipt ? 'dealbridge.receipt_issued' : 'dealbridge.confirmation_recorded',
      'POST /v1/dealbridge/sessions/:id/confirmations',
      {
        sessionId,
        confirmationId: result.confirmation.id,
        receiptId: result.receipt?.id,
      },
    );

    return {
      ...(await this.sessionView(sessionId, actor)),
      confirmationId: result.confirmation.id,
      receiptId: result.receipt?.id ?? null,
    };
  }

  async getReceipt(actor: Actor, sessionId: string) {
    await this.requireMemberSession(sessionId, actor);
    const receipt = await this.prisma.dealReceipt.findFirst({
      where: { sessionId },
      orderBy: { issuedAt: 'desc' },
    });
    if (!receipt) {
      throw new ApiException('not_found', 'No receipt for this session', HttpStatus.NOT_FOUND);
    }
    const valid = verifyReceiptSignature(receipt.payload, receipt.signature, receipt.keyId);
    return {
      receipt: {
        id: receipt.id,
        snapshotId: receipt.snapshotId,
        issuedAt: receipt.issuedAt,
        contentHash: receipt.contentHash,
        signature: receipt.signature,
        keyId: receipt.keyId,
        signatureValid: valid,
        supersedesReceiptId: receipt.supersedesReceiptId,
        supersededByReceiptId: receipt.supersededByReceiptId,
        retentionPolicy: receipt.retentionPolicy,
        payload: receipt.payload,
      },
      audioNote:
        'Audio is not permanently public. Request short-lived access via presentation audio endpoints when available.',
    };
  }

  async startRevision(
    actor: Actor,
    sessionId: string,
    body: { reason?: string; expectedRevision?: number },
  ) {
    const session = await this.requireMemberSession(sessionId, actor, 'merchant');
    if (session.state !== 'issued' && session.state !== 'awaiting_confirmations') {
      throw new ApiException(
        'invalid_state',
        'Amendments require an issued or awaiting confirmation session',
        HttpStatus.CONFLICT,
      );
    }
    if (
      body.expectedRevision != null &&
      body.expectedRevision !== session.activeRevision
    ) {
      throw new ApiException('revision_conflict', 'Stale revision', HttpStatus.CONFLICT);
    }
    // Invalidate outstanding confirmations/checks by advancing activeRevision past the prior snapshot.
    const nextRevision = session.revisionCounter + 1;
    await this.prisma.dealSession.update({
      where: { id: sessionId },
      data: {
        state: 'active',
        revisionCounter: nextRevision,
        activeRevision: nextRevision,
      },
    });
    await this.prisma.dealAuditEvent.create({
      data: {
        organizationId: session.organizationId,
        sessionId,
        actorUserId: actor.userId,
        operation: 'revision.started',
        affectedRevision: nextRevision,
        metadata: {
          reason: body.reason ?? null,
          invalidatedRevision: session.activeRevision,
        },
      },
    });
    return this.sessionView(sessionId, actor);
  }

  async requestDeletion(actor: Actor, sessionId: string) {
    const session = await this.requireMemberSession(sessionId, actor, 'merchant');
    const outcome =
      'Deletion requested. Media and derived texts will be removed where policy allows. Signed receipt metadata may be retained under retention policy; backups are not instantly purged.';
    await this.prisma.$transaction(async (tx) => {
      const turns = await tx.dealConversationTurn.findMany({
        where: { sessionId },
        select: { audioStorageKey: true },
      });
      const presentations = await tx.dealReviewPresentation.findMany({
        where: { snapshot: { sessionId } },
        select: { audioStorageKey: true },
      });
      for (const t of turns) {
        if (t.audioStorageKey) await this.storage.tryUnlink(t.audioStorageKey);
      }
      for (const p of presentations) {
        if (p.audioStorageKey) await this.storage.tryUnlink(p.audioStorageKey);
      }
      await tx.dealConversationTurn.updateMany({
        where: { sessionId },
        data: { audioStorageKey: null },
      });
      await tx.dealReviewPresentation.updateMany({
        where: { snapshot: { sessionId } },
        data: { audioStorageKey: null, audioHash: null },
      });
      await tx.dealSession.update({
        where: { id: sessionId },
        data: {
          deletedAt: new Date(),
          deletionOutcome: outcome,
          state: isTerminal(session.state as DealState) ? session.state : 'cancelled',
        },
      });
      await tx.dealAuditEvent.create({
        data: {
          organizationId: actor.organizationId,
          sessionId,
          actorUserId: actor.userId,
          operation: 'session.deletion_requested',
          metadata: { outcome },
        },
      });
    });
    return { ok: true, outcome };
  }

  async listEvents(actor: Actor, sessionId: string, cursor?: number) {
    await this.requireMemberSession(sessionId, actor);
    const events = await this.prisma.dealSessionEvent.findMany({
      where: {
        sessionId,
        serverSequence: cursor != null ? { gt: cursor } : undefined,
      },
      orderBy: { serverSequence: 'asc' },
      take: 200,
    });
    return {
      events: events.map((e) => ({
        eventId: e.id,
        sessionId: e.sessionId,
        tenantId: e.organizationId,
        serverSequence: e.serverSequence,
        type: e.type,
        sourceRevision: e.sourceRevision,
        activeRevision: e.activeRevision,
        occurredAt: e.occurredAt,
        correlationId: e.correlationId,
        payload: e.payload,
      })),
      nextCursor: events.length ? events[events.length - 1]!.serverSequence : cursor ?? 0,
    };
  }

  async sessionView(sessionId: string, actor: Actor) {
    const session = await this.prisma.dealSession.findFirst({
      where: {
        id: sessionId,
        deletedAt: null,
        OR: [
          { organizationId: actor.organizationId },
          { participants: { some: { userId: actor.userId } } },
        ],
      },
      include: {
        participants: true,
        turns: {
          orderBy: { sequence: 'asc' },
          include: {
            transcripts: { orderBy: { createdAt: 'desc' }, take: 2 },
            translations: { orderBy: { createdAt: 'desc' }, take: 2 },
            speaker: true,
          },
        },
        snapshots: {
          orderBy: { revision: 'desc' },
          take: 1,
          include: { presentations: true },
        },
        checks: { orderBy: { createdAt: 'desc' }, take: 20 },
        confirmations: { orderBy: { createdAt: 'desc' }, take: 20 },
        receipts: { orderBy: { issuedAt: 'desc' }, take: 5 },
      },
    });
    if (!session) {
      throw new ApiException('not_found', 'Deal session not found', HttpStatus.NOT_FOUND);
    }
    const me = session.participants.find((p) => p.userId === actor.userId);
    const activeSnapshot = session.snapshots[0] ?? null;
    const myPresentation = activeSnapshot?.presentations.find(
      (p) => p.participantId === me?.id,
    );
    return {
      id: session.id,
      state: session.state,
      category: session.category,
      corridor: session.corridor,
      merchantLanguage: session.merchantLanguage,
      buyerLanguage: session.buyerLanguage,
      timeZone: session.timeZone,
      activeRevision: session.activeRevision,
      revisionCounter: session.revisionCounter,
      expiresAt: session.expiresAt,
      isDemo: session.isDemo,
      isFixture: session.isFixture,
      demoLabel: session.isDemo || session.isFixture ? 'SIMULATED / FIXTURE DEMO' : null,
      headline: 'Speak your language. Confirm the same deal.',
      participants: session.participants.map((p) => ({
        id: p.id,
        role: p.role,
        userId: p.userId,
        language: p.language,
        identityAssurance: p.identityAssurance,
      })),
      me: me
        ? { participantId: me.id, role: me.role, language: me.language }
        : null,
      turns: session.turns.map((t) => ({
        id: t.id,
        sequence: t.sequence,
        speakerRole: t.speaker.role,
        sourceLanguage: t.sourceLanguage,
        status: t.status,
        hasAudio: Boolean(t.audioStorageKey),
        transcript: t.transcripts[0]?.text ?? null,
        priorTranscript: t.transcripts[1]?.text ?? null,
        translation: t.translations[0]
          ? {
              language: t.translations[0].targetLanguage,
              text: t.translations[0].text,
              provider: t.translations[0].provider,
              status: t.translations[0].status,
            }
          : null,
        processingError: t.processingError,
      })),
      activeSnapshot: activeSnapshot
        ? {
            id: activeSnapshot.id,
            revision: activeSnapshot.revision,
            contentHash: activeSnapshot.contentHash,
            unresolvedFields: activeSnapshot.unresolvedFields,
            terms: activeSnapshot.normalizedTerms,
            myPresentation: myPresentation
              ? {
                  id: myPresentation.id,
                  language: myPresentation.language,
                  summaryText: myPresentation.summaryText,
                  presentationHash: myPresentation.presentationHash,
                  hasAudio: Boolean(myPresentation.audioStorageKey),
                  audioHash: myPresentation.audioHash,
                  // Never autoplay sensitive receipt/review audio on open — client must click.
                  autoplay: false,
                }
              : null,
          }
        : null,
      checks: session.checks.map((c) => ({
        id: c.id,
        participantId: c.participantId,
        snapshotId: c.snapshotId,
        state: c.state,
        clarificationField: c.clarificationField,
        clarificationQuestion: c.clarificationQuestion,
        comparisons: c.comparisons,
      })),
      confirmations: session.confirmations.map((c) => ({
        id: c.id,
        participantId: c.participantId,
        snapshotId: c.snapshotId,
        action: c.action,
        serverTimestamp: c.serverTimestamp,
      })),
      receipts: session.receipts.map((r) => ({
        id: r.id,
        snapshotId: r.snapshotId,
        issuedAt: r.issuedAt,
        supersededByReceiptId: r.supersededByReceiptId,
        supersedesReceiptId: r.supersedesReceiptId,
        keyId: r.keyId,
      })),
      noticeVersion: DEALBRIDGE_NOTICE_VERSION,
    };
  }

  // --- Pilot / admin / demo -------------------------------------------------

  async upsertPilotConfig(
    organizationId: string,
    body: {
      version: string;
      category: string;
      corridor: string;
      merchantVariety: string;
      buyerVariety: string;
      enrollmentStartsAt: string;
      enrollmentEndsAt: string;
      cohortAssignment?: unknown;
      metricDefinitions?: unknown;
      costBudgets?: unknown;
      thresholds?: unknown;
      evaluationProtocol?: unknown;
      active?: boolean;
    },
  ) {
    const metricDefinitions = body.metricDefinitions ?? {
      completion:
        'Eligible started sessions issuing a two-party receipt / eligible started sessions',
      criticalErrorEscape:
        'Independently reviewed issued receipts with ≥1 critical meaning error / reviewed issued receipts',
      clarificationBurden: 'Clarification turns and review duration per session',
      repeatMerchantUsage:
        'Activated merchants completing another real session within 28 days / activated merchants with full 28-day window',
      paidConversion:
        'Eligible offered merchants making a real payment / eligible merchants offered the same paid plan',
      orderCorrectionRate:
        'Followed-up orders requiring correction attributable to misunderstood terms / followed-up eligible orders',
      processingCost: 'ASR+MT+extraction+verification+TTS+storage+retries per session/receipt',
      contributionMargin: 'Net recognized revenue minus variable service/support costs',
    };
    return this.prisma.dealPilotConfig.upsert({
      where: {
        organizationId_version: { organizationId, version: body.version },
      },
      create: {
        organizationId,
        version: body.version,
        category: body.category,
        corridor: body.corridor,
        merchantVariety: body.merchantVariety,
        buyerVariety: body.buyerVariety,
        enrollmentStartsAt: new Date(body.enrollmentStartsAt),
        enrollmentEndsAt: new Date(body.enrollmentEndsAt),
        cohortAssignment: (body.cohortAssignment ?? { mode: 'manual' }) as Prisma.InputJsonValue,
        metricDefinitions: metricDefinitions as Prisma.InputJsonValue,
        costBudgets: (body.costBudgets ?? { maxVariableUsdPerReceipt: 1.5 }) as Prisma.InputJsonValue,
        thresholds: (body.thresholds ?? {
          relativeOrderCorrectionReduction: 0.3,
          repeatUsage28d: 0.4,
          paidConversion: 0.2,
        }) as Prisma.InputJsonValue,
        evaluationProtocol: (body.evaluationProtocol ?? {
          note: 'Preregister thresholds before reviewing results. Underpowered comparisons are inconclusive.',
        }) as Prisma.InputJsonValue,
        active: body.active ?? true,
      },
      update: {
        category: body.category,
        corridor: body.corridor,
        merchantVariety: body.merchantVariety,
        buyerVariety: body.buyerVariety,
        enrollmentStartsAt: new Date(body.enrollmentStartsAt),
        enrollmentEndsAt: new Date(body.enrollmentEndsAt),
        cohortAssignment: (body.cohortAssignment ?? { mode: 'manual' }) as Prisma.InputJsonValue,
        metricDefinitions: metricDefinitions as Prisma.InputJsonValue,
        costBudgets: (body.costBudgets ?? {}) as Prisma.InputJsonValue,
        thresholds: (body.thresholds ?? {}) as Prisma.InputJsonValue,
        evaluationProtocol: (body.evaluationProtocol ?? {}) as Prisma.InputJsonValue,
        active: body.active ?? true,
      },
    });
  }

  async pilotDashboard(organizationId: string) {
    const configs = await this.prisma.dealPilotConfig.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    const events = await this.prisma.dealPilotEvent.findMany({
      where: { organizationId },
      orderBy: { occurredAt: 'desc' },
      take: 5000,
    });
    const sessions = await this.prisma.dealSession.findMany({
      where: { organizationId, isFixture: false, isDemo: false, deletedAt: null },
      include: { receipts: true, costEvents: true },
    });

    const started = sessions.filter((s) => s.state !== 'draft');
    const issued = sessions.filter((s) => s.receipts.some((r) => !r.supersededByReceiptId));
    const byCohort = (cohort: string) => started.filter((s) => s.pilotCohort === cohort);

    const completion = (cohort: string) => {
      const s = byCohort(cohort);
      const i = s.filter((x) => x.receipts.length > 0);
      return {
        started: s.length,
        issued: i.length,
        rate: s.length ? i.length / s.length : null,
      };
    };

    const costMicros = sessions.reduce(
      (sum, s) => sum + s.costEvents.reduce((a, e) => a + e.amountUsdMicros, 0),
      0,
    );

    const merchants = new Map<string, Date[]>();
    for (const e of events.filter((x) => x.type === 'receipt.issued')) {
      const arr = merchants.get(e.merchantPseudoId) ?? [];
      arr.push(e.occurredAt);
      merchants.set(e.merchantPseudoId, arr);
    }
    let repeatEligible = 0;
    let repeatSuccess = 0;
    const windowMs = 28 * 24 * 3600_000;
    const now = Date.now();
    for (const [, dates] of merchants) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      const first = dates[0]!;
      if (now - first.getTime() < windowMs) continue;
      repeatEligible += 1;
      if (dates.length >= 2 && dates[1]!.getTime() - first.getTime() <= windowMs) {
        repeatSuccess += 1;
      }
    }

    return {
      configs,
      funnels: {
        dealbridge: completion('dealbridge'),
        baseline: completion('baseline'),
        allNonFixture: {
          started: started.length,
          issued: issued.length,
          rate: started.length ? issued.length / started.length : null,
        },
      },
      repeatMerchantUsage28d: {
        eligible: repeatEligible,
        success: repeatSuccess,
        rate: repeatEligible ? repeatSuccess / repeatEligible : null,
        note: 'Fixtures and demo sessions excluded. Window requires full 28 days after first activation.',
      },
      processingCost: {
        totalUsd: costMicros / 1_000_000,
        perStartedSessionUsd: started.length ? costMicros / 1_000_000 / started.length : null,
        perIssuedReceiptUsd: issued.length ? costMicros / 1_000_000 / issued.length : null,
      },
      eventCounts: Object.fromEntries(
        [...new Set(events.map((e) => e.type))].map((t) => [
          t,
          events.filter((e) => e.type === t).length,
        ]),
      ),
      missingFollowUpRate: null,
      criticalErrorEscape: null,
      note: 'No fabricated traction metrics. criticalErrorEscape requires human adjudication and remains null until reviewed.',
      limitations: [
        'Staff, test, demo, and fixture sessions are excluded from merchant funnels.',
        'Paid conversion uses billing events outside this dashboard when available.',
      ],
    };
  }

  async exportPilot(organizationId: string) {
    const dashboard = await this.pilotDashboard(organizationId);
    const events = await this.prisma.dealPilotEvent.findMany({
      where: { organizationId },
      orderBy: { occurredAt: 'asc' },
      take: 10_000,
      select: {
        id: true,
        merchantPseudoId: true,
        cohort: true,
        corridor: true,
        schemaVersion: true,
        revision: true,
        type: true,
        occurredAt: true,
        // payload redacted of commercial terms by construction in recordPilotEvent
        payload: true,
      },
    });
    return {
      exportedAt: new Date().toISOString(),
      protocolVersion: dashboard.configs[0]?.version ?? null,
      metricDefinitions: dashboard.configs[0]?.metricDefinitions ?? null,
      dashboard,
      events,
    };
  }

  /**
   * Reproducible investor demo (Section 20). Always labeled SIMULATED / FIXTURE DEMO.
   */
  async runInvestorDemo(actor: Actor) {
    await this.assertEnabled(actor.organizationId);
    const buyerUserId = `demo-buyer-${createHash('sha256')
      .update(`${actor.organizationId}:${Date.now()}:${mintToken(8)}`)
      .digest('hex')
      .slice(0, 12)}`;
    const merchantActor = actor;
    const created = await this.createSession(merchantActor, {
      category: 'wholesale_rice',
      merchantLanguage: 'en',
      buyerLanguage: 'fr',
      timeZone: 'Africa/Accra',
      isDemo: true,
      pilotCohort: undefined,
      idempotencyKey: `demo-${mintToken(12)}`,
    });
    const sessionId = created.id as string;
    const invite = await this.createInvite(merchantActor, sessionId, 24);
    const buyerActor: Actor = {
      ...actor,
      userId: buyerUserId,
      authContext: 'demo_fixture',
    };
    await this.join(buyerActor, sessionId, { token: invite.token, language: 'fr' });
    for (const a of [merchantActor, buyerActor]) {
      for (const purpose of ['processing', 'recording', 'retention'] as const) {
        await this.recordConsent(a, sessionId, { purpose, decision: 'granted' });
      }
    }

    // 1) Seller proposes 50 bags — snapshot before buyer mismatch turn so terms stay at 50.
    await this.createTurn(merchantActor, sessionId, {
      text: 'I propose 50 bags of 25 kg rice at GHS 320 per bag for delivery on 2026-11-05 to Buyer warehouse, payment on delivery, shipping excluded, tax unresolved.',
      language: 'en',
    });
    const termOverrides = {
      'quantity.value': '50',
      'quantity.unit': 'bag',
      'quantity.packageSize.value': '25',
      'quantity.packageSize.unit': 'kg',
      'product.description': 'Rice',
      'pricing.currency': 'GHS',
      'pricing.unitPrice': '320.00',
      'pricing.total': '16000.00',
      'pricing.basis': 'per_bag',
      'pricing.shippingIncluded': false,
      'pricing.taxTreatment': 'unresolved',
      'delivery.date': '2026-11-05',
      'delivery.location': 'Buyer warehouse',
      'delivery.locationConfirmed': true,
      'payment.dueCondition': 'on_delivery',
      'payment.method': 'mobile_money',
    } as Record<string, unknown>;
    const snap1 = await this.proposeSnapshot(merchantActor, sessionId, {
      overrides: termOverrides,
    });
    const view1 = await this.sessionView(sessionId, buyerActor);
    const presentation1 = view1.activeSnapshot?.myPresentation;
    if (!presentation1) {
      throw new ApiException(
        'demo_failed',
        'Missing buyer presentation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    // 2) Buyer explains back 15 — mismatch, no receipt.
    const mismatch = await this.submitCheck(buyerActor, sessionId, {
      snapshotId: snap1.snapshotId,
      presentationHash: presentation1.presentationHash,
      responseText: '15 bags of rice at GHS 320',
    });
    if (mismatch.status !== 'needs_clarification') {
      throw new ApiException(
        'demo_failed',
        `Expected quantity mismatch clarification, got ${mismatch.status}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 3) Clarify and rebuild snapshot.
    await this.createTurn(merchantActor, sessionId, {
      text: 'Correction: quantity is 50 bags, not 15. Shipping excluded. Tax unresolved. Delivery location Buyer warehouse. Payment on delivery via mobile money.',
      language: 'en',
    });
    await this.createTurn(buyerActor, sessionId, {
      text: 'Daccord: 50 sacs, livraison 2026-11-05, GHS 320 par sac, total 16000 GHS, paiement à la livraison.',
      language: 'fr',
    });
    const snap2 = await this.proposeSnapshot(merchantActor, sessionId, {
      overrides: termOverrides,
    });

    const mView = await this.sessionView(sessionId, merchantActor);
    const bView = await this.sessionView(sessionId, buyerActor);
    const mPres = mView.activeSnapshot?.myPresentation;
    const bPres = bView.activeSnapshot?.myPresentation;
    if (!mPres || !bPres) {
      throw new ApiException(
        'demo_failed',
        'Missing review presentations after clarification snapshot',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const explain =
      '50 bags of rice at GHS 320 per bag total 16000 GHS delivery 2026-11-05 on delivery';
    const mCheck = await this.submitCheck(merchantActor, sessionId, {
      snapshotId: snap2.snapshotId,
      presentationHash: mPres.presentationHash,
      responseText: explain,
    });
    const bCheck = await this.submitCheck(buyerActor, sessionId, {
      snapshotId: snap2.snapshotId,
      presentationHash: bPres.presentationHash,
      responseText: explain,
    });
    if (mCheck.status !== 'check_completed' || bCheck.status !== 'check_completed') {
      throw new ApiException(
        'demo_failed',
        `Explain-back incomplete: merchant=${mCheck.status} buyer=${bCheck.status}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 4) Independent confirmations against the same snapshot.
    await this.confirm(merchantActor, sessionId, {
      snapshotId: snap2.snapshotId,
      contentHash: snap2.contentHash,
      presentationHash: mPres.presentationHash,
      action: 'confirm',
      idempotencyKey: `demo-m-${sessionId}`,
    });
    const issued = await this.confirm(buyerActor, sessionId, {
      snapshotId: snap2.snapshotId,
      contentHash: snap2.contentHash,
      presentationHash: bPres.presentationHash,
      action: 'confirm',
      idempotencyKey: `demo-b-${sessionId}`,
    });
    if (!issued.receiptId) {
      throw new ApiException(
        'demo_failed',
        'Expected two-party receipt after dual confirmation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 5) Amend quantity; prior confirmations cannot authorize the amended version.
    await this.startRevision(merchantActor, sessionId, {
      reason: 'Amend quantity for demonstration',
      expectedRevision: snap2.revision,
    });
    await this.createTurn(merchantActor, sessionId, {
      text: 'Amended quantity: 55 bags of 25 kg rice at GHS 320 per bag, total 17600 GHS.',
      language: 'en',
    });
    const snap3 = await this.proposeSnapshot(merchantActor, sessionId, {
      overrides: {
        ...termOverrides,
        'quantity.value': '55',
        'pricing.total': '17600.00',
      },
    });

    let staleRejected = false;
    try {
      await this.confirm(buyerActor, sessionId, {
        snapshotId: snap2.snapshotId,
        contentHash: snap2.contentHash,
        presentationHash: bPres.presentationHash,
        action: 'confirm',
        idempotencyKey: `demo-stale-${sessionId}`,
      });
    } catch (err) {
      staleRejected = err instanceof ApiException;
    }
    if (!staleRejected) {
      throw new ApiException(
        'demo_failed',
        'Stale confirmation against prior snapshot was incorrectly accepted',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const receipt = await this.getReceipt(merchantActor, sessionId);
    return {
      label: 'SIMULATED / FIXTURE DEMO',
      headline: 'Speak your language. Confirm the same deal.',
      sessionId,
      invitePath: invite.joinPath,
      mismatchCheck: mismatch,
      issuedReceiptId: issued.receiptId,
      amendedSnapshotId: snap3.snapshotId,
      staleConfirmationRejected: staleRejected,
      receipt,
      resetHint: 'POST /v1/dealbridge/demo/reset with the sessionId to delete demo media/session.',
    };
  }

  async resetDemo(actor: Actor, sessionId: string) {
    const session = await this.prisma.dealSession.findFirst({
      where: { id: sessionId, organizationId: actor.organizationId },
    });
    if (!session) {
      throw new ApiException('not_found', 'Session not found', HttpStatus.NOT_FOUND);
    }
    if (!session.isDemo && !session.isFixture) {
      throw new ApiException(
        'not_demo',
        'Only labeled demo/fixture sessions can be reset via this endpoint',
        HttpStatus.FORBIDDEN,
      );
    }
    return this.requestDeletion(actor, sessionId);
  }

  // --- internals ------------------------------------------------------------

  private async maybeEnterAwaitingConfirmations(sessionId: string, actor: Actor) {
    const session = await this.prisma.dealSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        participants: true,
        snapshots: { orderBy: { revision: 'desc' }, take: 1 },
      },
    });
    const snap = session.snapshots[0];
    if (!snap || snap.revision !== session.activeRevision) return;
    const terms = snap.normalizedTerms as unknown as NormalizedTerms;
    const required =
      REQUIRED_FIELDS_BY_CATEGORY[session.category] ?? REQUIRED_FIELDS_BY_CATEGORY.wholesale_rice!;
    if (required.some((f) => terms.unresolvedFields.includes(f))) return;

    for (const p of session.participants) {
      const check = await this.prisma.dealUnderstandingCheck.findFirst({
        where: {
          sessionId,
          participantId: p.id,
          snapshotId: snap.id,
          state: 'check_completed',
        },
      });
      if (!check) return;
    }
    if (session.state !== 'awaiting_confirmations') {
      await this.transition(
        sessionId,
        session.state as DealState,
        'awaiting_confirmations',
        actor.userId,
      );
    }
  }

  private async transition(
    sessionId: string,
    from: DealState,
    to: DealState,
    actorUserId?: string,
  ) {
    assertTransition(from, to);
    const session = await this.prisma.dealSession.update({
      where: { id: sessionId },
      data: { state: to },
    });
    await this.prisma.dealAuditEvent.create({
      data: {
        organizationId: session.organizationId,
        sessionId,
        actorUserId,
        operation: `state.${from}->${to}`,
        affectedRevision: session.activeRevision,
      },
    });
  }

  private assertNotExpired(session: { expiresAt: Date; id: string; state: string; organizationId: string }) {
    if (session.expiresAt.getTime() < Date.now()) {
      if (session.state !== 'expired') {
        void this.prisma.dealSession.update({
          where: { id: session.id },
          data: { state: 'expired' },
        });
      }
      throw new ApiException('session_expired', 'Deal session expired', HttpStatus.GONE);
    }
  }

  private assertAudio(file: Express.Multer.File) {
    if (file.size > MAX_AUDIO_BYTES) {
      throw new ApiException(
        'payload_too_large',
        `Audio exceeds ${MAX_AUDIO_BYTES} bytes`,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }
    const mime = file.mimetype || 'application/octet-stream';
    if (!ALLOWED_AUDIO.has(mime)) {
      throw new ApiException(
        'unsupported_media',
        `Unsupported audio type ${mime}`,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }
    // Basic decodability: require non-empty buffer; wav/riff sniff when claimed.
    if (!file.buffer?.length) {
      throw new ApiException('invalid_media', 'Empty audio payload', HttpStatus.BAD_REQUEST);
    }
    if (mime.includes('wav') && file.buffer.length >= 12) {
      const riff = file.buffer.toString('ascii', 0, 4);
      const wave = file.buffer.toString('ascii', 8, 12);
      if (riff !== 'RIFF' || wave !== 'WAVE') {
        throw new ApiException(
          'invalid_media',
          'Claimed WAV is not a decodable RIFF/WAVE file',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private async requireMemberSession(
    sessionId: string,
    actor: Actor,
    role?: 'merchant' | 'buyer',
  ) {
    const session = await this.prisma.dealSession.findFirst({
      where: {
        id: sessionId,
        deletedAt: null,
        OR: [
          { organizationId: actor.organizationId },
          { participants: { some: { userId: actor.userId } } },
        ],
      },
      include: { participants: true },
    });
    if (!session) {
      throw new ApiException('not_found', 'Deal session not found', HttpStatus.NOT_FOUND);
    }
    // Entitlement applies to the hosting tenant (merchant org), not the buyer home org.
    await this.assertEnabled(session.organizationId);
    const participant = session.participants.find((p) => p.userId === actor.userId);
    if (!participant) {
      throw new ApiException(
        'forbidden',
        'Not a participant in this deal session',
        HttpStatus.FORBIDDEN,
      );
    }
    if (role && participant.role !== role) {
      throw new ApiException('forbidden', `Requires ${role} role`, HttpStatus.FORBIDDEN);
    }
    return session;
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    sessionId: string,
    organizationId: string,
    type: string,
    payload: Record<string, unknown>,
  ) {
    const last = await tx.dealSessionEvent.findFirst({
      where: { sessionId },
      orderBy: { serverSequence: 'desc' },
      select: { serverSequence: true },
    });
    const session = await tx.dealSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { activeRevision: true },
    });
    await tx.dealSessionEvent.create({
      data: {
        sessionId,
        organizationId,
        serverSequence: (last?.serverSequence ?? 0) + 1,
        type,
        activeRevision: session.activeRevision,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  private async nextSeq(sessionId: string) {
    const last = await this.prisma.dealSessionEvent.findFirst({
      where: { sessionId },
      orderBy: { serverSequence: 'desc' },
      select: { serverSequence: true },
    });
    return (last?.serverSequence ?? 0) + 1;
  }

  private async recordCost(
    sessionId: string,
    organizationId: string,
    component: string,
    amountUsdMicros: number,
  ) {
    await this.prisma.dealUsageCostEvent.create({
      data: { sessionId, organizationId, component, amountUsdMicros },
    });
    const session = await this.prisma.dealSession.findUnique({ where: { id: sessionId } });
    if (session?.pilotCohort) {
      await this.recordPilotEvent({
        organizationId,
        sessionId,
        merchantPseudoId: 'cost',
        cohort: session.pilotCohort,
        corridor: session.corridor,
        type: 'usage.cost_recorded',
        payload: { component, amountUsdMicros },
      });
    }
  }

  private async safeAudit(
    actor: Actor,
    action: string,
    route: string,
    metadata?: Record<string, unknown>,
  ) {
    let userId: string | undefined;
    if (actor.authContext === 'clerk_session') {
      userId = actor.userId;
    } else {
      const existing = await this.prisma.user.findUnique({
        where: { id: actor.userId },
        select: { id: true },
      });
      userId = existing?.id;
    }
    await this.audit.record({
      organizationId: actor.organizationId,
      userId,
      action,
      route,
      ip: actor.ip,
      metadata,
    });
  }

  private async recordPilotEvent(input: {
    organizationId: string;
    sessionId?: string;
    merchantPseudoId: string;
    cohort: string;
    corridor: string;
    type: string;
    revision?: number;
    payload: Record<string, unknown>;
  }) {
    // Never include commercial terms or audio in analytics payloads.
    const safePayload = { ...input.payload };
    delete safePayload.terms;
    delete safePayload.text;
    delete safePayload.audio;
    await this.prisma.dealPilotEvent.create({
      data: {
        organizationId: input.organizationId,
        sessionId: input.sessionId,
        merchantPseudoId: input.merchantPseudoId,
        cohort: input.cohort,
        corridor: input.corridor,
        schemaVersion: DEALBRIDGE_SCHEMA_VERSION,
        revision: input.revision,
        type: input.type,
        payload: safePayload as Prisma.InputJsonValue,
      },
    });
  }
}
