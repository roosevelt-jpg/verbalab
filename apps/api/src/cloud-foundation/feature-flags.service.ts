import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ownTtsConfigured } from '../gateway/own-tts.adapter';
import { BillingService } from '../billing/billing.service';
import type { PlanFeature } from '../billing/plans';
import { ApiException } from '../common/errors/api-exception';

/** Plan entitlement keys operators can toggle when their plan includes them. */
export const TOGGLEABLE_FEATURES: PlanFeature[] = [
  'speech',
  'translate',
  'playground',
  'commercial',
  'dealBridge',
  'voiceClones',
  'marketplace',
  'fineTunes',
  'prioritySupport',
  'workspacesExtra',
  'sso',
  'dedicated',
];

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  async forOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true, disabledAt: true, featureOverrides: true },
    });
    // Resolve through billing so platform-admin Plan catalog edits apply live.
    const plan = await this.billing.resolvePlan(org.plan);
    const pro = await this.billing.resolvePlan('pro');
    const orgEnabled = !org.disabledAt;
    const proPlus = plan.rank >= pro.rank;
    const workspaceUsed = await this.prisma.workspace.count({ where: { organizationId } });
    const overrides = this.parseOverrides(org.featureOverrides);

    const flag = (key: string, base: boolean) =>
      typeof overrides[key] === 'boolean' ? overrides[key]! : base;

    const planFeatureFlags = Object.fromEntries(
      TOGGLEABLE_FEATURES.map((key) => [key, flag(key, plan.features.includes(key))]),
    ) as Record<PlanFeature, boolean>;

    const flags = {
      orgEnabled,
      pro: proPlus,
      starter: plan.rank >= 1,
      creator: plan.rank >= 2,
      business: plan.rank >= 2,
      scale: plan.rank >= 2,
      enterprise: plan.rank >= 3,
      speech: planFeatureFlags.speech,
      translate: planFeatureFlags.translate,
      playground: planFeatureFlags.playground,
      commercial: planFeatureFlags.commercial,
      dealBridge:
        planFeatureFlags.dealBridge && process.env.DEALBRIDGE_DISABLED !== '1',
      marketplace:
        planFeatureFlags.marketplace && process.env.MARKETPLACE_DISABLED !== '1',
      voiceClones:
        planFeatureFlags.voiceClones && process.env.VOICE_CLONE_DISABLED !== '1',
      fineTunes:
        planFeatureFlags.fineTunes && process.env.FINE_TUNES_DISABLED !== '1',
      prioritySupport: planFeatureFlags.prioritySupport,
      sso: planFeatureFlags.sso,
      dedicated: planFeatureFlags.dedicated,
      workspacesExtra: planFeatureFlags.workspacesExtra,
      ownTts: ownTtsConfigured(),
      notifications: process.env.NOTIFICATIONS_DISABLED !== '1',
      slackConnector: process.env.SLACK_CONNECTOR_DISABLED !== '1',
      voiceAgent: process.env.VOICE_AGENT_DISABLED !== '1',
      billingCheckout: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    };

    const effectiveFeatures = TOGGLEABLE_FEATURES.filter((key) => Boolean(flags[key]));

    return {
      organizationId,
      plan: org.plan,
      flags,
      overrides,
      entitlements: {
        characterQuotaDefault: plan.characterQuota,
        name: plan.name,
        rank: plan.rank,
        features: effectiveFeatures,
        planFeatures: [...plan.features],
        workspaceLimit: plan.workspaceLimit,
        workspaceUsed,
        workspaceRemaining:
          plan.workspaceLimit < 0 ? null : Math.max(0, plan.workspaceLimit - workspaceUsed),
        canCreateWorkspace: plan.workspaceLimit < 0 || workspaceUsed < plan.workspaceLimit,
      },
    };
  }

  /**
   * Org owners/admins can toggle plan-included entitlements on/off.
   * Plan-locked features cannot be enabled here — upgrade under Billing.
   */
  async patchOverrides(input: {
    organizationId: string;
    role: string;
    patch: Record<string, boolean | null>;
  }) {
    if (input.role !== 'owner' && input.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can change workspace entitlements',
        HttpStatus.FORBIDDEN,
      );
    }

    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
      select: { plan: true, featureOverrides: true },
    });
    const plan = await this.billing.resolvePlan(org.plan);
    const current = this.parseOverrides(org.featureOverrides);
    const next = { ...current };

    for (const [key, value] of Object.entries(input.patch)) {
      if (!TOGGLEABLE_FEATURES.includes(key as PlanFeature)) {
        throw new ApiException('validation_error', `Unknown entitlement feature: ${key}`);
      }
      const onPlan = plan.features.includes(key as PlanFeature);
      if (value === true && !onPlan) {
        throw new ApiException(
          'plan_required',
          `${key} requires a higher plan — upgrade under Billing`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      if (value === null) {
        delete next[key];
      } else if (typeof value === 'boolean') {
        if (!onPlan && value === false) {
          // Already locked by plan; ignore no-op disable.
          continue;
        }
        next[key] = value;
      }
    }

    await this.prisma.organization.update({
      where: { id: input.organizationId },
      data: { featureOverrides: next as Prisma.InputJsonValue },
    });

    return this.forOrganization(input.organizationId);
  }

  private parseOverrides(raw: unknown): Record<string, boolean> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'boolean') out[k] = v;
    }
    return out;
  }
}
