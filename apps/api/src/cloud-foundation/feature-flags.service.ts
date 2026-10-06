import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ownTtsConfigured } from '../gateway/own-tts.adapter';
import { isProOrAbove, planFromId, planHasFeature } from '../billing/plans';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async forOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true, disabledAt: true, featureOverrides: true },
    });
    const plan = planFromId(org.plan);
    const orgEnabled = !org.disabledAt;
    const proPlus = isProOrAbove(org.plan);
    const workspaceUsed = await this.prisma.workspace.count({ where: { organizationId } });
    const overrides = this.parseOverrides(org.featureOverrides);

    const flag = (key: string, base: boolean) =>
      typeof overrides[key] === 'boolean' ? overrides[key]! : base;

    return {
      organizationId,
      plan: org.plan,
      flags: {
        orgEnabled,
        pro: proPlus,
        starter: plan.rank >= 1,
        creator: plan.rank >= 2,
        business: plan.rank >= 2,
        scale: plan.rank >= 2,
        enterprise: plan.rank >= 3,
        commercial: flag('commercial', planHasFeature(org.plan, 'commercial')),
        marketplace:
          flag('marketplace', planHasFeature(org.plan, 'marketplace')) &&
          process.env.MARKETPLACE_DISABLED !== '1',
        voiceClones:
          flag('voiceClones', planHasFeature(org.plan, 'voiceClones')) &&
          process.env.VOICE_CLONE_DISABLED !== '1',
        fineTunes:
          flag('fineTunes', planHasFeature(org.plan, 'fineTunes')) &&
          process.env.FINE_TUNES_DISABLED !== '1',
        prioritySupport: flag('prioritySupport', planHasFeature(org.plan, 'prioritySupport')),
        sso: flag('sso', planHasFeature(org.plan, 'sso')),
        dedicated: flag('dedicated', planHasFeature(org.plan, 'dedicated')),
        workspacesExtra: flag('workspacesExtra', planHasFeature(org.plan, 'workspacesExtra')),
        ownTts: ownTtsConfigured(),
        notifications: process.env.NOTIFICATIONS_DISABLED !== '1',
        slackConnector: process.env.SLACK_CONNECTOR_DISABLED !== '1',
        voiceAgent: process.env.VOICE_AGENT_DISABLED !== '1',
        billingCheckout: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
      },
      overrides,
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

  private parseOverrides(raw: Prisma.JsonValue | null | undefined): Record<string, boolean> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === 'boolean') out[key] = value;
    }
    return out;
  }
}
