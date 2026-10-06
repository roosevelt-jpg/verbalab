import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ownTtsConfigured } from '../gateway/own-tts.adapter';
import { planFromId } from '../billing/plans';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async forOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true, disabledAt: true },
    });
    const plan = planFromId(org.plan);
    const isPro = org.plan === 'pro';
    const orgEnabled = !org.disabledAt;

    return {
      organizationId,
      plan: org.plan,
      flags: {
        orgEnabled,
        pro: isPro,
        marketplace: isPro && process.env.MARKETPLACE_DISABLED !== '1',
        voiceClones: isPro && process.env.VOICE_CLONE_DISABLED !== '1',
        fineTunes: isPro && process.env.FINE_TUNES_DISABLED !== '1',
        ownTts: ownTtsConfigured(),
        notifications: process.env.NOTIFICATIONS_DISABLED !== '1',
        slackConnector: process.env.SLACK_CONNECTOR_DISABLED !== '1',
        voiceAgent: process.env.VOICE_AGENT_DISABLED !== '1',
        billingCheckout: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
      },
      entitlements: {
        characterQuotaDefault: plan.characterQuota,
        name: plan.name,
      },
    };
  }
}
