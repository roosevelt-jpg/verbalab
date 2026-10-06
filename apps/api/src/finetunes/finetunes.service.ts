import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { EvalService } from '../eval/eval.service';
import { GOLDEN_PAIRS, pairKey } from '../eval/goldens';
import { GatewayService } from '../gateway/gateway.service';
import { FineTuneTranslateAdapter } from './finetune-translate.adapter';
import {
  DEFAULT_FINETUNE_BASE_MODEL,
  FINETUNE_FAIL_CHAR_SIM_MAX,
  FINETUNE_FAIL_EXACT_MATCH_MAX,
  isFineTuneArtifactKind,
  isFineTuneLauncher,
  type ReadyFineTuneRoute,
} from './finetune.types';
import {
  newCallbackToken,
  resolveTrainingLauncher,
} from '../training/training-launchers';

@Injectable()
export class FineTunesService implements OnModuleInit {
  private readonly logger = new Logger(FineTunesService.name);
  private readonly readyByPair = new Map<string, ReadyFineTuneRoute>();
  private launcherOverride: ReturnType<typeof resolveTrainingLauncher> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly evalService: EvalService,
    private readonly billing: BillingService,
    private readonly audit: AuditService,
    private readonly gateway: GatewayService,
  ) {}

  /** Test hook — inject a launcher without env credentials. */
  setLauncherForTests(launcher: ReturnType<typeof resolveTrainingLauncher> | null) {
    this.launcherOverride = launcher;
  }

  private publicApiBase(): string {
    return (process.env.API_PUBLIC_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
  }

  private callbackUrl(): string {
    return `${this.publicApiBase()}/v1/training-jobs/callback`;
  }

  launcherStatus() {
    const names = ['manual', 'modal', 'vertex', 'fixture'] as const;
    return {
      callbackUrl: this.callbackUrl(),
      launchers: names.map((name) => {
        const launcher = resolveTrainingLauncher(name);
        return {
          name,
          configured: launcher.isConfigured(),
          notes:
            name === 'manual'
              ? 'Default. Attach artifacts after external GPU training.'
              : name === 'modal'
                ? 'Needs MODAL_TOKEN_ID, MODAL_TOKEN_SECRET, MODAL_LAUNCH_URL'
                : name === 'vertex'
                  ? 'Needs VERTEX_LAUNCH_URL, VERTEX_ACCESS_TOKEN'
                  : 'Needs TRAINING_FIXTURE=1 (CI only)',
        };
      }),
    };
  }

  async onModuleInit() {
    await this.refreshReadyCache();
    this.gateway.setFineTuneRouting({
      resolve: (source, target) => this.resolveReady(source, target),
      adapter: new FineTuneTranslateAdapter(),
    });
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required for fine-tunes',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private pairMapKey(sourceLang: string, targetLang: string) {
    return `${sourceLang}:${targetLang}`;
  }

  resolveReady(sourceLang: string, targetLang: string): ReadyFineTuneRoute | null {
    return this.readyByPair.get(this.pairMapKey(sourceLang, targetLang)) ?? null;
  }

  async refreshReadyCache() {
    const rows = await this.prisma.modelRegistryEntry.findMany({
      where: { feature: 'translate', status: 'ready', kind: 'finetune' },
    });
    this.readyByPair.clear();
    for (const row of rows) {
      if (!isFineTuneArtifactKind(row.artifactKind)) continue;
      this.readyByPair.set(this.pairMapKey(row.sourceLang, row.targetLang), {
        id: row.id,
        slug: row.slug,
        sourceLang: row.sourceLang,
        targetLang: row.targetLang,
        artifactKind: row.artifactKind,
        artifactUri: row.artifactUri,
        baseModel: row.baseModel,
      });
    }
  }

  /** Pairs where coverage shows vendor metrics below thresholds. */
  listCandidates() {
    const snapshot = this.evalService.getSnapshot();
    const focus = new Set(
      GOLDEN_PAIRS.map((p) => pairKey(p.sourceLang, p.targetLang)),
    );

    const fromSnapshot = (snapshot?.pairs ?? []).map((p) => {
      const key = pairKey(p.sourceLang, p.targetLang);
      const failed =
        p.exactMatchRate < FINETUNE_FAIL_EXACT_MATCH_MAX ||
        p.meanCharSimilarity < FINETUNE_FAIL_CHAR_SIM_MAX;
      return {
        sourceLang: p.sourceLang,
        targetLang: p.targetLang,
        pairKey: key,
        failed,
        reason: failed
          ? `exactMatchRate=${p.exactMatchRate} (<${FINETUNE_FAIL_EXACT_MATCH_MAX}) or meanCharSimilarity=${p.meanCharSimilarity} (<${FINETUNE_FAIL_CHAR_SIM_MAX})`
          : null,
        exactMatchRate: p.exactMatchRate as number | null,
        meanCharSimilarity: p.meanCharSimilarity as number | null,
        segmentCount: p.segmentCount,
        hasGolden: focus.has(key),
        asOf: snapshot?.asOf ?? null,
        mode: snapshot?.mode ?? null,
      };
    });

    const known = new Set(fromSnapshot.map((r) => r.pairKey));
    for (const pair of GOLDEN_PAIRS) {
      const key = pairKey(pair.sourceLang, pair.targetLang);
      if (known.has(key)) continue;
      fromSnapshot.push({
        sourceLang: pair.sourceLang,
        targetLang: pair.targetLang,
        pairKey: key,
        failed: true,
        reason:
          'No coverage snapshot yet — treat golden focus pairs as candidates until evaluated',
        exactMatchRate: null,
        meanCharSimilarity: null,
        segmentCount: pair.segments.length,
        hasGolden: true,
        asOf: null,
        mode: null,
      });
    }

    return {
      thresholds: {
        exactMatchRateMax: FINETUNE_FAIL_EXACT_MATCH_MAX,
        meanCharSimilarityMax: FINETUNE_FAIL_CHAR_SIM_MAX,
      },
      disclaimer:
        'Candidates are heuristic flags from tiny golden reference metrics — not a mandate to train.',
      candidates: fromSnapshot.filter((c) => c.failed),
      all: fromSnapshot,
    };
  }

  packsDir() {
    return join(process.cwd(), 'eval', 'finetune-packs');
  }

  exportTrainingPack(sourceLang: string, targetLang: string) {
    const pair = GOLDEN_PAIRS.find(
      (p) => p.sourceLang === sourceLang && p.targetLang === targetLang,
    );
    if (!pair) {
      throw new ApiException(
        'not_found',
        `No golden pack for ${sourceLang}→${targetLang}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const dir = this.packsDir();
    mkdirSync(dir, { recursive: true });
    const jsonlPath = join(dir, `${sourceLang}-${targetLang}.jsonl`);
    const phraseMapPath = join(dir, `${sourceLang}-${targetLang}.phrase-map.json`);

    const lines = pair.segments.map((s) =>
      JSON.stringify({ source: s.source, target: s.reference, id: s.id }),
    );
    writeFileSync(jsonlPath, `${lines.join('\n')}\n`, 'utf8');

    const phraseMap = {
      sourceLang,
      targetLang,
      baseModel: DEFAULT_FINETUNE_BASE_MODEL,
      entries: pair.segments.map((s) => ({ source: s.source, target: s.reference })),
    };
    writeFileSync(phraseMapPath, `${JSON.stringify(phraseMap, null, 2)}\n`, 'utf8');

    return { jsonlPath, phraseMapPath, segmentCount: pair.segments.length };
  }

  listJobs(organizationId: string) {
    return this.prisma.fineTuneJob.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { modelEntry: true },
    });
  }

  listModels() {
    return this.prisma.modelRegistryEntry.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createJob(input: {
    organizationId: string;
    userId?: string;
    role: string;
    sourceLang: string;
    targetLang: string;
    launcher?: string;
    baseModel?: string;
    datasetAssetId?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    if (!input.sourceLang?.trim() || !input.targetLang?.trim()) {
      throw new ApiException(
        'validation_error',
        'sourceLang and targetLang are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const launcher = input.launcher ?? 'manual';
    if (!isFineTuneLauncher(launcher)) {
      throw new ApiException(
        'validation_error',
        'launcher must be manual, modal, vertex, or fixture',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (launcher === 'fixture' && process.env.TRAINING_FIXTURE !== '1') {
      throw new ApiException(
        'validation_error',
        'fixture launcher requires TRAINING_FIXTURE=1',
        HttpStatus.BAD_REQUEST,
      );
    }

    let datasetAssetId: string | undefined;
    if (input.datasetAssetId) {
      const asset = await this.prisma.datasetAsset.findFirst({
        where: { id: input.datasetAssetId, organizationId: input.organizationId },
      });
      if (!asset) {
        throw new ApiException(
          'not_found',
          'Dataset asset not found in this organization',
          HttpStatus.NOT_FOUND,
        );
      }
      datasetAssetId = asset.id;
    }

    const pack = this.exportTrainingPack(input.sourceLang, input.targetLang);
    const job = await this.prisma.fineTuneJob.create({
      data: {
        organizationId: input.organizationId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        baseModel: input.baseModel ?? DEFAULT_FINETUNE_BASE_MODEL,
        launcher,
        status: 'queued',
        trainingPackPath: pack.jsonlPath,
        datasetAssetId,
        createdByUserId: input.userId,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'finetune.job_created',
      route: 'POST /v1/training-jobs',
      ip: input.ip,
      metadata: {
        jobId: job.id,
        sourceLang: job.sourceLang,
        targetLang: job.targetLang,
        launcher,
        datasetAssetId: datasetAssetId ?? null,
      },
    });

    return { ...job, trainingPack: pack };
  }

  async getJob(organizationId: string, jobId: string) {
    const job = await this.prisma.fineTuneJob.findFirst({
      where: { id: jobId, organizationId },
      include: { modelEntry: true, datasetAsset: true },
    });
    if (!job) {
      throw new ApiException('not_found', 'Training job not found', HttpStatus.NOT_FOUND);
    }
    return job;
  }

  async launchJob(input: {
    organizationId: string;
    userId?: string;
    role: string;
    jobId: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    const job = await this.prisma.fineTuneJob.findFirst({
      where: { id: input.jobId, organizationId: input.organizationId },
    });
    if (!job) {
      throw new ApiException('not_found', 'Fine-tune job not found', HttpStatus.NOT_FOUND);
    }
    if (!job.trainingPackPath) {
      throw new ApiException(
        'validation_error',
        'Job has no training pack path',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!isFineTuneLauncher(job.launcher)) {
      throw new ApiException(
        'validation_error',
        `Unsupported launcher: ${job.launcher}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const callbackToken = newCallbackToken();
    const launcher =
      this.launcherOverride?.name === job.launcher
        ? this.launcherOverride
        : resolveTrainingLauncher(job.launcher);

    try {
      const launched = await launcher.launch({
        jobId: job.id,
        organizationId: job.organizationId,
        sourceLang: job.sourceLang,
        targetLang: job.targetLang,
        baseModel: job.baseModel,
        trainingPackPath: job.trainingPackPath,
        callbackUrl: this.callbackUrl(),
        callbackToken,
      });

      const updated = await this.prisma.fineTuneJob.update({
        where: { id: job.id },
        data: {
          status: launched.status,
          externalJobId: launched.externalJobId,
          callbackToken,
          errorMessage: launched.message ?? null,
          providerMeta: (launched.providerMeta ?? { launcher: job.launcher }) as Prisma.InputJsonValue,
          startedAt: launched.status === 'running' ? new Date() : null,
        },
      });

      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'training.job_launched',
        route: `POST /v1/training-jobs/${job.id}/launch`,
        ip: input.ip,
        metadata: {
          jobId: job.id,
          status: launched.status,
          externalJobId: launched.externalJobId,
          launcher: job.launcher,
        },
      });

      return {
        ...updated,
        callbackUrl: this.callbackUrl(),
        // Returned once so rented GPU workers can authenticate the callback.
        callbackToken,
      };
    } catch (error) {
      const message =
        error instanceof ApiException
          ? String(error.message)
          : error instanceof Error
            ? error.message
            : 'Launch failed';
      this.logger.warn(JSON.stringify({ event: 'training.launch_deferred', jobId: job.id, message }));
      return this.prisma.fineTuneJob.update({
        where: { id: job.id },
        data: {
          status: 'awaiting_gpu',
          errorMessage: message,
          callbackToken,
          providerMeta: { launcher: job.launcher, deferred: true } as Prisma.InputJsonValue,
        },
      });
    }
  }

  /**
   * Rented-GPU cloud callback — authenticated by per-job callbackToken (not Clerk).
   */
  async handleCallback(input: {
    jobId: string;
    callbackToken: string;
    status: 'succeeded' | 'failed';
    artifactKind?: string;
    artifactUri?: string;
    useGoldenPhraseMap?: boolean;
    errorMessage?: string;
    metricsJson?: Prisma.InputJsonValue;
    promote?: boolean;
  }) {
    const job = await this.prisma.fineTuneJob.findUnique({ where: { id: input.jobId } });
    if (!job || !job.callbackToken || job.callbackToken !== input.callbackToken) {
      throw new ApiException('unauthorized', 'Invalid training callback token', HttpStatus.UNAUTHORIZED);
    }

    if (input.status === 'failed') {
      return this.prisma.fineTuneJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorMessage: input.errorMessage ?? 'Remote training reported failure',
          finishedAt: new Date(),
          metricsJson: input.metricsJson ?? undefined,
        },
      });
    }

    return this.completeJob({
      organizationId: job.organizationId,
      role: 'owner',
      jobId: job.id,
      artifactKind: input.artifactKind ?? 'phrase_map',
      artifactUri: input.artifactUri,
      useGoldenPhraseMap: input.useGoldenPhraseMap ?? !input.artifactUri,
      promote: input.promote !== false,
      skipBillingAssert: true,
    });
  }

  async completeJob(input: {
    organizationId: string;
    userId?: string;
    role: string;
    jobId: string;
    artifactKind: string;
    artifactUri?: string;
    useGoldenPhraseMap?: boolean;
    promote?: boolean;
    displayName?: string;
    ip?: string;
    skipBillingAssert?: boolean;
  }) {
    this.assertOwnerOrAdmin(input.role);
    if (!input.skipBillingAssert) {
      await this.billing.assertPro(input.organizationId);
    }

    if (!isFineTuneArtifactKind(input.artifactKind)) {
      throw new ApiException(
        'validation_error',
        'artifactKind must be phrase_map or http_endpoint',
        HttpStatus.BAD_REQUEST,
      );
    }

    const job = await this.prisma.fineTuneJob.findFirst({
      where: { id: input.jobId, organizationId: input.organizationId },
    });
    if (!job) {
      throw new ApiException('not_found', 'Fine-tune job not found', HttpStatus.NOT_FOUND);
    }

    let artifactUri = input.artifactUri?.trim() ?? '';
    if (input.useGoldenPhraseMap || (!artifactUri && input.artifactKind === 'phrase_map')) {
      const pack = this.exportTrainingPack(job.sourceLang, job.targetLang);
      artifactUri = pack.phraseMapPath;
    }
    if (!artifactUri) {
      throw new ApiException(
        'validation_error',
        'artifactUri is required (or useGoldenPhraseMap for phrase_map)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const promote = input.promote !== false;
    const slug = `ft-${job.sourceLang}-${job.targetLang}-${job.id.slice(-6)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedJob = await tx.fineTuneJob.update({
        where: { id: job.id },
        data: {
          status: 'succeeded',
          artifactKind: input.artifactKind,
          artifactUri,
          errorMessage: null,
          finishedAt: new Date(),
        },
      });

      if (promote) {
        await tx.modelRegistryEntry.updateMany({
          where: {
            feature: 'translate',
            kind: 'finetune',
            sourceLang: job.sourceLang,
            targetLang: job.targetLang,
            status: 'ready',
          },
          data: { status: 'retired' },
        });

        const entry = await tx.modelRegistryEntry.create({
          data: {
            slug,
            displayName:
              input.displayName ??
              `Fine-tune ${job.sourceLang}→${job.targetLang} (${job.baseModel})`,
            feature: 'translate',
            kind: 'finetune',
            provider: 'finetune',
            sourceLang: job.sourceLang,
            targetLang: job.targetLang,
            baseModel: job.baseModel,
            status: 'ready',
            artifactKind: input.artifactKind,
            artifactUri,
            fineTuneJobId: job.id,
            notes: 'Promoted fine-tune; pair-routed ahead of vendor MT when ready.',
            metricsJson: {
              note: 'Promoted from manual/rented fine-tune job; re-run coverage to measure.',
            } as Prisma.InputJsonValue,
          },
        });
        return { job: updatedJob, model: entry };
      }

      return { job: updatedJob, model: null };
    });

    await this.refreshReadyCache();

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'finetune.job_completed',
      route: `POST /v1/finetunes/jobs/${job.id}/complete`,
      ip: input.ip,
      metadata: {
        jobId: job.id,
        artifactKind: input.artifactKind,
        modelId: result.model?.id ?? null,
      },
    });

    return result;
  }

  async retireModel(input: {
    organizationId: string;
    userId?: string;
    role: string;
    modelId: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    const model = await this.prisma.modelRegistryEntry.findUnique({
      where: { id: input.modelId },
    });
    if (!model) {
      throw new ApiException('not_found', 'Model not found', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.modelRegistryEntry.update({
      where: { id: model.id },
      data: { status: 'retired' },
    });
    await this.refreshReadyCache();

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'finetune.model_retired',
      route: `POST /v1/finetunes/models/${model.id}/retire`,
      ip: input.ip,
      metadata: { modelId: model.id, slug: model.slug },
    });

    return updated;
  }
}
