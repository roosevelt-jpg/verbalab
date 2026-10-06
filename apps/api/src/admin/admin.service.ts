import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { UsageService } from '../usage/usage.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly apiKeys: ApiKeysService,
    private readonly usage: UsageService,
  ) {}

  async searchOrganizations(q?: string, limitRaw?: number) {
    const take = Math.min(Math.max(limitRaw ?? 50, 1), 100);
    const query = q?.trim();
    const where: Prisma.OrganizationWhereInput = query
      ? {
          OR: [
            { id: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { clerkOrgId: { contains: query, mode: 'insensitive' } },
            { stripeCustomerId: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {};

    const orgs = await this.prisma.organization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        plan: true,
        billingStatus: true,
        characterQuota: true,
        disabledAt: true,
        disabledReason: true,
        clerkOrgId: true,
        stripeCustomerId: true,
        createdAt: true,
        _count: { select: { memberships: true, apiKeys: true } },
      },
    });

    return orgs.map((org) => ({
      id: org.id,
      name: org.name,
      plan: org.plan,
      billingStatus: org.billingStatus,
      characterQuota: org.characterQuota,
      disabledAt: org.disabledAt,
      disabledReason: org.disabledReason,
      clerkOrgId: org.clerkOrgId,
      stripeCustomerId: org.stripeCustomerId,
      createdAt: org.createdAt,
      memberCount: org._count.memberships,
      apiKeyCount: org._count.apiKeys,
    }));
  }

  async getOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        billingStatus: true,
        characterQuota: true,
        disabledAt: true,
        disabledReason: true,
        clerkOrgId: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
      },
    });
    if (!org) {
      throw new ApiException('not_found', 'Organization not found', HttpStatus.NOT_FOUND);
    }

    const [usage, keys, members] = await Promise.all([
      this.usage.summary(organizationId),
      this.apiKeys.list(organizationId),
      this.prisma.membership.findMany({
        where: { organizationId },
        include: {
          user: { select: { id: true, email: true, name: true, clerkUserId: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      ...org,
      usage,
      apiKeys: keys,
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
    };
  }

  async revokeAllKeys(input: {
    organizationId: string;
    actorUserId: string;
    ip?: string;
  }) {
    await this.requireOrg(input.organizationId);
    const keys = await this.prisma.apiKey.findMany({
      where: { organizationId: input.organizationId, revokedAt: null },
      select: { id: true },
    });

    for (const key of keys) {
      await this.apiKeys.revoke(input.organizationId, key.id, {
        userId: input.actorUserId,
        ip: input.ip,
      });
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'admin.keys_revoked_all',
      route: 'POST /v1/admin/organizations/:id/revoke-keys',
      ip: input.ip,
      metadata: { count: keys.length },
    });

    return { revoked: keys.length };
  }

  async setDisabled(input: {
    organizationId: string;
    actorUserId: string;
    disabled: boolean;
    reason?: string;
    ip?: string;
  }) {
    await this.requireOrg(input.organizationId);

    const updated = await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: input.disabled
        ? {
            disabledAt: new Date(),
            disabledReason: input.reason?.trim() || 'Suspended by platform admin',
          }
        : { disabledAt: null, disabledReason: null },
      select: {
        id: true,
        name: true,
        disabledAt: true,
        disabledReason: true,
      },
    });

    if (input.disabled) {
      await this.revokeAllKeys({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        ip: input.ip,
      });
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: input.disabled ? 'admin.org_disabled' : 'admin.org_enabled',
      route: 'POST /v1/admin/organizations/:id/disable',
      ip: input.ip,
      metadata: { reason: updated.disabledReason },
    });

    return updated;
  }

  private async requireOrg(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!org) {
      throw new ApiException('not_found', 'Organization not found', HttpStatus.NOT_FOUND);
    }
  }
}
