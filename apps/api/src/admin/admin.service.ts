import { HttpStatus, Injectable } from '@nestjs/common';
import { MembershipRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { UsageService } from '../usage/usage.service';
import { normalizePlanId, PLAN_IDS, planFromId, type PlanId } from '../billing/plans';
import { FeatureFlagsService } from '../cloud-foundation/feature-flags.service';

const OVERRIDEABLE_FLAGS = [
  'commercial',
  'marketplace',
  'voiceClones',
  'fineTunes',
  'prioritySupport',
  'sso',
  'dedicated',
  'workspacesExtra',
] as const;

export type OverrideableFlag = (typeof OVERRIDEABLE_FLAGS)[number];

export type WorkspaceListQuery = {
  q?: string;
  plan?: string;
  status?: string;
  region?: string;
  page?: number;
  pageSize?: number;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly apiKeys: ApiKeysService,
    private readonly usage: UsageService,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  listPlanFilters() {
    return PLAN_IDS.map((id) => ({ id, name: planFromId(id).name }));
  }

  /** Legacy alias used by existing tests and OpenAPI paths. */
  async searchOrganizations(q?: string, limitRaw?: number, planRaw?: string) {
    const result = await this.listWorkspaces({
      q,
      plan: planRaw,
      pageSize: limitRaw ?? 50,
      page: 1,
    });
    return result.items;
  }

  async listWorkspaces(query: WorkspaceListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 100);
    const where = this.buildWhere(query);

    const [total, orgs] = await Promise.all([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          plan: true,
          billingStatus: true,
          characterQuota: true,
          dataRegion: true,
          disabledAt: true,
          disabledReason: true,
          clerkOrgId: true,
          stripeCustomerId: true,
          featureOverrides: true,
          createdAt: true,
          _count: {
            select: {
              memberships: true,
              apiKeys: true,
              workspaces: true,
              invites: true,
            },
          },
        },
      }),
    ]);

    const usageByOrg = await this.usageSummariesForIds(orgs.map((o) => o.id));

    const items = orgs.map((org) => {
      const usage = usageByOrg.get(org.id) ?? { characters: 0, requests: 0, periodStart: '' };
      return {
        id: org.id,
        name: org.name,
        plan: org.plan,
        billingStatus: org.billingStatus,
        characterQuota: org.characterQuota,
        dataRegion: org.dataRegion,
        status: org.disabledAt
          ? 'suspended'
          : org.billingStatus === 'active'
            ? 'active'
            : org.billingStatus,
        disabledAt: org.disabledAt,
        disabledReason: org.disabledReason,
        clerkOrgId: org.clerkOrgId,
        stripeCustomerId: org.stripeCustomerId,
        featureOverrides: this.asOverrideMap(org.featureOverrides),
        createdAt: org.createdAt,
        memberCount: org._count.memberships,
        apiKeyCount: org._count.apiKeys,
        workspaceSeatCount: org._count.workspaces,
        inviteCount: org._count.invites,
        usageSummary: {
          characters: usage.characters,
          requests: usage.requests,
          periodStart: usage.periodStart,
        },
      };
    });

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getOrganization(organizationId: string) {
    return this.getWorkspace(organizationId);
  }

  async getWorkspace(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        billingStatus: true,
        characterQuota: true,
        dataRegion: true,
        retentionDays: true,
        persistSourceText: true,
        allowVendorTraining: true,
        disabledAt: true,
        disabledReason: true,
        clerkOrgId: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        featureOverrides: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!org) {
      throw new ApiException('not_found', 'Workspace not found', HttpStatus.NOT_FOUND);
    }

    const [usage, keys, members, invites, workspaces, flags, connectors, auditSnippet, branding] =
      await Promise.all([
        this.usage.summary(organizationId),
        this.apiKeys.list(organizationId),
        this.prisma.membership.findMany({
          where: { organizationId },
          include: {
            user: { select: { id: true, email: true, name: true, clerkUserId: true } },
          },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.organizationInvite.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { invitedBy: { select: { id: true, email: true, name: true } } },
        }),
        this.prisma.workspace.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            defaultSourceLang: true,
            defaultTargetLang: true,
            createdAt: true,
          },
        }),
        this.featureFlags.forOrganization(organizationId),
        this.listConnectors(organizationId),
        this.audit.listForOrg(organizationId, 25),
        this.prisma.platformBranding.findUnique({ where: { id: 'default' } }),
      ]);

    return {
      id: org.id,
      name: org.name,
      plan: org.plan,
      planName: planFromId(org.plan).name,
      billingStatus: org.billingStatus,
      characterQuota: org.characterQuota,
      dataRegion: org.dataRegion,
      retentionDays: org.retentionDays,
      persistSourceText: org.persistSourceText,
      allowVendorTraining: org.allowVendorTraining,
      status: org.disabledAt ? 'suspended' : 'active',
      disabledAt: org.disabledAt,
      disabledReason: org.disabledReason,
      clerkOrgId: org.clerkOrgId,
      stripeCustomerId: org.stripeCustomerId,
      stripeSubscriptionId: org.stripeSubscriptionId,
      featureOverrides: this.asOverrideMap(org.featureOverrides),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      usage,
      featureFlags: flags.flags,
      entitlements: flags.entitlements,
      apiKeys: keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        environment: k.environment,
        revokedAt: k.revokedAt,
        createdAt: k.createdAt,
        masked: `${k.prefix}••••••••`,
      })),
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
      invites: invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        acceptedAt: inv.acceptedAt,
        invitedBy: inv.invitedBy,
      })),
      workspaces,
      modelDefaults: workspaces.map((w) => ({
        workspaceId: w.id,
        workspaceName: w.name,
        defaultSourceLang: w.defaultSourceLang,
        defaultTargetLang: w.defaultTargetLang,
      })),
      connectors,
      branding: branding
        ? {
            companyName: branding.companyName,
            logoUrl: branding.logoUrl,
            country: branding.country,
            region: branding.region,
          }
        : null,
      quotas: {
        characterQuota: org.characterQuota,
        usedCharacters: usage.characters,
        remainingCharacters: Math.max(0, org.characterQuota - usage.characters),
      },
      activity: auditSnippet,
    };
  }

  async updateWorkspace(
    organizationId: string,
    actorUserId: string,
    body: {
      name?: string;
      plan?: string;
      characterQuota?: number;
      dataRegion?: string | null;
      billingStatus?: string;
      featureOverrides?: Record<string, boolean | null>;
      retentionDays?: number | null;
      persistSourceText?: boolean;
      allowVendorTraining?: boolean;
    },
    ip?: string,
  ) {
    await this.requireOrg(organizationId);
    const data: Prisma.OrganizationUpdateInput = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.plan === 'string' && body.plan.trim()) {
      const plan = planFromId(body.plan.trim());
      data.plan = plan.id;
      if (body.characterQuota === undefined) {
        data.characterQuota = plan.characterQuota;
      }
    }
    if (typeof body.characterQuota === 'number' && Number.isFinite(body.characterQuota)) {
      data.characterQuota = Math.max(0, Math.floor(body.characterQuota));
    }
    if (body.dataRegion !== undefined) {
      data.dataRegion = body.dataRegion?.trim() || null;
    }
    if (typeof body.billingStatus === 'string' && body.billingStatus.trim()) {
      data.billingStatus = body.billingStatus.trim();
    }
    if (body.retentionDays !== undefined) {
      data.retentionDays = body.retentionDays;
    }
    if (typeof body.persistSourceText === 'boolean') {
      data.persistSourceText = body.persistSourceText;
    }
    if (typeof body.allowVendorTraining === 'boolean') {
      data.allowVendorTraining = body.allowVendorTraining;
    }
    if (body.featureOverrides) {
      data.featureOverrides = this.mergeOverrides(
        await this.currentOverrides(organizationId),
        body.featureOverrides,
      );
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data,
      select: {
        id: true,
        name: true,
        plan: true,
        characterQuota: true,
        dataRegion: true,
        billingStatus: true,
        featureOverrides: true,
        retentionDays: true,
        persistSourceText: true,
        allowVendorTraining: true,
      },
    });

    await this.recordAdminAudit({
      actorUserId,
      action: 'admin.workspace_updated',
      targetOrganizationId: organizationId,
      route: 'PATCH /v1/admin/workspaces/:id',
      ip,
      metadata: { fields: Object.keys(body) },
    });

    return {
      ...updated,
      featureOverrides: this.asOverrideMap(updated.featureOverrides),
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
    await this.recordAdminAudit({
      actorUserId: input.actorUserId,
      action: 'admin.keys_revoked_all',
      targetOrganizationId: input.organizationId,
      route: 'POST /v1/admin/workspaces/:id/revoke-keys',
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
    await this.recordAdminAudit({
      actorUserId: input.actorUserId,
      action: input.disabled ? 'admin.workspace_suspended' : 'admin.workspace_resumed',
      targetOrganizationId: input.organizationId,
      route: input.disabled
        ? 'POST /v1/admin/workspaces/:id/suspend'
        : 'POST /v1/admin/workspaces/:id/resume',
      ip: input.ip,
      metadata: { reason: updated.disabledReason },
    });

    return updated;
  }

  async bulkAction(input: {
    actorUserId: string;
    action: 'suspend' | 'resume' | 'export';
    organizationIds: string[];
    reason?: string;
    ip?: string;
  }) {
    const ids = [...new Set(input.organizationIds.map((id) => id.trim()).filter(Boolean))];
    if (ids.length === 0) {
      throw new ApiException('validation_error', 'organizationIds required', HttpStatus.BAD_REQUEST);
    }
    if (ids.length > 200) {
      throw new ApiException(
        'validation_error',
        'Max 200 workspaces per bulk action',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (input.action === 'export') {
      const list = await this.prisma.organization.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          plan: true,
          billingStatus: true,
          dataRegion: true,
          characterQuota: true,
          disabledAt: true,
          createdAt: true,
          _count: { select: { memberships: true, apiKeys: true, workspaces: true } },
        },
      });
      const usageByOrg = await this.usageSummariesForIds(list.map((o) => o.id));
      const rows = list.map((org) => {
        const usage = usageByOrg.get(org.id);
        return {
          id: org.id,
          name: org.name,
          plan: org.plan,
          billingStatus: org.billingStatus,
          dataRegion: org.dataRegion ?? '',
          characterQuota: org.characterQuota,
          status: org.disabledAt ? 'suspended' : 'active',
          memberCount: org._count.memberships,
          apiKeyCount: org._count.apiKeys,
          workspaceSeatCount: org._count.workspaces,
          usageCharacters: usage?.characters ?? 0,
          usageRequests: usage?.requests ?? 0,
          createdAt: org.createdAt.toISOString(),
        };
      });
      const header = [
        'id',
        'name',
        'plan',
        'billingStatus',
        'dataRegion',
        'characterQuota',
        'status',
        'memberCount',
        'apiKeyCount',
        'workspaceSeatCount',
        'usageCharacters',
        'usageRequests',
        'createdAt',
      ];
      const csv = [
        header.join(','),
        ...rows.map((row) =>
          header
            .map((key) => {
              const val = String((row as Record<string, unknown>)[key] ?? '');
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(','),
        ),
      ].join('\n');

      await this.recordAdminAudit({
        actorUserId: input.actorUserId,
        action: 'admin.bulk_export',
        route: 'POST /v1/admin/workspaces/bulk',
        ip: input.ip,
        metadata: { count: ids.length },
      });

      return { action: 'export' as const, count: rows.length, csv };
    }

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const id of ids) {
      try {
        await this.setDisabled({
          organizationId: id,
          actorUserId: input.actorUserId,
          disabled: input.action === 'suspend',
          reason: input.reason,
          ip: input.ip,
        });
        results.push({ id, ok: true });
      } catch (err) {
        results.push({
          id,
          ok: false,
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    await this.recordAdminAudit({
      actorUserId: input.actorUserId,
      action: input.action === 'suspend' ? 'admin.bulk_suspend' : 'admin.bulk_resume',
      route: 'POST /v1/admin/workspaces/bulk',
      ip: input.ip,
      metadata: {
        count: ids.length,
        ok: results.filter((r) => r.ok).length,
      },
    });

    return { action: input.action, results };
  }

  async crossWorkspaceAnalytics() {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const [usageAgg, byPlan, byRegion, recentUsage, topOrgs] = await Promise.all([
      this.prisma.usageEvent.groupBy({
        by: ['feature'],
        where: { createdAt: { gte: start } },
        _sum: { units: true },
        _count: { _all: true },
      }),
      this.prisma.organization.groupBy({
        by: ['plan'],
        _count: { _all: true },
      }),
      this.prisma.organization.groupBy({
        by: ['dataRegion'],
        _count: { _all: true },
      }),
      this.prisma.usageEvent.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
        select: { createdAt: true, units: true, feature: true },
        orderBy: { createdAt: 'asc' },
        take: 5000,
      }),
      this.prisma.usageEvent.groupBy({
        by: ['organizationId'],
        where: { createdAt: { gte: start }, feature: 'translate' },
        _sum: { units: true },
        _count: { _all: true },
        orderBy: { _sum: { units: 'desc' } },
        take: 10,
      }),
    ]);

    const totalOrgs = await this.prisma.organization.count();
    const suspended = await this.prisma.organization.count({
      where: { disabledAt: { not: null } },
    });
    const active = totalOrgs - suspended;

    const orgNames = await this.prisma.organization.findMany({
      where: { id: { in: topOrgs.map((t) => t.organizationId) } },
      select: { id: true, name: true, plan: true },
    });
    const nameById = new Map(orgNames.map((o) => [o.id, o]));

    const dayBuckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      dayBuckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const event of recentUsage) {
      if (event.feature !== 'translate') continue;
      const key = event.createdAt.toISOString().slice(0, 10);
      if (dayBuckets.has(key)) {
        dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + event.units);
      }
    }

    return {
      periodStart: start.toISOString(),
      totals: {
        workspaces: totalOrgs,
        active,
        suspended,
        members: await this.prisma.membership.count(),
      },
      byPlan: byPlan.map((p) => ({ plan: p.plan, count: p._count._all })),
      byRegion: byRegion.map((r) => ({
        region: r.dataRegion ?? 'unset',
        count: r._count._all,
      })),
      usageByFeature: usageAgg.map((u) => ({
        feature: u.feature,
        units: u._sum.units ?? 0,
        events: u._count._all,
      })),
      sparklineCharacters: [...dayBuckets.values()],
      sparklineLabels: [...dayBuckets.keys()],
      topWorkspaces: topOrgs.map((t) => ({
        id: t.organizationId,
        name: nameById.get(t.organizationId)?.name ?? t.organizationId,
        plan: nameById.get(t.organizationId)?.plan ?? 'free',
        characters: t._sum.units ?? 0,
        requests: t._count._all,
      })),
    };
  }

  async listPlatformAudit(query: { q?: string; limit?: number; organizationId?: string }) {
    const take = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const where: Prisma.AdminAuditEventWhereInput = {};
    if (query.organizationId) where.targetOrganizationId = query.organizationId;
    if (query.q?.trim()) {
      where.OR = [
        { action: { contains: query.q.trim(), mode: 'insensitive' } },
        { route: { contains: query.q.trim(), mode: 'insensitive' } },
        { targetOrganizationId: { contains: query.q.trim(), mode: 'insensitive' } },
      ];
    }

    const events = await this.prisma.adminAuditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });

    const actorIds = [...new Set(events.map((e) => e.actorUserId).filter(Boolean))] as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, email: true, name: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return events.map((e) => ({
      id: e.id,
      action: e.action,
      route: e.route,
      ip: e.ip,
      targetOrganizationId: e.targetOrganizationId,
      metadata: e.metadata,
      createdAt: e.createdAt,
      actor: e.actorUserId ? userById.get(e.actorUserId) ?? null : null,
    }));
  }

  async listWorkspaceAudit(organizationId: string, limit?: number) {
    await this.requireOrg(organizationId);
    return this.audit.listForOrg(organizationId, limit ?? 50);
  }

  async listWorkspaceMembers(organizationId: string) {
    await this.requireOrg(organizationId);
    const members = await this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  async workspaceUsage(organizationId: string) {
    await this.requireOrg(organizationId);
    const [usage, org] = await Promise.all([
      this.usage.summary(organizationId),
      this.prisma.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { characterQuota: true, plan: true },
      }),
    ]);
    return {
      ...usage,
      characterQuota: org.characterQuota,
      plan: org.plan,
    };
  }

  async createWorkspace(input: {
    actorUserId: string;
    name: string;
    plan?: string;
    ownerEmail?: string;
    dataRegion?: string;
    characterQuota?: number;
    ip?: string;
  }) {
    const name = input.name.trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const plan = planFromId((input.plan ?? 'free') as PlanId);
    const ownerEmail = input.ownerEmail?.trim().toLowerCase();

    let ownerUserId = input.actorUserId;
    if (ownerEmail) {
      const existing = await this.prisma.user.findFirst({
        where: { email: { equals: ownerEmail, mode: 'insensitive' } },
      });
      if (existing) {
        ownerUserId = existing.id;
      } else {
        const created = await this.prisma.user.create({
          data: {
            clerkUserId: `pending_${ownerEmail.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`,
            email: ownerEmail,
            name: ownerEmail.split('@')[0],
          },
        });
        ownerUserId = created.id;
      }
    }

    const org = await this.prisma.organization.create({
      data: {
        name,
        plan: plan.id,
        characterQuota: input.characterQuota ?? plan.characterQuota,
        dataRegion: input.dataRegion?.trim() || null,
        memberships: {
          create: { userId: ownerUserId, role: MembershipRole.owner },
        },
        workspaces: {
          create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'ak' },
        },
      },
      include: { workspaces: true, memberships: true },
    });

    if (ownerEmail && ownerUserId !== input.actorUserId) {
      await this.prisma.organizationInvite.create({
        data: {
          organizationId: org.id,
          email: ownerEmail,
          role: MembershipRole.owner,
          token: `admin_invite_${org.id}_${Date.now()}`,
          status: 'accepted',
          invitedById: input.actorUserId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          acceptedAt: new Date(),
        },
      });
    }

    await this.recordAdminAudit({
      actorUserId: input.actorUserId,
      action: 'admin.workspace_created',
      targetOrganizationId: org.id,
      route: 'POST /v1/admin/workspaces',
      ip: input.ip,
      metadata: { name, plan: plan.id, ownerEmail: ownerEmail ?? null },
    });

    return {
      id: org.id,
      name: org.name,
      plan: org.plan,
      dataRegion: org.dataRegion,
      characterQuota: org.characterQuota,
      workspaceId: org.workspaces[0]?.id ?? null,
      ownerUserId,
    };
  }

  async inviteToWorkspace(input: {
    organizationId: string;
    actorUserId: string;
    email: string;
    role?: string;
    ip?: string;
  }) {
    await this.requireOrg(input.organizationId);
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new ApiException('validation_error', 'Valid email required', HttpStatus.BAD_REQUEST);
    }
    const role =
      input.role === 'owner'
        ? MembershipRole.owner
        : input.role === 'admin'
          ? MembershipRole.admin
          : MembershipRole.member;

    const invite = await this.prisma.organizationInvite.create({
      data: {
        organizationId: input.organizationId,
        email,
        role,
        token: `adm_${input.organizationId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        status: 'pending',
        invitedById: input.actorUserId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await this.recordAdminAudit({
      actorUserId: input.actorUserId,
      action: 'admin.workspace_invite',
      targetOrganizationId: input.organizationId,
      route: 'POST /v1/admin/workspaces/:id/invites',
      ip: input.ip,
      metadata: { email, role },
    });

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
    };
  }

  async openAsWorkspace(input: {
    organizationId: string;
    actorUserId: string;
    ip?: string;
  }) {
    await this.requireOrg(input.organizationId);

    await this.prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.actorUserId,
        },
      },
      create: {
        organizationId: input.organizationId,
        userId: input.actorUserId,
        role: MembershipRole.admin,
      },
      update: {},
    });

    const workspace = await this.prisma.workspace.findFirst({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });

    await this.recordAdminAudit({
      actorUserId: input.actorUserId,
      action: 'admin.workspace_open_as',
      targetOrganizationId: input.organizationId,
      route: 'POST /v1/admin/workspaces/:id/open-as',
      ip: input.ip,
      metadata: { workspaceId: workspace?.id ?? null },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'admin.impersonate_open',
      route: 'POST /v1/admin/workspaces/:id/open-as',
      ip: input.ip,
      metadata: { workspaceId: workspace?.id ?? null },
    });

    return {
      organizationId: input.organizationId,
      workspaceId: workspace?.id ?? null,
      workspaceName: workspace?.name ?? null,
    };
  }

  private buildWhere(query: WorkspaceListQuery): Prisma.OrganizationWhereInput {
    const where: Prisma.OrganizationWhereInput = {};
    const and: Prisma.OrganizationWhereInput[] = [];

    if (query.q?.trim()) {
      const q = query.q.trim();
      and.push({
        OR: [
          { id: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { clerkOrgId: { contains: q, mode: 'insensitive' } },
          { stripeCustomerId: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (query.plan?.trim() && query.plan.trim() !== 'all') {
      and.push({ plan: normalizePlanId(query.plan.trim()) });
    }
    if (query.region?.trim()) {
      const region = query.region.trim().toLowerCase();
      if (region === 'unset' || region === 'none') {
        and.push({ dataRegion: null });
      } else {
        and.push({ dataRegion: { equals: region, mode: 'insensitive' } });
      }
    }
    if (query.status?.trim()) {
      const status = query.status.trim().toLowerCase();
      if (status === 'suspended' || status === 'disabled') {
        and.push({ disabledAt: { not: null } });
      } else if (status === 'active') {
        and.push({ disabledAt: null, billingStatus: 'active' });
      } else {
        and.push({ billingStatus: status, disabledAt: null });
      }
    }

    if (and.length) where.AND = and;
    return where;
  }

  private async usageSummariesForIds(ids: string[]) {
    const map = new Map<string, { characters: number; requests: number; periodStart: string }>();
    if (ids.length === 0) return map;

    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const periodStart = start.toISOString();

    const events = await this.prisma.usageEvent.groupBy({
      by: ['organizationId'],
      where: {
        organizationId: { in: ids },
        createdAt: { gte: start },
        feature: 'translate',
      },
      _sum: { units: true },
      _count: { _all: true },
    });

    for (const id of ids) {
      map.set(id, { characters: 0, requests: 0, periodStart });
    }
    for (const row of events) {
      map.set(row.organizationId, {
        characters: row._sum.units ?? 0,
        requests: row._count._all,
        periodStart,
      });
    }
    return map;
  }

  private async listConnectors(organizationId: string) {
    const [slack, installs] = await Promise.all([
      this.prisma.slackInstallation.findMany({
        where: { organizationId },
        select: {
          id: true,
          teamId: true,
          teamName: true,
          workspaceId: true,
          createdAt: true,
        },
      }),
      this.prisma.marketplaceInstall.findMany({
        where: { installerOrgId: organizationId },
        take: 50,
        orderBy: { installedAt: 'desc' },
        include: {
          listing: { select: { id: true, title: true, kind: true } },
        },
      }),
    ]);

    return {
      slack: slack.map((s) => ({
        id: s.id,
        kind: 'slack' as const,
        name: s.teamName ?? s.teamId,
        workspaceId: s.workspaceId,
        installedAt: s.createdAt,
      })),
      marketplace: installs.map((i) => ({
        id: i.id,
        kind: i.listing.kind,
        name: i.listing.title,
        listingId: i.listing.id,
        workspaceId: i.installerWorkspaceId,
        installedAt: i.installedAt,
      })),
    };
  }

  private asOverrideMap(raw: Prisma.JsonValue | null | undefined): Record<string, boolean> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === 'boolean') out[key] = value;
    }
    return out;
  }

  private async currentOverrides(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { featureOverrides: true },
    });
    return this.asOverrideMap(org?.featureOverrides);
  }

  private mergeOverrides(
    current: Record<string, boolean>,
    patch: Record<string, boolean | null>,
  ): Prisma.InputJsonValue {
    const next = { ...current };
    for (const [key, value] of Object.entries(patch)) {
      if (!OVERRIDEABLE_FLAGS.includes(key as OverrideableFlag) && !/^[a-zA-Z0-9_]+$/.test(key)) {
        continue;
      }
      if (value === null) {
        delete next[key];
      } else if (typeof value === 'boolean') {
        next[key] = value;
      }
    }
    return next;
  }

  private async recordAdminAudit(input: {
    actorUserId: string;
    action: string;
    targetOrganizationId?: string;
    route?: string;
    ip?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    await this.prisma.adminAuditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        targetOrganizationId: input.targetOrganizationId,
        route: input.route,
        ip: input.ip,
        metadata: input.metadata,
      },
    });
  }

  private async requireOrg(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!org) {
      throw new ApiException('not_found', 'Workspace not found', HttpStatus.NOT_FOUND);
    }
  }
}
