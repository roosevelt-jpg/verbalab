import { Injectable } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';
import { RegionsService } from '../regions/regions.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { FeatureFlagsService } from './feature-flags.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CloudOverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly regions: RegionsService,
    private readonly workspaces: WorkspacesService,
    private readonly flags: FeatureFlagsService,
  ) {}

  async get(session: SessionContext) {
    const [org, billing, residency, workspaces, featureFlags] = await Promise.all([
      this.prisma.organization.findUniqueOrThrow({
        where: { id: session.organizationId },
        select: { id: true, name: true, plan: true, billingStatus: true, dataRegion: true },
      }),
      this.billing.getSummary(session.organizationId),
      this.regions.getOrgResidency(session.organizationId),
      this.workspaces.list(session.organizationId, session.workspaceId),
      this.flags.forOrganization(session.organizationId),
    ]);

    const currentWorkspace =
      workspaces.data.find((w) => w.id === session.workspaceId) ?? workspaces.data[0] ?? null;

    return {
      account: {
        userId: session.userId,
        clerkUserId: session.clerkUserId,
        role: session.role,
      },
      organization: {
        id: org.id,
        name: org.name,
        plan: org.plan,
        billingStatus: org.billingStatus,
        dataRegion: org.dataRegion,
      },
      workspace: currentWorkspace,
      workspaces: workspaces.data,
      billing,
      residency,
      featureFlags: featureFlags.flags,
      foundation: {
        projectsMappedTo: 'workspaces',
        availabilityZones: false,
        serviceDiscovery: false,
        docs: '/docs/CLOUD_PLATFORM_FOUNDATION.md',
      },
    };
  }
}
