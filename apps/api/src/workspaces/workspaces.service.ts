import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import {
  planAllowsAnotherWorkspace,
  planFromId,
  planWorkspaceLimit,
} from '../billing/plans';

@Injectable
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private toDto(row: {
    id: string;
    organizationId: string;
    name: string;
    defaultSourceLang: string;
    defaultTargetLang: string;
    createdAt: Date;
    updatedAt: Date;
  }, currentWorkspaceId?: string) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      defaultSourceLang: row.defaultSourceLang,
      defaultTargetLang: row.defaultTargetLang,
      isCurrent: currentWorkspaceId ? row.id === currentWorkspaceId : false,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async entitlements(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true },
    });
    const plan = planFromId(org.plan);
    const used = await this.prisma.workspace.count({ where: { organizationId } });
    const limit = plan.workspaceLimit;
    return {
      plan: org.plan,
      planName: plan.name,
      features: plan.features,
      workspaceLimit: limit,
      workspaceUsed: used,
      workspaceRemaining: limit < 0 ? null : Math.max(0, limit - used),
      canCreate: planAllowsAnotherWorkspace(org.plan, used),
      unlimited: limit < 0,
    };
  }

  async list(organizationId: string, currentWorkspaceId?: string) {
    const [rows, entitlements] = await Promise.all([
      this.prisma.workspace.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'asc' },
      }),
      this.entitlements(organizationId),
    ]);
    return {
      data: rows.map((r) => this.toDto(r, currentWorkspaceId)),
      entitlements,
    };
  }

  async get(organizationId: string, id: string, currentWorkspaceId?: string) {
    const row = await this.prisma.workspace.findFirst({
      where: { id, organizationId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Workspace not found', HttpStatus.NOT_FOUND);
    }
    return this.toDto(row, currentWorkspaceId);
  }

  async create(input: {
    organizationId: string;
    userId?: string;
    role: string;
    name: string;
    defaultSourceLang?: string;
    defaultTargetLang?: string;
    ip?: string;
  }) {
    if (input.role !== 'owner' && input.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can create workspaces',
        HttpStatus.FORBIDDEN,
      );
    }
    const name = input.name.trim;
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
      select: { plan: true },
    });
    const used = await this.prisma.workspace.count({
      where: { organizationId: input.organizationId },
    });
    const limit = planWorkspaceLimit(org.plan);
    if (!planAllowsAnotherWorkspace(org.plan, used)) {
      const plan = planFromId(org.plan);
      throw new ApiException(
        'plan_required',
        `Your ${plan.name} plan includes ${limit} workspace${limit === 1 ? '' : 's'}. Upgrade to Scale or Enterprise for more workspaces.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const row = await this.prisma.workspace.create({
      data: {
        organizationId: input.organizationId,
        name,
        defaultSourceLang: (input.defaultSourceLang ?? 'en').trim || 'en',
        defaultTargetLang: (input.defaultTargetLang ?? 'ak').trim || 'ak',
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workspace.created',
      route: 'POST /v1/workspaces',
      ip: input.ip,
      metadata: { workspaceId: row.id, name: row.name },
    });
    return this.toDto(row);
  }

  async update(input: {
    organizationId: string;
    userId?: string;
    role: string;
    id: string;
    name?: string;
    defaultSourceLang?: string;
    defaultTargetLang?: string;
    ip?: string;
    currentWorkspaceId?: string;
  }) {
    if (input.role !== 'owner' && input.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can update workspaces',
        HttpStatus.FORBIDDEN,
      );
    }
    const existing = await this.prisma.workspace.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Workspace not found', HttpStatus.NOT_FOUND);
    }
    const row = await this.prisma.workspace.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim || existing.name } : {}),
        ...(input.defaultSourceLang !== undefined
          ? { defaultSourceLang: input.defaultSourceLang.trim || existing.defaultSourceLang }
          : {}),
        ...(input.defaultTargetLang !== undefined
          ? { defaultTargetLang: input.defaultTargetLang.trim || existing.defaultTargetLang }
          : {}),
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workspace.updated',
      route: `PATCH /v1/workspaces/${row.id}`,
      ip: input.ip,
      metadata: { workspaceId: row.id },
    });
    return this.toDto(row, input.currentWorkspaceId);
  }
}
