import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../common/errors/api-exception';
import { resolveEntitlementContext, type EntitlementActor } from '../common/entitlements/entitlement-actor';
import { BillingService } from '../billing/billing.service';
import { LocalStorageService } from '../documents/local-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { EverydayAdapters } from './everyday.adapters';
import { everydayCatalog } from './everyday.catalog';
import {
  answerQuestionFromSource,
  assessCaptureQuality,
  buildExplanationClaims,
  replyCommitmentFindings,
  validateEvidenceBlockIds,
} from './everyday.checks';
import { hashBuffer, hashText, mintEventId, presentationHash } from './everyday.hash';
import {
  ADVICE_DISCLAIMER,
  DOCUMENT_CATEGORIES,
  EVERYDAY_CORRIDORS,
  EVERYDAY_FEATURE,
  EVERYDAY_MODES,
  EVERYDAY_POLICY_VERSION,
  SENSITIVE_CATEGORIES,
  everydayMaxPages,
  everydayMaxUploadBytes,
  type DocumentCategory,
  type EverydayBlock,
  type EverydayMode,
} from './everyday.types';

export type EverydayActor = {
  organizationId: string;
  platformAdmin?: boolean;
  workspaceId: string;
  userId: string;
  apiKeyId?: string;
  ip?: string;
};

@Injectable()
export class EverydayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly adapters: EverydayAdapters,
    private readonly storage: LocalStorageService,
  ) {}

  catalog() {
    return everydayCatalog();
  }

  async assertEnabled(actorOrOrg: string | EntitlementActor) {
    const { organizationId, platformAdmin } = resolveEntitlementContext(actorOrOrg);
    if (process.env.EVERYDAY_DISABLED === '1') {
      throw new ApiException(
        'feature_disabled',
        'Everyday is temporarily disabled for this environment.',
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
    if (platformAdmin) return;
    const overrides = (org.featureOverrides ?? {}) as Record<string, unknown>;
    if (typeof overrides.everyday === 'boolean') {
      if (!overrides.everyday) {
        throw new ApiException(
          'feature_disabled',
          'Everyday is disabled for this organization',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }
    if (process.env.EVERYDAY_OPEN === '1') return;
    await this.billing.assertFeature(
      organizationId,
      EVERYDAY_FEATURE,
      'Everyday requires a Pro plan or higher, or an organization entitlement override.',
    );
  }

  private corridorOrThrow(id: string) {
    const corridor = EVERYDAY_CORRIDORS.find((c) => c.id === id);
    if (!corridor) {
      throw new ApiException(
        'unsupported_corridor',
        `Everyday corridor ${id} is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return corridor;
  }

  private async appendEvent(
    sessionId: string,
    type: string,
    payload?: Record<string, unknown>,
  ) {
    const last = await this.prisma.everydayEvent.findFirst({
      where: { sessionId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    const sequence = (last?.sequence ?? 0) + 1;
    return this.prisma.everydayEvent.create({
      data: {
        sessionId,
        sequence,
        eventId: mintEventId(),
        type,
        payload: (payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async audit(
    actor: EverydayActor,
    operation: string,
    sessionId: string | null,
    meta?: Record<string, unknown>,
  ) {
    await this.prisma.everydayAuditEvent.create({
      data: {
        organizationId: actor.organizationId,
        sessionId,
        actorId: actor.userId,
        operation,
        meta: (meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async loadSession(actor: EverydayActor, sessionId: string) {
    const session = await this.prisma.everydaySession.findFirst({
      where: {
        id: sessionId,
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
      },
    });
    if (!session || session.deletedAt) {
      throw new ApiException('not_found', 'Everyday session not found', HttpStatus.NOT_FOUND);
    }
    if (session.ownerUserId !== actor.userId) {
      throw new ApiException(
        'forbidden',
        'Everyday sessions are private to the owning user',
        HttpStatus.FORBIDDEN,
      );
    }
    return session;
  }

  async listSessions(actor: EverydayActor) {
    await this.assertEnabled(actor);
    const sessions = await this.prisma.everydaySession.findMany({
      where: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        ownerUserId: actor.userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, originalName: true, status: true, pageCount: true },
        },
      },
    });
    return { sessions };
  }

  async createSession(
    actor: EverydayActor,
    input: {
      mode?: string;
      corridor?: string;
      preferredVariety?: string;
      documentCategory?: string;
      trainingConsent?: boolean;
      sensitivePolicyOk?: boolean;
      retentionDays?: number;
    },
  ) {
    await this.assertEnabled(actor);
    const mode = (input.mode ?? 'read_this_to_me') as EverydayMode;
    if (!EVERYDAY_MODES.includes(mode)) {
      throw new ApiException('validation_error', `Unsupported mode ${mode}`, HttpStatus.BAD_REQUEST);
    }
    const corridor = this.corridorOrThrow(input.corridor ?? 'en-ak');
    const category = (input.documentCategory ?? 'administrative_notice') as DocumentCategory;
    if (!DOCUMENT_CATEGORIES.includes(category)) {
      throw new ApiException(
        'validation_error',
        `Unsupported documentCategory ${category}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (SENSITIVE_CATEGORIES.has(category) && !input.sensitivePolicyOk) {
      throw new ApiException(
        'sensitive_policy_required',
        'Medical, legal, and financial documents require sensitivePolicyOk=true. Translation stays available under that acknowledgement; explanations are not professional advice.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.prisma.everydaySession.create({
      data: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        ownerUserId: actor.userId,
        mode,
        corridor: corridor.id,
        sourceLanguage: corridor.sourceLanguage,
        preferredVariety: input.preferredVariety ?? corridor.targetLanguage,
        documentCategory: category,
        trainingConsent: Boolean(input.trainingConsent),
        sensitivePolicyOk: Boolean(input.sensitivePolicyOk),
        retentionDays: Math.min(365, Math.max(1, input.retentionDays ?? 30)),
        policyVersion: EVERYDAY_POLICY_VERSION,
        state: 'capturing',
      },
    });
    await this.audit(actor, 'session.create', session.id, { mode, corridor: corridor.id });
    return { session };
  }

  async getSession(actor: EverydayActor, sessionId: string) {
    await this.assertEnabled(actor);
    const session = await this.loadSession(actor, sessionId);
    const documents = await this.prisma.everydayDocumentAsset.findMany({
      where: { sessionId, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        sourceRevisions: {
          where: { isActive: true },
          take: 1,
          include: {
            translations: { where: { stale: false }, orderBy: { createdAt: 'desc' }, take: 3 },
            explanations: { where: { stale: false }, orderBy: { createdAt: 'desc' }, take: 3 },
            questions: { where: { stale: false }, orderBy: { createdAt: 'desc' }, take: 10 },
            audio: { where: { stale: false }, orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
        ocrRevisions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    // Prefer ready documents with an active source ahead of recapture/failed captures.
    documents.sort((a, b) => {
      const score = (d: (typeof documents)[number]) =>
        (d.status === 'ready' ? 2 : 0) + (d.sourceRevisions.length ? 1 : 0);
      return score(b) - score(a);
    });
    const replies = await this.prisma.everydayReplyRevision.findMany({
      where: { sessionId, stale: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { approvals: true, audio: { where: { stale: false }, take: 3 } },
    });
    const terms = await this.prisma.everydayTermExplanation.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const events = await this.prisma.everydayEvent.findMany({
      where: { sessionId },
      orderBy: { sequence: 'asc' },
      take: 100,
    });
    return { session, documents, replies, terms, events };
  }

  async uploadDocument(
    actor: EverydayActor,
    sessionId: string,
    input: {
      filename: string;
      mimeType: string;
      contentBase64: string;
      pageCountHint?: number;
    },
  ) {
    await this.assertEnabled(actor);
    const session = await this.loadSession(actor, sessionId);
    if (!input.contentBase64?.trim() || !input.filename) {
      throw new ApiException(
        'validation_error',
        'filename and contentBase64 are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(input.contentBase64, 'base64');
    } catch {
      throw new ApiException('validation_error', 'contentBase64 is invalid', HttpStatus.BAD_REQUEST);
    }
    if (!buffer.length) {
      throw new ApiException('validation_error', 'Empty upload', HttpStatus.BAD_REQUEST);
    }
    if (buffer.length > everydayMaxUploadBytes()) {
      throw new ApiException(
        'validation_error',
        `Upload exceeds ${everydayMaxUploadBytes()} bytes`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const mime = input.mimeType || 'application/octet-stream';
    const allowed = new Set([
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain',
    ]);
    if (!allowed.has(mime) && !/\.(png|jpe?g|webp|gif|pdf|txt)$/i.test(input.filename)) {
      throw new ApiException(
        'validation_error',
        'Unsupported file type. Upload PNG, JPEG, WebP, GIF, PDF, or TXT.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Prompt-injection in document bytes must not alter permissions
    if (/\bIGNORE\s+PREVIOUS\b|\bSYSTEM\s*:/i.test(buffer.toString('utf8', 0, 2048))) {
      // Continue processing as ordinary text; never elevate rights
    }

    const quality = assessCaptureQuality({
      buffer,
      mimeType: mime,
      originalName: input.filename,
      pageCount: input.pageCountHint,
    });

    const contentHash = hashBuffer(buffer);
    const storageKey = `${actor.organizationId}/everyday/${session.id}/${contentHash.slice(0, 16)}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await this.storage.writeBuffer(storageKey, buffer);

    if (quality.requireRecapture) {
      const doc = await this.prisma.everydayDocumentAsset.create({
        data: {
          sessionId: session.id,
          organizationId: actor.organizationId,
          storageKey,
          contentHash,
          mimeType: mime,
          originalName: input.filename,
          byteSize: buffer.length,
          pageCount: quality.estimatedPages,
          consentScope: session.trainingConsent ? 'training_opt_in' : 'private',
          qualityReport: quality as unknown as Prisma.InputJsonValue,
          status: 'recapture_required',
        },
      });
      await this.prisma.everydaySession.update({
        where: { id: session.id },
        data: { state: 'capturing' },
      });
      await this.appendEvent(session.id, 'recapture.required', {
        documentId: doc.id,
        findings: quality.findings,
      });
      await this.audit(actor, 'document.recapture_required', session.id, { documentId: doc.id });
      return { document: doc, quality, ocr: null, source: null };
    }

    const ocr = await this.adapters.runOcr({
      buffer,
      filename: input.filename,
      mimeType: mime,
      languageHint: session.sourceLanguage,
    });

    if (ocr.status === 'unsupported' || !ocr.text.trim()) {
      const doc = await this.prisma.everydayDocumentAsset.create({
        data: {
          sessionId: session.id,
          organizationId: actor.organizationId,
          storageKey,
          contentHash,
          mimeType: mime,
          originalName: input.filename,
          byteSize: buffer.length,
          pageCount: ocr.pages || 1,
          qualityReport: quality as unknown as Prisma.InputJsonValue,
          status: 'failed',
        },
      });
      await this.appendEvent(session.id, 'processing.failed', {
        documentId: doc.id,
        reason: 'ocr_unsupported_or_empty',
      });
      throw new ApiException(
        'ocr_unavailable',
        'Could not extract readable text. Capture page images or use a supported PDF/text file.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (ocr.pages > everydayMaxPages()) {
      throw new ApiException(
        'validation_error',
        `Document exceeds ${everydayMaxPages()} pages`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const layoutStatus = ocr.blocks.some((b) => b.kind === 'table_cell')
      ? 'resolved_with_tables'
      : 'resolved';
    const ocrHash = hashText(ocr.text);

    const result = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.everydayDocumentAsset.create({
        data: {
          sessionId: session.id,
          organizationId: actor.organizationId,
          storageKey,
          contentHash,
          mimeType: mime,
          originalName: input.filename,
          byteSize: buffer.length,
          pageCount: ocr.pages,
          consentScope: session.trainingConsent ? 'training_opt_in' : 'private',
          qualityReport: quality as unknown as Prisma.InputJsonValue,
          status: 'ready',
        },
      });
      const ocrRev = await tx.everydayOcrRevision.create({
        data: {
          documentId: doc.id,
          modelVersion: ocr.modelVersion,
          contentHash: ocrHash,
          blocks: ocr.blocks as unknown as Prisma.InputJsonValue,
          fullText: ocr.text,
          readingOrderOk: true,
          layoutStatus,
          createdById: actor.userId,
        },
      });
      const source = await tx.everydaySourceRevision.create({
        data: {
          documentId: doc.id,
          ocrRevisionId: ocrRev.id,
          contentHash: ocrHash,
          fullText: ocr.text,
          blocks: ocr.blocks as unknown as Prisma.InputJsonValue,
          origin: 'ocr',
          authorUserId: actor.userId,
          isActive: true,
        },
      });
      await tx.everydaySession.update({
        where: { id: session.id },
        data: {
          state: 'reviewing',
          pageBudgetUsed: { increment: ocr.pages },
        },
      });
      return { doc, ocrRev, source };
    });

    await this.appendEvent(session.id, 'document.ready', { documentId: result.doc.id });
    await this.appendEvent(session.id, 'ocr.ready', {
      documentId: result.doc.id,
      ocrRevisionId: result.ocrRev.id,
      sourceRevisionId: result.source.id,
      provider: ocr.provider,
    });
    await this.audit(actor, 'document.upload', session.id, {
      documentId: result.doc.id,
      pages: ocr.pages,
      provider: ocr.provider,
    });

    return {
      document: result.doc,
      quality,
      ocr: result.ocrRev,
      source: result.source,
      ocrStatus: ocr.status,
    };
  }

  async correctSource(
    actor: EverydayActor,
    documentId: string,
    input: {
      fullText: string;
      blocks?: EverydayBlock[];
      expectedSourceRevisionId?: string;
    },
  ) {
    await this.assertEnabled(actor);
    const document = await this.prisma.everydayDocumentAsset.findFirst({
      where: { id: documentId, organizationId: actor.organizationId, deletedAt: null },
      include: { session: true },
    });
    if (!document || document.session.deletedAt) {
      throw new ApiException('not_found', 'Document not found', HttpStatus.NOT_FOUND);
    }
    if (document.session.ownerUserId !== actor.userId) {
      throw new ApiException('forbidden', 'Private document', HttpStatus.FORBIDDEN);
    }
    if (!input.fullText?.trim()) {
      throw new ApiException('validation_error', 'fullText is required', HttpStatus.BAD_REQUEST);
    }

    const active = await this.prisma.everydaySourceRevision.findFirst({
      where: { documentId, isActive: true },
    });
    if (
      input.expectedSourceRevisionId &&
      active &&
      active.id !== input.expectedSourceRevisionId
    ) {
      throw new ApiException(
        'revision_conflict',
        'expectedSourceRevisionId does not match the active source revision',
        HttpStatus.CONFLICT,
      );
    }

    let blocks: EverydayBlock[] = input.blocks?.length
      ? input.blocks
      : ((active?.blocks as EverydayBlock[] | undefined) ?? []).map((b, i) =>
          i === 0 ? { ...b, text: input.fullText } : b,
        );
    if (!blocks.length) {
      const { buildBlocksFromText } = await import('./everyday.checks');
      blocks = buildBlocksFromText(input.fullText, document.pageCount);
    }

    const contentHash = hashText(input.fullText);
    const source = await this.prisma.$transaction(async (tx) => {
      if (active) {
        await tx.everydaySourceRevision.update({
          where: { id: active.id },
          data: { isActive: false },
        });
        await tx.everydayTranslationRevision.updateMany({
          where: { sourceRevisionId: active.id },
          data: { stale: true },
        });
        await tx.everydayExplanationRevision.updateMany({
          where: { sourceRevisionId: active.id },
          data: { stale: true },
        });
        await tx.everydayQuestionAnswer.updateMany({
          where: { sourceRevisionId: active.id },
          data: { stale: true },
        });
        await tx.everydayAudioVariant.updateMany({
          where: { sourceRevisionId: active.id },
          data: { stale: true },
        });
      }
      const next = await tx.everydaySourceRevision.create({
        data: {
          documentId,
          ocrRevisionId: active?.ocrRevisionId,
          parentId: active?.id,
          contentHash,
          fullText: input.fullText,
          blocks: blocks as unknown as Prisma.InputJsonValue,
          origin: 'manual_correction',
          authorUserId: actor.userId,
          isActive: true,
        },
      });
      await tx.everydaySession.update({
        where: { id: document.sessionId },
        data: { state: 'reviewing' },
      });
      return next;
    });

    await this.appendEvent(document.sessionId, 'output.stale', {
      reason: 'source_corrected',
      sourceRevisionId: source.id,
      previousSourceRevisionId: active?.id,
    });
    await this.audit(actor, 'source.correct', document.sessionId, { sourceRevisionId: source.id });
    return { source };
  }

  private async loadActiveSource(actor: EverydayActor, sourceRevisionId: string) {
    const source = await this.prisma.everydaySourceRevision.findFirst({
      where: { id: sourceRevisionId },
      include: {
        document: { include: { session: true } },
      },
    });
    if (!source || source.document.deletedAt || source.document.session.deletedAt) {
      throw new ApiException('not_found', 'Source revision not found', HttpStatus.NOT_FOUND);
    }
    if (source.document.organizationId !== actor.organizationId) {
      throw new ApiException('forbidden', 'Cross-tenant access denied', HttpStatus.FORBIDDEN);
    }
    if (source.document.session.ownerUserId !== actor.userId) {
      throw new ApiException('forbidden', 'Private session', HttpStatus.FORBIDDEN);
    }
    if (!source.isActive) {
      throw new ApiException(
        'output_stale',
        'This source revision is no longer active. Use the current source revision.',
        HttpStatus.CONFLICT,
      );
    }
    return source;
  }

  async translateSource(
    actor: EverydayActor,
    sourceRevisionId: string,
    input?: { targetVariety?: string },
  ) {
    await this.assertEnabled(actor);
    const source = await this.loadActiveSource(actor, sourceRevisionId);
    const session = source.document.session;
    const corridor = this.corridorOrThrow(session.corridor);
    const target = input?.targetVariety ?? session.preferredVariety ?? corridor.targetLanguage;

    const mt = await this.adapters.translateFaithful({
      text: source.fullText,
      sourceLanguage: session.sourceLanguage,
      targetLanguage: target,
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
    });
    if (mt.status === 'unsupported') {
      throw new ApiException(
        'translation_unavailable',
        mt.criticalFindings[0]?.message ?? 'Translation unavailable',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const blocks = source.blocks as EverydayBlock[];
    const blockMappings = blocks.map((b) => ({
      sourceBlockId: b.id,
      targetText: mt.text, // whole-doc faithful MT; per-block mapping retained for evidence
    }));

    const row = await this.prisma.everydayTranslationRevision.create({
      data: {
        sourceRevisionId: source.id,
        targetVariety: target,
        contentHash: hashText(mt.text),
        faithfulText: mt.text,
        blockMappings: blockMappings as unknown as Prisma.InputJsonValue,
        modelVersion: mt.modelVersion,
        criticalFindings: mt.criticalFindings as unknown as Prisma.InputJsonValue,
        createdById: actor.userId,
      },
    });
    await this.prisma.everydaySession.update({
      where: { id: session.id },
      data: { state: 'ready' },
    });
    await this.appendEvent(session.id, 'translation.ready', {
      translationRevisionId: row.id,
      sourceRevisionId: source.id,
      status: mt.status,
    });
    await this.audit(actor, 'translation.create', session.id, { translationRevisionId: row.id });
    return { translation: row, status: mt.status };
  }

  async explainSource(
    actor: EverydayActor,
    sourceRevisionId: string,
    input?: { translationRevisionId?: string },
  ) {
    await this.assertEnabled(actor);
    const source = await this.loadActiveSource(actor, sourceRevisionId);
    const blocks = source.blocks as EverydayBlock[];
    const built = buildExplanationClaims(blocks);

    for (const claim of built.claims) {
      const check = validateEvidenceBlockIds(blocks, claim.evidenceBlockIds);
      if (!check.ok) {
        throw new ApiException(
          'invalid_evidence',
          `Explanation claim references unknown blocks: ${check.missing.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (input?.translationRevisionId) {
      const tr = await this.prisma.everydayTranslationRevision.findFirst({
        where: {
          id: input.translationRevisionId,
          sourceRevisionId: source.id,
          stale: false,
        },
      });
      if (!tr) {
        throw new ApiException(
          'not_found',
          'Translation revision not found for this source',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const row = await this.prisma.everydayExplanationRevision.create({
      data: {
        sourceRevisionId: source.id,
        translationRevisionId: input?.translationRevisionId,
        contentHash: hashText(built.simplifiedText),
        claims: built.claims as unknown as Prisma.InputJsonValue,
        simplifiedText: built.simplifiedText,
        omissions: built.omissions as unknown as Prisma.InputJsonValue,
        uncertaintyNotes: built.claims
          .filter((c) => c.uncertainty)
          .map((c) => c.uncertainty) as unknown as Prisma.InputJsonValue,
        modelVersion: 'everyday-grounded-explainer-v1',
        adviceDisclaimer: ADVICE_DISCLAIMER,
        createdById: actor.userId,
      },
    });
    await this.appendEvent(source.document.sessionId, 'explanation.ready', {
      explanationRevisionId: row.id,
      sourceRevisionId: source.id,
    });
    await this.audit(actor, 'explanation.create', source.document.sessionId, {
      explanationRevisionId: row.id,
    });
    return { explanation: row };
  }

  async askQuestion(actor: EverydayActor, sourceRevisionId: string, question: string) {
    await this.assertEnabled(actor);
    if (!question?.trim()) {
      throw new ApiException('validation_error', 'question is required', HttpStatus.BAD_REQUEST);
    }
    const source = await this.loadActiveSource(actor, sourceRevisionId);
    const blocks = source.blocks as EverydayBlock[];
    const quality = source.document.qualityReport as { findings?: { code: string }[] } | null;
    const missingPages = Boolean(
      quality?.findings?.some((f) => f.code === 'missing_page_or_crop'),
    );

    const answered = answerQuestionFromSource({
      question: question.trim(),
      blocks,
      missingPages,
    });

    for (const claim of answered.claims) {
      const check = validateEvidenceBlockIds(blocks, claim.evidenceBlockIds);
      if (!check.ok) {
        throw new ApiException(
          'invalid_evidence',
          `Answer references unknown blocks: ${check.missing.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const row = await this.prisma.everydayQuestionAnswer.create({
      data: {
        sourceRevisionId: source.id,
        question: question.trim(),
        answerability: answered.answerability,
        answerText: answered.answerText,
        claims: answered.claims as unknown as Prisma.InputJsonValue,
        evidence: answered.evidence as unknown as Prisma.InputJsonValue,
        reason: answered.reason,
        modelVersion: 'everyday-grounded-qa-v1',
        createdById: actor.userId,
      },
    });
    await this.audit(actor, 'question.answer', source.document.sessionId, {
      questionAnswerId: row.id,
      answerability: row.answerability,
    });
    return { answer: row };
  }

  async createAudio(
    actor: EverydayActor,
    input: {
      kind: 'translation' | 'explanation' | 'reply' | 'source';
      translationRevisionId?: string;
      explanationRevisionId?: string;
      replyRevisionId?: string;
      sourceRevisionId?: string;
    },
  ) {
    await this.assertEnabled(actor);
    let exactText = '';
    let language = 'en';
    let sessionId = '';
    let sourceRevisionId: string | undefined;
    let translationRevisionId: string | undefined;
    let explanationRevisionId: string | undefined;
    let replyRevisionId: string | undefined;

    if (input.kind === 'translation' && input.translationRevisionId) {
      const tr = await this.prisma.everydayTranslationRevision.findFirst({
        where: { id: input.translationRevisionId, stale: false },
        include: { sourceRevision: { include: { document: { include: { session: true } } } } },
      });
      if (!tr) throw new ApiException('not_found', 'Translation not found', HttpStatus.NOT_FOUND);
      await this.loadActiveSource(actor, tr.sourceRevisionId);
      exactText = tr.faithfulText;
      language = tr.targetVariety;
      sessionId = tr.sourceRevision.document.sessionId;
      sourceRevisionId = tr.sourceRevisionId;
      translationRevisionId = tr.id;
    } else if (input.kind === 'explanation' && input.explanationRevisionId) {
      const ex = await this.prisma.everydayExplanationRevision.findFirst({
        where: { id: input.explanationRevisionId, stale: false },
        include: { sourceRevision: { include: { document: { include: { session: true } } } } },
      });
      if (!ex) throw new ApiException('not_found', 'Explanation not found', HttpStatus.NOT_FOUND);
      await this.loadActiveSource(actor, ex.sourceRevisionId);
      exactText = `${ex.simplifiedText}\n\n${ex.adviceDisclaimer}`;
      language = ex.sourceRevision.document.session.preferredVariety;
      sessionId = ex.sourceRevision.document.sessionId;
      sourceRevisionId = ex.sourceRevisionId;
      explanationRevisionId = ex.id;
    } else if (input.kind === 'reply' && input.replyRevisionId) {
      const reply = await this.prisma.everydayReplyRevision.findFirst({
        where: { id: input.replyRevisionId, stale: false },
        include: { session: true },
      });
      if (!reply || reply.session.ownerUserId !== actor.userId) {
        throw new ApiException('not_found', 'Reply not found', HttpStatus.NOT_FOUND);
      }
      exactText = reply.targetText;
      language = reply.targetVariety;
      sessionId = reply.sessionId;
      replyRevisionId = reply.id;
    } else if (input.kind === 'source' && input.sourceRevisionId) {
      const source = await this.loadActiveSource(actor, input.sourceRevisionId);
      exactText = source.fullText;
      language = source.document.session.sourceLanguage;
      sessionId = source.document.sessionId;
      sourceRevisionId = source.id;
    } else {
      throw new ApiException(
        'validation_error',
        'kind and matching revision id are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const tts = await this.adapters.synthesize({
      text: exactText,
      language,
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
      storageKey = `${actor.organizationId}/everyday/${sessionId}/audio/${audioHash.slice(0, 16)}.wav`;
      await this.storage.writeBuffer(storageKey, tts.audio);
    }

    const row = await this.prisma.everydayAudioVariant.create({
      data: {
        kind: input.kind,
        sourceRevisionId,
        translationRevisionId,
        explanationRevisionId,
        replyRevisionId,
        textHash: hashText(exactText),
        exactText,
        storageKey,
        audioHash,
        mimeType: tts.mimeType,
        voiceId: tts.voice,
        modelVersion: tts.modelVersion,
        status: tts.status,
        createdById: actor.userId,
      },
    });
    if (tts.status === 'ok' || tts.status === 'fixture') {
      await this.appendEvent(sessionId, 'audio.ready', {
        audioId: row.id,
        kind: input.kind,
        status: tts.status,
      });
    }
    await this.audit(actor, 'audio.create', sessionId, { audioId: row.id, status: tts.status });
    return {
      audio: {
        id: row.id,
        kind: row.kind,
        status: row.status,
        voiceId: row.voiceId,
        mimeType: row.mimeType,
        textHash: row.textHash,
        note: tts.note,
        hasBytes: Boolean(tts.audio?.length),
      },
    };
  }

  async getAudioBytes(actor: EverydayActor, audioId: string) {
    await this.assertEnabled(actor);
    const audio = await this.prisma.everydayAudioVariant.findFirst({
      where: { id: audioId },
    });
    if (!audio || audio.stale) {
      throw new ApiException('not_found', 'Audio not found', HttpStatus.NOT_FOUND);
    }
    // Authorize via any linked revision ownership
    if (audio.sourceRevisionId) {
      await this.loadActiveSource(actor, audio.sourceRevisionId).catch(async () => {
        const src = await this.prisma.everydaySourceRevision.findFirst({
          where: { id: audio.sourceRevisionId! },
          include: { document: { include: { session: true } } },
        });
        if (
          !src ||
          src.document.organizationId !== actor.organizationId ||
          src.document.session.ownerUserId !== actor.userId
        ) {
          throw new ApiException('forbidden', 'Private audio', HttpStatus.FORBIDDEN);
        }
      });
    } else if (audio.replyRevisionId) {
      const reply = await this.prisma.everydayReplyRevision.findFirst({
        where: { id: audio.replyRevisionId },
        include: { session: true },
      });
      if (!reply || reply.session.ownerUserId !== actor.userId) {
        throw new ApiException('forbidden', 'Private audio', HttpStatus.FORBIDDEN);
      }
    }
    if (!audio.storageKey) {
      throw new ApiException(
        'audio_unavailable',
        'No audio bytes stored — TTS was unsupported for this variety.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const buf = await this.storage.readBuffer(audio.storageKey);
    return { buffer: buf, mimeType: audio.mimeType ?? 'audio/wav', audio };
  }

  async createReply(
    actor: EverydayActor,
    sessionId: string,
    input: { userSourceText: string; targetVariety?: string; sourceRevisionId?: string },
  ) {
    await this.assertEnabled(actor);
    const session = await this.loadSession(actor, sessionId);
    if (!input.userSourceText?.trim()) {
      throw new ApiException(
        'validation_error',
        'userSourceText is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (/\?\?\?|\[unclear\]/i.test(input.userSourceText)) {
      throw new ApiException(
        'clarification_required',
        'Your dictated text is ambiguous. Clarify before translating a reply.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const target = input.targetVariety ?? session.preferredVariety;
    const replySourceLang =
      target === session.preferredVariety
        ? session.sourceLanguage
        : target === session.sourceLanguage
          ? session.preferredVariety
          : session.sourceLanguage;
    const mt = await this.adapters.translateFaithful({
      text: input.userSourceText,
      sourceLanguage: replySourceLang,
      targetLanguage: target,
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
    });
    const targetText =
      replySourceLang === target || mt.status === 'unsupported' ? input.userSourceText : mt.text;

    const findings = replyCommitmentFindings(input.userSourceText, targetText);
    const last = await this.prisma.everydayReplyRevision.findFirst({
      where: { sessionId },
      orderBy: { revisionNumber: 'desc' },
    });

    const row = await this.prisma.everydayReplyRevision.create({
      data: {
        sessionId,
        sourceRevisionId: input.sourceRevisionId,
        parentId: last?.id,
        userSourceText: input.userSourceText,
        userSourceHash: hashText(input.userSourceText),
        targetText,
        targetHash: hashText(targetText),
        targetVariety: target,
        modelVersion: mt.modelVersion,
        criticalFindings: findings as unknown as Prisma.InputJsonValue,
        revisionNumber: (last?.revisionNumber ?? 0) + 1,
        createdById: actor.userId,
      },
    });
    await this.audit(actor, 'reply.create', sessionId, {
      replyRevisionId: row.id,
      findings: findings.length,
    });
    return { reply: row, commitmentFindings: findings };
  }

  async approveReply(
    actor: EverydayActor,
    replyId: string,
    input: {
      action: 'approve_copy' | 'approve_download' | 'approve_share_sheet';
      sourcePresentationHash: string;
      targetPresentationHash: string;
    },
  ) {
    await this.assertEnabled(actor);
    const reply = await this.prisma.everydayReplyRevision.findFirst({
      where: { id: replyId },
      include: { session: true },
    });
    if (!reply || reply.session.deletedAt) {
      throw new ApiException('not_found', 'Reply not found', HttpStatus.NOT_FOUND);
    }
    if (
      reply.session.organizationId !== actor.organizationId ||
      reply.session.ownerUserId !== actor.userId
    ) {
      throw new ApiException('forbidden', 'Private reply', HttpStatus.FORBIDDEN);
    }
    if (reply.stale) {
      throw new ApiException(
        'output_stale',
        'This reply revision is stale. Create a new reply after edits.',
        HttpStatus.CONFLICT,
      );
    }

    const expectedSource = hashText(reply.userSourceText);
    const expectedTarget = hashText(reply.targetText);
    const combo = presentationHash({
      sourceText: reply.userSourceText,
      targetText: reply.targetText,
    });
    const sourceOk =
      input.sourcePresentationHash === expectedSource ||
      input.sourcePresentationHash === combo;
    const targetOk =
      input.targetPresentationHash === expectedTarget ||
      input.targetPresentationHash === combo;
    if (!sourceOk || !targetOk) {
      throw new ApiException(
        'approval_hash_mismatch',
        'Approval hashes must match the exact source and target text currently shown.',
        HttpStatus.CONFLICT,
      );
    }

    const findings = reply.criticalFindings as { code: string }[];
    if (Array.isArray(findings) && findings.some((f) => f.code !== 'prompt_injection_ignored')) {
      // Still allow approval of intentional user text, but block unauthorized payment/admission invents
      const blocking = findings.filter((f) =>
        ['unauthorized_payment_commitment', 'unauthorized_admission', 'invented_date'].includes(
          f.code,
        ),
      );
      if (blocking.length) {
        throw new ApiException(
          'reply_blocked',
          'This reply adds unsupported commitments. Edit your wording and try again.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    const approval = await this.prisma.everydayReplyApproval.create({
      data: {
        replyRevisionId: reply.id,
        userId: actor.userId,
        sourcePresentationHash: input.sourcePresentationHash,
        targetPresentationHash: input.targetPresentationHash,
        action: input.action,
      },
    });
    await this.appendEvent(reply.sessionId, 'reply.approved', {
      replyRevisionId: reply.id,
      approvalId: approval.id,
      action: input.action,
    });
    await this.audit(actor, 'reply.approve', reply.sessionId, {
      approvalId: approval.id,
      action: input.action,
    });
    return {
      approval,
      export: {
        sourceText: reply.userSourceText,
        targetText: reply.targetText,
        note: 'Approved for local copy/download/share-sheet only. Everyday does not send external messages.',
      },
    };
  }

  async explainTerm(
    actor: EverydayActor,
    sessionId: string,
    input: {
      selectedSpan: string;
      sourceRevisionId?: string;
      scope?: 'document' | 'general';
      language?: string;
    },
  ) {
    await this.assertEnabled(actor);
    const session = await this.loadSession(actor, sessionId);
    if (!input.selectedSpan?.trim()) {
      throw new ApiException('validation_error', 'selectedSpan is required', HttpStatus.BAD_REQUEST);
    }
    const scope = input.scope ?? 'document';
    let evidenceBlockIds: string[] = [];
    let definition = '';
    let uncertainty: string | undefined;

    if (scope === 'document') {
      if (!input.sourceRevisionId) {
        throw new ApiException(
          'validation_error',
          'sourceRevisionId is required for document-scoped term explanations',
          HttpStatus.BAD_REQUEST,
        );
      }
      const source = await this.loadActiveSource(actor, input.sourceRevisionId);
      const blocks = source.blocks as EverydayBlock[];
      const span = input.selectedSpan.trim().toLowerCase();
      const hits = blocks.filter((b) => b.text.toLowerCase().includes(span));
      evidenceBlockIds = hits.map((b) => b.id);
      if (!hits.length) {
        uncertainty = 'Span not found in the active source revision.';
        definition = `“${input.selectedSpan.trim()}” was not found in the current document text.`;
      } else {
        definition = `In this document, “${input.selectedSpan.trim()}” appears as: ${hits[0]!.text}`;
      }
    } else {
      definition = `General sense of “${input.selectedSpan.trim()}” (not document-specific): a term whose exact meaning depends on context. Compare with the document usage when available.`;
      uncertainty = 'Labeled general definition — not grounded in document evidence.';
    }

    const row = await this.prisma.everydayTermExplanation.create({
      data: {
        sessionId: session.id,
        sourceRevisionId: input.sourceRevisionId,
        selectedSpan: input.selectedSpan.trim(),
        language: input.language ?? session.preferredVariety,
        scope,
        definition,
        evidenceBlockIds: evidenceBlockIds as unknown as Prisma.InputJsonValue,
        uncertainty,
        modelVersion: 'everyday-term-v1',
        createdById: actor.userId,
      },
    });
    await this.audit(actor, 'term.explain', session.id, { termId: row.id, scope });
    return { term: row };
  }

  async listEvents(actor: EverydayActor, sessionId: string, afterSequence = 0) {
    await this.assertEnabled(actor);
    await this.loadSession(actor, sessionId);
    const events = await this.prisma.everydayEvent.findMany({
      where: { sessionId, sequence: { gt: afterSequence } },
      orderBy: { sequence: 'asc' },
      take: 200,
    });
    return { events };
  }

  async deleteSession(actor: EverydayActor, sessionId: string) {
    await this.assertEnabled(actor);
    const session = await this.loadSession(actor, sessionId);
    const docs = await this.prisma.everydayDocumentAsset.findMany({
      where: { sessionId, deletedAt: null },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const doc of docs) {
        await tx.everydayDocumentAsset.update({
          where: { id: doc.id },
          data: { deletedAt: new Date(), status: 'deleted' },
        });
      }
      await tx.everydayTranslationRevision.updateMany({
        where: { sourceRevision: { document: { sessionId } } },
        data: { stale: true },
      });
      await tx.everydayExplanationRevision.updateMany({
        where: { sourceRevision: { document: { sessionId } } },
        data: { stale: true },
      });
      await tx.everydayQuestionAnswer.updateMany({
        where: { sourceRevision: { document: { sessionId } } },
        data: { stale: true },
      });
      await tx.everydayAudioVariant.updateMany({
        where: {
          OR: [
            { sourceRevision: { document: { sessionId } } },
            { replyRevision: { sessionId } },
          ],
        },
        data: { stale: true },
      });
      await tx.everydayReplyRevision.updateMany({
        where: { sessionId },
        data: { stale: true },
      });
      await tx.everydaySession.update({
        where: { id: sessionId },
        data: { state: 'deleted', deletedAt: new Date() },
      });
    });

    for (const doc of docs) {
      await this.storage.tryUnlink(doc.storageKey);
    }
    const audios = await this.prisma.everydayAudioVariant.findMany({
      where: {
        OR: [
          { sourceRevision: { document: { sessionId } } },
          { replyRevision: { sessionId } },
        ],
        storageKey: { not: null },
      },
      select: { storageKey: true },
    });
    for (const a of audios) {
      if (a.storageKey) await this.storage.tryUnlink(a.storageKey);
    }

    await this.appendEvent(session.id, 'session.deleted', { sessionId });
    await this.audit(actor, 'session.delete', sessionId, {});
    return { deleted: true, sessionId };
  }
}
