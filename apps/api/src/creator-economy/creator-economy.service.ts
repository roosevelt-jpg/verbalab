import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import {
  ECOSYSTEM_HUB_PLATFORM_FEE_BPS,
  ROYALTY_HAND_CHECK_SCENARIOS,
  creatorEconomyEngineCatalog,
  splitRevenue,
} from './creator-economy.catalog';

@Injectable
export class CreatorEconomyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine {
    return creatorEconomyEngineCatalog;
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  royaltyScenarios {
    const verified = ROYALTY_HAND_CHECK_SCENARIOS.map((s) => {
      const split = splitRevenue({ amountCents: s.amountCents, feeBps: s.feeBps });
      const ok =
        split.applicationFeeCents === s.fee && split.publisherNetCents === s.net;
      return {
        id: s.id,
        amountCents: s.amountCents,
        feeBps: s.feeBps,
        expectedApplicationFeeCents: s.fee,
        expectedPublisherNetCents: s.net,
        computed: split,
        handCheckPassed: ok,
      };
    });
    return {
      scenarios: verified,
      allHandChecksPassed: verified.every((v) => v.handCheckPassed),
      honesty: {
        creatorPayoutMathHandCheckedInTests: true,
        creatorPayoutMathVerifiedLive: false,
        storesRawCardData: false,
        stripeOrEquivalentRequired: true,
      },
      note:
        'Hand-check these scenarios before live creators. Live payout verification remains an ops sign-off (creatorPayoutMathVerifiedLive=false).',
    };
  }

  previewRoyalty(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    amountCents?: number;
    feeBps?: number;
    schedule?: 'ecosystem_hub' | 'content_marketplace';
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    return this.billing.assertPro(input.organizationId).then(async  => {
      await this.fabricGate.assertAllowed({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        bus: 'creator-economy',
        action: 'marketplace.royalty.preview',
        subjectId: input.userId,
        permissions: ['marketplace.install'],
      });

      const schedule = input.schedule ?? 'ecosystem_hub';
      const feeBps =
        input.feeBps != null
          ? Math.floor(Number(input.feeBps))
          : schedule === 'content_marketplace'
            ? this.billing.platformFeeBps
            : ECOSYSTEM_HUB_PLATFORM_FEE_BPS;

      const split = splitRevenue({
        amountCents: input.amountCents ?? 0,
        feeBps,
      });

      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'creator_economy.royalty_previewed',
        route: 'POST /v1/creator-economy/royalty/preview',
        ip: input.ip,
        metadata: { ...split, schedule },
      });

      return {
        schedule,
        ...split,
        honesty: this.engine.honesty,
        note:
          schedule === 'content_marketplace'
            ? 'Uses billing.platformFeeBps (MARKETPLACE_PLATFORM_FEE_BPS, default 20%).'
            : 'Uses ecosystem hub fee 15% (1500 bps) — Volume 11 model→voice-language marketplaces.',
      };
    });
  }

  async listSales(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceSale.findMany({
      where: {
        OR: [{ publisherOrgId: organizationId }, { buyerOrgId: organizationId }],
      },
      include: { listing: { select: { id: true, title: true, kind: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      sales: rows.map((r) => {
        const split = splitRevenue({
          amountCents: r.amountCents,
          feeBps:
            r.amountCents > 0
              ? Math.round((r.applicationFeeCents * 10_000) / r.amountCents)
              : 0,
        });
        return {
          id: r.id,
          listingId: r.listingId,
          listingTitle: r.listing.title,
          listingKind: r.listing.kind,
          role: r.publisherOrgId === organizationId ? 'publisher' : 'buyer',
          amountCents: r.amountCents,
          applicationFeeCents: r.applicationFeeCents,
          publisherNetCents: r.amountCents - r.applicationFeeCents,
          currency: r.currency,
          status: r.status,
          createdAt: r.createdAt.toISOString,
          impliedFeeBps: split.feeBps,
        };
      }),
      honesty: this.engine.honesty,
      note: 'Aggregated MarketplaceSale receipts ( + Volume 11 hubs). Not a payment ledger OS.',
    };
  }

  async listInvoices(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceSale.findMany({
      where: {
        OR: [{ publisherOrgId: organizationId }, { buyerOrgId: organizationId }],
      },
      include: { listing: { select: { title: true, kind: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      invoices: rows.map((r) => ({
        id: `inv_${r.id}`,
        saleId: r.id,
        listingTitle: r.listing.title,
        listingKind: r.listing.kind,
        amountCents: r.amountCents,
        applicationFeeCents: r.applicationFeeCents,
        publisherNetCents: r.amountCents - r.applicationFeeCents,
        currency: r.currency,
        status: r.status === 'paid' ? 'paid' : 'recorded',
        issuedAt: r.createdAt.toISOString,
      })),
      honesty: {
        fullInvoicingOs: false,
        storesRawCardData: false,
        stripeOrEquivalentRequired: true,
      },
      note: 'Invoice-style views over MarketplaceSale — not a full invoicing or tax OS.',
    };
  }

  async creatorProfile(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const [org, connect, salesAgg, listingCount] = await Promise.all([
      this.prisma.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { id: true, name: true, plan: true },
      }),
      this.billing.getConnectStatus(organizationId),
      this.prisma.marketplaceSale.aggregate({
        where: { publisherOrgId: organizationId },
        _sum: { amountCents: true, applicationFeeCents: true },
        _count: true,
      }),
      this.prisma.marketplaceListing.count({
        where: { publisherOrgId: organizationId },
      }),
    ]);
    const gross = salesAgg._sum.amountCents ?? 0;
    const fees = salesAgg._sum.applicationFeeCents ?? 0;
    return {
      profile: {
        organizationId: org.id,
        displayName: org.name,
        plan: org.plan,
        listingsPublished: listingCount,
        salesCount: salesAgg._count,
        grossSalesCents: gross,
        platformFeesCents: fees,
        publisherNetCents: gross - fees,
        connect: {
          connected: connect.connected,
          chargesEnabled: connect.chargesEnabled,
          onboardingConfigured: connect.onboardingConfigured,
          platformFeeBps: connect.platformFeeBps,
        },
      },
      honesty: this.engine.honesty,
      note: 'Creator profile over org + Connect + sales. Not a social creator CRM.',
    };
  }

  async organizationProfile(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        billingStatus: true,
        memberships: { select: { role: true }, take: 20 },
      },
    });
    const [asBuyer, asPublisher] = await Promise.all([
      this.prisma.marketplaceSale.count({ where: { buyerOrgId: organizationId } }),
      this.prisma.marketplaceSale.count({ where: { publisherOrgId: organizationId } }),
    ]);
    return {
      profile: {
        organizationId: org.id,
        name: org.name,
        plan: org.plan,
        billingStatus: org.billingStatus,
        membershipRoles: org.memberships.map((m) => m.role),
        purchasesAsBuyer: asBuyer,
        salesAsPublisher: asPublisher,
      },
      honesty: { storesRawCardData: false, crmOs: false },
      note: 'Organization economy summary — not a CRM OS.',
    };
  }

  async partnerProfile(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const connect = await this.billing.getConnectStatus(organizationId);
    return {
      partner: {
        organizationId,
        connectReady: Boolean(connect.connected && connect.chargesEnabled),
        connected: connect.connected,
        chargesEnabled: connect.chargesEnabled,
        onboardingConfigured: connect.onboardingConfigured,
        platformFeeBps: connect.platformFeeBps,
        program: 'stripe_connect_express',
      },
      honesty: {
        fullPartnerProgram: false,
        storesRawCardData: false,
        stripeOrEquivalentRequired: true,
        liveConnectBlockedWithoutStripeEnv: !connect.onboardingConfigured,
      },
      note:
        'Partner readiness is Stripe Connect Express. Full partner program / multi-tier accounts deferred.',
    };
  }

  async licensing(organizationId: string, workspaceId: string) {
    await this.billing.assertPro(organizationId);
    const installs = await this.prisma.marketplaceInstall.findMany({
      where: { installerOrgId: organizationId, installerWorkspaceId: workspaceId },
      include: { listing: { select: { id: true, title: true, kind: true, status: true } } },
      orderBy: { installedAt: 'desc' },
      take: 100,
    });
    return {
      entitlements: installs.map((i) => ({
        installId: i.id,
        listingId: i.listingId,
        title: i.listing.title,
        kind: i.listing.kind,
        listingStatus: i.listing.status,
        installedAt: i.installedAt.toISOString,
      })),
      honesty: {
        licenseServerOs: false,
        storesRawCardData: false,
      },
      note: 'Installed marketplace entitlements for this workspace — not a license server OS.',
    };
  }

  async taxReporting {
    return {
      status: 'deferred',
      coverage: {
        form1099: false,
        vatInvoicing: false,
        withholding: false,
        taxFormsExport: false,
      },
      honesty: {
        taxHandlingComplete: false,
        taxEngineOs: false,
        storesRawCardData: false,
        stripeOrEquivalentRequired: true,
      },
      note:
        'Tax reporting is an explicit gap. Do not treat Creator Economy as tax-complete before ops/legal coverage for 1099/VAT.',
    };
  }

  async disputes {
    return {
      status: 'deferred',
      coverage: {
        chargebackHandling: false,
        disputeWorkflowUi: false,
        refundsUi: false,
        stripeDisputeWebhooksWired: false,
      },
      honesty: {
        disputeChargebackComplete: false,
        refundsUiComplete: false,
        storesRawCardData: false,
        stripeOrEquivalentRequired: true,
      },
      note:
        'Dispute/chargeback flows are an explicit gap. Stripe may surface disputes in Dashboard when Connect is live — Lugemi UI/workflow not complete.',
    };
  }

  async analytics(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const [salesAsPublisher, salesAsBuyer, installs, listings, royalty] = await Promise.all([
      this.prisma.marketplaceSale.count({ where: { publisherOrgId: organizationId } }),
      this.prisma.marketplaceSale.count({ where: { buyerOrgId: organizationId } }),
      this.prisma.marketplaceInstall.count({ where: { installerOrgId: organizationId } }),
      this.prisma.marketplaceListing.count({ where: { publisherOrgId: organizationId } }),
      this.prisma.marketplaceSale.aggregate({
        where: { publisherOrgId: organizationId },
        _sum: { amountCents: true, applicationFeeCents: true },
      }),
    ]);
    const gross = royalty._sum.amountCents ?? 0;
    const fees = royalty._sum.applicationFeeCents ?? 0;
    return {
      listings,
      installs,
      salesAsPublisher,
      salesAsBuyer,
      grossSalesCents: gross,
      platformFeesCents: fees,
      publisherNetCents: gross - fees,
      honesty: this.engine.honesty,
      note: 'Creator Economy aggregates over MarketplaceSale / installs.',
    };
  }

  monitoring {
    const engine = this.engine;
    const scenarios = this.royaltyScenarios;
    return {
      mode: 'creator-economy',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      royaltyHandChecksPassed: scenarios.allHandChecksPassed,
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Creator Economy monitoring snapshot.',
    };
  }
}
