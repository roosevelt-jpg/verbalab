import { createHash } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import { TranslateService } from '../translate/translate.service';
import {
  capabilityForVoice,
  isDemoSafeVoice,
} from '../gateway/voice-capability-registry';
import { applyPronunciationLexicon } from './pronunciation-lexicon';
import {
  contentHash,
  criticalTermFlags,
  newId,
  segmentScript,
  type ScriptSegment,
} from './script-segmenter';
import type { StudioAuth } from './voice-studio.service';

type EditionSegment = {
  stableId: string;
  sourceText: string;
  translatedText: string;
  translationHash: string;
  takeId?: string;
  reviewStatus?: string;
  criticalFlags?: string[];
  provider?: string;
};

@Injectable()
export class StudioWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audio: AudioService,
    private readonly translate: TranslateService,
    private readonly audit: AuditService,
  ) {}

  private async projectOrThrow(auth: StudioAuth, projectId: string) {
    const project = await this.prisma.voiceStudioProject.findFirst({
      where: {
        id: projectId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
    if (!project) {
      throw new ApiException('not_found', 'Studio project not found', HttpStatus.NOT_FOUND);
    }
    return project;
  }

  private async editionOrThrow(auth: StudioAuth, editionId: string) {
    const edition = await this.prisma.studioEdition.findFirst({
      where: {
        id: editionId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
    if (!edition) {
      throw new ApiException('not_found', 'Edition not found', HttpStatus.NOT_FOUND);
    }
    return edition;
  }

  async createWorkspaceProject(
    auth: StudioAuth,
    body: {
      name?: string;
      description?: string;
      sourceLanguage?: string;
      reviewPolicy?: string;
    },
  ) {
    const name = body.name?.trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const project = await this.prisma.voiceStudioProject.create({
      data: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        name,
        description: body.description?.trim() || '',
        sourceLanguage: (body.sourceLanguage || 'en').trim(),
        reviewPolicy: body.reviewPolicy || 'independent_reviewer',
        ownerUserId: auth.userId ?? null,
        status: 'draft',
        timeline: [],
      },
    });
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_studio.workflow_project_create',
      route: 'POST /v1/voice-studio/workspace/projects',
      ip: auth.ip,
      metadata: { id: project.id, sourceLanguage: project.sourceLanguage },
    });
    return this.serializeProject(project);
  }

  async listWorkspaceProjects(auth: StudioAuth) {
    const rows = await this.prisma.voiceStudioProject.findMany({
      where: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        editions: { select: { id: true, languageVariety: true, status: true, voiceId: true } },
        releases: { select: { id: true }, take: 1 },
      },
    });
    return {
      product: 'lugemi-voice-studio-workspace',
      note:
        'Collaborative Voice Studio: script → translation → speech → native review → approved export. AI ratings are never native-speaker approval.',
      projects: rows.map((p) => ({
        ...this.serializeProject(p),
        editions: p.editions,
        hasRelease: p.releases.length > 0,
      })),
    };
  }

  async getWorkspaceProject(auth: StudioAuth, projectId: string) {
    const project = await this.projectOrThrow(auth, projectId);
    const [sources, editions, releases, pronunciations] = await Promise.all([
      this.prisma.studioSourceRevision.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.studioEdition.findMany({
        where: { projectId },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.studioRelease.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.studioPronunciationEntry.findMany({
        where: {
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          OR: [{ projectId }, { scope: 'tenant' }],
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
    ]);
    return {
      project: this.serializeProject(project),
      sourceRevisions: sources.map((s) => ({
        id: s.id,
        contentHash: s.contentHash,
        authorUserId: s.authorUserId,
        parentId: s.parentId,
        segmentCount: Array.isArray(s.segments) ? (s.segments as unknown[]).length : 0,
        createdAt: s.createdAt.toISOString(),
        scriptPreview: s.script.slice(0, 240),
      })),
      editions: editions.map((e) => this.serializeEdition(e)),
      releases: releases.map((r) => ({
        id: r.id,
        editionId: r.editionId,
        assemblyId: r.assemblyId,
        assemblyHash: r.assemblyHash,
        approverUserId: r.approverUserId,
        createdAt: r.createdAt.toISOString(),
      })),
      pronunciations: pronunciations.map((p) => ({
        id: p.id,
        scope: p.scope,
        languageVariety: p.languageVariety,
        writtenForm: p.writtenForm,
        representation: p.representation,
        value: p.value,
        status: p.status,
        revision: p.revision,
        compatibleModelIds: p.compatibleModelIds,
      })),
    };
  }

  async importScript(
    auth: StudioAuth,
    projectId: string,
    body: { script?: string; parentRevisionId?: string },
  ) {
    const project = await this.projectOrThrow(auth, projectId);
    const script = body.script?.normalize('NFC') ?? '';
    if (!script.trim()) {
      throw new ApiException('validation_error', 'script is required (UTF-8 text)', HttpStatus.BAD_REQUEST);
    }
    if ([...script].length > 50_000) {
      throw new ApiException(
        'validation_error',
        'Script limited to 50,000 characters in MVP',
        HttpStatus.BAD_REQUEST,
      );
    }
    const segments = segmentScript(script);
    const rev = await this.prisma.studioSourceRevision.create({
      data: {
        id: newId('ssr'),
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        projectId: project.id,
        script,
        contentHash: contentHash(script),
        authorUserId: auth.userId ?? null,
        parentId: body.parentRevisionId ?? null,
        segments: segments as object[],
      },
    });
    await this.prisma.voiceStudioProject.update({
      where: { id: project.id },
      data: {
        status: 'draft',
        timeline: segments.map((s) => ({
          id: s.stableId,
          text: s.text,
          language: project.sourceLanguage,
        })),
      },
    });
    return {
      sourceRevisionId: rev.id,
      contentHash: rev.contentHash,
      segments,
      note: 'Source revision is immutable. Edits create a new revision and stale dependent editions.',
    };
  }

  async createEdition(
    auth: StudioAuth,
    projectId: string,
    body: {
      sourceRevisionId?: string;
      languageVariety?: string;
      voiceId?: string;
      expectedRevision?: number;
    },
  ) {
    const project = await this.projectOrThrow(auth, projectId);
    const languageVariety = body.languageVariety?.trim();
    const voiceId = body.voiceId?.trim();
    if (!languageVariety || !voiceId) {
      throw new ApiException(
        'validation_error',
        'languageVariety and voiceId are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cap = capabilityForVoice({ voiceId, locale: languageVariety });
    const demoSafe = isDemoSafeVoice(voiceId, languageVariety);
    if (!demoSafe && cap.localEngine === 'formant') {
      throw new ApiException(
        'capability_unavailable',
        `Voice ${voiceId} / ${languageVariety} has no verified intelligible synthesis path (${cap.limitations})`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    let sourceRevisionId = body.sourceRevisionId;
    if (!sourceRevisionId) {
      const latest = await this.prisma.studioSourceRevision.findFirst({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!latest) {
        throw new ApiException(
          'validation_error',
          'Import a source script before creating an edition',
          HttpStatus.BAD_REQUEST,
        );
      }
      sourceRevisionId = latest.id;
    }

    const source = await this.prisma.studioSourceRevision.findFirst({
      where: { id: sourceRevisionId, projectId: project.id },
    });
    if (!source) {
      throw new ApiException('not_found', 'Source revision not found', HttpStatus.NOT_FOUND);
    }

    const sourceSegments = source.segments as unknown as ScriptSegment[];
    const edition = await this.prisma.studioEdition.create({
      data: {
        id: newId('sed'),
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        projectId: project.id,
        sourceRevisionId: source.id,
        languageVariety,
        voiceId,
        status: 'draft',
        segments: sourceSegments.map((s) => ({
          stableId: s.stableId,
          sourceText: s.text,
          translatedText: '',
          translationHash: '',
        })),
        selectedTakeIds: [],
        expectedRevision: 1,
        dictionaryHash: null,
      },
    });

    return {
      edition: this.serializeEdition(edition),
      capability: cap,
      note: demoSafe
        ? 'Edition uses a demo-safe or neural voice path. Native review still required for release approval.'
        : 'Edition created; verify neural checkpoint availability before generation.',
    };
  }

  async translateEdition(auth: StudioAuth, editionId: string, body: { expectedRevision?: number }) {
    const edition = await this.editionOrThrow(auth, editionId);
    this.assertRevision(edition.expectedRevision, body.expectedRevision);

    const project = await this.projectOrThrow(auth, edition.projectId);
    const source = await this.prisma.studioSourceRevision.findUniqueOrThrow({
      where: { id: edition.sourceRevisionId },
    });
    const sourceSegments = source.segments as unknown as ScriptSegment[];
    const next: EditionSegment[] = [];

    for (const seg of sourceSegments) {
      if (project.sourceLanguage.split('-')[0] === edition.languageVariety.split('-')[0]) {
        next.push({
          stableId: seg.stableId,
          sourceText: seg.text,
          translatedText: seg.text,
          translationHash: contentHash(seg.text),
          provider: 'identity',
          criticalFlags: [],
        });
        continue;
      }
      try {
        const out = await this.translate.translate({
          text: seg.text,
          source: project.sourceLanguage,
          target: edition.languageVariety.split('-')[0] || edition.languageVariety,
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          apiKeyId: auth.apiKeyId,
          userId: auth.userId,
          ip: auth.ip,
          skipReview: true,
        });
        const translated = out.text || seg.text;
        next.push({
          stableId: seg.stableId,
          sourceText: seg.text,
          translatedText: translated,
          translationHash: contentHash(translated),
          provider: out.provider,
          criticalFlags: criticalTermFlags(seg.text, translated),
        });
      } catch {
        // Soft sandbox / unsupported pair — keep source marked for human translation
        next.push({
          stableId: seg.stableId,
          sourceText: seg.text,
          translatedText: seg.text,
          translationHash: contentHash(seg.text),
          provider: 'passthrough_pending_human',
          criticalFlags: ['translation_unverified'],
        });
      }
    }

    const updated = await this.prisma.studioEdition.update({
      where: { id: edition.id },
      data: {
        segments: next as object[],
        status: 'draft',
        expectedRevision: edition.expectedRevision + 1,
        selectedTakeIds: [],
      },
    });

    // Mark prior takes stale — source/translation changed
    await this.prisma.studioAudioTake.updateMany({
      where: { editionId: edition.id },
      data: { stale: true },
    });

    return {
      edition: this.serializeEdition(updated),
      segments: next,
      note: 'Meaning review is separate from speech quality. Critical flags require human check before release.',
    };
  }

  async generateEdition(
    auth: StudioAuth,
    editionId: string,
    body: { expectedRevision?: number; segmentIds?: string[] },
  ) {
    const edition = await this.editionOrThrow(auth, editionId);
    this.assertRevision(edition.expectedRevision, body.expectedRevision);

    if (!isDemoSafeVoice(edition.voiceId, edition.languageVariety)) {
      const cap = capabilityForVoice({
        voiceId: edition.voiceId,
        locale: edition.languageVariety,
      });
      throw new ApiException(
        'capability_unavailable',
        `Cannot generate: ${cap.limitations}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const segments = edition.segments as unknown as EditionSegment[];
    const targets = body.segmentIds?.length
      ? segments.filter((s) => body.segmentIds!.includes(s.stableId))
      : segments;
    if (!targets.length) {
      throw new ApiException('validation_error', 'No segments to generate', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.voiceStudioProject.update({
      where: { id: edition.projectId },
      data: { status: 'generating' },
    });
    await this.prisma.studioEdition.update({
      where: { id: edition.id },
      data: { status: 'generating' },
    });

    const dictionary = await this.resolveDictionary(auth, edition.languageVariety, edition.projectId);
    const dictionaryHash = contentHash(JSON.stringify(dictionary));
    const takes = [];

    for (const seg of targets) {
      if (!seg.translatedText?.trim()) {
        throw new ApiException(
          'validation_error',
          `Segment ${seg.stableId} has no translation`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const rendered = applyPronunciationLexicon(
        seg.translatedText,
        dictionary.map((d) => ({ grapheme: d.writtenForm, alias: d.value })),
      );
      const spoken = await this.audio.speak({
        text: rendered,
        voice: edition.voiceId,
        language: edition.languageVariety,
        format: 'wav',
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        ip: auth.ip,
      });

      // Reject non-audio
      if (!spoken.audio || spoken.audio.length < 64) {
        throw new ApiException(
          'provider_error',
          'Speech engine returned empty/non-audio payload',
          HttpStatus.BAD_GATEWAY,
        );
      }
      const head = spoken.audio.toString('ascii', 0, 4);
      if (head === '{' || head === '<!DO' || spoken.mimeType.includes('json')) {
        throw new ApiException(
          'provider_error',
          'Speech engine returned non-audio payload; refusing to store',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const audioSha256 = createHash('sha256').update(spoken.audio).digest('hex');
      const take = await this.prisma.studioAudioTake.create({
        data: {
          id: newId('take'),
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          editionId: edition.id,
          stableSegmentId: seg.stableId,
          translationText: seg.translatedText,
          translationHash: seg.translationHash || contentHash(seg.translatedText),
          voiceId: edition.voiceId,
          modelVersion: spoken.provider || 'unknown',
          synthEngine: spoken.provider || 'unknown',
          verificationStatus: 'espeak_demo_or_neural',
          dictionaryHash,
          settings: { format: 'wav', renderedText: rendered },
          audioSha256,
          mimeType: spoken.mimeType || 'audio/wav',
          durationMs: estimateDurationMs(spoken.audio, spoken.mimeType),
          audioBase64: spoken.audio.toString('base64'),
          stale: false,
        },
      });
      takes.push(take);
      seg.takeId = take.id;
      seg.reviewStatus = 'pending_native_review';
    }

    const selectedTakeIds = segments
      .map((s) => s.takeId)
      .filter((id): id is string => Boolean(id));

    const updated = await this.prisma.studioEdition.update({
      where: { id: edition.id },
      data: {
        segments: segments as object[],
        selectedTakeIds,
        dictionaryHash,
        status: 'review_required',
        expectedRevision: edition.expectedRevision + 1,
      },
    });
    await this.prisma.voiceStudioProject.update({
      where: { id: edition.projectId },
      data: { status: 'review_required' },
    });

    return {
      edition: this.serializeEdition(updated),
      takes: takes.map((t) => ({
        id: t.id,
        stableSegmentId: t.stableSegmentId,
        audioSha256: t.audioSha256,
        mimeType: t.mimeType,
        durationMs: t.durationMs,
        voiceId: t.voiceId,
        verificationStatus: t.verificationStatus,
        syntheticSpeech: true,
      })),
      estimatedCharacters: targets.reduce((n, s) => n + [...s.translatedText].length, 0),
      note: 'Takes are drafts until native review + release approval. Synthetic speech labeled.',
    };
  }

  async regenerateSegment(
    auth: StudioAuth,
    editionId: string,
    body: {
      stableSegmentId?: string;
      translatedText?: string;
      expandContext?: boolean;
      expectedRevision?: number;
    },
  ) {
    const edition = await this.editionOrThrow(auth, editionId);
    this.assertRevision(edition.expectedRevision, body.expectedRevision);
    const stableSegmentId = body.stableSegmentId?.trim();
    if (!stableSegmentId) {
      throw new ApiException('validation_error', 'stableSegmentId is required', HttpStatus.BAD_REQUEST);
    }

    const segments = edition.segments as unknown as EditionSegment[];
    const idx = segments.findIndex((s) => s.stableId === stableSegmentId);
    if (idx < 0) {
      throw new ApiException('not_found', 'Segment not found on edition', HttpStatus.NOT_FOUND);
    }

    if (body.translatedText?.trim()) {
      segments[idx]!.translatedText = body.translatedText.normalize('NFC');
      segments[idx]!.translationHash = contentHash(segments[idx]!.translatedText);
      segments[idx]!.criticalFlags = criticalTermFlags(
        segments[idx]!.sourceText,
        segments[idx]!.translatedText,
      );
    }

    const ids = body.expandContext
      ? [segments[idx - 1]?.stableId, stableSegmentId, segments[idx + 1]?.stableId].filter(
          Boolean,
        ) as string[]
      : [stableSegmentId];

    const result = await this.generateEdition(auth, editionId, {
      expectedRevision: edition.expectedRevision + 1,
      segmentIds: ids,
    });

    return {
      ...result,
      regeneratedSegmentIds: ids,
      note: body.expandContext
        ? 'Expanded to neighboring segments for safer prosody joins. Full assembly reapproval required.'
        : 'Segment regenerated. Select the new take explicitly; prior assembly approvals are invalidated.',
    };
  }

  async reviewTake(
    auth: StudioAuth,
    takeId: string,
    body: {
      decision?: 'approved' | 'rejected' | 'changes_requested' | 'needs_adjudication';
      ratings?: Record<string, number>;
      qualifications?: string[];
      spanNotes?: unknown[];
      pronunciationNotes?: string;
      meaningNotes?: string;
      takeHash?: string;
    },
  ) {
    const take = await this.prisma.studioAudioTake.findFirst({
      where: {
        id: takeId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      include: { edition: true },
    });
    if (!take) {
      throw new ApiException('not_found', 'Take not found', HttpStatus.NOT_FOUND);
    }
    if (body.takeHash && body.takeHash !== take.audioSha256) {
      throw new ApiException(
        'conflict',
        'Stale take hash — reload the take before reviewing',
        HttpStatus.CONFLICT,
      );
    }
    if (take.stale) {
      throw new ApiException(
        'conflict',
        'Take is stale after a newer generation; review the current take',
        HttpStatus.CONFLICT,
      );
    }

    const reviewerUserId = auth.userId || 'api-key-reviewer';
    const project = await this.projectOrThrow(auth, take.edition.projectId);
    if (
      project.reviewPolicy === 'independent_reviewer' &&
      project.ownerUserId &&
      reviewerUserId === project.ownerUserId
    ) {
      throw new ApiException(
        'forbidden',
        'Independent review policy requires a different authorized reviewer from the producer',
        HttpStatus.FORBIDDEN,
      );
    }

    const clamp = (n: unknown) => Math.max(1, Math.min(5, Number(n) || 1));
    const ratings = {
      intelligibility: clamp(body.ratings?.intelligibility),
      naturalness: clamp(body.ratings?.naturalness),
      lexicalTone: clamp(body.ratings?.lexicalTone),
      varietyAuthenticity: clamp(body.ratings?.varietyAuthenticity),
      meaningPreservation: clamp(body.ratings?.meaningPreservation),
      joinQuality: clamp(body.ratings?.joinQuality),
    };

    const review = await this.prisma.studioNativeReview.create({
      data: {
        id: newId('snr'),
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        takeId: take.id,
        reviewerUserId,
        qualifications: body.qualifications ?? [],
        ratings,
        spanNotes: (body.spanNotes ?? []) as object[],
        pronunciationNotes: body.pronunciationNotes,
        meaningNotes: body.meaningNotes,
        decision: body.decision || 'needs_adjudication',
        takeHash: take.audioSha256,
        trainingEligible: false,
      },
    });

    const segments = take.edition.segments as unknown as EditionSegment[];
    for (const seg of segments) {
      if (seg.takeId === take.id) seg.reviewStatus = review.decision;
    }
    await this.prisma.studioEdition.update({
      where: { id: take.editionId },
      data: {
        segments: segments as object[],
        status:
          review.decision === 'approved'
            ? 'assembly_review'
            : review.decision === 'changes_requested'
              ? 'changes_requested'
              : 'review_required',
      },
    });

    return {
      review: {
        id: review.id,
        decision: review.decision,
        ratings: review.ratings,
        takeHash: review.takeHash,
        trainingEligible: false,
        note: 'AI checks may assist but cannot be presented as native-speaker validation.',
      },
    };
  }

  async assembleEdition(
    auth: StudioAuth,
    editionId: string,
    body: { takeIds?: string[]; pauseMs?: number; expectedRevision?: number },
  ) {
    const edition = await this.editionOrThrow(auth, editionId);
    this.assertRevision(edition.expectedRevision, body.expectedRevision);

    const takeIds =
      body.takeIds && body.takeIds.length > 0
        ? body.takeIds
        : ((edition.selectedTakeIds as string[]) || []).filter(Boolean);
    if (!takeIds.length) {
      throw new ApiException('validation_error', 'takeIds required', HttpStatus.BAD_REQUEST);
    }

    const takes = await this.prisma.studioAudioTake.findMany({
      where: {
        id: { in: takeIds },
        editionId: edition.id,
        organizationId: auth.organizationId,
        stale: false,
      },
    });
    if (takes.length !== takeIds.length) {
      throw new ApiException(
        'validation_error',
        'One or more takes missing, stale, or not on this edition',
        HttpStatus.BAD_REQUEST,
      );
    }

    const ordered = takeIds.map((id) => takes.find((t) => t.id === id)!);
    const buffers = ordered.map((t) => Buffer.from(t.audioBase64, 'base64'));
    const pauseMs = Math.max(0, Math.min(2000, body.pauseMs ?? 180));
    const assembled = concatWavWithSilence(buffers, pauseMs);
    const audioSha256 = createHash('sha256').update(assembled).digest('hex');
    const contentHashValue = contentHash(
      JSON.stringify({ takeIds, pauseMs, hashes: ordered.map((t) => t.audioSha256) }),
    );

    const assembly = await this.prisma.studioAssembly.create({
      data: {
        id: newId('asm'),
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        projectId: edition.projectId,
        editionId: edition.id,
        takeIds,
        settings: { pauseMs, sampleRate: 22050, channels: 1, bitDepth: 16 },
        audioSha256,
        mimeType: 'audio/wav',
        audioBase64: assembled.toString('base64'),
        contentHash: contentHashValue,
      },
    });

    await this.prisma.studioEdition.update({
      where: { id: edition.id },
      data: {
        selectedTakeIds: takeIds,
        status: 'assembly_review',
        expectedRevision: edition.expectedRevision + 1,
      },
    });
    await this.prisma.voiceStudioProject.update({
      where: { id: edition.projectId },
      data: { status: 'assembly_review' },
    });

    return {
      assembly: {
        id: assembly.id,
        audioSha256: assembly.audioSha256,
        contentHash: assembly.contentHash,
        mimeType: assembly.mimeType,
        takeIds,
        settings: assembly.settings,
      },
      note: 'Assembly is immutable. Approving creates a release pinned to this exact asset hash.',
    };
  }

  async approveRelease(
    auth: StudioAuth,
    assemblyId: string,
    body: { assemblyHash?: string; expectedEditionRevision?: number },
  ) {
    const assembly = await this.prisma.studioAssembly.findFirst({
      where: {
        id: assemblyId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      include: { edition: true, project: true },
    });
    if (!assembly) {
      throw new ApiException('not_found', 'Assembly not found', HttpStatus.NOT_FOUND);
    }
    if (body.assemblyHash && body.assemblyHash !== assembly.audioSha256) {
      throw new ApiException(
        'conflict',
        'Assembly hash mismatch — cannot approve a different asset',
        HttpStatus.CONFLICT,
      );
    }
    if (
      body.expectedEditionRevision != null &&
      body.expectedEditionRevision !== assembly.edition.expectedRevision
    ) {
      throw new ApiException(
        'conflict',
        'Edition revision changed; reassemble before approval',
        HttpStatus.CONFLICT,
      );
    }

    const approverUserId = auth.userId || 'api-key-approver';
    if (
      assembly.project.reviewPolicy === 'independent_reviewer' &&
      assembly.project.ownerUserId &&
      approverUserId === assembly.project.ownerUserId
    ) {
      throw new ApiException(
        'forbidden',
        'Independent review policy: producer cannot approve their own release',
        HttpStatus.FORBIDDEN,
      );
    }

    const existing = await this.prisma.studioRelease.findUnique({
      where: { assemblyId: assembly.id },
    });
    if (existing) {
      return { release: existing, note: 'Release already approved for this assembly hash.' };
    }

    const release = await this.prisma.studioRelease.create({
      data: {
        id: newId('rel'),
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        projectId: assembly.projectId,
        editionId: assembly.editionId,
        assemblyId: assembly.id,
        assemblyHash: assembly.audioSha256,
        policyVersion: 'studio-review-v1',
        approverUserId,
        producerUserId: assembly.project.ownerUserId,
      },
    });

    await this.prisma.studioEdition.update({
      where: { id: assembly.editionId },
      data: { status: 'release_approved' },
    });
    await this.prisma.voiceStudioProject.update({
      where: { id: assembly.projectId },
      data: { status: 'release_approved' },
    });

    return {
      release: {
        id: release.id,
        assemblyId: release.assemblyId,
        assemblyHash: release.assemblyHash,
        policyVersion: release.policyVersion,
        approverUserId: release.approverUserId,
        createdAt: release.createdAt.toISOString(),
      },
      note: 'Export pins this release. Later drafts do not alter this approved asset.',
    };
  }

  async exportRelease(auth: StudioAuth, releaseId: string, body: { format?: string }) {
    const release = await this.prisma.studioRelease.findFirst({
      where: {
        id: releaseId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      include: {
        assembly: true,
        edition: true,
        project: true,
      },
    });
    if (!release) {
      throw new ApiException('not_found', 'Release not found', HttpStatus.NOT_FOUND);
    }

    const format = body.format === 'wav' || !body.format ? 'wav' : body.format;
    if (format !== 'wav') {
      throw new ApiException(
        'validation_error',
        'MVP export supports wav master only',
        HttpStatus.BAD_REQUEST,
      );
    }

    const source = await this.prisma.studioSourceRevision.findUnique({
      where: { id: release.edition.sourceRevisionId },
    });
    const manifest = {
      releaseId: release.id,
      assemblyId: release.assemblyId,
      assemblyHash: release.assemblyHash,
      projectId: release.projectId,
      editionId: release.editionId,
      sourceRevisionId: release.edition.sourceRevisionId,
      sourceHash: source?.contentHash,
      languageVariety: release.edition.languageVariety,
      voiceId: release.edition.voiceId,
      dictionaryHash: release.edition.dictionaryHash,
      takeIds: release.assembly.takeIds,
      settings: release.assembly.settings,
      policyVersion: release.policyVersion,
      approverUserId: release.approverUserId,
      format: 'wav',
      sampleRate: 22050,
      channels: 1,
      bitDepth: 16,
      generatedAt: new Date().toISOString(),
      syntheticSpeech: true,
      note: 'Export approval is a quality-workflow record, not a legal certification. Native review required separately.',
    };

    const checksum = createHash('sha256')
      .update(release.assembly.audioBase64, 'utf8')
      .update(JSON.stringify(manifest))
      .digest('hex');

    const artifact = await this.prisma.studioExportArtifact.create({
      data: {
        id: newId('exp'),
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        releaseId: release.id,
        format: 'wav',
        checksum,
        manifest,
        audioBase64: release.assembly.audioBase64,
        mimeType: 'audio/wav',
      },
    });

    await this.prisma.voiceStudioProject.update({
      where: { id: release.projectId },
      data: { status: 'exported' },
    });
    await this.prisma.studioEdition.update({
      where: { id: release.editionId },
      data: { status: 'exported' },
    });

    return {
      export: {
        id: artifact.id,
        releaseId: release.id,
        format: artifact.format,
        checksum: artifact.checksum,
        mimeType: artifact.mimeType,
        manifest,
        audioBase64: artifact.audioBase64,
      },
    };
  }

  async getTakeAudio(auth: StudioAuth, takeId: string) {
    const take = await this.prisma.studioAudioTake.findFirst({
      where: {
        id: takeId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
    if (!take) {
      throw new ApiException('not_found', 'Take not found', HttpStatus.NOT_FOUND);
    }
    return take;
  }

  async getAssemblyAudio(auth: StudioAuth, assemblyId: string) {
    const assembly = await this.prisma.studioAssembly.findFirst({
      where: {
        id: assemblyId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
    if (!assembly) {
      throw new ApiException('not_found', 'Assembly not found', HttpStatus.NOT_FOUND);
    }
    return assembly;
  }

  async upsertPronunciationEntry(
    auth: StudioAuth,
    body: {
      writtenForm?: string;
      value?: string;
      languageVariety?: string;
      scope?: string;
      projectId?: string;
      representation?: string;
      compatibleModelIds?: string[];
      status?: string;
      notes?: string;
      id?: string;
    },
  ) {
    const writtenForm = body.writtenForm?.normalize('NFC').trim();
    const value = body.value?.normalize('NFC').trim();
    const languageVariety = body.languageVariety?.trim();
    if (!writtenForm || !value || !languageVariety) {
      throw new ApiException(
        'validation_error',
        'writtenForm, value, and languageVariety are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = {
      scope: body.scope || 'tenant',
      projectId: body.projectId ?? null,
      languageVariety,
      writtenForm,
      representation: body.representation || 'pronunciation_alias',
      value,
      compatibleModelIds: body.compatibleModelIds ?? [],
      status: body.status || 'awaiting_native_review',
      notes: body.notes?.trim() || '',
    };

    const row = body.id
      ? await this.prisma.studioPronunciationEntry.update({
          where: { id: body.id },
          data: { ...data, revision: { increment: 1 } },
        })
      : await this.prisma.studioPronunciationEntry.create({
          data: {
            id: newId('spe'),
            organizationId: auth.organizationId,
            workspaceId: auth.workspaceId,
            ...data,
            revision: 1,
          },
        });

    // Mirror approved aliases into classic lexicon for TTS path
    if (row.status === 'approved' && row.representation === 'pronunciation_alias') {
      await this.prisma.voiceStudioLexeme.upsert({
        where: {
          workspaceId_grapheme: {
            workspaceId: auth.workspaceId,
            grapheme: row.writtenForm,
          },
        },
        create: {
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          grapheme: row.writtenForm,
          alias: row.value,
          language: row.languageVariety,
          notes: `studio pronunciation rev ${row.revision}`,
        },
        update: {
          alias: row.value,
          language: row.languageVariety,
          notes: `studio pronunciation rev ${row.revision}`,
        },
      });
    }

    return {
      entry: row,
      note: 'Entry updates mark dependent takes stale only after regeneration; approved releases stay immutable.',
    };
  }

  async capabilities() {
    return {
      product: 'lugemi-voice-studio-workspace',
      workflow: [
        'create_project',
        'import_script',
        'create_edition',
        'translate',
        'generate',
        'native_review',
        'assemble',
        'approve_release',
        'export',
      ],
      deferred: [
        'video_dubbing',
        'lip_sync',
        'public_voice_marketplace',
        'live_calls',
        'unauthorized_voice_cloning',
      ],
      honesty:
        'Unsupported varieties return capability_unavailable. Fixture/formant audio never masquerades as native speech. Native review is human-only.',
      docs: '/docs/VOICE_STUDIO.md',
    };
  }

  private async resolveDictionary(
    auth: StudioAuth,
    languageVariety: string,
    projectId: string,
  ) {
    const rows = await this.prisma.studioPronunciationEntry.findMany({
      where: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        status: 'approved',
        OR: [
          { scope: 'project', projectId },
          { scope: 'tenant' },
          { languageVariety: { startsWith: languageVariety.split('-')[0] || languageVariety } },
        ],
      },
      orderBy: [{ scope: 'asc' }, { revision: 'desc' }],
    });
    // Precedence: project > tenant (first wins per writtenForm)
    const map = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = row.writtenForm.normalize('NFC').toLocaleLowerCase();
      if (row.scope === 'project') map.set(key, row);
      else if (!map.has(key)) map.set(key, row);
    }
    return [...map.values()];
  }

  private assertRevision(current: number, expected?: number) {
    if (expected != null && expected !== current) {
      throw new ApiException(
        'conflict',
        `expectedRevision ${expected} does not match current ${current}`,
        HttpStatus.CONFLICT,
      );
    }
  }

  private serializeProject(p: {
    id: string;
    name: string;
    description: string;
    sourceLanguage: string;
    status: string;
    reviewPolicy: string;
    ownerUserId: string | null;
    updatedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      sourceLanguage: p.sourceLanguage,
      status: p.status,
      reviewPolicy: p.reviewPolicy,
      ownerUserId: p.ownerUserId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private serializeEdition(e: {
    id: string;
    projectId: string;
    sourceRevisionId: string;
    languageVariety: string;
    voiceId: string;
    status: string;
    dictionaryHash: string | null;
    segments: unknown;
    selectedTakeIds: unknown;
    expectedRevision: number;
    updatedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: e.id,
      projectId: e.projectId,
      sourceRevisionId: e.sourceRevisionId,
      languageVariety: e.languageVariety,
      voiceId: e.voiceId,
      status: e.status,
      dictionaryHash: e.dictionaryHash,
      segments: e.segments,
      selectedTakeIds: e.selectedTakeIds,
      expectedRevision: e.expectedRevision,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

function estimateDurationMs(buf: Buffer, mimeType: string): number {
  if (mimeType.includes('wav') && buf.length > 44) {
    const byteRate = buf.readUInt32LE(28) || 44100;
    const dataSize = Math.max(0, buf.length - 44);
    return Math.round((dataSize / byteRate) * 1000);
  }
  return Math.max(500, Math.round(buf.length / 32));
}

/** Concatenate PCM WAV buffers with optional silence between clips. */
function concatWavWithSilence(buffers: Buffer[], pauseMs: number): Buffer {
  const pcms: Buffer[] = [];
  let sampleRate = 22050;
  for (const buf of buffers) {
    if (buf.toString('ascii', 0, 4) !== 'RIFF') {
      pcms.push(buf);
      continue;
    }
    sampleRate = buf.readUInt32LE(24) || sampleRate;
    pcms.push(buf.subarray(44));
  }
  const silenceSamples = Math.floor((sampleRate * pauseMs) / 1000);
  const silence = Buffer.alloc(silenceSamples * 2);
  const parts: Buffer[] = [];
  for (let i = 0; i < pcms.length; i++) {
    parts.push(pcms[i]!);
    if (i < pcms.length - 1 && silence.length) parts.push(silence);
  }
  const data = Buffer.concat(parts);
  const out = Buffer.alloc(44 + data.length);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + data.length, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(sampleRate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(data.length, 40);
  data.copy(out, 44);
  return out;
}
