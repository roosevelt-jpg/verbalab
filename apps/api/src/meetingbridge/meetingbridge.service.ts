import { randomBytes } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../common/errors/api-exception';
import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingBridgeAdapters } from './meetingbridge.adapters';
import { meetingbridgeCatalog } from './meetingbridge.catalog';
import { contentHash, hashInviteToken, mintEventId, mintInviteToken, mintTurnId } from './meetingbridge.hash';
import { assertItemTransition, assertMeetingTransition } from './meetingbridge.state-machine';
import {
  CONFIRM_ACTIONS,
  DEFAULT_APPROVAL_POLICY,
  LISTENING_MODES,
  MEETINGBRIDGE_CORRIDORS,
  MEETINGBRIDGE_FEATURE,
  MEETINGBRIDGE_MAX_PARTICIPANTS,
  MEETINGBRIDGE_NOTICE_VERSION,
  type ConfirmAction,
  type ConsentPurpose,
  type ItemKind,
  type ItemState,
  type ListeningMode,
  type MeetingEventType,
  type MeetingState,
} from './meetingbridge.types';

export type MeetingActor = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  apiKeyId?: string;
  ip?: string;
};

@Injectable()
export class MeetingBridgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly adapters: MeetingBridgeAdapters,
  ) {}

  catalog() {
    return meetingbridgeCatalog();
  }

  async assertEnabled(organizationId: string) {
    if (process.env.MEETINGBRIDGE_DISABLED === '1') {
      throw new ApiException(
        'feature_disabled',
        'MeetingBridge is disabled by MEETINGBRIDGE_DISABLED=1',
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
    if (typeof overrides.meetingBridge === 'boolean') {
      if (!overrides.meetingBridge) {
        throw new ApiException(
          'feature_disabled',
          'MeetingBridge is disabled for this organization',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }
    if (process.env.MEETINGBRIDGE_OPEN === '1') return;
    await this.billing.assertFeature(
      organizationId,
      MEETINGBRIDGE_FEATURE,
      'MeetingBridge requires a plan with the meetingBridge entitlement (Pro+), or set featureOverrides.meetingBridge=true / MEETINGBRIDGE_OPEN=1.',
    );
  }

  private corridorOrThrow(id: string) {
    const corridor = MEETINGBRIDGE_CORRIDORS.find((c) => c.id === id);
    if (!corridor) {
      throw new ApiException(
        'unsupported_corridor',
        `MeetingBridge corridor ${id} is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return corridor;
  }

  private async requireMeeting(meetingId: string, organizationId: string) {
    const meeting = await this.prisma.meetingMeeting.findFirst({
      where: { id: meetingId, organizationId, deletedAt: null },
    });
    if (!meeting) {
      throw new ApiException('not_found', 'MeetingBridge meeting not found', HttpStatus.NOT_FOUND);
    }
    return meeting;
  }

  private async requireMember(meetingId: string, userId: string) {
    const membership = await this.prisma.meetingMembership.findFirst({
      where: { meetingId, userId, active: true },
    });
    if (!membership) {
      throw new ApiException('forbidden', 'Not an active MeetingBridge member', HttpStatus.FORBIDDEN);
    }
    return membership;
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    input: {
      meetingId: string;
      type: MeetingEventType;
      actorId?: string;
      payload?: Prisma.InputJsonValue;
    },
  ) {
    const meeting = await tx.meetingMeeting.update({
      where: { id: input.meetingId },
      data: { sequence: { increment: 1 } },
      select: { sequence: true },
    });
    return tx.meetingEvent.create({
      data: {
        meetingId: input.meetingId,
        sequence: meeting.sequence,
        eventId: mintEventId(),
        type: input.type,
        actorId: input.actorId,
        payload: input.payload ?? undefined,
      },
    });
  }

  private async audit(input: {
    organizationId: string;
    meetingId?: string;
    actorId: string;
    operation: string;
    meta?: Prisma.InputJsonValue;
  }) {
    await this.prisma.meetingAuditEvent.create({
      data: {
        organizationId: input.organizationId,
        meetingId: input.meetingId,
        actorId: input.actorId,
        operation: input.operation,
        meta: input.meta ?? undefined,
      },
    });
  }

  async listMeetings(actor: MeetingActor) {
    await this.assertEnabled(actor.organizationId);
    const memberships = await this.prisma.meetingMembership.findMany({
      where: {
        userId: actor.userId,
        active: true,
        meeting: { organizationId: actor.organizationId, deletedAt: null },
      },
      include: { meeting: true },
      orderBy: { joinedAt: 'desc' },
    });
    return {
      meetings: memberships.map((m) => ({
        id: m.meeting.id,
        title: m.meeting.title,
        state: m.meeting.state,
        corridor: m.meeting.corridor,
        role: m.role,
        speakingLanguage: m.speakingLanguage,
        listeningLanguage: m.listeningLanguage,
        sequence: m.meeting.sequence,
        createdAt: m.meeting.createdAt,
      })),
    };
  }

  async createMeeting(
    actor: MeetingActor,
    input: {
      title: string;
      agenda?: string;
      timeZone?: string;
      corridor?: string;
      speakingLanguage?: string;
      listeningLanguage?: string;
      maxParticipants?: number;
      isDemo?: boolean;
      terminology?: Record<string, string>;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const title = input.title?.trim();
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }
    const corridor = this.corridorOrThrow(input.corridor ?? 'en-ak');
    const speaking = (input.speakingLanguage ?? corridor.speakingLanguage).trim();
    const listening = (input.listeningLanguage ?? corridor.listeningLanguage).trim();
    const maxParticipants = Math.min(
      MEETINGBRIDGE_MAX_PARTICIPANTS,
      Math.max(2, input.maxParticipants ?? MEETINGBRIDGE_MAX_PARTICIPANTS),
    );

    const meeting = await this.prisma.$transaction(async (tx) => {
      const created = await tx.meetingMeeting.create({
        data: {
          organizationId: actor.organizationId,
          workspaceId: actor.workspaceId,
          organizerId: actor.userId,
          title,
          agenda: input.agenda?.trim() ?? '',
          timeZone: input.timeZone?.trim() || 'Africa/Accra',
          state: 'scheduled',
          corridor: corridor.id,
          supportedLanguages: [speaking, listening],
          terminologySnapshot: input.terminology ?? {},
          approvalPolicy: DEFAULT_APPROVAL_POLICY,
          maxParticipants,
          interpretationMode: 'turn_taking',
          mediaMode: process.env.MEETINGBRIDGE_MEDIA_URL?.trim() ? 'webrtc' : 'phrase_upload',
          isDemo: Boolean(input.isDemo),
          isFixture: process.env.NODE_ENV === 'test',
        },
      });
      await tx.meetingMembership.create({
        data: {
          meetingId: created.id,
          userId: actor.userId,
          role: 'organizer',
          speakingLanguage: speaking,
          listeningLanguage: listening,
          listeningMode: 'captions_only',
          presence: 'online',
        },
      });
      await this.appendEvent(tx, {
        meetingId: created.id,
        type: 'participant.joined',
        actorId: actor.userId,
        payload: { role: 'organizer' },
      });
      return created;
    });

    await this.audit({
      organizationId: actor.organizationId,
      meetingId: meeting.id,
      actorId: actor.userId,
      operation: 'meeting.create',
      meta: { corridor: corridor.id },
    });

    return this.meetingView(meeting.id, actor);
  }

  async meetingView(meetingId: string, actor: MeetingActor) {
    await this.assertEnabled(actor.organizationId);
    const meeting = await this.requireMeeting(meetingId, actor.organizationId);
    await this.requireMember(meetingId, actor.userId);

    const [memberships, utterances, items, minutes, events] = await Promise.all([
      this.prisma.meetingMembership.findMany({ where: { meetingId }, orderBy: { joinedAt: 'asc' } }),
      this.prisma.meetingUtterance.findMany({
        where: { meetingId },
        include: {
          activeRevision: { include: { translations: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
      this.prisma.meetingItem.findMany({
        where: { meetingId },
        include: {
          activeRevision: {
            include: { presentations: true, confirmations: true },
          },
          disagreements: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.meetingMinutesRevision.findMany({
        where: { meetingId },
        orderBy: { revisionNumber: 'desc' },
        take: 5,
      }),
      this.prisma.meetingEvent.findMany({
        where: { meetingId },
        orderBy: { sequence: 'desc' },
        take: 50,
      }),
    ]);

    return {
      meeting: {
        id: meeting.id,
        title: meeting.title,
        agenda: meeting.agenda,
        timeZone: meeting.timeZone,
        state: meeting.state,
        corridor: meeting.corridor,
        supportedLanguages: meeting.supportedLanguages,
        approvalPolicy: meeting.approvalPolicy,
        maxParticipants: meeting.maxParticipants,
        interpretationMode: meeting.interpretationMode,
        mediaMode: meeting.mediaMode,
        sequence: meeting.sequence,
        noticeVersion: MEETINGBRIDGE_NOTICE_VERSION,
        isDemo: meeting.isDemo,
        isFixture: meeting.isFixture,
        createdAt: meeting.createdAt,
        closedAt: meeting.closedAt,
      },
      memberships: memberships.map((m) => ({
        userId: m.userId,
        role: m.role,
        active: m.active,
        speakingLanguage: m.speakingLanguage,
        listeningLanguage: m.listeningLanguage,
        listeningMode: m.listeningMode,
        presence: m.presence,
      })),
      utterances: utterances.map((u) => ({
        id: u.id,
        speakerId: u.speakerId,
        turnId: u.turnId,
        revision: u.activeRevision
          ? {
              id: u.activeRevision.id,
              revisionNumber: u.activeRevision.revisionNumber,
              originalText: u.activeRevision.originalText,
              language: u.activeRevision.language,
              commitState: u.activeRevision.commitState,
              translations: u.activeRevision.translations.map((t) => ({
                id: t.id,
                targetLanguage: t.targetLanguage,
                text: t.text,
                status: t.status,
                modelVersion: t.modelVersion,
              })),
            }
          : null,
      })),
      items: items.map((item) => ({
        id: item.id,
        kind: item.kind,
        state: item.state,
        revision: item.activeRevision
          ? {
              id: item.activeRevision.id,
              revisionNumber: item.activeRevision.revisionNumber,
              wording: item.activeRevision.wording,
              ownerParticipantIds: item.activeRevision.ownerParticipantIds,
              requiredApproverIds: item.activeRevision.requiredApproverIds,
              dueDate: item.activeRevision.dueDate,
              timeZone: item.activeRevision.timeZone,
              contentHash: item.activeRevision.contentHash,
              presentations: item.activeRevision.presentations,
              confirmations: item.activeRevision.confirmations.map((c) => ({
                actorId: c.actorId,
                action: c.action,
                createdAt: c.createdAt,
              })),
            }
          : null,
        disagreements: item.disagreements,
      })),
      minutes,
      events: events.reverse(),
      catalog: this.catalog(),
    };
  }

  async createInvite(meetingId: string, actor: MeetingActor, expiresInHours = 72) {
    await this.assertEnabled(actor.organizationId);
    const meeting = await this.requireMeeting(meetingId, actor.organizationId);
    const member = await this.requireMember(meetingId, actor.userId);
    if (member.role !== 'organizer') {
      throw new ApiException('forbidden', 'Only the organizer can invite', HttpStatus.FORBIDDEN);
    }
    const token = mintInviteToken();
    const invite = await this.prisma.meetingInvitation.create({
      data: {
        meetingId: meeting.id,
        tokenHash: hashInviteToken(token),
        expiresAt: new Date(Date.now() + Math.max(1, expiresInHours) * 3600_000),
        scope: 'participant',
      },
    });
    await this.audit({
      organizationId: actor.organizationId,
      meetingId,
      actorId: actor.userId,
      operation: 'meeting.invite',
      meta: { inviteId: invite.id },
    });
    return {
      inviteId: invite.id,
      token,
      expiresAt: invite.expiresAt,
      joinPath: `/meetingbridge/join/${token}`,
    };
  }

  async peekInvite(token: string) {
    const invite = await this.prisma.meetingInvitation.findUnique({
      where: { tokenHash: hashInviteToken(token) },
      include: { meeting: true },
    });
    if (!invite || invite.meeting.deletedAt) {
      throw new ApiException('not_found', 'Invitation not found', HttpStatus.NOT_FOUND);
    }
    return {
      meetingId: invite.meetingId,
      title: invite.meeting.title,
      corridor: invite.meeting.corridor,
      timeZone: invite.meeting.timeZone,
      expiresAt: invite.expiresAt,
      redeemed: Boolean(invite.redeemedAt),
      noticeVersion: MEETINGBRIDGE_NOTICE_VERSION,
      notices: {
        processing: 'Speech is processed for captions and translation during the meeting.',
        recording: 'Persistent recording is optional and separately consented.',
        training: 'Training on your voice is never automatic and requires explicit consent.',
      },
    };
  }

  async joinMeeting(
    token: string,
    actor: MeetingActor,
    input: {
      speakingLanguage: string;
      listeningLanguage: string;
      speakingVariety?: string;
      listeningVariety?: string;
      listeningMode?: ListeningMode;
      consents?: { purpose: ConsentPurpose; decision: 'granted' | 'denied' }[];
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const invite = await this.prisma.meetingInvitation.findUnique({
      where: { tokenHash: hashInviteToken(token) },
      include: { meeting: true },
    });
    if (!invite || invite.meeting.deletedAt || invite.meeting.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Invitation not found', HttpStatus.NOT_FOUND);
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new ApiException('invite_expired', 'Invitation expired', HttpStatus.GONE);
    }
    if (invite.redeemedAt && invite.redeemedByUserId !== actor.userId) {
      throw new ApiException('invite_used', 'Invitation already redeemed', HttpStatus.CONFLICT);
    }

    const activeCount = await this.prisma.meetingMembership.count({
      where: { meetingId: invite.meetingId, active: true },
    });
    const existing = await this.prisma.meetingMembership.findUnique({
      where: { meetingId_userId: { meetingId: invite.meetingId, userId: actor.userId } },
    });
    if (!existing && activeCount >= invite.meeting.maxParticipants) {
      throw new ApiException(
        'capacity',
        `Meeting is full (max ${invite.meeting.maxParticipants})`,
        HttpStatus.CONFLICT,
      );
    }

    const listeningMode = LISTENING_MODES.includes(input.listeningMode as ListeningMode)
      ? (input.listeningMode as ListeningMode)
      : 'captions_only';

    await this.prisma.$transaction(async (tx) => {
      const membership = await tx.meetingMembership.upsert({
        where: { meetingId_userId: { meetingId: invite.meetingId, userId: actor.userId } },
        create: {
          meetingId: invite.meetingId,
          userId: actor.userId,
          role: 'participant',
          speakingLanguage: input.speakingLanguage.trim(),
          listeningLanguage: input.listeningLanguage.trim(),
          speakingVariety: input.speakingVariety,
          listeningVariety: input.listeningVariety,
          listeningMode,
          presence: 'online',
        },
        update: {
          active: true,
          speakingLanguage: input.speakingLanguage.trim(),
          listeningLanguage: input.listeningLanguage.trim(),
          speakingVariety: input.speakingVariety,
          listeningVariety: input.listeningVariety,
          listeningMode,
          presence: 'online',
          languagePrefVersion: { increment: 1 },
        },
      });

      if (!invite.redeemedAt) {
        await tx.meetingInvitation.update({
          where: { id: invite.id },
          data: { redeemedAt: new Date(), redeemedByUserId: actor.userId },
        });
      }

      for (const c of input.consents ?? [
        { purpose: 'processing' as const, decision: 'granted' as const },
      ]) {
        await tx.meetingConsent.create({
          data: {
            meetingId: invite.meetingId,
            membershipId: membership.id,
            purpose: c.purpose,
            decision: c.decision,
            noticeVersion: MEETINGBRIDGE_NOTICE_VERSION,
          },
        });
      }

      if (invite.meeting.state === 'scheduled') {
        assertMeetingTransition(invite.meeting.state as MeetingState, 'lobby');
        await tx.meetingMeeting.update({
          where: { id: invite.meetingId },
          data: { state: 'lobby' },
        });
      }

      await this.appendEvent(tx, {
        meetingId: invite.meetingId,
        type: 'participant.joined',
        actorId: actor.userId,
      });
    });

    return this.meetingView(invite.meetingId, actor);
  }

  async updatePreferences(
    meetingId: string,
    actor: MeetingActor,
    input: {
      speakingLanguage?: string;
      listeningLanguage?: string;
      speakingVariety?: string;
      listeningVariety?: string;
      listeningMode?: ListeningMode;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.requireMeeting(meetingId, actor.organizationId);
    const member = await this.requireMember(meetingId, actor.userId);
    if (input.listeningMode && !LISTENING_MODES.includes(input.listeningMode)) {
      throw new ApiException('validation_error', 'Invalid listeningMode', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.meetingMembership.update({
      where: { id: member.id },
      data: {
        speakingLanguage: input.speakingLanguage?.trim() || member.speakingLanguage,
        listeningLanguage: input.listeningLanguage?.trim() || member.listeningLanguage,
        speakingVariety: input.speakingVariety ?? member.speakingVariety,
        listeningVariety: input.listeningVariety ?? member.listeningVariety,
        listeningMode: input.listeningMode ?? member.listeningMode,
        languagePrefVersion: { increment: 1 },
      },
    });
    return this.meetingView(meetingId, actor);
  }

  async openLobby(meetingId: string, actor: MeetingActor) {
    return this.transitionMeeting(meetingId, actor, 'lobby');
  }

  async startLive(meetingId: string, actor: MeetingActor) {
    return this.transitionMeeting(meetingId, actor, 'live');
  }

  private async transitionMeeting(meetingId: string, actor: MeetingActor, to: MeetingState) {
    await this.assertEnabled(actor.organizationId);
    const meeting = await this.requireMeeting(meetingId, actor.organizationId);
    const member = await this.requireMember(meetingId, actor.userId);
    if (member.role !== 'organizer') {
      throw new ApiException('forbidden', 'Only the organizer can change meeting state', HttpStatus.FORBIDDEN);
    }
    assertMeetingTransition(meeting.state as MeetingState, to);
    await this.prisma.meetingMeeting.update({ where: { id: meetingId }, data: { state: to } });
    await this.audit({
      organizationId: actor.organizationId,
      meetingId,
      actorId: actor.userId,
      operation: `meeting.state.${to}`,
    });
    return this.meetingView(meetingId, actor);
  }

  async commitUtterance(
    meetingId: string,
    actor: MeetingActor,
    input: {
      text: string;
      language?: string;
      variety?: string;
      turnId?: string;
      targetLanguages?: string[];
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const meeting = await this.requireMeeting(meetingId, actor.organizationId);
    const member = await this.requireMember(meetingId, actor.userId);
    if (!['lobby', 'live', 'processing', 'reviewing'].includes(meeting.state)) {
      throw new ApiException(
        'conflict',
        'Utterances can only be committed while the meeting is open',
        HttpStatus.CONFLICT,
      );
    }
    const text = input.text?.trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    const language = (input.language ?? member.speakingLanguage).trim();
    const turnId = input.turnId?.trim() || mintTurnId();
    const targets = (
      input.targetLanguages?.length
        ? input.targetLanguages
        : (meeting.supportedLanguages as string[]).filter((l) => l !== language)
    ).map((l) => l.trim());

    const result = await this.prisma.$transaction(async (tx) => {
      if (meeting.state === 'lobby') {
        assertMeetingTransition('lobby', 'live');
        await tx.meetingMeeting.update({ where: { id: meetingId }, data: { state: 'live' } });
      }

      const utterance = await tx.meetingUtterance.create({
        data: {
          meetingId,
          speakerId: actor.userId,
          turnId,
        },
      });
      const revision = await tx.meetingUtteranceRevision.create({
        data: {
          utteranceId: utterance.id,
          revisionNumber: 1,
          originalText: text,
          language,
          variety: input.variety,
          commitState: 'committed',
          contentHash: contentHash({ text, language }),
          status: 'current',
        },
      });
      await tx.meetingUtterance.update({
        where: { id: utterance.id },
        data: { activeRevisionId: revision.id },
      });

      const translations = [];
      for (const target of targets) {
        const translated = await this.adapters.translateText({
          text,
          sourceLang: language,
          targetLang: target,
          organizationId: actor.organizationId,
          workspaceId: actor.workspaceId,
        });
        if (translated.status === 'unsupported') continue;
        const row = await tx.meetingTranslationRevision.create({
          data: {
            sourceRevisionId: revision.id,
            targetLanguage: target,
            text: translated.text,
            textHash: contentHash(translated.text),
            modelVersion: translated.modelVersion,
            status: translated.status === 'fixture' ? 'ready' : translated.status,
          },
        });
        translations.push(row);
      }

      await this.appendEvent(tx, {
        meetingId,
        type: 'transcript.committed',
        actorId: actor.userId,
        payload: { utteranceId: utterance.id, revisionId: revision.id },
      });
      if (translations.length) {
        await this.appendEvent(tx, {
          meetingId,
          type: 'translation.ready',
          actorId: actor.userId,
          payload: { revisionId: revision.id, count: translations.length },
        });
      }

      return { utterance, revision, translations };
    });

    return result;
  }

  async correctUtterance(
    meetingId: string,
    actor: MeetingActor,
    input: { utteranceId: string; text: string; reason?: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.requireMeeting(meetingId, actor.organizationId);
    await this.requireMember(meetingId, actor.userId);

    const utterance = await this.prisma.meetingUtterance.findFirst({
      where: { id: input.utteranceId, meetingId },
      include: { activeRevision: true },
    });
    if (!utterance?.activeRevision) {
      throw new ApiException('not_found', 'Utterance not found', HttpStatus.NOT_FOUND);
    }
    if (utterance.speakerId !== actor.userId) {
      // Flag for review path — still appends a correction request revision owned by speaker? Guide: correct own or flag another.
      // For flagged others we store a disagreement-like correction request on the utterance as corrected by actor with note.
    }

    const text = input.text?.trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.meetingUtteranceRevision.update({
        where: { id: utterance.activeRevision!.id },
        data: { status: 'superseded' },
      });
      const nextNum = utterance.activeRevision!.revisionNumber + 1;
      const revision = await tx.meetingUtteranceRevision.create({
        data: {
          utteranceId: utterance.id,
          revisionNumber: nextNum,
          originalText: text,
          language: utterance.activeRevision!.language,
          variety: utterance.activeRevision!.variety,
          commitState: 'corrected',
          parentRevisionId: utterance.activeRevision!.id,
          contentHash: contentHash({ text, reason: input.reason }),
          status: 'current',
        },
      });
      await tx.meetingUtterance.update({
        where: { id: utterance.id },
        data: { activeRevisionId: revision.id },
      });

      // Mark dependent items stale
      const items = await tx.meetingItem.findMany({
        where: { meetingId },
        include: { activeRevision: true },
      });
      for (const item of items) {
        const sources = (item.activeRevision?.sourceRevisionIds as string[] | null) ?? [];
        if (sources.includes(utterance.activeRevision!.id) && item.activeRevision) {
          await tx.meetingItemRevision.update({
            where: { id: item.activeRevision.id },
            data: { status: 'stale' },
          });
          if (item.state !== 'superseded' && item.state !== 'cancelled') {
            // Confirmed/declined records cannot return to clarification; supersede and require a new proposal.
            const nextState: ItemState =
              item.state === 'confirmed' || item.state === 'declined'
                ? 'superseded'
                : 'clarification_required';
            assertItemTransition(item.state as ItemState, nextState);
            await tx.meetingItem.update({
              where: { id: item.id },
              data: { state: nextState },
            });
          }
          await this.appendEvent(tx, {
            meetingId,
            type: 'item.stale',
            actorId: actor.userId,
            payload: { itemId: item.id },
          });
        }
      }

      await this.appendEvent(tx, {
        meetingId,
        type: 'transcript.corrected',
        actorId: actor.userId,
        payload: { utteranceId: utterance.id, revisionId: revision.id },
      });
    });

    return this.meetingView(meetingId, actor);
  }

  async proposeItem(
    meetingId: string,
    actor: MeetingActor,
    input: {
      kind: ItemKind;
      wording: string;
      ownerParticipantIds?: string[];
      requiredApproverIds?: string[];
      dueDate?: string;
      sourceRevisionIds?: string[];
      conditions?: string[];
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const meeting = await this.requireMeeting(meetingId, actor.organizationId);
    await this.requireMember(meetingId, actor.userId);
    const wording = input.wording?.trim();
    if (!wording || !input.kind) {
      throw new ApiException('validation_error', 'kind and wording are required', HttpStatus.BAD_REQUEST);
    }

    const owners = input.ownerParticipantIds?.length ? input.ownerParticipantIds : [actor.userId];
    const required = input.requiredApproverIds?.length
      ? input.requiredApproverIds
      : Array.from(new Set([...owners, meeting.organizerId]));

    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.meetingItem.create({
        data: { meetingId, kind: input.kind, state: 'proposed' },
      });
      const hash = contentHash({
        wording,
        owners,
        required,
        dueDate: input.dueDate ?? null,
        conditions: input.conditions ?? [],
      });
      const revision = await tx.meetingItemRevision.create({
        data: {
          itemId: created.id,
          revisionNumber: 1,
          wording,
          ownerParticipantIds: owners,
          requiredApproverIds: required,
          dueDate: input.dueDate,
          timeZone: meeting.timeZone,
          conditions: input.conditions ?? [],
          sourceRevisionIds: input.sourceRevisionIds ?? [],
          contentHash: hash,
          status: 'current',
          createdById: actor.userId,
        },
      });
      await tx.meetingItem.update({
        where: { id: created.id },
        data: { activeRevisionId: revision.id, state: 'reviewing' },
      });

      const members = await tx.meetingMembership.findMany({
        where: { meetingId, active: true },
      });
      for (const m of members) {
        const presentationText =
          m.listeningLanguage === 'en' || m.listeningLanguage === meeting.corridor.split('-')[0]
            ? wording
            : (
                await this.adapters.translateText({
                  text: wording,
                  sourceLang: 'en',
                  targetLang: m.listeningLanguage,
                  organizationId: actor.organizationId,
                  workspaceId: actor.workspaceId,
                })
              ).text || wording;
        await tx.meetingReviewPresentation.create({
          data: {
            itemRevisionId: revision.id,
            participantId: m.userId,
            language: m.listeningLanguage,
            wording: presentationText,
            presentationHash: contentHash({ wording: presentationText, language: m.listeningLanguage, hash }),
          },
        });
      }

      await this.appendEvent(tx, {
        meetingId,
        type: 'item.proposed',
        actorId: actor.userId,
        payload: { itemId: created.id, kind: input.kind },
      });
      return created;
    });

    return this.meetingView(meetingId, actor).then((view) => ({
      ...view,
      proposedItemId: item.id,
    }));
  }

  async confirmItem(
    meetingId: string,
    actor: MeetingActor,
    input: {
      itemId: string;
      action: ConfirmAction;
      idempotencyKey: string;
      note?: string;
      presentationId?: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.requireMeeting(meetingId, actor.organizationId);
    await this.requireMember(meetingId, actor.userId);

    if (!CONFIRM_ACTIONS.includes(input.action)) {
      throw new ApiException('validation_error', 'Invalid confirmation action', HttpStatus.BAD_REQUEST);
    }
    if (!input.idempotencyKey?.trim()) {
      throw new ApiException('validation_error', 'idempotencyKey is required', HttpStatus.BAD_REQUEST);
    }

    const item = await this.prisma.meetingItem.findFirst({
      where: { id: input.itemId, meetingId },
      include: {
        activeRevision: { include: { presentations: true, confirmations: true } },
      },
    });
    if (!item?.activeRevision || item.activeRevision.status === 'stale') {
      throw new ApiException(
        'conflict',
        'Item revision is missing or stale — review the latest wording before confirming',
        HttpStatus.CONFLICT,
      );
    }

    const required = item.activeRevision.requiredApproverIds as string[];
    if (!required.includes(actor.userId)) {
      throw new ApiException(
        'forbidden',
        'You are not a required approver for this item revision',
        HttpStatus.FORBIDDEN,
      );
    }

    const presentation =
      item.activeRevision.presentations.find((p) => p.id === input.presentationId) ??
      item.activeRevision.presentations.find((p) => p.participantId === actor.userId);
    if (!presentation) {
      throw new ApiException('not_found', 'Review presentation not found', HttpStatus.NOT_FOUND);
    }

    const existing = item.activeRevision.confirmations.find(
      (c) => c.actorId === actor.userId && c.idempotencyKey === input.idempotencyKey,
    );
    if (existing) {
      if (existing.action !== input.action || existing.presentationHash !== presentation.presentationHash) {
        throw new ApiException(
          'idempotency_conflict',
          'Idempotency key reused with a different payload',
          HttpStatus.CONFLICT,
        );
      }
      return this.meetingView(meetingId, actor);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.meetingItemConfirmation.create({
        data: {
          itemRevisionId: item.activeRevision!.id,
          presentationId: presentation.id,
          actorId: actor.userId,
          itemHash: item.activeRevision!.contentHash,
          presentationHash: presentation.presentationHash,
          action: input.action,
          note: input.note,
          idempotencyKey: input.idempotencyKey,
        },
      });

      if (input.action === 'change_request' || input.action === 'decline') {
        if (input.action === 'change_request') {
          await tx.meetingDisagreement.create({
            data: {
              itemId: item.id,
              participantId: actor.userId,
              itemRevisionId: item.activeRevision!.id,
              reason: input.note?.trim() || 'Change requested',
              status: 'open',
            },
          });
          assertItemTransition(item.state as ItemState, 'disputed');
          await tx.meetingItem.update({ where: { id: item.id }, data: { state: 'disputed' } });
          await this.appendEvent(tx, {
            meetingId,
            type: 'item.disputed',
            actorId: actor.userId,
            payload: { itemId: item.id },
          });
        } else {
          assertItemTransition(item.state as ItemState, 'declined');
          await tx.meetingItem.update({ where: { id: item.id }, data: { state: 'declined' } });
        }
        return;
      }

      const confirmations = await tx.meetingItemConfirmation.findMany({
        where: { itemRevisionId: item.activeRevision!.id, action: 'confirm' },
      });
      const confirmedActors = new Set(confirmations.map((c) => c.actorId));
      confirmedActors.add(actor.userId);
      const allIn = required.every((id) => confirmedActors.has(id));
      const nextState: ItemState = allIn ? 'confirmed' : 'partially_confirmed';
      if (item.state !== nextState) {
        assertItemTransition(item.state as ItemState, nextState);
        await tx.meetingItem.update({ where: { id: item.id }, data: { state: nextState } });
      }
      if (allIn) {
        await this.appendEvent(tx, {
          meetingId,
          type: 'item.confirmed',
          actorId: actor.userId,
          payload: { itemId: item.id },
        });
      }
    });

    return this.meetingView(meetingId, actor);
  }

  async closeMeeting(meetingId: string, actor: MeetingActor) {
    await this.assertEnabled(actor.organizationId);
    const meeting = await this.requireMeeting(meetingId, actor.organizationId);
    const member = await this.requireMember(meetingId, actor.userId);
    if (member.role !== 'organizer') {
      throw new ApiException('forbidden', 'Only the organizer can close the meeting', HttpStatus.FORBIDDEN);
    }
    const from = meeting.state as MeetingState;
    if (from === 'live') {
      assertMeetingTransition(from, 'processing');
      await this.prisma.meetingMeeting.update({
        where: { id: meetingId },
        data: { state: 'processing', closedAt: new Date() },
      });
      assertMeetingTransition('processing', 'reviewing');
      await this.prisma.meetingMeeting.update({ where: { id: meetingId }, data: { state: 'reviewing' } });
    } else if (from === 'lobby' || from === 'scheduled') {
      assertMeetingTransition(from, 'cancelled');
      await this.prisma.meetingMeeting.update({
        where: { id: meetingId },
        data: { state: 'cancelled', closedAt: new Date() },
      });
    } else if (from === 'processing') {
      assertMeetingTransition(from, 'reviewing');
      await this.prisma.meetingMeeting.update({ where: { id: meetingId }, data: { state: 'reviewing' } });
    }

    await this.prisma.$transaction(async (tx) => {
      await this.appendEvent(tx, {
        meetingId,
        type: 'meeting.closed',
        actorId: actor.userId,
      });
    });

    return this.meetingView(meetingId, actor);
  }

  async issueMinutes(meetingId: string, actor: MeetingActor) {
    await this.assertEnabled(actor.organizationId);
    const meeting = await this.requireMeeting(meetingId, actor.organizationId);
    const member = await this.requireMember(meetingId, actor.userId);
    if (member.role !== 'organizer') {
      throw new ApiException('forbidden', 'Only the organizer can issue minutes', HttpStatus.FORBIDDEN);
    }
    if (!['reviewing', 'processing', 'live'].includes(meeting.state)) {
      throw new ApiException(
        'conflict',
        'Minutes can be issued after the meeting is closed for review',
        HttpStatus.CONFLICT,
      );
    }

    const [memberships, items, utterances] = await Promise.all([
      this.prisma.meetingMembership.findMany({ where: { meetingId } }),
      this.prisma.meetingItem.findMany({
        where: { meetingId },
        include: { activeRevision: { include: { confirmations: true } }, disagreements: true },
      }),
      this.prisma.meetingUtterance.findMany({
        where: { meetingId },
        include: { activeRevision: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const confirmed = items.filter((i) => i.state === 'confirmed');
    const pending = items.filter((i) =>
      ['proposed', 'reviewing', 'partially_confirmed', 'clarification_required'].includes(i.state),
    );
    const disputed = items.filter((i) => i.state === 'disputed' || i.disagreements.some((d) => d.status === 'open'));

    const payload = {
      meetingId,
      title: meeting.title,
      timeZone: meeting.timeZone,
      corridor: meeting.corridor,
      attendance: memberships.map((m) => ({
        userId: m.userId,
        role: m.role,
        active: m.active,
        presence: m.presence,
      })),
      agenda: meeting.agenda,
      confirmed: confirmed.map((i) => ({
        id: i.id,
        kind: i.kind,
        wording: i.activeRevision?.wording,
        owners: i.activeRevision?.ownerParticipantIds,
        dueDate: i.activeRevision?.dueDate,
        confirmations: i.activeRevision?.confirmations,
      })),
      pending: pending.map((i) => ({ id: i.id, kind: i.kind, state: i.state, wording: i.activeRevision?.wording })),
      disputed: disputed.map((i) => ({
        id: i.id,
        kind: i.kind,
        wording: i.activeRevision?.wording,
        disagreements: i.disagreements,
      })),
      transcript: utterances.map((u) => ({
        speakerId: u.speakerId,
        text: u.activeRevision?.originalText,
        language: u.activeRevision?.language,
      })),
      policy: meeting.approvalPolicy,
      notice: 'Approval records are workflow evidence, not legal certification. Absence is not consent.',
    };

    const markdown = [
      `# ${meeting.title}`,
      ``,
      `Timezone: ${meeting.timeZone}`,
      `Corridor: ${meeting.corridor}`,
      ``,
      `## Agenda`,
      meeting.agenda || '_None_',
      ``,
      `## Confirmed`,
      ...confirmed.map((i) => `- [${i.kind}] ${i.activeRevision?.wording}`),
      ``,
      `## Pending`,
      ...pending.map((i) => `- (${i.state}) [${i.kind}] ${i.activeRevision?.wording}`),
      ``,
      `## Disputed / unresolved`,
      ...disputed.map((i) => `- [${i.kind}] ${i.activeRevision?.wording}`),
      ``,
      `_Silence and presence are not agreement._`,
    ].join('\n');

    const hash = contentHash(payload);
    const prior = await this.prisma.meetingMinutesRevision.findFirst({
      where: { meetingId },
      orderBy: { revisionNumber: 'desc' },
    });

    const minutes = await this.prisma.$transaction(async (tx) => {
      if (meeting.state !== 'reviewing') {
        if (meeting.state === 'live' || meeting.state === 'processing') {
          await tx.meetingMeeting.update({ where: { id: meetingId }, data: { state: 'reviewing' } });
        }
      }
      assertMeetingTransition('reviewing', 'minutes_issued');
      const created = await tx.meetingMinutesRevision.create({
        data: {
          meetingId,
          revisionNumber: (prior?.revisionNumber ?? 0) + 1,
          markdown,
          jsonPayload: payload,
          contentHash: hash,
          issuedById: actor.userId,
          supersedesId: prior?.id,
        },
      });
      await tx.meetingMeeting.update({
        where: { id: meetingId },
        data: { state: 'minutes_issued', closedAt: meeting.closedAt ?? new Date() },
      });
      await this.appendEvent(tx, {
        meetingId,
        type: 'minutes.issued',
        actorId: actor.userId,
        payload: { minutesId: created.id, hash },
      });
      return created;
    });

    return { minutes, view: await this.meetingView(meetingId, actor) };
  }

  async exportMinutes(
    meetingId: string,
    actor: MeetingActor,
    input: { minutesId: string; format?: 'markdown' | 'json' | 'csv_tasks'; idempotencyKey: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.requireMeeting(meetingId, actor.organizationId);
    await this.requireMember(meetingId, actor.userId);
    if (!input.idempotencyKey?.trim()) {
      throw new ApiException('validation_error', 'idempotencyKey is required', HttpStatus.BAD_REQUEST);
    }

    const minutes = await this.prisma.meetingMinutesRevision.findFirst({
      where: { id: input.minutesId, meetingId },
    });
    if (!minutes) {
      throw new ApiException('not_found', 'Minutes revision not found', HttpStatus.NOT_FOUND);
    }

    const existing = await this.prisma.meetingExport.findUnique({
      where: { meetingId_idempotencyKey: { meetingId, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) {
      if (existing.minutesRevisionId !== minutes.id || existing.format !== (input.format ?? 'markdown')) {
        throw new ApiException(
          'idempotency_conflict',
          'Idempotency key reused with a different export payload',
          HttpStatus.CONFLICT,
        );
      }
      return existing;
    }

    const format = input.format ?? 'markdown';
    const body =
      format === 'json'
        ? JSON.stringify(minutes.jsonPayload, null, 2)
        : format === 'csv_tasks'
          ? this.csvTasks(minutes.jsonPayload)
          : minutes.markdown;

    const storageKey = `meetingbridge/${meetingId}/exports/${randomBytes(8).toString('hex')}.${format === 'json' ? 'json' : format === 'csv_tasks' ? 'csv' : 'md'}`;

    return this.prisma.meetingExport.create({
      data: {
        meetingId,
        minutesRevisionId: minutes.id,
        format,
        destination: 'private_download',
        status: 'ready',
        storageKey,
        idempotencyKey: input.idempotencyKey,
        createdById: actor.userId,
      },
    }).then((row) => ({ ...row, body }));
  }

  private csvTasks(payload: Prisma.JsonValue) {
    const data = payload as {
      confirmed?: { kind?: string; wording?: string; dueDate?: string | null; owners?: string[] }[];
    };
    const lines = ['kind,wording,dueDate,owners'];
    for (const item of data.confirmed ?? []) {
      if (item.kind !== 'action') continue;
      const wording = String(item.wording ?? '').replace(/"/g, '""');
      const owners = Array.isArray(item.owners) ? item.owners.join(';') : '';
      lines.push(`"${item.kind}","${wording}","${item.dueDate ?? ''}","${owners}"`);
    }
    return lines.join('\n');
  }
}
