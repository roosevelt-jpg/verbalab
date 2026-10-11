import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../common/errors/api-exception';
import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { LanguageAssuranceAdapters } from './assurance.adapters';
import { languageAssuranceCatalog } from './assurance.catalog';
import {
  runAudioIntegrityChecks,
  runCriticalInformationChecks,
  type AssuranceFinding,
} from './assurance.checks';
import {
  bundleHashFromParts,
  contentHash,
  hashAudioBuffer,
  hashText,
  mintEventId,
} from './assurance.hash';
import {
  ASSURANCE_CORRIDORS,
  LANGUAGE_ASSURANCE_CALIBRATION_VERSION,
  LANGUAGE_ASSURANCE_FEATURE,
  SYSTEM_POLICY_BUSINESS_AUDIO,
  SYSTEM_POLICY_PREVIEW,
  type AssuranceProduct,
  type CheckStage,
  type ContentCategory,
  type Disposition,
} from './assurance.types';

export type AssuranceActor = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  apiKeyId?: string;
  ip?: string;
};

@Injectable()
export class LanguageAssuranceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly adapters: LanguageAssuranceAdapters,
  ) {}

  catalog() {
    return languageAssuranceCatalog();
  }

  async assertEnabled(organizationId: string) {
    if (process.env.LANGUAGE_ASSURANCE_DISABLED === '1') {
      throw new ApiException(
        'feature_disabled',
        'Language Assurance is disabled by LANGUAGE_ASSURANCE_DISABLED=1',
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
    if (typeof overrides.languageAssurance === 'boolean') {
      if (!overrides.languageAssurance) {
        throw new ApiException(
          'feature_disabled',
          'Language Assurance is disabled for this organization',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }
    if (process.env.LANGUAGE_ASSURANCE_OPEN === '1') return;
    await this.billing.assertFeature(
      organizationId,
      LANGUAGE_ASSURANCE_FEATURE,
      'Language Assurance requires a plan with the languageAssurance entitlement (Pro+), or set featureOverrides.languageAssurance=true / LANGUAGE_ASSURANCE_OPEN=1.',
    );
  }

  private corridorOrThrow(id: string) {
    const corridor = ASSURANCE_CORRIDORS.find((c) => c.id === id);
    if (!corridor) {
      throw new ApiException(
        'unsupported_corridor',
        `Assurance corridor ${id} is not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return corridor;
  }

  private async ensureSystemPolicies() {
    for (const policy of [SYSTEM_POLICY_BUSINESS_AUDIO, SYSTEM_POLICY_PREVIEW]) {
      const existing = await this.prisma.assurancePolicySnapshot.findFirst({
        where: {
          organizationId: null,
          version: policy.version,
          task: policy.task,
          corridor: 'en-ak',
        },
      });
      if (!existing) {
        await this.prisma.assurancePolicySnapshot.create({
          data: {
            organizationId: null,
            version: policy.version,
            task: policy.task,
            corridor: 'en-ak',
            contentCategory: policy.contentCategory,
            requiredStages: policy.requiredStages,
            requireNativeReview: policy.requireNativeReview,
            allowOverrides: policy.allowOverrides,
            maxRetries: policy.maxRetries,
            budgetNote: policy.budgetNote,
            isSystem: true,
          },
        });
      }
      // Mirror for en-fr
      const fr = await this.prisma.assurancePolicySnapshot.findFirst({
        where: {
          organizationId: null,
          version: policy.version,
          task: policy.task,
          corridor: 'en-fr',
        },
      });
      if (!fr) {
        await this.prisma.assurancePolicySnapshot.create({
          data: {
            organizationId: null,
            version: policy.version,
            task: policy.task,
            corridor: 'en-fr',
            contentCategory: policy.contentCategory,
            requiredStages: policy.requiredStages,
            requireNativeReview: policy.requireNativeReview,
            allowOverrides: policy.allowOverrides,
            maxRetries: policy.maxRetries,
            budgetNote: policy.budgetNote,
            isSystem: true,
          },
        });
      }
    }
  }

  private async resolvePolicy(input: {
    organizationId: string;
    task: string;
    corridor: string;
    contentCategory: string;
    policyVersion?: string;
  }) {
    await this.ensureSystemPolicies();
    if (input.policyVersion) {
      const exact = await this.prisma.assurancePolicySnapshot.findFirst({
        where: {
          version: input.policyVersion,
          task: input.task,
          corridor: input.corridor,
          OR: [{ organizationId: input.organizationId }, { organizationId: null, isSystem: true }],
        },
        orderBy: { createdAt: 'desc' },
      });
      if (exact) return exact;
    }
    const byTask = await this.prisma.assurancePolicySnapshot.findFirst({
      where: {
        task: input.task,
        corridor: input.corridor,
        contentCategory: input.contentCategory,
        OR: [{ organizationId: input.organizationId }, { organizationId: null, isSystem: true }],
      },
      orderBy: [{ isSystem: 'asc' }, { createdAt: 'desc' }],
    });
    if (byTask) return byTask;

    // Fallback: business audio for announcements, preview otherwise
    const fallbackVersion =
      input.contentCategory === 'preview'
        ? SYSTEM_POLICY_PREVIEW.version
        : SYSTEM_POLICY_BUSINESS_AUDIO.version;
    const fallback = await this.prisma.assurancePolicySnapshot.findFirst({
      where: {
        version: fallbackVersion,
        corridor: input.corridor,
        organizationId: null,
        isSystem: true,
      },
    });
    if (!fallback) {
      throw new ApiException(
        'policy_unavailable',
        'No applicable Assurance policy snapshot',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return fallback;
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    runId: string,
    type: string,
    payload?: Prisma.InputJsonValue,
  ) {
    const count = await tx.assuranceEvent.count({ where: { runId } });
    return tx.assuranceEvent.create({
      data: {
        runId,
        sequence: count + 1,
        eventId: mintEventId(),
        type,
        payload: payload ?? undefined,
      },
    });
  }

  private async audit(input: {
    organizationId: string;
    runId?: string;
    actorId: string;
    operation: string;
    meta?: Prisma.InputJsonValue;
  }) {
    await this.prisma.assuranceAuditEvent.create({
      data: {
        organizationId: input.organizationId,
        runId: input.runId,
        actorId: input.actorId,
        operation: input.operation,
        meta: input.meta ?? undefined,
      },
    });
  }

  async createRun(
    actor: AssuranceActor,
    input: {
      product?: AssuranceProduct;
      contentCategory?: ContentCategory;
      corridor?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      sourceVariety?: string;
      targetVariety?: string;
      sourceText: string;
      targetText: string;
      audioBase64?: string;
      audioMimeType?: string;
      modelVersion?: string;
      voiceVersion?: string;
      terminology?: Record<string, string>;
      task?: string;
      policyVersion?: string;
      idempotencyKey: string;
      assignReviewerUserId?: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    if (!input.sourceText?.trim() || !input.targetText?.trim()) {
      throw new ApiException(
        'validation_error',
        'sourceText and targetText are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!input.idempotencyKey?.trim()) {
      throw new ApiException('validation_error', 'idempotencyKey is required', HttpStatus.BAD_REQUEST);
    }

    const corridor = this.corridorOrThrow(input.corridor ?? 'en-ak');
    const product = (input.product ?? 'generic') as AssuranceProduct;
    const contentCategory = (input.contentCategory ?? 'business_announcement') as ContentCategory;
    const task =
      input.task ??
      (contentCategory === 'preview' ? SYSTEM_POLICY_PREVIEW.task : SYSTEM_POLICY_BUSINESS_AUDIO.task);

    const existing = await this.prisma.assuranceVerificationRun.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId: actor.organizationId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      include: { bundle: true, findings: true, policy: true, reviews: true, releases: true },
    });
    if (existing) {
      const sourceTextHash = hashText(input.sourceText.trim());
      const targetTextHash = hashText(input.targetText.trim());
      if (
        existing.bundle.sourceTextHash !== sourceTextHash ||
        existing.bundle.targetTextHash !== targetTextHash
      ) {
        throw new ApiException(
          'idempotency_conflict',
          'Idempotency key reused with different artifact hashes',
          HttpStatus.CONFLICT,
        );
      }
      return this.runView(existing.id, actor);
    }

    let audioSha256: string | null = null;
    let audioStorageKey: string | null = null;
    if (input.audioBase64?.trim()) {
      const buf = Buffer.from(input.audioBase64, 'base64');
      if (buf.length > Number(process.env.LANGUAGE_ASSURANCE_MAX_AUDIO_BYTES ?? 5_000_000)) {
        throw new ApiException('validation_error', 'Audio exceeds size limit', HttpStatus.BAD_REQUEST);
      }
      audioSha256 = hashAudioBuffer(buf);
      audioStorageKey = `assurance://${actor.organizationId}/${audioSha256}`;
    }

    const sourceTextHash = hashText(input.sourceText.trim());
    const targetTextHash = hashText(input.targetText.trim());
    const bundleHash = bundleHashFromParts({
      sourceTextHash,
      targetTextHash,
      audioSha256,
      sourceLanguage: input.sourceLanguage ?? corridor.sourceLanguage,
      targetLanguage: input.targetLanguage ?? corridor.targetLanguage,
      product,
      contentCategory,
      corridor: corridor.id,
      modelVersion: input.modelVersion ?? null,
      voiceVersion: input.voiceVersion ?? null,
    });

    const policy = await this.resolvePolicy({
      organizationId: actor.organizationId,
      task,
      corridor: corridor.id,
      contentCategory,
      policyVersion: input.policyVersion,
    });

    const bundle = await this.prisma.assuranceArtifactBundle.upsert({
      where: {
        organizationId_bundleHash: {
          organizationId: actor.organizationId,
          bundleHash,
        },
      },
      create: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        product,
        contentCategory,
        corridor: corridor.id,
        sourceLanguage: input.sourceLanguage ?? corridor.sourceLanguage,
        targetLanguage: input.targetLanguage ?? corridor.targetLanguage,
        sourceVariety: input.sourceVariety,
        targetVariety: input.targetVariety,
        sourceText: input.sourceText.trim(),
        sourceTextHash,
        targetText: input.targetText.trim(),
        targetTextHash,
        audioStorageKey,
        audioSha256,
        audioMimeType: input.audioMimeType,
        modelVersion: input.modelVersion,
        voiceVersion: input.voiceVersion,
        terminologySnapshot: input.terminology ?? undefined,
        provenance: { createdById: actor.userId, product },
        bundleHash,
        createdById: actor.userId,
      },
      update: {},
    });

    const run = await this.prisma.assuranceVerificationRun.create({
      data: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        bundleId: bundle.id,
        policyId: policy.id,
        executionState: 'running',
        calibrationVersion: LANGUAGE_ASSURANCE_CALIBRATION_VERSION,
        idempotencyKey: input.idempotencyKey,
        createdById: actor.userId,
        startedAt: new Date(),
        unavailableChecks: [],
        stageStates: {},
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await this.appendEvent(tx, run.id, 'run.started', {
        bundleHash,
        policyVersion: policy.version,
      });
    });

    const requiredStages = policy.requiredStages as CheckStage[];
    const stageStates: Record<string, string> = {};
    const unavailable: string[] = [];
    const allFindings: AssuranceFinding[] = [];

    // Stage: structural / audio integrity
    if (requiredStages.includes('structural_audio_integrity')) {
      const integrity = runAudioIntegrityChecks({
        audioBase64: input.audioBase64,
        audioMimeType: input.audioMimeType,
        // Only require bytes when the caller attached audio. Text-only bundles skip this stage.
        requireAudio: Boolean(input.audioBase64),
      });
      if (integrity.unavailable === 'no_audio_provided' && !input.audioBase64) {
        stageStates.structural_audio_integrity = 'skipped_no_audio';
        unavailable.push('structural_audio_integrity:no_audio');
      } else {
        allFindings.push(...integrity.findings);
        stageStates.structural_audio_integrity = integrity.ok ? 'passed' : 'failed';
      }
    }

    // Stage: critical information
    if (requiredStages.includes('critical_information')) {
      const critical = runCriticalInformationChecks(bundle.sourceText, bundle.targetText);
      allFindings.push(...critical);
      stageStates.critical_information = critical.some((f) => f.severity === 'critical')
        ? 'failed'
        : 'passed';
    }

    // Stage: semantic fidelity
    if (requiredStages.includes('semantic_fidelity')) {
      const fidelity = await this.adapters.semanticFidelity({
        source: bundle.sourceText,
        target: bundle.targetText,
        sourceLanguage: bundle.sourceLanguage,
        targetLanguage: bundle.targetLanguage,
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        userId: actor.userId,
        ip: actor.ip,
      });
      if (fidelity.unavailable) {
        stageStates.semantic_fidelity = 'unavailable';
        unavailable.push(`semantic_fidelity:${fidelity.unavailable}`);
      } else {
        allFindings.push(...fidelity.findings);
        stageStates.semantic_fidelity = fidelity.findings.some((f) => f.severity === 'critical')
          ? 'failed'
          : 'passed';
      }
    }

    // Stage: spoken realization
    if (requiredStages.includes('spoken_realization')) {
      const spoken = await this.adapters.spokenRealization({
        approvedTargetText: bundle.targetText,
        audioBase64: input.audioBase64,
        audioMimeType: input.audioMimeType,
        language: bundle.targetLanguage,
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        apiKeyId: actor.apiKeyId,
        userId: actor.userId,
        ip: actor.ip,
      });
      if (spoken.unavailable) {
        stageStates.spoken_realization = 'unavailable';
        unavailable.push(`spoken_realization:${spoken.unavailable}`);
      } else {
        allFindings.push(...spoken.findings);
        stageStates.spoken_realization = spoken.findings.some((f) => f.severity === 'critical')
          ? 'failed'
          : 'passed';
      }
    }

    // Disposition (deterministic — models cannot approve)
    let disposition: Disposition = 'eligible_under_policy';
    const criticalFindings = allFindings.filter((f) => f.severity === 'critical');
    const requiredUnavailable = unavailable.filter((u) => {
      const stage = u.split(':')[0] as CheckStage;
      return requiredStages.includes(stage) && stage !== 'structural_audio_integrity';
    });
    // structural skipped_no_audio for text-only is OK; spoken unavailable when required is NOT a pass
    const spokenRequiredUnavailable = unavailable.some((u) => u.startsWith('spoken_realization:'));
    const fidelityUnavailable = unavailable.some((u) => u.startsWith('semantic_fidelity:'));

    if (criticalFindings.some((f) => f.category.includes('negation') || f.category.includes('quantity') || f.category.includes('currency'))) {
      disposition = 'needs_clarification';
    } else if (criticalFindings.length > 0 || Object.values(stageStates).includes('failed')) {
      disposition = 'blocked';
    } else if (
      (spokenRequiredUnavailable && requiredStages.includes('spoken_realization')) ||
      (fidelityUnavailable && requiredStages.includes('semantic_fidelity'))
    ) {
      disposition = 'indeterminate';
    } else if (policy.requireNativeReview || requiredStages.includes('native_review')) {
      disposition = 'human_review_required';
      stageStates.native_review = 'pending';
    } else {
      disposition = 'eligible_under_policy';
      if (requiredStages.includes('native_review')) stageStates.native_review = 'waived_by_policy';
    }

    const report = this.buildReport({
      runId: run.id,
      bundleHash: bundle.bundleHash,
      policyVersion: policy.version,
      disposition,
      stageStates,
      unavailable,
      findings: allFindings,
      calibrationVersion: LANGUAGE_ASSURANCE_CALIBRATION_VERSION,
    });
    const reportHash = contentHash(report.json);

    await this.prisma.$transaction(async (tx) => {
      for (const f of allFindings) {
        await tx.assuranceCheckFinding.create({
          data: {
            runId: run.id,
            stage: f.stage,
            category: f.category,
            severity: f.severity,
            sourceEvidence: f.sourceEvidence,
            targetEvidence: f.targetEvidence,
            audioTimestampMs: f.audioTimestampMs ?? undefined,
            uncertainty: f.uncertainty,
            scoreMeaning: f.scoreMeaning,
            reasonCode: f.reasonCode,
            evidence: (f.evidence as Prisma.InputJsonValue | undefined) ?? undefined,
          },
        });
      }

      if (disposition === 'human_review_required' && input.assignReviewerUserId) {
        await tx.assuranceReviewAssignment.create({
          data: {
            runId: run.id,
            reviewerUserId: input.assignReviewerUserId,
            language: bundle.targetLanguage,
            variety: bundle.targetVariety,
            scope: 'both',
            createdById: actor.userId,
          },
        });
        await this.appendEvent(tx, run.id, 'review.required', {
          reviewerUserId: input.assignReviewerUserId,
        });
      } else if (disposition === 'human_review_required') {
        await this.appendEvent(tx, run.id, 'review.required', {});
      }

      await tx.assuranceVerificationRun.update({
        where: { id: run.id },
        data: {
          executionState: 'completed',
          disposition,
          unavailableChecks: unavailable,
          stageStates,
          reportHash,
          reportMarkdown: report.markdown,
          reportJson: report.json as Prisma.InputJsonValue,
          modelVersions: {
            fidelity: 'lugemi-fidelity',
            calibration: LANGUAGE_ASSURANCE_CALIBRATION_VERSION,
          },
          completedAt: new Date(),
        },
      });

      await this.appendEvent(tx, run.id, 'run.completed', {
        disposition,
        reportHash,
      });
    });

    await this.audit({
      organizationId: actor.organizationId,
      runId: run.id,
      actorId: actor.userId,
      operation: 'run.create',
      meta: { disposition, bundleHash, policyVersion: policy.version },
    });

    return this.runView(run.id, actor);
  }

  private buildReport(input: {
    runId: string;
    bundleHash: string;
    policyVersion: string;
    disposition: Disposition;
    stageStates: Record<string, string>;
    unavailable: string[];
    findings: AssuranceFinding[];
    calibrationVersion: string;
  }) {
    const json = {
      runId: input.runId,
      artifactBundleHash: input.bundleHash,
      policyVersion: input.policyVersion,
      executionState: 'completed',
      disposition: input.disposition,
      calibrationVersion: input.calibrationVersion,
      stageStates: input.stageStates,
      findings: input.findings.map((f) => ({
        category: f.category,
        severity: f.severity,
        sourceEvidence: f.sourceEvidence,
        targetEvidence: f.targetEvidence,
        stage: f.stage,
        scoreMeaning: f.scoreMeaning,
        reasonCode: f.reasonCode,
        uncertainty: f.uncertainty,
      })),
      unavailableChecks: input.unavailable,
      requiresHumanReview: input.disposition === 'human_review_required',
      statement: `Eligible under policy ${input.policyVersion} only when disposition is eligible_under_policy for artifacts ${input.bundleHash.slice(0, 12)}… following listed checks. Not certified translation.`,
    };
    const markdown = [
      '# Language Assurance evidence report',
      '',
      `Run: \`${input.runId}\``,
      `Bundle: \`${input.bundleHash}\``,
      `Policy: \`${input.policyVersion}\``,
      `Disposition: **${input.disposition}**`,
      `Calibration: \`${input.calibrationVersion}\` (unmeasured until published)`,
      '',
      '## Stages',
      ...Object.entries(input.stageStates).map(([k, v]) => `- ${k}: ${v}`),
      '',
      '## Findings',
      ...(input.findings.length
        ? input.findings.map(
            (f) =>
              `- **${f.severity}** \`${f.category}\` (${f.stage}) — src “${f.sourceEvidence ?? '—'}” → tgt “${f.targetEvidence ?? '—'}”`,
          )
        : ['- None']),
      '',
      '## Unavailable checks',
      ...(input.unavailable.length ? input.unavailable.map((u) => `- ${u}`) : ['- None']),
      '',
      '> Automated checks support reviewers; they do not substitute for native judgment or participant confirmation.',
      '',
    ].join('\n');
    return { json, markdown };
  }

  async runView(runId: string, actor: AssuranceActor) {
    await this.assertEnabled(actor.organizationId);
    const run = await this.prisma.assuranceVerificationRun.findFirst({
      where: { id: runId, organizationId: actor.organizationId },
      include: {
        bundle: true,
        policy: true,
        findings: { orderBy: { createdAt: 'asc' } },
        assignments: true,
        reviews: { orderBy: { createdAt: 'asc' } },
        releases: true,
        events: { orderBy: { sequence: 'asc' }, take: 50 },
      },
    });
    if (!run) {
      throw new ApiException('not_found', 'Assurance run not found', HttpStatus.NOT_FOUND);
    }
    return {
      run: {
        id: run.id,
        executionState: run.executionState,
        disposition: run.disposition,
        calibrationVersion: run.calibrationVersion,
        unavailableChecks: run.unavailableChecks,
        stageStates: run.stageStates,
        reportHash: run.reportHash,
        idempotencyKey: run.idempotencyKey,
        createdAt: run.createdAt,
        completedAt: run.completedAt,
      },
      bundle: {
        id: run.bundle.id,
        product: run.bundle.product,
        contentCategory: run.bundle.contentCategory,
        corridor: run.bundle.corridor,
        sourceLanguage: run.bundle.sourceLanguage,
        targetLanguage: run.bundle.targetLanguage,
        sourceText: run.bundle.sourceText,
        targetText: run.bundle.targetText,
        sourceTextHash: run.bundle.sourceTextHash,
        targetTextHash: run.bundle.targetTextHash,
        audioSha256: run.bundle.audioSha256,
        bundleHash: run.bundle.bundleHash,
        modelVersion: run.bundle.modelVersion,
        voiceVersion: run.bundle.voiceVersion,
      },
      policy: {
        id: run.policy.id,
        version: run.policy.version,
        task: run.policy.task,
        requireNativeReview: run.policy.requireNativeReview,
        requiredStages: run.policy.requiredStages,
      },
      findings: run.findings,
      assignments: run.assignments,
      reviews: run.reviews,
      releases: run.releases,
      events: run.events,
      catalog: this.catalog(),
    };
  }

  async listRuns(actor: AssuranceActor) {
    await this.assertEnabled(actor.organizationId);
    const runs = await this.prisma.assuranceVerificationRun.findMany({
      where: { organizationId: actor.organizationId },
      include: { bundle: true, policy: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      runs: runs.map((r) => ({
        id: r.id,
        disposition: r.disposition,
        executionState: r.executionState,
        corridor: r.bundle.corridor,
        product: r.bundle.product,
        policyVersion: r.policy.version,
        bundleHash: r.bundle.bundleHash,
        createdAt: r.createdAt,
      })),
    };
  }

  async cancelRun(runId: string, actor: AssuranceActor) {
    await this.assertEnabled(actor.organizationId);
    const run = await this.prisma.assuranceVerificationRun.findFirst({
      where: { id: runId, organizationId: actor.organizationId },
    });
    if (!run) throw new ApiException('not_found', 'Run not found', HttpStatus.NOT_FOUND);
    if (['completed', 'cancelled', 'failed'].includes(run.executionState)) {
      throw new ApiException('conflict', 'Run already finished', HttpStatus.CONFLICT);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.assuranceVerificationRun.update({
        where: { id: runId },
        data: { executionState: 'cancelled', cancelledAt: new Date(), disposition: 'indeterminate' },
      });
      await this.appendEvent(tx, runId, 'run.failed', { reason: 'cancelled' });
    });
    await this.audit({
      organizationId: actor.organizationId,
      runId,
      actorId: actor.userId,
      operation: 'run.cancel',
    });
    return this.runView(runId, actor);
  }

  async getReport(runId: string, actor: AssuranceActor, format: 'json' | 'markdown' = 'json') {
    const view = await this.runView(runId, actor);
    const run = await this.prisma.assuranceVerificationRun.findFirstOrThrow({
      where: { id: runId, organizationId: actor.organizationId },
    });
    if (format === 'markdown') {
      return {
        format: 'markdown',
        reportHash: run.reportHash,
        body: run.reportMarkdown,
        note: 'Private evidence report. Distinguishes automated checks from human approval.',
      };
    }
    return {
      format: 'json',
      reportHash: run.reportHash,
      body: run.reportJson,
      note: 'Private evidence report. Distinguishes automated checks from human approval.',
    };
  }

  async assignReview(
    runId: string,
    actor: AssuranceActor,
    input: { reviewerUserId: string; scope?: 'translation' | 'speech' | 'both' },
  ) {
    await this.assertEnabled(actor.organizationId);
    const run = await this.prisma.assuranceVerificationRun.findFirst({
      where: { id: runId, organizationId: actor.organizationId },
      include: { bundle: true, policy: true },
    });
    if (!run) throw new ApiException('not_found', 'Run not found', HttpStatus.NOT_FOUND);
    if (!input.reviewerUserId?.trim()) {
      throw new ApiException('validation_error', 'reviewerUserId is required', HttpStatus.BAD_REQUEST);
    }
    if (input.reviewerUserId === run.createdById && run.policy.requireNativeReview) {
      throw new ApiException(
        'forbidden',
        'Independent reviewer required — producer cannot self-assign when policy requires native review',
        HttpStatus.FORBIDDEN,
      );
    }
    const assignment = await this.prisma.assuranceReviewAssignment.create({
      data: {
        runId,
        reviewerUserId: input.reviewerUserId,
        language: run.bundle.targetLanguage,
        variety: run.bundle.targetVariety,
        scope: input.scope ?? 'both',
        createdById: actor.userId,
      },
    });
    await this.prisma.$transaction(async (tx) => {
      await this.appendEvent(tx, runId, 'review.required', { assignmentId: assignment.id });
    });
    return { assignment, view: await this.runView(runId, actor) };
  }

  async submitReview(
    assignmentId: string,
    actor: AssuranceActor,
    input: {
      judgment: 'approve' | 'request_changes' | 'reject' | 'uncertain';
      sourceTextHash: string;
      targetTextHash: string;
      audioSha256?: string | null;
      meaningOk?: boolean;
      pronunciationOk?: boolean;
      toneOk?: boolean;
      naturalnessOk?: boolean;
      audioIntegrityOk?: boolean;
      notes?: string;
      correctionSuggestion?: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    const assignment = await this.prisma.assuranceReviewAssignment.findFirst({
      where: { id: assignmentId },
      include: { run: { include: { bundle: true, policy: true } } },
    });
    if (!assignment || assignment.run.organizationId !== actor.organizationId) {
      throw new ApiException('not_found', 'Review assignment not found', HttpStatus.NOT_FOUND);
    }
    if (assignment.reviewerUserId !== actor.userId) {
      throw new ApiException('forbidden', 'Only the assigned reviewer can submit', HttpStatus.FORBIDDEN);
    }
    if (assignment.status !== 'open') {
      throw new ApiException('conflict', 'Assignment already closed', HttpStatus.CONFLICT);
    }
    if (assignment.run.policy.requireNativeReview && assignment.reviewerUserId === assignment.run.createdById) {
      throw new ApiException(
        'forbidden',
        'Producer cannot self-approve under independent review policy',
        HttpStatus.FORBIDDEN,
      );
    }
    if (
      input.sourceTextHash !== assignment.run.bundle.sourceTextHash ||
      input.targetTextHash !== assignment.run.bundle.targetTextHash ||
      (assignment.run.bundle.audioSha256 &&
        input.audioSha256 &&
        input.audioSha256 !== assignment.run.bundle.audioSha256)
    ) {
      throw new ApiException(
        'stale_artifact',
        'Review rejected — artifact hashes do not match the current bundle',
        HttpStatus.CONFLICT,
      );
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const row = await tx.assuranceHumanReview.create({
        data: {
          organizationId: actor.organizationId,
          runId: assignment.runId,
          assignmentId: assignment.id,
          reviewerUserId: actor.userId,
          sourceTextHash: input.sourceTextHash,
          targetTextHash: input.targetTextHash,
          audioSha256: input.audioSha256 ?? assignment.run.bundle.audioSha256,
          judgment: input.judgment,
          meaningOk: input.meaningOk,
          pronunciationOk: input.pronunciationOk,
          toneOk: input.toneOk,
          naturalnessOk: input.naturalnessOk,
          audioIntegrityOk: input.audioIntegrityOk,
          notes: input.notes,
          correctionSuggestion: input.correctionSuggestion,
        },
      });
      await tx.assuranceReviewAssignment.update({
        where: { id: assignment.id },
        data: { status: 'completed' },
      });

      let disposition = assignment.run.disposition;
      const stageStates = {
        ...((assignment.run.stageStates as Record<string, string>) ?? {}),
        native_review: input.judgment,
      };
      if (input.judgment === 'approve') {
        disposition = 'eligible_under_policy';
      } else if (input.judgment === 'uncertain' || input.judgment === 'request_changes') {
        disposition = 'needs_clarification';
      } else {
        disposition = 'blocked';
      }

      const report = this.buildReport({
        runId: assignment.runId,
        bundleHash: assignment.run.bundle.bundleHash,
        policyVersion: assignment.run.policy.version,
        disposition: disposition as Disposition,
        stageStates,
        unavailable: (assignment.run.unavailableChecks as string[]) ?? [],
        findings: (
          await tx.assuranceCheckFinding.findMany({ where: { runId: assignment.runId } })
        ).map((f) => ({
          stage: f.stage,
          category: f.category,
          severity: f.severity as 'critical' | 'major' | 'minor',
          sourceEvidence: f.sourceEvidence ?? undefined,
          targetEvidence: f.targetEvidence ?? undefined,
          scoreMeaning: f.scoreMeaning,
          reasonCode: f.reasonCode ?? undefined,
          uncertainty: f.uncertainty ?? undefined,
        })),
        calibrationVersion: assignment.run.calibrationVersion,
      });

      await tx.assuranceVerificationRun.update({
        where: { id: assignment.runId },
        data: {
          disposition,
          stageStates,
          reportHash: contentHash(report.json),
          reportMarkdown: report.markdown,
          reportJson: report.json as Prisma.InputJsonValue,
        },
      });
      await this.appendEvent(tx, assignment.runId, 'review.completed', {
        judgment: input.judgment,
        reviewId: row.id,
      });
      return row;
    });

    await this.audit({
      organizationId: actor.organizationId,
      runId: assignment.runId,
      actorId: actor.userId,
      operation: 'review.submit',
      meta: { judgment: input.judgment, reviewId: review.id },
    });

    return { review, view: await this.runView(assignment.runId, actor) };
  }

  async releaseEvidence(
    runId: string,
    actor: AssuranceActor,
    input: { reason?: string },
  ) {
    await this.assertEnabled(actor.organizationId);
    const run = await this.prisma.assuranceVerificationRun.findFirst({
      where: { id: runId, organizationId: actor.organizationId },
      include: { bundle: true, policy: true, reviews: true },
    });
    if (!run) throw new ApiException('not_found', 'Run not found', HttpStatus.NOT_FOUND);
    if (run.executionState !== 'completed') {
      throw new ApiException('conflict', 'Run must be completed', HttpStatus.CONFLICT);
    }
    if (run.disposition !== 'eligible_under_policy') {
      throw new ApiException(
        'conflict',
        `Release evidence requires eligible_under_policy; current disposition is ${run.disposition}`,
        HttpStatus.CONFLICT,
      );
    }
    if (!run.reportHash) {
      throw new ApiException('conflict', 'Report hash missing', HttpStatus.CONFLICT);
    }
    if (run.policy.requireNativeReview && !run.reviews.some((r) => r.judgment === 'approve')) {
      throw new ApiException(
        'conflict',
        'Native approval required before release evidence',
        HttpStatus.CONFLICT,
      );
    }

    const evidenceHash = contentHash({
      runId,
      bundleHash: run.bundle.bundleHash,
      reportHash: run.reportHash,
      policyVersion: run.policy.version,
      disposition: run.disposition,
      decidedById: actor.userId,
    });

    const existing = await this.prisma.assuranceReleaseEvidence.findUnique({
      where: {
        runId_bundleHash_reportHash: {
          runId,
          bundleHash: run.bundle.bundleHash,
          reportHash: run.reportHash,
        },
      },
    });
    if (existing) {
      return { release: existing, note: 'Idempotent replay of release evidence.' };
    }

    const release = await this.prisma.assuranceReleaseEvidence.create({
      data: {
        runId,
        bundleHash: run.bundle.bundleHash,
        reportHash: run.reportHash,
        policyVersion: run.policy.version,
        disposition: run.disposition!,
        decidedById: actor.userId,
        reason: input.reason,
        evidenceHash,
      },
    });
    await this.prisma.$transaction(async (tx) => {
      await this.appendEvent(tx, runId, 'release_evidence.ready', { evidenceHash });
    });
    await this.audit({
      organizationId: actor.organizationId,
      runId,
      actorId: actor.userId,
      operation: 'release.evidence',
      meta: { evidenceHash },
    });
    return {
      release,
      note: `Eligible under policy ${run.policy.version} for artifacts ${run.bundle.bundleHash.slice(0, 12)}… following listed checks.`,
    };
  }

  async createPolicy(
    actor: AssuranceActor,
    input: {
      version: string;
      task: string;
      corridor: string;
      contentCategory: ContentCategory;
      requiredStages: CheckStage[];
      requireNativeReview?: boolean;
      maxRetries?: number;
      budgetNote?: string;
    },
  ) {
    await this.assertEnabled(actor.organizationId);
    this.corridorOrThrow(input.corridor);
    if (!input.version?.trim() || !input.task?.trim()) {
      throw new ApiException('validation_error', 'version and task are required', HttpStatus.BAD_REQUEST);
    }
    if (!Array.isArray(input.requiredStages) || input.requiredStages.length === 0) {
      throw new ApiException(
        'validation_error',
        'requiredStages must be a non-empty array',
        HttpStatus.BAD_REQUEST,
      );
    }
    const policy = await this.prisma.assurancePolicySnapshot.create({
      data: {
        organizationId: actor.organizationId,
        version: input.version.trim(),
        task: input.task.trim(),
        corridor: input.corridor,
        contentCategory: input.contentCategory,
        requiredStages: input.requiredStages,
        requireNativeReview: input.requireNativeReview ?? true,
        allowOverrides: false,
        maxRetries: input.maxRetries ?? 1,
        budgetNote: input.budgetNote,
        isSystem: false,
        createdById: actor.userId,
      },
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorId: actor.userId,
      operation: 'policy.create',
      meta: { policyId: policy.id, version: policy.version },
    });
    return { policy };
  }

  async listReviewQueue(actor: AssuranceActor) {
    await this.assertEnabled(actor.organizationId);
    const assignments = await this.prisma.assuranceReviewAssignment.findMany({
      where: { reviewerUserId: actor.userId, status: 'open' },
      include: {
        run: { include: { bundle: true, findings: true, policy: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return {
      assignments: assignments
        .filter((a) => a.run.organizationId === actor.organizationId)
        .map((a) => ({
          id: a.id,
          runId: a.runId,
          scope: a.scope,
          language: a.language,
          disposition: a.run.disposition,
          policyVersion: a.run.policy.version,
          sourceText: a.run.bundle.sourceText,
          targetText: a.run.bundle.targetText,
          sourceTextHash: a.run.bundle.sourceTextHash,
          targetTextHash: a.run.bundle.targetTextHash,
          audioSha256: a.run.bundle.audioSha256,
          findings: a.run.findings,
        })),
    };
  }

  /** Voice Studio integration: verify take/translation/audio as a bundle. */
  async verifyVoiceStudioTake(
    actor: AssuranceActor,
    input: {
      sourceText: string;
      targetText: string;
      audioBase64?: string;
      audioMimeType?: string;
      audioSha256?: string;
      voiceVersion?: string;
      modelVersion?: string;
      corridor?: string;
      idempotencyKey: string;
      assignReviewerUserId?: string;
    },
  ) {
    if (input.audioBase64 && input.audioSha256) {
      const actual = hashAudioBuffer(Buffer.from(input.audioBase64, 'base64'));
      if (actual !== input.audioSha256) {
        throw new ApiException(
          'validation_error',
          'audioSha256 does not match provided audio bytes',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return this.createRun(actor, {
      product: 'voice_studio',
      contentCategory: 'business_announcement',
      corridor: input.corridor ?? 'en-ak',
      sourceText: input.sourceText,
      targetText: input.targetText,
      audioBase64: input.audioBase64,
      audioMimeType: input.audioMimeType,
      voiceVersion: input.voiceVersion,
      modelVersion: input.modelVersion,
      task: SYSTEM_POLICY_BUSINESS_AUDIO.task,
      idempotencyKey: input.idempotencyKey,
      assignReviewerUserId: input.assignReviewerUserId,
    });
  }
}
