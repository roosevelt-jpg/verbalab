import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ownTtsConfigured } from '../gateway/own-tts.adapter';
import { isProOrAbove, planFromId, planHasFeature } from '../billing/plans';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async forOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true, disabledAt: true },
    });
    const plan = planFromId(org.plan);
    const orgEnabled = !org.disabledAt;
    const proPlus = isProOrAbove(org.plan);
    const workspaceUsed = await this.prisma.workspace.count({ where: { organizationId } });

    return {
      organizationId,
      plan: org.plan,
      flags: {
        orgEnabled,
        pro: proPlus,
        starter: plan.rank >= 1,
        creator: plan.rank >= 2,
        scale: plan.rank >= 4,
        enterprise: plan.rank >= 5,
        commercial: planHasFeature(org.plan, 'commercial'),
        marketplace: planHasFeature(org.plan, 'marketplace') && process.env.MARKETPLACE_DISABLED !== '1',
        voiceClones: planHasFeature(org.plan, 'voiceClones') && process.env.VOICE_CLONE_DISABLED !== '1',
        fineTunes: planHasFeature(org.plan, 'fineTunes') && process.env.FINE_TUNES_DISABLED !== '1',
        prioritySupport: planHasFeature(org.plan, 'prioritySupport'),
        sso: planHasFeature(org.plan, 'sso'),
        dedicated: planHasFeature(org.plan, 'dedicated'),
        workspacesExtra: planHasFeature(org.plan, 'workspacesExtra'),
        ownTts: ownTtsConfigured(),
        notifications: process.env.NOTIFICATIONS_DISABLED !== '1',
        slackConnector: process.env.SLACK_CONNECTOR_DISABLED !== '1',
        voiceAgent: process.env.VOICE_AGENT_DISABLED !== '1',
        billingCheckout: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
      },
      /** Workspace inherits org subscription — ElevenLabs-style entitlement packaging. */
      entitlements: {
        characterQuotaDefault: plan.characterQuota,
        name: plan.name,
        rank: plan.rank,
        features: plan.features,
        workspaceLimit: plan.workspaceLimit,
        workspaceUsed,
        workspaceRemaining:
          plan.workspaceLimit < 0 ? null : Math.max(0, plan.workspaceLimit - workspaceUsed),
        canCreateWorkspace: plan.workspaceLimit < 0 || workspaceUsed < plan.workspaceLimit,
      },
    };
  }
}
