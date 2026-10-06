import { Prisma } from '@prisma/client';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { JobsService } from '../jobs/jobs.service';
import {
  BATCH_KINDS,
  batchCeilings,
  batchKinds,
  batchRuntimeCatalog,
  batchRuntimeMode,
  priorityWeight,
  type BatchKind,
  type BatchPriority,
} from './batch-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
};

@Injectable()
export class BatchRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly jobs: JobsService,
  ) {}

  engine() {
    return {
      ...batchRuntimeCatalog(),
      ceilings: batchCeilings(),
      mode: batchRuntimeMode(),
      spendSafety: {
        hardSpendCeilingsRequired: true,
        note:
          'Batch Runtime does not open-ended autoscale GPU workers. Translation delegates to existing BullMQ. Cost Optimization must enforce spend caps.',
      },
    };
  }

  kinds() {
    return {
      kinds: batchKinds(),
      honesty: batchRuntimeCatalog().honesty,
    };
  }

  async listRuns(input: AuthCtx & { status?: string; kind?: string }) {
    const rows = await this.prisma.batchRun.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.status ? { status: input.status } : {}),
        ...(input.kind ? { kind: input.kind.toLowerCase() } : {}),
      },
      orderBy: [{ priorityWeight: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
    return {
      runs: rows.map((r) => this.serialize(r)),
      note: 'Org/workspace-scoped batch runs (priority-ordered).',
    };
  }

  async getRun(input: AuthCtx & { id: string }) {
    const row = await this.requireRun(input);
    return { run: this.serialize(row) };
  }

  async createRun(
    input: AuthCtx & {
      kind?: string;
      priority?: string;
      items?: unknown[];
      source?: string;
      target?: string;
      label?: string;
      maxRetries?: number;
      runAt?: string;
      webhookUrl?: string;
    },
  ) {
    this.assertEnabled();
    const kind = this.normalizeKind(input.kind ?? 'translation');
    if (kind === 'video') {
      throw new ApiException(
        'validation_error',
        'Video batch jobs are deferred',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (kind === 'training') {
      throw new ApiException(
        'validation_error',
        'Use POST /v1/training-jobs for training — Batch Runtime does not regenerate that API',
        HttpStatus.BAD_REQUEST,
      );
    }

    const ceilings = batchCeilings();
    const priority = this.normalizePriority(input.priority ?? 'normal');
    const items = Array.isArray(input.items) ? input.items : [];
    if (items.length === 0) {
      throw new ApiException(
        'validation_error',
        'items must be a non-empty array',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (items.length > ceilings.maxItemsPerRun) {
      throw new ApiException(
        'batch_ceiling',
        `Hard item ceiling exceeded: ${items.length} > maxItemsPerRun ${ceilings.maxItemsPerRun}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const maxRetries = Math.min(
      ceilings.maxRetries,
      Math.max(0, Math.floor(input.maxRetries ?? ceilings.maxRetries)),
    );
    const runAt = input.runAt ? new Date(input.runAt) : null;
    if (runAt && Number.isNaN(runAt.getTime())) {
      throw new ApiException(
        'validation_error',
        'runAt must be an ISO datetime',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Any explicit runAt creates a scheduled run; /start executes when due.
    const scheduled = Boolean(runAt);

    let jobId: string | null = null;
    let status = scheduled ? 'scheduled' : 'queued';
    let result: unknown = null;
    const source = (input.source ?? 'en').trim() || 'en';
    const target = (input.target ?? 'sw').trim() || 'sw';

    if (kind === 'translation' && !scheduled) {
      const batchItems = items.map((it) => {
        if (typeof it === 'string') return { text: it };
        if (it && typeof it === 'object' && 'text' in it) {
          return { text: String((it as { text: unknown }).text) };
        }
        throw new ApiException(
          'validation_error',
          'translation items must be strings or { text }',
          HttpStatus.BAD_REQUEST,
        );
      });
      const job = await this.jobs.create({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        type: 'batch_translate',
        payload: { source, target, items: batchItems },
        webhookUrl: input.webhookUrl,
        route: 'POST /v1/batch-runtime/runs',
      });
      jobId = job.id;
      status = job.status === 'completed' ? 'completed' : 'running';
      result = { delegatedJobId: job.id, delegatedType: 'batch_translate' };
    } else if (!scheduled) {
      const processed = this.processSandboxItems(kind, items);
      status = 'completed';
      result = processed;
    }

    const row = await this.prisma.batchRun.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        kind,
        priority,
        priorityWeight: priorityWeight(priority),
        status,
        label: (input.label ?? '').slice(0, 200),
        itemCount: items.length,
        checkpointIndex: !scheduled && kind !== 'translation' ? items.length : 0,
        attempts: 0,
        maxRetries,
        jobId,
        runAt,
        result: (result as object) ?? {},
        metadata: {
          source,
          target,
          scheduled,
          extendsBullMqJobs: kind === 'translation',
          sandboxLogicalOnly: kind !== 'translation',
          items: scheduled || kind !== 'translation' ? items.slice(0, ceilings.maxItemsPerRun) : undefined,
        } as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'batch_runtime.run_created',
      route: 'POST /v1/batch-runtime/runs',
      ip: input.ip,
      metadata: { id: row.id, kind, priority, itemCount: items.length, jobId },
    });

    return {
      run: this.serialize(row),
      ceilings,
      honesty: batchRuntimeCatalog().honesty,
      note:
        kind === 'translation'
          ? 'Delegated to existing BullMQ batch_translate job.'
          : scheduled
            ? 'Scheduled sandbox run — call /runs/:id/start after runAt (or now).'
            : 'Sandbox batch completed with checkpoint at end.',
    };
  }

  async startScheduled(input: AuthCtx & { id: string }) {
    this.assertEnabled();
    const row = await this.requireRun(input);
    if (row.status !== 'scheduled') {
      throw new ApiException(
        'validation_error',
        'Only scheduled runs can be started',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (row.runAt && row.runAt.getTime() > Date.now()) {
      throw new ApiException(
        'validation_error',
        `runAt ${row.runAt.toISOString()} is still in the future`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const meta = (row.metadata as {
      items?: unknown[];
      source?: string;
      target?: string;
    }) ?? {};
    const items = Array.isArray(meta.items) ? meta.items : [];

    let jobId = row.jobId;
    let result: unknown;
    let status = 'completed';

    if (row.kind === 'translation') {
      if (items.length === 0) {
        throw new ApiException(
          'validation_error',
          'Scheduled translation has no retained items',
          HttpStatus.BAD_REQUEST,
        );
      }
      const batchItems = items.map((it) =>
        typeof it === 'string' ? { text: it } : { text: String((it as { text?: unknown }).text ?? '') },
      );
      const job = await this.jobs.create({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        type: 'batch_translate',
        payload: {
          source: meta.source ?? 'en',
          target: meta.target ?? 'sw',
          items: batchItems,
        },
        route: 'POST /v1/batch-runtime/runs/:id/start',
      });
      jobId = job.id;
      status = job.status === 'completed' ? 'completed' : 'running';
      result = { delegatedJobId: job.id, startedFromSchedule: true };
    } else {
      result = {
        ...this.processSandboxItems(row.kind as BatchKind, items),
        startedFromSchedule: true,
      };
    }

    const updated = await this.prisma.batchRun.update({
      where: { id: row.id },
      data: {
        status,
        jobId,
        checkpointIndex: row.itemCount,
        result: result as object,
        metadata: {
          ...((row.metadata as object) ?? {}),
          startedAt: new Date().toISOString(),
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'batch_runtime.run_started',
      route: 'POST /v1/batch-runtime/runs/:id/start',
      ip: input.ip,
      metadata: { id: row.id, jobId },
    });

    return {
      run: this.serialize(updated),
      note: 'Scheduled run started.',
    };
  }

  async checkpoint(
    input: AuthCtx & { id: string; index?: number },
  ) {
    this.assertEnabled();
    const row = await this.requireRun(input);
    if (!['queued', 'running', 'scheduled', 'failed', 'completed'].includes(row.status)) {
      throw new ApiException(
        'validation_error',
        'Cannot checkpoint this run status',
        HttpStatus.BAD_REQUEST,
      );
    }
    const index = Math.min(
      row.itemCount,
      Math.max(0, Math.floor(input.index ?? row.checkpointIndex)),
    );
    const updated = await this.prisma.batchRun.update({
      where: { id: row.id },
      data: {
        checkpointIndex: index,
        status: row.status === 'scheduled' ? 'scheduled' : 'running',
        metadata: {
          ...((row.metadata as object) ?? {}),
          lastCheckpointAt: new Date().toISOString(),
        },
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'batch_runtime.checkpoint',
      route: 'POST /v1/batch-runtime/runs/:id/checkpoint',
      ip: input.ip,
      metadata: { id: row.id, index },
    });
    return {
      run: this.serialize(updated),
      note: 'Sandbox checkpoint cursor updated — not a distributed snapshot.',
    };
  }

  async retry(input: AuthCtx & { id: string }) {
    this.assertEnabled();
    const row = await this.requireRun(input);
    if (row.attempts >= row.maxRetries) {
      throw new ApiException(
        'batch_retry_ceiling',
        `Retry budget exhausted: attempts ${row.attempts} >= maxRetries ${row.maxRetries}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    if (!['failed', 'completed', 'running'].includes(row.status)) {
      throw new ApiException(
        'validation_error',
        'Run status does not allow retry',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Resume from checkpoint for sandbox kinds
    const resumeFrom = row.checkpointIndex;
    const updated = await this.prisma.batchRun.update({
      where: { id: row.id },
      data: {
        attempts: row.attempts + 1,
        status: 'completed',
        checkpointIndex: row.itemCount,
        error: null,
        result: {
          ...((row.result as object) ?? {}),
          retriedFromCheckpoint: resumeFrom,
          attempt: row.attempts + 1,
          note:
            row.kind === 'translation'
              ? 'Retry recorded on hub; delegated BullMQ job is not automatically re-queued.'
              : 'Sandbox retry resumed from checkpoint to end.',
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'batch_runtime.retried',
      route: 'POST /v1/batch-runtime/runs/:id/retry',
      ip: input.ip,
      metadata: { id: row.id, attempts: updated.attempts },
    });

    return {
      run: this.serialize(updated),
      honesty: batchRuntimeCatalog().honesty,
      note: 'Retry within hard budget — not open-ended.',
    };
  }

  async analytics(input: AuthCtx) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, completed, failed, scheduled, audits] = await Promise.all([
      this.prisma.batchRun.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      }),
      this.prisma.batchRun.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'completed',
        },
      }),
      this.prisma.batchRun.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'failed',
        },
      }),
      this.prisma.batchRun.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'scheduled',
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId: input.organizationId,
          action: { startsWith: 'batch_runtime.' },
          createdAt: { gte: since },
        },
      }),
    ]);
    return {
      workspace: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      runsTotal: total,
      completed,
      failed,
      scheduled,
      auditsLast30d: audits,
      note: 'Batch Runtime analytics. ≠ AI Runtime Analytics.',
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, analytics] = await Promise.all([
      Promise.resolve(this.engine()),
      this.analytics(input),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      mode: batchRuntimeMode(),
      analytics,
      honesty: engine.honesty,
      spendSafety: engine.spendSafety,
      deferred: engine.capabilities
        .filter((c) => c.status === 'deferred')
        .map((c) => c.id),
      note: 'Batch Runtime monitoring snapshot.',
    };
  }

  private processSandboxItems(kind: BatchKind, items: unknown[]) {
    return {
      kind,
      processed: items.length,
      items: items.slice(0, 20).map((it, i) => ({
        index: i,
        preview: typeof it === 'string' ? it.slice(0, 80) : JSON.stringify(it).slice(0, 80),
        status: 'sandbox_ok',
      })),
      note: 'Sandbox logical batch — Gateway not invoked for each item.',
    };
  }

  private assertEnabled() {
    if (batchRuntimeMode() === 'disabled') {
      throw new ApiException(
        'batch_runtime_disabled',
        'Batch Runtime mode is disabled (LUGEMI_BATCH_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private normalizeKind(raw: string): BatchKind {
    const k = raw.toLowerCase() as BatchKind;
    if (!BATCH_KINDS.includes(k)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of ${BATCH_KINDS.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return k;
  }

  private normalizePriority(raw: string): BatchPriority {
    const p = raw.toLowerCase();
    if (p === 'low' || p === 'normal' || p === 'high') return p;
    throw new ApiException(
      'validation_error',
      'priority must be low|normal|high',
      HttpStatus.BAD_REQUEST,
    );
  }

  private async requireRun(input: AuthCtx & { id: string }) {
    const row = await this.prisma.batchRun.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Batch run not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  private serialize(r: {
    id: string;
    organizationId: string;
    workspaceId: string;
    kind: string;
    priority: string;
    priorityWeight: number;
    status: string;
    label: string;
    itemCount: number;
    checkpointIndex: number;
    attempts: number;
    maxRetries: number;
    jobId: string | null;
    runAt: Date | null;
    error: string | null;
    result: unknown;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: r.id,
      organizationId: r.organizationId,
      workspaceId: r.workspaceId,
      kind: r.kind,
      priority: r.priority,
      priorityWeight: r.priorityWeight,
      status: r.status,
      label: r.label,
      itemCount: r.itemCount,
      checkpointIndex: r.checkpointIndex,
      attempts: r.attempts,
      maxRetries: r.maxRetries,
      jobId: r.jobId,
      runAt: r.runAt?.toISOString() ?? null,
      error: r.error,
      result: r.result,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
