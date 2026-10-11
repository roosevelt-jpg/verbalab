import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../common/errors/api-exception';
import { BillingService } from '../billing/billing.service';
import { LocalStorageService } from '../documents/local-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { LearnBackAdapters } from './learnback.adapters';
import { learnbackCatalog } from './learnback.catalog';
import {
  buildImprovedExample,
  detectPromptInjection,
  evaluateAnswer,
  SYSTEM_SCENARIO_SEEDS,
  type RubricFinding,
} from './learnback.checks';
import { hashBuffer, hashText, mintEventId } from './learnback.hash';
import {
  LEARNBACK_CORRIDORS,
  LEARNBACK_FEATURE,
  LEARNBACK_POLICY_VERSION,
  LEARNBACK_RUBRIC_INTERVIEW_V1,
  learnbackMaxAudioBytes,
  SITUATIONS,
  type Situation,
} from './learnback.types';

export type LearnBackActor = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  apiKeyId?: string;
  ip?: string;
};

@Injectable()
export class LearnBackService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly adapters: LearnBackAdapters,
    private readonly storage: LocalStorageService,
  ) {}

  async onModuleInit() {
    await this.ensureSystemScenarios();
  }

  catalog() {
    return learnbackCatalog();
  }

  async assertEnabled(organizationId: string) {
    if (process.env.LEARNBACK_DISABLED === '1') {
      throw new ApiException(
        'feature_disabled',
        'LearnBack is disabled by LEARNBACK_DISABLED=1',
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
    if (typeof overrides.learnBack === 'boolean') {
      if (!overrides.learnBack) {
        throw new ApiException(
          'feature_disabled',
          'LearnBack is disabled for this organization',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }
    if (process.env.LEARNBACK_OPEN === '1') return;
    await this.billing.assertFeature(
      organizationId,
      LEARNBACK_FEATURE,
      'LearnBack requires a plan with the learnBack entitlement (Pro+), or set featureOverrides.learnBack=true / LEARNBACK_OPEN=1.',
    );
  }

  private corridorOrThrow(id: string) {
    const corridor = LEARNBACK_CORRIDORS.find((c) => c.id === id);
    if (!corridor) {
      throw new ApiException(
        'unsupported_corridor',
        `LearnBack corridor ${id} is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return corridor;
  }

  private async ensureSystemScenarios() {
    for (const seed of SYSTEM_SCENARIO_SEEDS) {
      const existing = await this.prisma.learnBackScenarioPack.findUnique({
        where: {
          packKey_revision_corridorId: {
            packKey: seed.packKey,
            revision: seed.revision,
            corridorId: seed.corridorId,
          },
        },
      });
      if (!existing) {
        await this.prisma.learnBackScenarioPack.create({
          data: {
            packKey: seed.packKey,
            revision: seed.revision,
            situation: seed.situation,
            corridorId: seed.corridorId,
            levelLabel: seed.levelLabel,
            questionText: seed.questionText,
            questionExplanation: seed.questionExplanation,
            intent: seed.intent,
            targetSkills: seed.targetSkills,
            followUpPrompts: seed.followUpPrompts,
            exampleAnswers: seed.exampleAnswers,
            phraseExamples: seed.phraseExamples,
            rubricVersion: seed.rubricVersion,
            reviewerNote: seed.reviewerNote,
            isSystem: true,
          },
        });
      }
    }
  }

  private async appendEvent(sessionId: string, type: string, payload?: Record<string, unknown>) {
    const last = await this.prisma.learnBackEvent.findFirst({
      where: { sessionId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    return this.prisma.learnBackEvent.create({
      data: {
        sessionId,
        sequence: (last?.sequence ?? 0) + 1,
        eventId: mintEventId(),
        type,
        payload: (payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async audit(
    actor: LearnBackActor,
    operation: string,
    sessionId: string | null,
    meta?: Record<string, unknown>,
  ) {
    await this.prisma.learnBackAuditEvent.create({
      data: {
        organizationId: actor.organizationId,
        sessionId,
        actorId: actor.userId,
        operation,
        meta: (meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async ensureProfile(actor: LearnBackActor) {
    return this.prisma.learnBackLearnerProfile.upsert({
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
      },
      update: { workspaceId: actor.workspaceId },
    });
  }

  private async loadSession(actor: LearnBackActor, sessionId: string) {
    const session = await this.prisma.learnBackPracticeSession.findFirst({
      where: {
        id: sessionId,
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        ownerUserId: actor.userId,
        deletedAt: null,
      },
      include: { scenarioPack: true },
    });
    if (!session) {
      throw new ApiException('not_found', 'LearnBack session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }

  async getProfile(actor: LearnBackActor) {
    await this.assertEnabled(actor.organizationId);
    const profile = await this.ensureProfile(actor);
    return { profile };
  }

  async updateProfile(
    actor: LearnBackActor,
    input: {
      explanationLanguage?: string;
      practiceLanguage?: string;
      optionalAccentTarget?: string | null;
      goal?: string | null;
      trainingConsent?: boolean;
      retentionDays?: number;
      accessibilityPrefs?: Record<string, unknown>;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureProfile(actor);
    const profile = await this.prisma.learnBackLearnerProfile.update({
      where: {
        organizationId_ownerUserId: {
          organizationId: actor.organizationId,
          ownerUserId: actor.userId,
        },
      },
      data: {
        explanationLanguage: input.explanationLanguage,
        practiceLanguage: input.practiceLanguage,
        optionalAccentTarget:
          input.optionalAccentTarget === undefined ? undefined : input.optionalAccentTarget,
        goal: input.goal === undefined ? undefined : input.goal,
        trainingConsent: input.trainingConsent,
        retentionDays:
          input.retentionDays == null
            ? undefined
            : Math.min(365, Math.max(1, input.retentionDays)),
        accessibilityPrefs:
          input.accessibilityPrefs === undefined
            ? undefined
            : (input.accessibilityPrefs as Prisma.InputJsonValue),
      },
    });
    await this.audit(actor, 'profile.update', null, {});
    return { profile };
  }

  async listScenarios(actor: LearnBackActor, filters?: { situation?: string; corridorId?: string }) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureSystemScenarios();
    const scenarios = await this.prisma.learnBackScenarioPack.findMany({
      where: {
        isSystem: true,
        ...(filters?.situation ? { situation: filters.situation } : {}),
        ...(filters?.corridorId ? { corridorId: filters.corridorId } : {}),
      },
      orderBy: [{ situation: 'asc' }, { packKey: 'asc' }],
    });
    return { scenarios, corridors: LEARNBACK_CORRIDORS };
  }

  async listSessions(actor: LearnBackActor) {
    await this.assertEnabled(actor.organizationId);
    const sessions = await this.prisma.learnBackPracticeSession.findMany({
      where: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        ownerUserId: actor.userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        scenarioPack: {
          select: { id: true, packKey: true, questionText: true, situation: true },
        },
      },
    });
    return { sessions };
  }

  async createSession(
    actor: LearnBackActor,
    input: {
      corridorId?: string;
      situation?: string;
      scenarioPackId?: string;
      fictionalMode?: boolean;
      trainingConsent?: boolean;
      idempotencyKey?: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureProfile(actor);
    await this.ensureSystemScenarios();

    const corridor = this.corridorOrThrow(input.corridorId ?? 'ak-en-interview');
    const situation = (input.situation ?? 'job_interview') as Situation;
    if (!SITUATIONS.includes(situation)) {
      throw new ApiException(
        'validation_error',
        `Unsupported situation ${situation}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!corridor.situations.includes(situation)) {
      throw new ApiException(
        'unsupported_situation',
        `Corridor ${corridor.id} does not include situation ${situation}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let pack = input.scenarioPackId
      ? await this.prisma.learnBackScenarioPack.findFirst({
          where: { id: input.scenarioPackId, corridorId: corridor.id },
        })
      : await this.prisma.learnBackScenarioPack.findFirst({
          where: { corridorId: corridor.id, situation, isSystem: true },
          orderBy: { createdAt: 'asc' },
        });
    if (!pack) {
      throw new ApiException(
        'scenario_unavailable',
        'No reviewed scenario pack for this corridor/situation',
        HttpStatus.NOT_FOUND,
      );
    }

    const session = await this.prisma.learnBackPracticeSession.create({
      data: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        ownerUserId: actor.userId,
        scenarioPackId: pack.id,
        corridorId: corridor.id,
        explanationLanguage: corridor.explanationLanguage,
        practiceLanguage: corridor.practiceLanguage,
        situation,
        fictionalMode: Boolean(input.fictionalMode),
        trainingConsent: Boolean(input.trainingConsent),
        policyVersion: LEARNBACK_POLICY_VERSION,
        state: 'ready',
      },
      include: { scenarioPack: true },
    });
    await this.appendEvent(session.id, 'session.ready', {
      scenarioPackId: pack.id,
      fictionalMode: session.fictionalMode,
    });
    await this.audit(actor, 'session.create', session.id, {
      corridorId: corridor.id,
      situation,
    });
    return { session };
  }

  async getSession(actor: LearnBackActor, sessionId: string) {
    await this.assertEnabled(actor.organizationId);
    const session = await this.loadSession(actor, sessionId);
    const attempts = await this.prisma.learnBackAttempt.findMany({
      where: { sessionId },
      orderBy: { attemptNumber: 'asc' },
      include: {
        transcripts: { where: { isActive: true }, take: 1 },
        evaluations: { where: { stale: false }, orderBy: { createdAt: 'desc' }, take: 1 },
        feedback: { where: { stale: false }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    const events = await this.prisma.learnBackEvent.findMany({
      where: { sessionId },
      orderBy: { sequence: 'asc' },
      take: 100,
    });
    return { session, attempts, events };
  }

  async createAttempt(
    actor: LearnBackActor,
    sessionId: string,
    input: {
      contentBase64?: string;
      mimeType?: string;
      textAnswer?: string;
      idempotencyKey: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const session = await this.loadSession(actor, sessionId);
    if (!input.idempotencyKey?.trim()) {
      throw new ApiException(
        'validation_error',
        'idempotencyKey is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.prisma.learnBackAttempt.findUnique({
      where: {
        sessionId_idempotencyKey: {
          sessionId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: {
        transcripts: { where: { isActive: true }, take: 1 },
        evaluations: { where: { stale: false }, take: 1 },
        feedback: { where: { stale: false }, take: 1 },
      },
    });
    if (existing) return { attempt: existing, reused: true };

    let audioBuffer: Buffer | null = null;
    let audioHash: string | null = null;
    let storageKey: string | null = null;
    let mimeType = input.mimeType ?? 'audio/wav';

    if (input.contentBase64?.trim()) {
      audioBuffer = Buffer.from(input.contentBase64, 'base64');
      if (!audioBuffer.length) {
        throw new ApiException('validation_error', 'Empty audio', HttpStatus.BAD_REQUEST);
      }
      if (audioBuffer.length > learnbackMaxAudioBytes()) {
        throw new ApiException(
          'validation_error',
          `Audio exceeds ${learnbackMaxAudioBytes()} bytes`,
          HttpStatus.BAD_REQUEST,
        );
      }
      audioHash = hashBuffer(audioBuffer);
      storageKey = `${actor.organizationId}/learnback/${sessionId}/${audioHash.slice(0, 16)}.bin`;
      await this.storage.writeBuffer(storageKey, audioBuffer);
    } else if (!input.textAnswer?.trim()) {
      throw new ApiException(
        'validation_error',
        'Provide contentBase64 audio or textAnswer (accessible fallback)',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (detectPromptInjection(input.textAnswer ?? '')) {
      // Continue as ordinary text — never elevate permissions
    }

    const last = await this.prisma.learnBackAttempt.findFirst({
      where: { sessionId },
      orderBy: { attemptNumber: 'desc' },
    });
    const attemptNumber = (last?.attemptNumber ?? 0) + 1;

    await this.prisma.learnBackPracticeSession.update({
      where: { id: sessionId },
      data: { state: 'processing' },
    });

    const attempt = await this.prisma.learnBackAttempt.create({
      data: {
        sessionId,
        attemptNumber,
        audioStorageKey: storageKey,
        audioHash,
        audioMimeType: audioBuffer ? mimeType : null,
        promptRevision: session.scenarioPack.revision,
        state: 'transcribing',
        idempotencyKey: input.idempotencyKey,
        createdById: actor.userId,
      },
    });

    let asrText = input.textAnswer?.trim() ?? '';
    let asrModel = 'text-fallback';
    let uncertainty: 'low' | 'medium' | 'high' = 'low';

    if (audioBuffer) {
      const asr = await this.adapters.recognize({
        buffer: audioBuffer,
        mimeType,
        language: session.practiceLanguage,
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        apiKeyId: actor.apiKeyId,
        userId: actor.userId,
        ip: actor.ip,
      });
      if (asr.status === 'unsupported' && !asrText) {
        await this.prisma.learnBackAttempt.update({
          where: { id: attempt.id },
          data: { state: 'failed' },
        });
        throw new ApiException(
          'asr_unavailable',
          'Speech recognition unavailable. Retry or use text input.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      asrText = asr.text || asrText;
      asrModel = asr.provider;
      uncertainty = asr.uncertainty;
    }

    const transcript = await this.prisma.learnBackTranscriptRevision.create({
      data: {
        attemptId: attempt.id,
        asrText,
        editedText: asrText,
        contentHash: hashText(asrText),
        asrModel,
        uncertainty,
        origin: audioBuffer ? 'asr' : 'learner_correction',
        isActive: true,
        createdById: actor.userId,
      },
    });

    await this.prisma.learnBackAttempt.update({
      where: { id: attempt.id },
      data: { state: 'evaluating' },
    });

    const evaluationBundle = await this.runEvaluation(actor, session, attempt.id, transcript.id, {
      text: asrText,
      uncertainty,
      audioBuffer,
      mimeType,
      audioHash,
    });

    await this.appendEvent(sessionId, 'attempt.feedback_available', {
      attemptId: attempt.id,
      evaluationId: evaluationBundle.evaluation.id,
    });
    await this.audit(actor, 'attempt.create', sessionId, { attemptId: attempt.id });

    return {
      attempt: await this.prisma.learnBackAttempt.findUniqueOrThrow({
        where: { id: attempt.id },
        include: {
          transcripts: { where: { isActive: true }, take: 1 },
          evaluations: { where: { stale: false }, take: 1 },
          feedback: { where: { stale: false }, take: 1 },
        },
      }),
      reused: false,
    };
  }

  private async runEvaluation(
    actor: LearnBackActor,
    session: Awaited<ReturnType<LearnBackService['loadSession']>>,
    attemptId: string,
    transcriptRevisionId: string,
    input: {
      text: string;
      uncertainty: 'low' | 'medium' | 'high';
      audioBuffer: Buffer | null;
      mimeType: string;
      audioHash: string | null;
    },
  ) {
    const pack = session.scenarioPack;
    const evaluated = evaluateAnswer({
      questionText: pack.questionText,
      transcript: input.text,
      intent: pack.intent,
      uncertainAsr: input.uncertainty === 'high',
    });

    const pron = await this.adapters.assessPronunciation({
      reference: pack.questionText,
      hypothesis: input.text,
      language: session.practiceLanguage,
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
      audioBuffer: input.audioBuffer ?? undefined,
      mimeType: input.mimeType,
      apiKeyId: actor.apiKeyId,
      userId: actor.userId,
      ip: actor.ip,
    });

    const unassessed = Array.from(
      new Set([
        ...evaluated.unassessedDimensions,
        ...(pron.status === 'not_assessed' ? ['pronunciation'] : []),
      ]),
    );

    const evaluation = await this.prisma.learnBackEvaluation.create({
      data: {
        attemptId,
        transcriptRevisionId,
        transcriptHash: hashText(input.text),
        audioHash: input.audioHash,
        rubricVersion: pack.rubricVersion || LEARNBACK_RUBRIC_INTERVIEW_V1,
        modelVersion: 'learnback-rubric-descriptive-v1',
        status: evaluated.status,
        findings: evaluated.findings as unknown as Prisma.InputJsonValue,
        unassessedDimensions: unassessed as unknown as Prisma.InputJsonValue,
        pronunciationStatus: pron.status,
        pronunciationReason: pron.reason,
        pronunciationFindings: pron.findings as unknown as Prisma.InputJsonValue,
      },
    });

    const improved = buildImprovedExample({
      transcript: input.text,
      exampleAnswers: pack.exampleAnswers as string[],
      findings: evaluated.findings,
    });

    const explanationSource = this.renderExplanationEnglish({
      findings: evaluated.findings,
      abstainReason: evaluated.abstainReason,
      status: evaluated.status,
      pronunciation: pron,
    });

    const localized = await this.adapters.localize({
      text: explanationSource,
      sourceLanguage: 'en',
      targetLanguage: session.explanationLanguage,
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
    });

    const feedbackText =
      localized.status === 'unsupported' ? explanationSource : localized.text || explanationSource;

    const feedback = await this.prisma.learnBackFeedbackRevision.create({
      data: {
        attemptId,
        evaluationId: evaluation.id,
        explanationLanguage: session.explanationLanguage,
        localizedExplanation: feedbackText,
        improvedExample: improved.example,
        exampleLabel: improved.label,
        placeholders: improved.placeholders as unknown as Prisma.InputJsonValue,
        contentHash: hashText(feedbackText + improved.example),
        modelVersion: localized.modelVersion,
      },
    });

    // Progress observations from comparable evidence (assisted)
    const profile = await this.ensureProfile(actor);
    for (const finding of evaluated.findings.slice(0, 2)) {
      await this.prisma.learnBackProgressObservation.create({
        data: {
          organizationId: actor.organizationId,
          ownerUserId: actor.userId,
          profileId: profile.id,
          skill: finding.dimension,
          rubricVersion: pack.rubricVersion,
          evidence: finding.evidence,
          attemptId,
          assisted: true,
          note: finding.note,
        },
      });
    }

    await this.prisma.learnBackAttempt.update({
      where: { id: attemptId },
      data: { state: 'feedback_available' },
    });
    await this.prisma.learnBackPracticeSession.update({
      where: { id: session.id },
      data: { state: 'feedback_available' },
    });

    return { evaluation, feedback };
  }

  private renderExplanationEnglish(input: {
    findings: RubricFinding[];
    abstainReason?: string;
    status: string;
    pronunciation: { status: string; reason?: string };
  }): string {
    if (input.status === 'abstain') {
      return (
        input.abstainReason ??
        'Feedback is paused until the transcript is clearer. Correct recognition errors first — they are not your mistakes.'
      );
    }
    if (!input.findings.length) {
      return [
        'Your answer covered the question with useful detail.',
        'Optional next step: practise once more with a slightly different example from your own experience.',
        input.pronunciation.status === 'not_assessed'
          ? `Pronunciation: not assessed. ${input.pronunciation.reason ?? ''}`
          : 'Pronunciation tips are listed separately when available.',
      ].join(' ');
    }
    const parts = input.findings.map(
      (f, i) =>
        `${i + 1}. ${f.note ?? f.suggestionIntent} (from your words: “${f.evidence.slice(0, 80)}”)`,
    );
    parts.push(
      input.pronunciation.status === 'not_assessed'
        ? `Pronunciation: not assessed. ${input.pronunciation.reason ?? ''}`
        : 'Pronunciation tips are listed separately when available.',
    );
    parts.push('This is practice feedback, not a hiring judgment or proficiency certificate.');
    return parts.join(' ');
  }

  async correctTranscript(
    actor: LearnBackActor,
    attemptId: string,
    input: { editedText: string; expectedTranscriptRevisionId?: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    if (!input.editedText?.trim()) {
      throw new ApiException('validation_error', 'editedText is required', HttpStatus.BAD_REQUEST);
    }
    const attempt = await this.prisma.learnBackAttempt.findFirst({
      where: { id: attemptId },
      include: {
        session: { include: { scenarioPack: true } },
        transcripts: { where: { isActive: true }, take: 1 },
      },
    });
    if (
      !attempt ||
      attempt.session.deletedAt ||
      attempt.session.organizationId !== actor.organizationId ||
      attempt.session.ownerUserId !== actor.userId
    ) {
      throw new ApiException('not_found', 'Attempt not found', HttpStatus.NOT_FOUND);
    }
    const active = attempt.transcripts[0];
    if (
      input.expectedTranscriptRevisionId &&
      active &&
      active.id !== input.expectedTranscriptRevisionId
    ) {
      throw new ApiException(
        'revision_conflict',
        'expectedTranscriptRevisionId does not match the active transcript',
        HttpStatus.CONFLICT,
      );
    }

    const next = await this.prisma.$transaction(async (tx) => {
      if (active) {
        await tx.learnBackTranscriptRevision.update({
          where: { id: active.id },
          data: { isActive: false },
        });
        await tx.learnBackEvaluation.updateMany({
          where: { attemptId },
          data: { stale: true },
        });
        await tx.learnBackFeedbackRevision.updateMany({
          where: { attemptId },
          data: { stale: true },
        });
      }
      return tx.learnBackTranscriptRevision.create({
        data: {
          attemptId,
          parentId: active?.id,
          asrText: active?.asrText ?? input.editedText,
          editedText: input.editedText.trim(),
          contentHash: hashText(input.editedText.trim()),
          asrModel: active?.asrModel ?? 'learner_correction',
          uncertainty: 'low',
          origin: 'learner_correction',
          isActive: true,
          createdById: actor.userId,
        },
      });
    });

    // Re-evaluate text only — do not claim acoustic pronunciation changed
    let audioBuffer: Buffer | null = null;
    if (attempt.audioStorageKey) {
      try {
        audioBuffer = await this.storage.readBuffer(attempt.audioStorageKey);
      } catch {
        audioBuffer = null;
      }
    }

    const session = await this.loadSession(actor, attempt.sessionId);
    await this.runEvaluation(actor, session, attemptId, next.id, {
      text: next.editedText,
      uncertainty: 'low',
      audioBuffer,
      mimeType: attempt.audioMimeType ?? 'audio/wav',
      audioHash: attempt.audioHash,
    });

    await this.appendEvent(attempt.sessionId, 'transcript.corrected', {
      attemptId,
      transcriptRevisionId: next.id,
      note: 'Text feedback refreshed; acoustic pronunciation not reclaimed as improved.',
    });
    await this.audit(actor, 'transcript.correct', attempt.sessionId, {
      attemptId,
      transcriptRevisionId: next.id,
    });

    return this.getAttemptFeedback(actor, attemptId);
  }

  async getAttemptFeedback(actor: LearnBackActor, attemptId: string) {
    await this.assertEnabled(actor.organizationId);
    const attempt = await this.prisma.learnBackAttempt.findFirst({
      where: { id: attemptId },
      include: {
        session: true,
        transcripts: { where: { isActive: true }, take: 1 },
        evaluations: { where: { stale: false }, orderBy: { createdAt: 'desc' }, take: 1 },
        feedback: { where: { stale: false }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (
      !attempt ||
      attempt.session.deletedAt ||
      attempt.session.organizationId !== actor.organizationId ||
      attempt.session.ownerUserId !== actor.userId
    ) {
      throw new ApiException('not_found', 'Attempt not found', HttpStatus.NOT_FOUND);
    }
    return {
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        state: attempt.state,
        audioHash: attempt.audioHash,
      },
      transcript: attempt.transcripts[0] ?? null,
      evaluation: attempt.evaluations[0] ?? null,
      feedback: attempt.feedback[0] ?? null,
    };
  }

  async synthesizeAudio(
    actor: LearnBackActor,
    input: { kind: 'question' | 'explanation' | 'example' | 'phrase'; text: string; language: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    if (!input.text?.trim()) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    const tts = await this.adapters.synthesize({
      text: input.text,
      language: input.language,
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
      apiKeyId: actor.apiKeyId,
      userId: actor.userId,
      ip: actor.ip,
    });
    let storageKey: string | null = null;
    let audioHash: string | null = null;
    if (tts.audio?.length) {
      audioHash = hashBuffer(tts.audio);
      storageKey = `${actor.organizationId}/learnback/tts/${audioHash.slice(0, 16)}.wav`;
      await this.storage.writeBuffer(storageKey, tts.audio);
    }
    const row = await this.prisma.learnBackAudioArtifact.create({
      data: {
        ownerUserId: actor.userId,
        organizationId: actor.organizationId,
        kind: input.kind,
        textHash: hashText(input.text),
        exactText: input.text,
        storageKey,
        audioHash,
        mimeType: tts.mimeType,
        voiceId: tts.voice,
        status: tts.status,
        modelVersion: tts.modelVersion,
      },
    });
    return {
      audio: {
        id: row.id,
        kind: row.kind,
        status: row.status,
        voiceId: row.voiceId,
        hasBytes: Boolean(tts.audio?.length),
        note: tts.note,
      },
    };
  }

  async getAudioBytes(actor: LearnBackActor, audioId: string) {
    await this.assertEnabled(actor.organizationId);
    const audio = await this.prisma.learnBackAudioArtifact.findFirst({
      where: { id: audioId, organizationId: actor.organizationId, ownerUserId: actor.userId },
    });
    if (!audio?.storageKey) {
      throw new ApiException('audio_unavailable', 'Audio not available', HttpStatus.NOT_FOUND);
    }
    const buffer = await this.storage.readBuffer(audio.storageKey);
    return { buffer, mimeType: audio.mimeType ?? 'audio/wav', audio };
  }

  async listPhrasebook(actor: LearnBackActor) {
    await this.assertEnabled(actor.organizationId);
    const entries = await this.prisma.learnBackPhrasebookEntry.findMany({
      where: {
        organizationId: actor.organizationId,
        ownerUserId: actor.userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { entries };
  }

  async savePhrase(
    actor: LearnBackActor,
    input: {
      phrase: string;
      intendedMeaning: string;
      context?: string;
      practiceLanguage?: string;
      explanationLanguage?: string;
      sourceAttemptId?: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    if (!input.phrase?.trim() || !input.intendedMeaning?.trim()) {
      throw new ApiException(
        'validation_error',
        'phrase and intendedMeaning are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const profile = await this.ensureProfile(actor);
    const entry = await this.prisma.learnBackPhrasebookEntry.create({
      data: {
        organizationId: actor.organizationId,
        ownerUserId: actor.userId,
        profileId: profile.id,
        phrase: input.phrase.trim(),
        intendedMeaning: input.intendedMeaning.trim(),
        context: input.context,
        practiceLanguage: input.practiceLanguage ?? profile.practiceLanguage,
        explanationLanguage: input.explanationLanguage ?? profile.explanationLanguage,
        sourceAttemptId: input.sourceAttemptId,
        reviewStatus: 'learner',
      },
    });
    await this.audit(actor, 'phrasebook.save', null, { entryId: entry.id });
    return { entry };
  }

  async updatePhrase(
    actor: LearnBackActor,
    entryId: string,
    input: { phrase?: string; intendedMeaning?: string; context?: string | null },
  ) {
    await this.assertEnabled(actor.organizationId);
    const existing = await this.prisma.learnBackPhrasebookEntry.findFirst({
      where: {
        id: entryId,
        organizationId: actor.organizationId,
        ownerUserId: actor.userId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Phrasebook entry not found', HttpStatus.NOT_FOUND);
    }
    const entry = await this.prisma.learnBackPhrasebookEntry.update({
      where: { id: entryId },
      data: {
        phrase: input.phrase?.trim(),
        intendedMeaning: input.intendedMeaning?.trim(),
        context: input.context === undefined ? undefined : input.context,
        revisionNumber: { increment: 1 },
      },
    });
    return { entry };
  }

  async deletePhrase(actor: LearnBackActor, entryId: string) {
    await this.assertEnabled(actor.organizationId);
    const existing = await this.prisma.learnBackPhrasebookEntry.findFirst({
      where: {
        id: entryId,
        organizationId: actor.organizationId,
        ownerUserId: actor.userId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Phrasebook entry not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.learnBackPhrasebookEntry.update({
      where: { id: entryId },
      data: { deletedAt: new Date() },
    });
    return { deleted: true, entryId };
  }

  async getProgress(actor: LearnBackActor) {
    await this.assertEnabled(actor.organizationId);
    const observations = await this.prisma.learnBackProgressObservation.findMany({
      where: { organizationId: actor.organizationId, ownerUserId: actor.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      observations,
      note: 'Observations are assisted practice evidence for comparable tasks — not a standardized proficiency certificate.',
      unassessedDimensions: ['standardized_proficiency'],
    };
  }

  async updateReminderPreferences(
    actor: LearnBackActor,
    input: {
      reminderOptIn?: boolean;
      reminderTimezone?: string | null;
      reminderChannel?: string | null;
      quietHoursStart?: number | null;
      quietHoursEnd?: number | null;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    await this.ensureProfile(actor);
    const hasExternalNotifications = process.env.NOTIFICATIONS_DISABLED !== '1';
    if (input.reminderOptIn && input.reminderChannel && input.reminderChannel !== 'in_app') {
      if (!hasExternalNotifications) {
        throw new ApiException(
          'reminders_in_app_only',
          'External reminder channels are not provisioned. Use reminderChannel=in_app for the due list.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }
    const profile = await this.prisma.learnBackLearnerProfile.update({
      where: {
        organizationId_ownerUserId: {
          organizationId: actor.organizationId,
          ownerUserId: actor.userId,
        },
      },
      data: {
        reminderOptIn: input.reminderOptIn,
        reminderTimezone:
          input.reminderTimezone === undefined ? undefined : input.reminderTimezone,
        reminderChannel: input.reminderChannel === undefined ? undefined : input.reminderChannel,
        quietHoursStart:
          input.quietHoursStart === undefined ? undefined : input.quietHoursStart,
        quietHoursEnd: input.quietHoursEnd === undefined ? undefined : input.quietHoursEnd,
      },
    });
    await this.audit(actor, 'reminders.update', null, {
      reminderOptIn: profile.reminderOptIn,
      channel: profile.reminderChannel,
    });
    return {
      profile,
      delivery: profile.reminderOptIn
        ? profile.reminderChannel === 'in_app' || !profile.reminderChannel
          ? 'in_app_due_list'
          : 'permissioned_channel'
        : 'opted_out',
    };
  }

  async deleteSession(actor: LearnBackActor, sessionId: string) {
    await this.assertEnabled(actor.organizationId);
    const session = await this.loadSession(actor, sessionId);
    const attempts = await this.prisma.learnBackAttempt.findMany({
      where: { sessionId },
      select: { id: true, audioStorageKey: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.learnBackEvaluation.updateMany({
        where: { attempt: { sessionId } },
        data: { stale: true },
      });
      await tx.learnBackFeedbackRevision.updateMany({
        where: { attempt: { sessionId } },
        data: { stale: true },
      });
      await tx.learnBackPracticeSession.update({
        where: { id: sessionId },
        data: { state: 'deleted', deletedAt: new Date() },
      });
    });

    for (const a of attempts) {
      if (a.audioStorageKey) await this.storage.tryUnlink(a.audioStorageKey);
    }
    await this.appendEvent(session.id, 'session.deleted', { sessionId });
    await this.audit(actor, 'session.delete', sessionId, {});
    return { deleted: true, sessionId };
  }
}
