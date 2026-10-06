import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { RegionsService } from '../regions/regions.service';
import { FeatureFlagsService } from '../cloud-foundation/feature-flags.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { isPlatformAdmin } from '../common/admin/platform-admin';
import { currentRegionCode } from '../regions/regions.catalog';

@Injectable()
export class EnterpriseCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly regions: RegionsService,
    private readonly flags: FeatureFlagsService,
  ) {}

  private async dataSettings(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        retentionDays: true,
        persistSourceText: true,
        allowVendorTraining: true,
      },
    });
    return {
      organizationId: org.id,
      name: org.name,
      retentionDays: org.retentionDays,
      persistSourceText: org.persistSourceText,
      allowVendorTraining: org.allowVendorTraining,
    };
  }

  async policies(organizationId: string) {
    const [org, settings, residency, billing, featureFlags, memberCount, workspaceCount, activeKeys] =
      await Promise.all([
        this.prisma.organization.findUniqueOrThrow({
          where: { id: organizationId },
          select: {
            id: true,
            name: true,
            plan: true,
            disabledAt: true,
            disabledReason: true,
            characterQuota: true,
            dataRegion: true,
          },
        }),
        this.dataSettings(organizationId),
        this.regions.getOrgResidency(organizationId),
        this.billing.getSummary(organizationId),
        this.flags.forOrganization(organizationId),
        this.prisma.membership.count({ where: { organizationId } }),
        this.prisma.workspace.count({ where: { organizationId } }),
        this.prisma.apiKey.count({ where: { organizationId, revokedAt: null } }),
      ]);

    return {
      organizationId: org.id,
      organizationName: org.name,
      organization: {
        security: {
          tenantIsolation: true,
          rbacRoles: ['owner', 'admin', 'member'],
          abac: false,
          orgDisabled: Boolean(org.disabledAt),
          disabledReason: org.disabledReason,
          apiKeysActive: activeKeys,
          hashedApiKeys: true,
        },
        compliance: {
          retentionDays: settings.retentionDays,
          persistSourceText: settings.persistSourceText,
          allowVendorTraining: settings.allowVendorTraining,
          vendorTrainingEnforcement: 'contractual_default',
          automatedRetentionSweeper: false,
          dataMap: '/docs/data-map.md',
          certificationsProduct: false,
        },
        billing: {
          plan: billing.plan,
          planName: billing.planName,
          characterQuota: billing.characterQuota,
          charactersUsed: billing.charactersUsed,
          charactersRemaining: billing.charactersRemaining,
          billingStatus: billing.billingStatus,
          rateLimits: 'plan_entitled_redis',
        },
        cloud: {
          deployRegion: currentRegionCode(),
          dataRegionPin: org.dataRegion,
          residencyMatchesDeploy: residency.matchesCurrentDeploy,
          availabilityZones: false,
          featureFlags: featureFlags.flags,
        },
        governance: {
          export: true,
          deleteOrganization: true,
          auditLog: true,
          members: memberCount,
          workspaces: workspaceCount,
        },
      },
      note: 'Derived read model — not a policy engine.',
    };
  }

  async overview(session: SessionContext) {
    const [policies, workspaces, residency] = await Promise.all([
      this.policies(session.organizationId),
      this.prisma.workspace.findMany({
        where: { organizationId: session.organizationId },
        select: { id: true, name: true, defaultSourceLang: true, defaultTargetLang: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.regions.getOrgResidency(session.organizationId),
    ]);

    return {
      session: {
        userId: session.userId,
        role: session.role,
        workspaceId: session.workspaceId,
        organizationId: session.organizationId,
      },
      policies,
      workspaces: workspaces.map((w) => ({
        ...w,
        isCurrent: w.id === session.workspaceId,
      })),
      residency,
      platformAdmin: isPlatformAdmin({ clerkUserId: session.clerkUserId }),
      links: {
        data: '/data',
        identity: '/identity',
        billing: '/billing',
        audit: '/audit',
        admin: '/admin',
        workspaces: '/dashboard',
        dataMap: '/docs/data-map.md',
      },
      docs: '/docs/ENTERPRISE_CLOUD.md',
    };
  }

  async vendorPolicyForAudit(organizationId: string) {
    const settings = await this.dataSettings(organizationId);
    return {
      allowVendorTraining: settings.allowVendorTraining,
      persistSourceText: settings.persistSourceText,
      retentionDays: settings.retentionDays,
      vendorTrainingEnforcement: 'contractual_default' as const,
    };
  }
}
