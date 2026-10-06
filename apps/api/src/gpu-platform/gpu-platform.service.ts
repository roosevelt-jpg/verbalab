import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  gpuCeilings,
  gpuPlatformCatalog,
  gpuPools,
  gpuProvisionMode,
  gpuVendors,
} from './gpu-platform.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

@Injectable
export class GpuPlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine {
    const ceilings = gpuCeilings;
    return {
      ...gpuPlatformCatalog,
      ceilings,
      spendSafety: {
        hardSpendCeilingsRequired: true,
        hardInstanceCeilingsRequired: true,
        openEndedGpuAutoscale: false,
        callsCloudGpuApis: false,
        sandboxBeforeRealCloudBill: true,
        provisionMode: ceilings.provisionMode,
        note:
          'Sandbox logical allocations only. Hard max instances + max spend enforced. Never open-ended autoscale. Do not connect to a production GPU billing account.',
      },
    };
  }

  vendors {
    return { vendors: gpuVendors, honesty: gpuPlatformCatalog.honesty };
  }

  pools(vendor?: string) {
    const all = gpuPools;
    const filtered = vendor
      ? all.filter((p) => p.vendor === vendor.toLowerCase)
      : all;
    return {
      pools: filtered,
      note: 'Sandbox pool catalog — not live cloud inventory.',
      honesty: { callsCloudGpuApis: false },
    };
  }

  ceilings {
    return gpuCeilings;
  }

  private async activeInventory(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.gpuAllocation.findMany({
      where: {
        organizationId,
        workspaceId,
        status: { in: ['pending', 'active'] },
      },
    });
    const instances = rows.reduce((s, r) => s + r.instances, 0);
    const hourlyUsd = rows.reduce(
      (s, r) => s + r.instances * r.estimatedHourlyUsd,
      0,
    );
    return { rows, instances, hourlyUsd };
  }

  async listAllocations(input: AuthCtx & { status?: string }) {
    const where = {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      ...(input.status ? { status: input.status } : {}),
    };
    const rows = await this.prisma.gpuAllocation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      allocations: rows.map((r) => this.serialize(r)),
      note: 'Org/workspace-scoped sandbox allocations.',
    };
  }

  async allocate(
    input: AuthCtx & {
      poolId?: string;
      instances?: number;
      purpose?: string;
      reservationHours?: number;
    },
  ) {
    const mode = gpuProvisionMode;
    if (mode === 'disabled') {
      throw new ApiException(
        'gpu_provision_disabled',
        'GPU provision mode is disabled (LUGEMI_GPU_PROVISION_MODE=disabled). Sandbox logical allocate requires mode=sandbox.',
        HttpStatus.FORBIDDEN,
      );
    }

    const poolId = input.poolId?.trim ?? '';
    const pool = gpuPools.find((p) => p.id === poolId);
    if (!pool || pool.status !== 'sandbox_available') {
      throw new ApiException(
        'validation_error',
        'Unknown or unavailable sandbox GPU pool',
        HttpStatus.BAD_REQUEST,
      );
    }

    const want = Math.min(Math.max(input.instances ?? 1, 1), 8);
    const ceilings = gpuCeilings;
    const inv = await this.activeInventory(input.organizationId, input.workspaceId);

    if (inv.instances + want > ceilings.maxInstances) {
      throw new ApiException(
        'gpu_instance_ceiling',
        `Hard instance ceiling exceeded: active ${inv.instances} + requested ${want} > maxInstances ${ceilings.maxInstances}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const nextHourly = inv.hourlyUsd + want * pool.estimatedHourlyUsd;
    if (nextHourly > ceilings.maxSpendUsd) {
      throw new ApiException(
        'gpu_spend_ceiling',
        `Hard spend ceiling exceeded: estimated hourly $${nextHourly.toFixed(2)} > maxSpendUsd $${ceilings.maxSpendUsd}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const reservationUntil =
      input.reservationHours && input.reservationHours > 0
        ? new Date(Date.now + Math.min(input.reservationHours, 72) * 3600_000)
        : null;

    const row = await this.prisma.gpuAllocation.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        vendor: pool.vendor,
        poolId: pool.id,
        instances: want,
        estimatedHourlyUsd: pool.estimatedHourlyUsd,
        status: 'active',
        purpose: (input.purpose ?? '').slice(0, 200),
        reservationUntil,
        metadata: {
          provisionMode: mode,
          sandboxLogicalOnly: true,
          callsCloudGpuApis: false,
          accelerator: pool.accelerator,
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'gpu_platform.allocated',
      route: 'POST /v1/gpu-platform/allocations',
      ip: input.ip,
      metadata: {
        id: row.id,
        poolId: pool.id,
        instances: want,
        estimatedHourlyUsd: pool.estimatedHourlyUsd,
      },
    });

    return {
      allocation: this.serialize(row),
      ceilings,
      note: 'Sandbox logical allocation activated — no cloud GPU API called.',
      honesty: { callsCloudGpuApis: false, openEndedGpuAutoscale: false },
    };
  }

  async scale(
    input: AuthCtx & { id: string; targetInstances?: number },
  ) {
    const mode = gpuProvisionMode;
    if (mode === 'disabled') {
      throw new ApiException(
        'gpu_provision_disabled',
        'GPU provision mode is disabled',
        HttpStatus.FORBIDDEN,
      );
    }

    const target = Math.min(Math.max(input.targetInstances ?? 1, 0), 8);
    const row = await this.prisma.gpuAllocation.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'GPU allocation not found', HttpStatus.NOT_FOUND);
    }
    if (row.status !== 'active' && row.status !== 'pending') {
      throw new ApiException(
        'validation_error',
        'Only pending/active allocations can be scaled',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (target === 0) {
      return this.release({ ...input, id: row.id });
    }

    const ceilings = gpuCeilings;
    const inv = await this.activeInventory(input.organizationId, input.workspaceId);
    const others = inv.instances - row.instances;
    const clamped = Math.min(target, ceilings.maxInstances - others);
    if (clamped < 1) {
      throw new ApiException(
        'gpu_instance_ceiling',
        `Hard instance ceiling prevents scale: others ${others}, maxInstances ${ceilings.maxInstances}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const nextHourly =
      inv.hourlyUsd - row.instances * row.estimatedHourlyUsd + clamped * row.estimatedHourlyUsd;
    if (nextHourly > ceilings.maxSpendUsd) {
      throw new ApiException(
        'gpu_spend_ceiling',
        `Hard spend ceiling prevents scale to ${target} (clamped would be $${nextHourly.toFixed(2)}/hr)`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const updated = await this.prisma.gpuAllocation.update({
      where: { id: row.id },
      data: {
        instances: clamped,
        metadata: {
          ...((row.metadata as object) ?? {}),
          lastScaleTarget: target,
          clampedToCeiling: clamped < target,
          openEndedGpuAutoscale: false,
        },
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'gpu_platform.scaled',
      route: 'POST /v1/gpu-platform/allocations/:id/scale',
      ip: input.ip,
      metadata: { id: row.id, target, applied: clamped },
    });

    return {
      allocation: this.serialize(updated),
      requestedTarget: target,
      appliedInstances: clamped,
      clampedToCeiling: clamped < target,
      ceilings,
      note: 'Scaled toward target but hard-clamped to ceilings — never open-ended.',
      honesty: { openEndedGpuAutoscale: false, callsCloudGpuApis: false },
    };
  }

  async release(input: AuthCtx & { id: string }) {
    const row = await this.prisma.gpuAllocation.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'GPU allocation not found', HttpStatus.NOT_FOUND);
    }
    const updated = await this.prisma.gpuAllocation.update({
      where: { id: row.id },
      data: { status: 'released', instances: 0 },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'gpu_platform.released',
      route: 'POST /v1/gpu-platform/allocations/:id/release',
      ip: input.ip,
      metadata: { id: row.id },
    });
    return {
      allocation: this.serialize(updated),
      note: 'Sandbox allocation released.',
    };
  }

  async health(input: AuthCtx) {
    const inv = await this.activeInventory(input.organizationId, input.workspaceId);
    const ceilings = gpuCeilings;
    return {
      status: gpuProvisionMode === 'disabled' ? 'disabled' : 'sandbox_ok',
      activeInstances: inv.instances,
      estimatedHourlyUsd: Number(inv.hourlyUsd.toFixed(4)),
      ceilings,
      poolsHealthy: gpuPools.filter((p) => p.status === 'sandbox_available').length,
      note: 'Sandbox health — not vendor GPU telemetry.',
      honesty: { callsCloudGpuApis: false },
    };
  }

  async costs(input: AuthCtx) {
    const inv = await this.activeInventory(input.organizationId, input.workspaceId);
    const ceilings = gpuCeilings;
    return {
      estimatedHourlyUsd: Number(inv.hourlyUsd.toFixed(4)),
      estimatedDailyUsd: Number((inv.hourlyUsd * 24).toFixed(4)),
      activeInstances: inv.instances,
      maxSpendUsd: ceilings.maxSpendUsd,
      withinSpendCeiling: inv.hourlyUsd <= ceilings.maxSpendUsd,
      currency: 'USD' as const,
      note: 'Estimated from sandbox hourly rates — not cloud invoices.',
      honesty: { callsCloudGpuApis: false },
    };
  }

  async analytics(input: AuthCtx) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const [total, active, released, audits] = await Promise.all([
      this.prisma.gpuAllocation.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      }),
      this.prisma.gpuAllocation.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'active',
        },
      }),
      this.prisma.gpuAllocation.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'released',
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId: input.organizationId,
          action: { startsWith: 'gpu_platform.' },
          createdAt: { gte: since },
        },
      }),
    ]);
    const costs = await this.costs(input);
    return {
      workspace: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      allocationsTotal: total,
      active,
      released,
      auditsLast30d: audits,
      costs,
      note: 'GPU Platform analytics. ≠ AI Runtime Analytics.',
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, health, costs] = await Promise.all([
      Promise.resolve(this.engine),
      this.health(input),
      this.costs(input),
    ]);
    return {
      generatedAt: new Date.toISOString,
      health,
      costs,
      honesty: engine.honesty,
      spendSafety: engine.spendSafety,
      deferred: engine.capabilities
        .filter((c) => c.status === 'deferred')
        .map((c) => c.id),
      note: 'GPU Platform monitoring snapshot.',
    };
  }

  private serialize(r: {
    id: string;
    organizationId: string;
    workspaceId: string;
    vendor: string;
    poolId: string;
    instances: number;
    estimatedHourlyUsd: number;
    status: string;
    purpose: string;
    reservationUntil: Date | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: r.id,
      organizationId: r.organizationId,
      workspaceId: r.workspaceId,
      vendor: r.vendor,
      poolId: r.poolId,
      instances: r.instances,
      estimatedHourlyUsd: r.estimatedHourlyUsd,
      estimatedHourlyTotalUsd: Number((r.instances * r.estimatedHourlyUsd).toFixed(4)),
      status: r.status,
      purpose: r.purpose,
      reservationUntil: r.reservationUntil?.toISOString ?? null,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString,
      updatedAt: r.updatedAt.toISOString,
    };
  }
}
