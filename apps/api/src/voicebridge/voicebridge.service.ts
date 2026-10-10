import { createHash, randomBytes } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../common/errors/api-exception';
import { BillingService } from '../billing/billing.service';
import { LocalStorageService } from '../documents/local-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { DealBridgeService } from '../dealbridge/dealbridge.service';
import { VoiceBridgeAdapters } from './voicebridge.adapters';
import { contentHash, hashInviteToken } from './voicebridge.hash';
import { assertMessageTransition } from './voicebridge.state-machine';
import {
  VOICEBRIDGE_FEATURE,
  VOICEBRIDGE_MAX_PARTICIPANTS,
  VOICEBRIDGE_MAX_RECORDING_SECONDS,
  VOICEBRIDGE_MAX_UPLOAD_BYTES,
  VOICEBRIDGE_NOTICE_VERSION,
  type ConsentPurpose,
  type MessageState,
  type ThreadEventType,
} from './voicebridge.types';

export type VoiceActor = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  apiKeyId?: string;
  ip?: string;
};

@Injectable()
export class VoiceBridgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly storage: LocalStorageService,
    private readonly adapters: VoiceBridgeAdapters,
    private readonly dealbridge: DealBridgeService,
  ) {}

  catalog() {
    return {
      product: 'VoiceBridge',
      promise: 'Speak once. Connect across languages.',
      noticeVersion: VOICEBRIDGE_NOTICE_VERSION,
      limits: {
        maxParticipants: VOICEBRIDGE_MAX_PARTICIPANTS,
        maxRecordingSeconds: VOICEBRIDGE_MAX_RECORDING_SECONDS,
        maxUploadBytes: VOICEBRIDGE_MAX_UPLOAD_BYTES,
      },
      pilotCorridor: process.env.VOICEBRIDGE_PILOT_CORRIDOR ?? 'en-fr',
      dealBridgeHandoff: true,
    };
  }

  async assertEnabled(organizationId: string) {
    if (process.env.VOICEBRIDGE_DISABLED === '1') {
      throw new ApiException(
        'feature_disabled',
        'VoiceBridge is disabled by VOICEBRIDGE_DISABLED=1',
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
    if (typeof overrides.voiceBridge === 'boolean') {
      if (!overrides.voiceBridge) {
        throw new ApiException(
          'feature_disabled',
          'VoiceBridge is disabled for this organization',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }
    if (process.env.VOICEBRIDGE_OPEN === '1') return;
    await this.billing.assertFeature(
      organizationId,
      VOICEBRIDGE_FEATURE,
      'VoiceBridge requires a plan with the voiceBridge entitlement (Pro+), or set featureOverrides.voiceBridge=true / VOICEBRIDGE_OPEN=1 for pilot.',
    );
  }

  private async requireMember(threadId: string, userId: string) {
    const membership = await this.prisma.voiceMembership.findFirst({
      where: { threadId, userId, active: true },
    });
    if (!membership) {
      throw new ApiException('forbidden', 'Not an active VoiceBridge member', HttpStatus.FORBIDDEN);
    }
    return membership;
  }

  private async requireThread(threadId: string, organizationId: string) {
    const thread = await this.prisma.voiceThread.findFirst({
      where: { id: threadId, organizationId, deletedAt: null },
    });
    if (!thread) {
      throw new ApiException('not_found', 'VoiceBridge thread not found', HttpStatus.NOT_FOUND);
    }
    return thread;
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    input: {
      threadId: string;
      type: ThreadEventType;
      messageId?: string;
      sourceRevisionId?: string;
      variantVersion?: number;
      correlationId?: string;
      payload?: Prisma.InputJsonValue;
    },
  ) {
    const thread = await tx.voiceThread.update({
      where: { id: input.threadId },
      data: { sequence: { increment: 1 } },
      select: { sequence: true },
    });
    return tx.voiceThreadEvent.create({
      data: {
        threadId: input.threadId,
        sequence: thread.sequence,
        eventId: `evt_${randomBytes(12).toString('hex')}`,
        type: input.type,
        messageId: input.messageId,
        sourceRevisionId: input.sourceRevisionId,
        variantVersion: input.variantVersion,
        correlationId: input.correlationId,
        payload: input.payload ?? undefined,
      },
    });
  }

  private async audit(
    input: {
      organizationId: string;
      threadId?: string;
      actorId: string;
      operation: string;
      revisionId?: string;
      meta?: Prisma.InputJsonValue;
    },
  ) {
    await this.prisma.voiceAuditEvent.create({
      data: {
        organizationId: input.organizationId,
        threadId: input.threadId,
        actorId: input.actorId,
        operation: input.operation,
        revisionId: input.revisionId,
        meta: input.meta ?? undefined,
      },
    });
  }

  async listThreads(actor: VoiceActor) {
    await this.assertEnabled(actor.organizationId);
    const memberships = await this.prisma.voiceMembership.findMany({
      where: { userId: actor.userId, active: true, thread: { organizationId: actor.organizationId, deletedAt: null } },
      include: { thread: true },
      orderBy: { joinedAt: 'desc' },
    });
    return {
      threads: memberships.map((m) => ({
        id: m.thread.id,
        title: m.thread.title,
        category: m.thread.category,
        state: m.thread.state,
        role: m.role,
        language: m.language,
        sequence: m.thread.sequence,
        createdAt: m.thread.createdAt,
      })),
    };
  }

  async createThread(
    actor: VoiceActor,
    input: { title: string; category?: string; language: string; variety?: string; corridor?: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    const title = input.title?.trim();
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }
    const language = input.language?.trim();
    if (!language) {
      throw new ApiException('validation_error', 'language is required', HttpStatus.BAD_REQUEST);
    }

    const thread = await this.prisma.$transaction(async (tx) => {
      const created = await tx.voiceThread.create({
        data: {
          organizationId: actor.organizationId,
          workspaceId: actor.workspaceId,
          creatorId: actor.userId,
          title,
          category: input.category?.trim() || null,
          corridor: input.corridor ?? process.env.VOICEBRIDGE_PILOT_CORRIDOR ?? 'en-fr',
          memberships: {
            create: {
              userId: actor.userId,
              role: 'creator',
              language,
              variety: input.variety ?? null,
            },
          },
        },
      });
      await this.appendEvent(tx, {
        threadId: created.id,
        type: 'membership.changed',
        payload: { userId: actor.userId, role: 'creator', action: 'joined' },
      });
      return created;
    });

    await this.audit({
      organizationId: actor.organizationId,
      threadId: thread.id,
      actorId: actor.userId,
      operation: 'thread.created',
    });

    return this.threadView(thread.id, actor);
  }

  async threadView(threadId: string, actor: VoiceActor) {
    await this.assertEnabled(actor.organizationId);
    const thread = await this.requireThread(threadId, actor.organizationId);
    await this.requireMember(threadId, actor.userId);

    const [memberships, messages, events] = await Promise.all([
      this.prisma.voiceMembership.findMany({ where: { threadId, active: true } }),
      this.prisma.voiceMessage.findMany({
        where: { threadId, deletedAt: null, state: { not: 'deleted' } },
        orderBy: { createdAt: 'asc' },
        include: {
          revisions: {
            orderBy: { revisionNumber: 'asc' },
            include: { variants: { orderBy: { version: 'desc' } } },
          },
        },
      }),
      this.prisma.voiceThreadEvent.findMany({
        where: { threadId },
        orderBy: { sequence: 'asc' },
        take: 200,
      }),
    ]);

    const me = memberships.find((m) => m.userId === actor.userId)!;

    return {
      thread: {
        id: thread.id,
        title: thread.title,
        category: thread.category,
        state: thread.state,
        sequence: thread.sequence,
        corridor: thread.corridor,
        maxParticipants: thread.maxParticipants,
        createdAt: thread.createdAt,
      },
      me: {
        role: me.role,
        language: me.language,
        variety: me.variety,
        languagePrefVersion: me.languagePrefVersion,
      },
      members: memberships.map((m) => ({
        userId: m.userId,
        role: m.role,
        language: m.language,
        variety: m.variety,
        joinedAt: m.joinedAt,
      })),
      messages: messages.map((msg) => {
        const active = msg.revisions.find((r) => r.id === msg.activeRevisionId) ?? null;
        const myVariant =
          active?.variants.find(
            (v) =>
              v.targetLanguage === me.language &&
              (v.targetVariety ?? null) === (me.variety ?? null) &&
              (v.state === 'ready' || v.state === 'text_ready' || v.state === 'needs_clarification'),
          ) ??
          active?.variants.find((v) => v.targetLanguage === me.language) ??
          null;
        return {
          id: msg.id,
          authorId: msg.authorId,
          state: msg.state,
          replyToMessageId: msg.replyToMessageId,
          replyToRevisionId: msg.replyToRevisionId,
          activeRevisionId: msg.activeRevisionId,
          activeRevision: active
            ? {
                id: active.id,
                revisionNumber: active.revisionNumber,
                reviewedTranscript: active.reviewedTranscript,
                language: active.language,
                status: active.status,
                supersedesId: active.supersedesId,
                correctionReason: active.correctionReason,
                contentHash: active.contentHash,
                publishedAt: active.publishedAt,
                hasAudio: Boolean(active.originalAudioKey),
              }
            : null,
          myVariant: myVariant
            ? {
                id: myVariant.id,
                state: myVariant.state,
                text: myVariant.text,
                targetLanguage: myVariant.targetLanguage,
                verificationState: myVariant.verificationState,
                verificationIssues: myVariant.verificationIssues,
                hasAudio: Boolean(myVariant.audioKey),
                version: myVariant.version,
              }
            : null,
          history: msg.revisions.map((r) => ({
            id: r.id,
            revisionNumber: r.revisionNumber,
            status: r.status,
            supersedesId: r.supersedesId,
            correctionReason: r.correctionReason,
            publishedAt: r.publishedAt,
          })),
        };
      }),
      events: events.map((e) => ({
        eventId: e.eventId,
        sequence: e.sequence,
        type: e.type,
        messageId: e.messageId,
        sourceRevisionId: e.sourceRevisionId,
        createdAt: e.createdAt,
      })),
      noticeVersion: VOICEBRIDGE_NOTICE_VERSION,
    };
  }

  async createInvite(threadId: string, actor: VoiceActor, expiresInHours = 72) {
    await this.assertEnabled(actor.organizationId);
    await this.requireThread(threadId, actor.organizationId);
    const me = await this.requireMember(threadId, actor.userId);
    if (me.role !== 'creator' && me.role !== 'moderator') {
      throw new ApiException('forbidden', 'Only creators/moderators can invite', HttpStatus.FORBIDDEN);
    }
    const activeCount = await this.prisma.voiceMembership.count({
      where: { threadId, active: true },
    });
    if (activeCount >= VOICEBRIDGE_MAX_PARTICIPANTS) {
      throw new ApiException(
        'validation_error',
        `Thread already has ${VOICEBRIDGE_MAX_PARTICIPANTS} participants`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const token = randomBytes(24).toString('base64url');
    const invite = await this.prisma.voiceInvitation.create({
      data: {
        threadId,
        tokenHash: hashInviteToken(token),
        expiresAt: new Date(Date.now() + expiresInHours * 3600_000),
      },
    });
    await this.audit({
      organizationId: actor.organizationId,
      threadId,
      actorId: actor.userId,
      operation: 'invite.created',
      meta: { inviteId: invite.id },
    });
    return {
      inviteId: invite.id,
      token,
      expiresAt: invite.expiresAt,
      joinPath: `/voicebridge/join/${token}`,
    };
  }

  async peekInvite(token: string) {
    const invite = await this.prisma.voiceInvitation.findUnique({
      where: { tokenHash: hashInviteToken(token) },
      include: { thread: true },
    });
    if (!invite || invite.redeemedAt || invite.expiresAt < new Date()) {
      throw new ApiException('not_found', 'Invitation not found or expired', HttpStatus.NOT_FOUND);
    }
    return {
      threadId: invite.threadId,
      title: invite.thread.title,
      expiresAt: invite.expiresAt,
      noticeVersion: VOICEBRIDGE_NOTICE_VERSION,
    };
  }

  async joinThread(
    token: string,
    actor: VoiceActor,
    input: { language: string; variety?: string; consents?: { purpose: ConsentPurpose; decision: 'granted' | 'denied' }[] },
  ) {
    await this.assertEnabled(actor.organizationId);
    const language = input.language?.trim();
    if (!language) {
      throw new ApiException('validation_error', 'language is required', HttpStatus.BAD_REQUEST);
    }
    const processing = input.consents?.find((c) => c.purpose === 'processing');
    if (!processing || processing.decision !== 'granted') {
      throw new ApiException(
        'validation_error',
        'Processing consent must be granted to join',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const invite = await tx.voiceInvitation.findUnique({
        where: { tokenHash: hashInviteToken(token) },
        include: { thread: true },
      });
      if (!invite || invite.redeemedAt || invite.expiresAt < new Date()) {
        throw new ApiException('not_found', 'Invitation not found or expired', HttpStatus.NOT_FOUND);
      }
      if (invite.thread.organizationId !== actor.organizationId) {
        throw new ApiException('forbidden', 'Invitation is for another organization', HttpStatus.FORBIDDEN);
      }
      const activeCount = await tx.voiceMembership.count({
        where: { threadId: invite.threadId, active: true },
      });
      if (activeCount >= invite.thread.maxParticipants) {
        throw new ApiException('validation_error', 'Thread is full', HttpStatus.BAD_REQUEST);
      }

      const existing = await tx.voiceMembership.findUnique({
        where: { threadId_userId: { threadId: invite.threadId, userId: actor.userId } },
      });
      const membership =
        existing ??
        (await tx.voiceMembership.create({
          data: {
            threadId: invite.threadId,
            userId: actor.userId,
            role: 'member',
            language,
            variety: input.variety ?? null,
          },
        }));

      if (existing && !existing.active) {
        await tx.voiceMembership.update({
          where: { id: existing.id },
          data: { active: true, language, variety: input.variety ?? null },
        });
      }

      await tx.voiceInvitation.update({
        where: { id: invite.id },
        data: { redeemedAt: new Date(), redeemedByUserId: actor.userId },
      });

      for (const c of input.consents ?? []) {
        if (c.purpose === 'training' && c.decision === 'denied') {
          // training is optional — always allowed to deny
        }
        await tx.voiceConsent.create({
          data: {
            threadId: invite.threadId,
            membershipId: membership.id,
            userId: actor.userId,
            purpose: c.purpose,
            noticeVersion: VOICEBRIDGE_NOTICE_VERSION,
            decision: c.decision,
          },
        });
      }

      await this.appendEvent(tx, {
        threadId: invite.threadId,
        type: 'membership.changed',
        payload: { userId: actor.userId, action: 'joined' },
      });

      return invite.threadId;
    });

    return this.threadView(result, actor);
  }

  async patchMemberMe(
    threadId: string,
    actor: VoiceActor,
    input: { language?: string; variety?: string | null; notificationsEnabled?: boolean },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.requireThread(threadId, actor.organizationId);
    const me = await this.requireMember(threadId, actor.userId);
    const updated = await this.prisma.voiceMembership.update({
      where: { id: me.id },
      data: {
        language: input.language?.trim() || me.language,
        variety: input.variety === undefined ? me.variety : input.variety,
        notificationsEnabled:
          input.notificationsEnabled === undefined ? me.notificationsEnabled : input.notificationsEnabled,
        languagePrefVersion: { increment: input.language ? 1 : 0 },
      },
    });
    return {
      language: updated.language,
      variety: updated.variety,
      languagePrefVersion: updated.languagePrefVersion,
      notificationsEnabled: updated.notificationsEnabled,
    };
  }

  issueUploadAuth(threadId: string, actor: VoiceActor) {
    return this.assertEnabled(actor.organizationId).then(async () => {
      await this.requireThread(threadId, actor.organizationId);
      await this.requireMember(threadId, actor.userId);
      return {
        maxBytes: VOICEBRIDGE_MAX_UPLOAD_BYTES,
        maxRecordingSeconds: VOICEBRIDGE_MAX_RECORDING_SECONDS,
        allowedMimeTypes: ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/x-wav'],
        uploadPath: `/v1/voicebridge/threads/${threadId}/messages`,
        expiresAt: new Date(Date.now() + 30 * 60_000),
      };
    });
  }

  async createDraftMessage(
    threadId: string,
    actor: VoiceActor,
    input: {
      text?: string;
      language?: string;
      idempotencyKey?: string;
      replyToMessageId?: string;
      replyToRevisionId?: string;
      file?: Express.Multer.File;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.requireThread(threadId, actor.organizationId);
    const me = await this.requireMember(threadId, actor.userId);

    if (input.idempotencyKey) {
      const existing = await this.prisma.voiceMessage.findUnique({
        where: { threadId_idempotencyKey: { threadId, idempotencyKey: input.idempotencyKey } },
      });
      if (existing) {
        return this.messageDraftView(existing.id, actor);
      }
    }

    if (input.file) {
      if (input.file.size > VOICEBRIDGE_MAX_UPLOAD_BYTES) {
        throw new ApiException('validation_error', 'Upload exceeds 20 MB limit', HttpStatus.BAD_REQUEST);
      }
    }

    let transcript = input.text?.trim() ?? '';
    let audioKey: string | null = null;
    let audioMime: string | null = null;
    let asrStatus: string = 'text';

    if (input.file) {
      audioKey = `voicebridge/${threadId}/${randomBytes(12).toString('hex')}.bin`;
      audioMime = input.file.mimetype;
      await this.storage.writeBuffer(audioKey, input.file.buffer);
      const asr = await this.adapters.recognize({
        file: input.file,
        language: input.language ?? me.language,
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        apiKeyId: actor.apiKeyId,
        userId: actor.userId,
        ip: actor.ip,
      });
      if (asr.status === 'unavailable') {
        throw new ApiException(
          'asr_unavailable',
          'Speech recognition unavailable for this corridor — unsupported ASR is explicit',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      transcript = asr.text;
      asrStatus = asr.status;
    }

    if (!transcript) {
      throw new ApiException(
        'validation_error',
        'Message requires text or recognizable audio',
        HttpStatus.BAD_REQUEST,
      );
    }

    const message = await this.prisma.voiceMessage.create({
      data: {
        threadId,
        authorId: actor.userId,
        state: 'awaiting_review',
        idempotencyKey: input.idempotencyKey ?? null,
        replyToMessageId: input.replyToMessageId ?? null,
        replyToRevisionId: input.replyToRevisionId ?? null,
        revisions: {
          create: {
            revisionNumber: 0,
            originalAudioKey: audioKey,
            originalAudioMime: audioMime,
            reviewedTranscript: transcript,
            language: input.language ?? me.language,
            variety: me.variety,
            authorId: actor.userId,
            contentHash: contentHash(transcript),
            status: 'current',
          },
        },
      },
      include: { revisions: true },
    });

    // Point activeRevision at draft revision 0 for review (not published yet)
    await this.prisma.voiceMessage.update({
      where: { id: message.id },
      data: { activeRevisionId: message.revisions[0]?.id },
    });

    await this.audit({
      organizationId: actor.organizationId,
      threadId,
      actorId: actor.userId,
      operation: 'message.drafted',
      revisionId: message.revisions[0]?.id,
      meta: { asrStatus },
    });

    return this.messageDraftView(message.id, actor);
  }

  async messageDraftView(messageId: string, actor: VoiceActor) {
    const message = await this.prisma.voiceMessage.findUnique({
      where: { id: messageId },
      include: { revisions: { orderBy: { revisionNumber: 'asc' } }, thread: true },
    });
    if (!message || message.thread.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Message not found', HttpStatus.NOT_FOUND);
    }
    await this.requireMember(message.threadId, actor.userId);
    const draft = message.revisions[message.revisions.length - 1];
    return {
      messageId: message.id,
      state: message.state,
      requiresSenderReview: message.state === 'awaiting_review',
      draftRevision: draft
        ? {
            id: draft.id,
            revisionNumber: draft.revisionNumber,
            reviewedTranscript: draft.reviewedTranscript,
            language: draft.language,
            hasAudio: Boolean(draft.originalAudioKey),
            contentHash: draft.contentHash,
          }
        : null,
    };
  }

  async updateDraftTranscript(
    messageId: string,
    actor: VoiceActor,
    input: { reviewedTranscript: string; expectedDraftRevisionId: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    const message = await this.prisma.voiceMessage.findUnique({
      where: { id: messageId },
      include: { thread: true, revisions: true },
    });
    if (!message || message.thread.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Message not found', HttpStatus.NOT_FOUND);
    }
    if (message.authorId !== actor.userId) {
      throw new ApiException('forbidden', 'Only the author can edit the draft transcript', HttpStatus.FORBIDDEN);
    }
    if (message.state !== 'awaiting_review') {
      throw new ApiException('conflict', 'Message is not awaiting review', HttpStatus.CONFLICT);
    }
    const draft = message.revisions.find((r) => r.id === input.expectedDraftRevisionId);
    if (!draft) {
      throw new ApiException('conflict', 'expectedDraftRevisionId does not match', HttpStatus.CONFLICT);
    }
    const text = input.reviewedTranscript.trim();
    if (!text) {
      throw new ApiException('validation_error', 'reviewedTranscript is required', HttpStatus.BAD_REQUEST);
    }
    const updated = await this.prisma.voiceSourceRevision.update({
      where: { id: draft.id },
      data: { reviewedTranscript: text, contentHash: contentHash(text) },
    });
    return {
      draftRevision: {
        id: updated.id,
        reviewedTranscript: updated.reviewedTranscript,
        contentHash: updated.contentHash,
      },
    };
  }

  async publishMessage(
    messageId: string,
    actor: VoiceActor,
    input: { expectedDraftRevisionId: string; reviewedTranscript?: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    const message = await this.prisma.voiceMessage.findUnique({
      where: { id: messageId },
      include: { thread: true, revisions: true },
    });
    if (!message || message.thread.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Message not found', HttpStatus.NOT_FOUND);
    }
    if (message.authorId !== actor.userId) {
      throw new ApiException('forbidden', 'Only the author can publish', HttpStatus.FORBIDDEN);
    }
    assertMessageTransition(message.state as MessageState, 'published');
    const draft = message.revisions.find((r) => r.id === input.expectedDraftRevisionId);
    if (!draft || draft.revisionNumber !== 0) {
      throw new ApiException(
        'conflict',
        'expectedDraftRevisionId must match the current draft revision',
        HttpStatus.CONFLICT,
      );
    }

    const transcript = (input.reviewedTranscript ?? draft.reviewedTranscript).trim();
    if (!transcript) {
      throw new ApiException('validation_error', 'Sender review transcript is required', HttpStatus.BAD_REQUEST);
    }

    const members = await this.prisma.voiceMembership.findMany({
      where: { threadId: message.threadId, active: true },
    });

    const published = await this.prisma.$transaction(async (tx) => {
      const revision = await tx.voiceSourceRevision.update({
        where: { id: draft.id },
        data: {
          reviewedTranscript: transcript,
          contentHash: contentHash(transcript),
          revisionNumber: 1,
          status: 'current',
          publishedAt: new Date(),
        },
      });
      await tx.voiceMessage.update({
        where: { id: message.id },
        data: { state: 'published', activeRevisionId: revision.id },
      });
      await this.appendEvent(tx, {
        threadId: message.threadId,
        type: 'message.published',
        messageId: message.id,
        sourceRevisionId: revision.id,
      });
      return revision;
    });

    await this.generateVariantsForRevision({
      actor,
      threadId: message.threadId,
      revisionId: published.id,
      sourceText: published.reviewedTranscript,
      sourceLanguage: published.language,
      members,
      expectedActiveRevisionId: published.id,
    });

    await this.audit({
      organizationId: actor.organizationId,
      threadId: message.threadId,
      actorId: actor.userId,
      operation: 'message.published',
      revisionId: published.id,
    });

    return this.threadView(message.threadId, actor);
  }

  private async generateVariantsForRevision(input: {
    actor: VoiceActor;
    threadId: string;
    revisionId: string;
    sourceText: string;
    sourceLanguage: string;
    members: { id: string; userId: string; language: string; variety: string | null }[];
    expectedActiveRevisionId: string;
  }) {
    // Group by identical language/variety
    const groups = new Map<string, { language: string; variety: string | null; membershipIds: string[] }>();
    for (const m of input.members) {
      const key = `${m.language}::${m.variety ?? ''}`;
      const g = groups.get(key) ?? { language: m.language, variety: m.variety, membershipIds: [] };
      g.membershipIds.push(m.id);
      groups.set(key, g);
    }

    for (const g of groups.values()) {
      const jobKey = `translate:${input.revisionId}:${g.language}:${g.variety ?? ''}`;
      const job = await this.prisma.voiceProcessingJob.upsert({
        where: { idempotencyKey: jobKey },
        create: {
          threadId: input.threadId,
          sourceRevisionId: input.revisionId,
          expectedActiveRevisionId: input.expectedActiveRevisionId,
          idempotencyKey: jobKey,
          stage: 'translate',
          targetLanguage: g.language,
          status: 'running',
          attempts: 1,
        },
        update: { attempts: { increment: 1 }, status: 'running' },
      });

      // Stale job guard — never replace current content for superseded revisions
      const message = await this.prisma.voiceMessage.findFirst({
        where: { activeRevisionId: input.expectedActiveRevisionId },
      });
      if (!message) {
        await this.prisma.voiceProcessingJob.update({
          where: { id: job.id },
          data: { status: 'stale', errorClass: 'stale_revision' },
        });
        continue;
      }

      const mt = await this.adapters.translateText({
        text: input.sourceText,
        source: input.sourceLanguage,
        target: g.language,
        organizationId: input.actor.organizationId,
        workspaceId: input.actor.workspaceId,
        apiKeyId: input.actor.apiKeyId,
        userId: input.actor.userId,
        ip: input.actor.ip,
      });

      if (mt.status === 'unsupported') {
        await this.prisma.voiceLanguageVariant.create({
          data: {
            sourceRevisionId: input.revisionId,
            targetLanguage: g.language,
            targetVariety: g.variety,
            text: '',
            state: 'unsupported',
            contentHash: contentHash(`unsupported:${g.language}`),
            modelVersions: { translate: mt.modelVersion },
          },
        });
        await this.prisma.voiceProcessingJob.update({
          where: { id: job.id },
          data: { status: 'failed', errorClass: 'unsupported' },
        });
        await this.prisma.$transaction(async (tx) => {
          await this.appendEvent(tx, {
            threadId: input.threadId,
            type: 'processing.failed',
            sourceRevisionId: input.revisionId,
            payload: { language: g.language, reason: 'unsupported' },
          });
        });
        continue;
      }

      const verification = this.adapters.verifyCriticalTerms(input.sourceText, mt.text);
      let state: string =
        verification.status === 'needs_clarification' ? 'needs_clarification' : 'text_ready';
      let audioKey: string | null = null;
      let audioMime: string | null = null;

      if (verification.status === 'ok') {
        const tts = await this.adapters.synthesize({
          text: mt.text,
          language: g.language,
          organizationId: input.actor.organizationId,
          workspaceId: input.actor.workspaceId,
          apiKeyId: input.actor.apiKeyId,
          userId: input.actor.userId,
          ip: input.actor.ip,
        });
        if (tts.status !== 'unsupported' && tts.audio) {
          audioKey = `voicebridge/${input.threadId}/variants/${randomBytes(10).toString('hex')}.bin`;
          audioMime = tts.mimeType;
          await this.storage.writeBuffer(audioKey, tts.audio);
          state = 'ready';
        } else {
          state = 'text_ready';
        }
      }

      const variant = await this.prisma.voiceLanguageVariant.create({
        data: {
          sourceRevisionId: input.revisionId,
          targetLanguage: g.language,
          targetVariety: g.variety,
          text: mt.text,
          audioKey,
          audioMime,
          state,
          verificationState: verification.status,
          verificationIssues: verification.issues.length ? verification.issues : undefined,
          contentHash: contentHash(`${g.language}:${mt.text}`),
          modelVersions: { translate: mt.modelVersion },
        },
      });

      for (const membershipId of g.membershipIds) {
        await this.prisma.voiceDeliveryRecord.upsert({
          where: {
            membershipId_revisionId: { membershipId, revisionId: input.revisionId },
          },
          create: {
            membershipId,
            revisionId: input.revisionId,
            variantId: variant.id,
            availableAt: new Date(),
          },
          update: {
            variantId: variant.id,
            availableAt: new Date(),
          },
        });
      }

      await this.prisma.voiceProcessingJob.update({
        where: { id: job.id },
        data: { status: 'succeeded' },
      });

      await this.prisma.$transaction(async (tx) => {
        await this.appendEvent(tx, {
          threadId: input.threadId,
          type: state === 'ready' ? 'variant.audio_ready' : 'variant.text_ready',
          sourceRevisionId: input.revisionId,
          variantVersion: variant.version,
          payload: { language: g.language, variantId: variant.id, state },
        });
        if (state === 'needs_clarification') {
          await this.appendEvent(tx, {
            threadId: input.threadId,
            type: 'clarification.required',
            sourceRevisionId: input.revisionId,
            payload: { language: g.language, issues: verification.issues },
          });
        }
      });
    }
  }

  async correctMessage(
    messageId: string,
    actor: VoiceActor,
    input: {
      expectedActiveRevisionId: string;
      reviewedTranscript: string;
      correctionReason?: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const message = await this.prisma.voiceMessage.findUnique({
      where: { id: messageId },
      include: { thread: true },
    });
    if (!message || message.thread.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Message not found', HttpStatus.NOT_FOUND);
    }
    if (message.authorId !== actor.userId) {
      throw new ApiException('forbidden', 'Only the author can correct', HttpStatus.FORBIDDEN);
    }
    if (message.state !== 'published') {
      throw new ApiException('conflict', 'Only published messages can be corrected', HttpStatus.CONFLICT);
    }
    if (message.activeRevisionId !== input.expectedActiveRevisionId) {
      throw new ApiException(
        'conflict',
        'Stale correction — expectedActiveRevisionId does not match current active revision',
        HttpStatus.CONFLICT,
      );
    }
    const text = input.reviewedTranscript.trim();
    if (!text) {
      throw new ApiException('validation_error', 'reviewedTranscript is required', HttpStatus.BAD_REQUEST);
    }

    const members = await this.prisma.voiceMembership.findMany({
      where: { threadId: message.threadId, active: true },
    });

    const newRevision = await this.prisma.$transaction(async (tx) => {
      const prev = await tx.voiceSourceRevision.findUniqueOrThrow({
        where: { id: input.expectedActiveRevisionId },
      });
      await tx.voiceSourceRevision.update({
        where: { id: prev.id },
        data: { status: 'superseded' },
      });
      const next = await tx.voiceSourceRevision.create({
        data: {
          messageId: message.id,
          revisionNumber: prev.revisionNumber + 1,
          originalAudioKey: prev.originalAudioKey,
          originalAudioMime: prev.originalAudioMime,
          reviewedTranscript: text,
          language: prev.language,
          variety: prev.variety,
          supersedesId: prev.id,
          correctionReason: input.correctionReason ?? 'author_correction',
          authorId: actor.userId,
          contentHash: contentHash(text),
          status: 'current',
        },
      });
      await tx.voiceMessage.update({
        where: { id: message.id },
        data: { activeRevisionId: next.id },
      });
      await tx.voiceDealDraftLink.updateMany({
        where: {
          threadId: message.threadId,
          staleSince: null,
        },
        data: { staleSince: new Date() },
      });
      await this.appendEvent(tx, {
        threadId: message.threadId,
        type: 'message.corrected',
        messageId: message.id,
        sourceRevisionId: next.id,
        payload: {
          supersedesId: prev.id,
          correctionReason: input.correctionReason ?? 'author_correction',
        },
      });
      await this.appendEvent(tx, {
        threadId: message.threadId,
        type: 'deal_draft.stale',
        sourceRevisionId: next.id,
      });
      return next;
    });

    await this.generateVariantsForRevision({
      actor,
      threadId: message.threadId,
      revisionId: newRevision.id,
      sourceText: newRevision.reviewedTranscript,
      sourceLanguage: newRevision.language,
      members,
      expectedActiveRevisionId: newRevision.id,
    });

    await this.audit({
      organizationId: actor.organizationId,
      threadId: message.threadId,
      actorId: actor.userId,
      operation: 'message.corrected',
      revisionId: newRevision.id,
    });

    return this.threadView(message.threadId, actor);
  }

  async acknowledgeRevision(revisionId: string, actor: VoiceActor) {
    await this.assertEnabled(actor.organizationId);
    const revision = await this.prisma.voiceSourceRevision.findUnique({
      where: { id: revisionId },
      include: { message: { include: { thread: true } } },
    });
    if (!revision || revision.message.thread.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Revision not found', HttpStatus.NOT_FOUND);
    }
    const me = await this.requireMember(revision.message.threadId, actor.userId);
    const record = await this.prisma.voiceDeliveryRecord.upsert({
      where: {
        membershipId_revisionId: { membershipId: me.id, revisionId },
      },
      create: {
        membershipId: me.id,
        revisionId,
        availableAt: new Date(),
        acknowledgmentAt: new Date(),
      },
      update: { acknowledgmentAt: new Date() },
    });
    return {
      revisionId,
      acknowledgmentAt: record.acknowledgmentAt,
      note: 'Acknowledgment is not agreement or deal confirmation',
    };
  }

  async recordPlayback(revisionId: string, actor: VoiceActor) {
    const revision = await this.prisma.voiceSourceRevision.findUnique({
      where: { id: revisionId },
      include: { message: { include: { thread: true } } },
    });
    if (!revision || revision.message.thread.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Revision not found', HttpStatus.NOT_FOUND);
    }
    const me = await this.requireMember(revision.message.threadId, actor.userId);
    const record = await this.prisma.voiceDeliveryRecord.upsert({
      where: {
        membershipId_revisionId: { membershipId: me.id, revisionId },
      },
      create: {
        membershipId: me.id,
        revisionId,
        availableAt: new Date(),
        firstPlayedAt: new Date(),
      },
      update: {
        firstPlayedAt: { set: undefined },
      },
    });
    if (!record.firstPlayedAt) {
      await this.prisma.voiceDeliveryRecord.update({
        where: { id: record.id },
        data: { firstPlayedAt: new Date() },
      });
    }
    return { revisionId, playbackRecorded: true, note: 'Playback is not acknowledgment or agreement' };
  }

  async createDealDraft(
    threadId: string,
    actor: VoiceActor,
    input: {
      selectedRevisionIds: string[];
      partyAUserId: string;
      partyBUserId: string;
      category?: string;
      idempotencyKey?: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.requireThread(threadId, actor.organizationId);
    await this.requireMember(threadId, actor.userId);

    if (!input.selectedRevisionIds?.length) {
      throw new ApiException('validation_error', 'selectedRevisionIds required', HttpStatus.BAD_REQUEST);
    }
    if (!input.partyAUserId || !input.partyBUserId) {
      throw new ApiException('validation_error', 'Both deal parties are required', HttpStatus.BAD_REQUEST);
    }

    const revisions = await this.prisma.voiceSourceRevision.findMany({
      where: { id: { in: input.selectedRevisionIds }, message: { threadId } },
      include: { message: true },
    });
    if (revisions.length !== input.selectedRevisionIds.length) {
      throw new ApiException('validation_error', 'One or more revisions are not in this thread', HttpStatus.BAD_REQUEST);
    }
    for (const r of revisions) {
      if (r.message.activeRevisionId !== r.id || r.status !== 'current') {
        throw new ApiException(
          'conflict',
          `Revision ${r.id} is not the current active evidence`,
          HttpStatus.CONFLICT,
        );
      }
    }

    for (const party of [input.partyAUserId, input.partyBUserId]) {
      await this.requireMember(threadId, party);
    }

    const handoffKey =
      input.idempotencyKey ??
      createHash('sha256')
        .update(`${threadId}:${input.selectedRevisionIds.sort().join(',')}:${input.partyAUserId}:${input.partyBUserId}`)
        .digest('hex')
        .slice(0, 32);

    const existing = await this.prisma.voiceDealDraftLink.findUnique({ where: { handoffKey } });
    if (existing) {
      return {
        dealDraftLinkId: existing.id,
        dealSessionId: existing.dealSessionId,
        staleSince: existing.staleSince,
        handoffKey: existing.handoffKey,
        selectedRevisionIds: existing.selectedRevisionIds,
      };
    }

    // Real DealBridge draft adapter — create a draft session with provenance metadata
    let dealSessionId: string | null = null;
    try {
      const partyA = await this.prisma.voiceMembership.findUniqueOrThrow({
        where: { threadId_userId: { threadId, userId: input.partyAUserId } },
      });
      const partyB = await this.prisma.voiceMembership.findUniqueOrThrow({
        where: { threadId_userId: { threadId, userId: input.partyBUserId } },
      });
      const session = await this.dealbridge.createSession(
        {
          organizationId: actor.organizationId,
          workspaceId: actor.workspaceId,
          userId: actor.userId,
          apiKeyId: actor.apiKeyId,
          authContext: actor.apiKeyId ? 'api_key_actor' : 'clerk_session',
          ip: actor.ip,
        },
        {
          category: input.category ?? 'voicebridge_handoff',
          merchantLanguage: partyA.language,
          buyerLanguage: partyB.language,
          idempotencyKey: `vb-${handoffKey}`,
          isDemo: false,
        },
      );
      dealSessionId =
        (session as { session?: { id?: string }; id?: string; sessionId?: string }).session?.id ??
        (session as { sessionId?: string }).sessionId ??
        (session as { id?: string }).id ??
        null;
    } catch (err) {
      // Honest unavailable capability if DealBridge cannot create a draft
      throw new ApiException(
        'dealbridge_unavailable',
        `DealBridge draft handoff failed: ${err instanceof Error ? err.message : 'unavailable'}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const link = await this.prisma.voiceDealDraftLink.create({
      data: {
        threadId,
        initiatorId: actor.userId,
        dealSessionId,
        selectedRevisionIds: input.selectedRevisionIds,
        selectedRevisionHashes: revisions.map((r) => r.contentHash),
        partyAUserId: input.partyAUserId,
        partyBUserId: input.partyBUserId,
        category: input.category ?? null,
        handoffKey,
      },
    });

    await this.audit({
      organizationId: actor.organizationId,
      threadId,
      actorId: actor.userId,
      operation: 'deal_draft.created',
      meta: { dealSessionId, selectedRevisionIds: input.selectedRevisionIds },
    });

    return {
      dealDraftLinkId: link.id,
      dealSessionId: link.dealSessionId,
      handoffKey: link.handoffKey,
      selectedRevisionIds: link.selectedRevisionIds,
      note: 'Handoff creates only a DealBridge draft — confirmations and receipts stay in DealBridge',
      dealbridgePath: dealSessionId ? `/dealbridge/sessions/${dealSessionId}` : null,
    };
  }
}
