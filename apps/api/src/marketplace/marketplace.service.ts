import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { hashTmSegment, normalizeTmSegment } from '../tm/tm-hash';
import { isPromptKey } from '../prompts/prompt-defaults';
import { upsertGlossarySnapshot } from '../glossary/glossary-snapshot-install';
import {
  DatasetSnapshotPair,
  GlossarySnapshotTerm,
  MARKETPLACE_KIND_DATASET,
  MARKETPLACE_KIND_GLOSSARY,
  MARKETPLACE_KIND_PROMPT,
  MARKETPLACE_KINDS,
  MARKETPLACE_STATUS_PUBLISHED,
  MARKETPLACE_STATUS_UNPUBLISHED,
  MarketplaceKind,
  PromptSnapshotItem,
  isMarketplaceKind,
  isPromptSnapshotItem,
} from './marketplace.types';

@Injectable
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
  ) {}

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private requireKind(raw?: string): MarketplaceKind {
    const kind = (raw ?? MARKETPLACE_KIND_GLOSSARY).trim.toLowerCase;
    if (!isMarketplaceKind(kind)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of ${MARKETPLACE_KINDS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return kind;
  }

  private serializeListing(row: {
    id: string;
    publisherOrgId: string;
    publisherWorkspaceId: string;
    kind: string;
    title: string;
    description: string | null;
    status: string;
    termCount: number;
    priceCents?: number;
    currency?: string;
    createdAt: Date;
    updatedAt: Date;
    publisherOrg?: { name: string };
  }) {
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      description: row.description,
      status: row.status,
      /** Snapshot item count (glossary terms, prompts, or dataset pairs). */
      termCount: row.termCount,
      itemCount: row.termCount,
      priceCents: row.priceCents ?? 0,
      currency: row.currency ?? 'usd',
      publisherOrgId: row.publisherOrgId,
      publisherWorkspaceId: row.publisherWorkspaceId,
      publisherName: row.publisherOrg?.name ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listPublished(organizationId: string, kind?: string) {
    await this.billing.assertPro(organizationId);
    const filter = kind ? this.requireKind(kind) : undefined;
    const rows = await this.prisma.marketplaceListing.findMany({
      where: {
        status: MARKETPLACE_STATUS_PUBLISHED,
        ...(filter ? { kind: filter } : {}),
      },
      include: { publisherOrg: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.serializeListing(r));
  }

  async listMine(organizationId: string, kind?: string) {
    await this.billing.assertPro(organizationId);
    const filter = kind ? this.requireKind(kind) : undefined;
    const rows = await this.prisma.marketplaceListing.findMany({
      where: {
        publisherOrgId: organizationId,
        ...(filter ? { kind: filter } : {}),
      },
      include: { publisherOrg: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.serializeListing(r));
  }

  async listInstalls(organizationId: string, workspaceId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceInstall.findMany({
      where: { installerOrgId: organizationId, installerWorkspaceId: workspaceId },
      include: {
        listing: {
          include: { publisherOrg: { select: { name: true } } },
        },
      },
      orderBy: { installedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      termsInstalled: r.termsInstalled,
      itemsInstalled: r.termsInstalled,
      installedAt: r.installedAt,
      listing: this.serializeListing(r.listing),
    }));
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    title: string;
    description?: string;
    kind?: string;
    priceCents?: number;
    currency?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    const title = input.title.trim;
    if (!title) {
      throw new ApiException(
        'validation_error',
        'title is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const priceCents = Math.floor(Number(input.priceCents ?? 0));
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      throw new ApiException(
        'validation_error',
        'priceCents must be a non-negative integer',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (priceCents > 0 && priceCents < 50) {
      throw new ApiException(
        'validation_error',
        'Paid listings must be at least 50 cents (or free)',
        HttpStatus.BAD_REQUEST,
      );
    }
    const currency = (input.currency ?? 'usd').trim.toLowerCase || 'usd';
    if (!/^[a-z]{3}$/.test(currency)) {
      throw new ApiException(
        'validation_error',
        'currency must be a 3-letter ISO code',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (priceCents > 0) {
      const publisher = await this.prisma.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
      });
      if (this.billing.isMarketplacePaymentsConfigured && !publisher.stripeConnectChargesEnabled) {
        throw new ApiException(
          'connect_required',
          'Connect payouts must be enabled before publishing paid listings',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const kind = this.requireKind(input.kind);
    const built = await this.buildSnapshot({
      kind,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
    });

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        publisherOrgId: input.organizationId,
        publisherWorkspaceId: input.workspaceId,
        kind,
        title,
        description: input.description?.trim || null,
        status: MARKETPLACE_STATUS_PUBLISHED,
        snapshot: built.snapshot,
        termCount: built.itemCount,
        priceCents,
        currency,
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'marketplace.listing_published',
      route: 'POST /v1/marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        kind,
        termCount: listing.termCount,
        priceCents,
      },
    });

    return this.serializeListing(listing);
  }

  async listSales(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceSale.findMany({
      where: {
        OR: [{ publisherOrgId: organizationId }, { buyerOrgId: organizationId }],
      },
      include: {
        listing: { select: { id: true, title: true, kind: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      listingTitle: r.listing.title,
      listingKind: r.listing.kind,
      buyerOrgId: r.buyerOrgId,
      publisherOrgId: r.publisherOrgId,
      amountCents: r.amountCents,
      applicationFeeCents: r.applicationFeeCents,
      currency: r.currency,
      status: r.status,
      installId: r.installId,
      createdAt: r.createdAt,
      role: r.publisherOrgId === organizationId ? 'publisher' : 'buyer',
    }));
  }

  private async buildSnapshot(input: {
    kind: MarketplaceKind;
    organizationId: string;
    workspaceId: string;
  }): Promise<{ snapshot: object; itemCount: number }> {
    if (input.kind === MARKETPLACE_KIND_GLOSSARY) {
      const terms = await this.prisma.glossaryTerm.findMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
        orderBy: [{ sourceLang: 'asc' }, { targetLang: 'asc' }, { sourceTerm: 'asc' }],
      });
      if (terms.length === 0) {
        throw new ApiException(
          'validation_error',
          'Workspace has no glossary terms to publish',
          HttpStatus.BAD_REQUEST,
        );
      }
      const snapshot: GlossarySnapshotTerm[] = terms.map((t) => ({
        sourceLang: t.sourceLang,
        targetLang: t.targetLang,
        sourceTerm: t.sourceTerm,
        targetTerm: t.targetTerm,
        caseSensitive: t.caseSensitive,
        wholeWord: t.wholeWord,
      }));
      return { snapshot, itemCount: snapshot.length };
    }

    if (input.kind === MARKETPLACE_KIND_PROMPT) {
      const prompts = await this.prisma.prompt.findMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          activeVersion: { not: null },
        },
        include: { versions: true },
      });
      const snapshot: PromptSnapshotItem[] = [];
      for (const prompt of prompts) {
        if (!isPromptKey(prompt.key) || prompt.activeVersion == null) continue;
        const version = prompt.versions.find((v) => v.version === prompt.activeVersion);
        if (!version?.body?.trim) continue;
        snapshot.push({ key: prompt.key, body: version.body });
      }
      if (snapshot.length === 0) {
        throw new ApiException(
          'validation_error',
          'Workspace has no active managed prompts to publish',
          HttpStatus.BAD_REQUEST,
        );
      }
      return { snapshot, itemCount: snapshot.length };
    }

    // dataset — parallel pairs from approved TM (pre–Dataset Cloud)
    const entries = await this.prisma.translationMemoryEntry.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        approved: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    if (entries.length === 0) {
      throw new ApiException(
        'validation_error',
        'Workspace has no approved TM pairs to publish as a dataset',
        HttpStatus.BAD_REQUEST,
      );
    }
    const snapshot: DatasetSnapshotPair[] = entries.map((e) => ({
      sourceLang: e.sourceLang,
      targetLang: e.targetLang,
      sourceText: e.sourceText,
      targetText: e.targetText,
    }));
    return { snapshot, itemCount: snapshot.length };
  }

  async unpublish(input: {
    organizationId: string;
    listingId: string;
    userId?: string;
    role: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { id: input.listingId, publisherOrgId: input.organizationId },
    });
    if (!listing) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { status: MARKETPLACE_STATUS_UNPUBLISHED },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'marketplace.listing_unpublished',
      route: `DELETE /v1/marketplace/listings/${input.listingId}`,
      ip: input.ip,
      metadata: { listingId: listing.id },
    });

    return this.serializeListing(updated);
  }

  async install(input: {
    organizationId: string;
    workspaceId: string;
    listingId: string;
    userId?: string;
    role: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: input.listingId },
    });
    if (!listing || listing.status !== MARKETPLACE_STATUS_PUBLISHED) {
      throw new ApiException(
        'not_found',
        'Published listing not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (!isMarketplaceKind(listing.kind)) {
      throw new ApiException(
        'validation_error',
        `Unsupported listing kind: ${listing.kind}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.prisma.marketplaceInstall.findUnique({
      where: {
        listingId_installerWorkspaceId: {
          listingId: listing.id,
          installerWorkspaceId: input.workspaceId,
        },
      },
    });
    if (existing) {
      throw new ApiException(
        'conflict',
        'Listing already installed in this workspace',
        HttpStatus.CONFLICT,
      );
    }

    if (listing.priceCents > 0) {
      if (this.billing.isMarketplacePaymentsConfigured) {
        const publisher = await this.prisma.organization.findUniqueOrThrow({
          where: { id: listing.publisherOrgId },
        });
        if (!publisher.stripeConnectAccountId || !publisher.stripeConnectChargesEnabled) {
          throw new ApiException(
            'connect_required',
            'Publisher has not completed Stripe Connect onboarding',
            HttpStatus.BAD_REQUEST,
          );
        }
        const checkout = await this.billing.createMarketplaceCheckout({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId ?? '',
          listingId: listing.id,
          listingTitle: listing.title,
          amountCents: listing.priceCents,
          currency: listing.currency,
          destinationAccountId: publisher.stripeConnectAccountId,
          ip: input.ip,
        });
        return {
          requiresPayment: true as const,
          checkoutUrl: checkout.url,
          sessionId: checkout.sessionId,
          amountCents: listing.priceCents,
          applicationFeeCents: checkout.applicationFeeCents,
          currency: listing.currency,
          listing: this.serializeListing(listing),
        };
      }

      // Fixture / local path: record sale then install (no live Stripe).
      const fee = this.billing.applicationFeeCents(listing.priceCents);
      const install = await this.copyListingIntoWorkspace({
        listing,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
      });
      await this.prisma.marketplaceSale.create({
        data: {
          listingId: listing.id,
          buyerOrgId: input.organizationId,
          publisherOrgId: listing.publisherOrgId,
          installId: install.id,
          amountCents: listing.priceCents,
          applicationFeeCents: fee,
          currency: listing.currency,
          status: 'recorded',
        },
      });
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'marketplace.listing_installed',
        route: `POST /v1/marketplace/listings/${input.listingId}/install`,
        ip: input.ip,
        metadata: {
          listingId: listing.id,
          kind: listing.kind,
          installId: install.id,
          termsInstalled: install.termsInstalled,
          saleStatus: 'recorded',
          amountCents: listing.priceCents,
        },
      });
      return {
        requiresPayment: false as const,
        id: install.id,
        listingId: install.listingId,
        termsInstalled: install.termsInstalled,
        itemsInstalled: install.termsInstalled,
        installedAt: install.installedAt,
        saleStatus: 'recorded' as const,
        amountCents: listing.priceCents,
        listing: this.serializeListing(listing),
      };
    }

    const install = await this.copyListingIntoWorkspace({
      listing,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'marketplace.listing_installed',
      route: `POST /v1/marketplace/listings/${input.listingId}/install`,
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        kind: listing.kind,
        installId: install.id,
        termsInstalled: install.termsInstalled,
      },
    });

    return {
      requiresPayment: false as const,
      id: install.id,
      listingId: install.listingId,
      termsInstalled: install.termsInstalled,
      itemsInstalled: install.termsInstalled,
      installedAt: install.installedAt,
      listing: this.serializeListing(listing),
    };
  }

  /** Complete a paid Checkout (webhook) — idempotent on session id. */
  async fulfillPaidCheckout(input: {
    sessionId: string;
    listingId?: string;
    organizationId?: string;
    workspaceId?: string;
    userId?: string;
    amountTotal: number;
    currency: string;
  }) {
    if (!input.listingId || !input.organizationId || !input.workspaceId) {
      return { skipped: true as const };
    }

    const existingSale = await this.prisma.marketplaceSale.findUnique({
      where: { stripeCheckoutSessionId: input.sessionId },
    });
    if (existingSale) {
      return { skipped: true as const, saleId: existingSale.id };
    }

    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: input.listingId },
    });
    if (!listing) {
      return { skipped: true as const };
    }

    const already = await this.prisma.marketplaceInstall.findUnique({
      where: {
        listingId_installerWorkspaceId: {
          listingId: listing.id,
          installerWorkspaceId: input.workspaceId,
        },
      },
    });
    if (already) {
      const fee = this.billing.applicationFeeCents(listing.priceCents);
      const sale = await this.prisma.marketplaceSale.create({
        data: {
          listingId: listing.id,
          buyerOrgId: input.organizationId,
          publisherOrgId: listing.publisherOrgId,
          installId: already.id,
          amountCents: input.amountTotal || listing.priceCents,
          applicationFeeCents: fee,
          currency: input.currency || listing.currency,
          stripeCheckoutSessionId: input.sessionId,
          status: 'paid',
        },
      });
      return { saleId: sale.id, installId: already.id };
    }

    const install = await this.copyListingIntoWorkspace({
      listing,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
    });
    const fee = this.billing.applicationFeeCents(listing.priceCents);
    const sale = await this.prisma.marketplaceSale.create({
      data: {
        listingId: listing.id,
        buyerOrgId: input.organizationId,
        publisherOrgId: listing.publisherOrgId,
        installId: install.id,
        amountCents: input.amountTotal || listing.priceCents,
        applicationFeeCents: fee,
        currency: input.currency || listing.currency,
        stripeCheckoutSessionId: input.sessionId,
        status: 'paid',
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'marketplace.sale_paid',
      route: 'stripe.webhook',
      metadata: {
        saleId: sale.id,
        listingId: listing.id,
        sessionId: input.sessionId,
        amountCents: sale.amountCents,
      },
    });

    return { saleId: sale.id, installId: install.id };
  }

  private async copyListingIntoWorkspace(input: {
    listing: {
      id: string;
      kind: string;
      snapshot: unknown;
      publisherOrgId: string;
    };
    organizationId: string;
    workspaceId: string;
    userId?: string;
  }) {
    const { listing } = input;

    return this.prisma.$transaction(async (tx) => {
      let count = 0;
      if (listing.kind === MARKETPLACE_KIND_GLOSSARY) {
        const snapshot = listing.snapshot as unknown as GlossarySnapshotTerm[];
        if (!Array.isArray(snapshot) || snapshot.length === 0) {
          throw new ApiException(
            'validation_error',
            'Listing snapshot is empty',
            HttpStatus.BAD_REQUEST,
          );
        }
        count = await upsertGlossarySnapshot(tx, {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          terms: snapshot,
        });
      } else if (listing.kind === MARKETPLACE_KIND_PROMPT) {
        const snapshot = listing.snapshot as unknown as PromptSnapshotItem[];
        if (!Array.isArray(snapshot) || snapshot.length === 0) {
          throw new ApiException(
            'validation_error',
            'Listing snapshot is empty',
            HttpStatus.BAD_REQUEST,
          );
        }
        for (const item of snapshot) {
          if (!isPromptSnapshotItem(item)) continue;
          const prompt = await tx.prompt.upsert({
            where: {
              workspaceId_key: {
                workspaceId: input.workspaceId,
                key: item.key,
              },
            },
            create: {
              organizationId: input.organizationId,
              workspaceId: input.workspaceId,
              key: item.key,
            },
            update: {},
          });
          const latest = await tx.promptVersion.findFirst({
            where: { promptId: prompt.id },
            orderBy: { version: 'desc' },
            select: { version: true },
          });
          const version = (latest?.version ?? 0) + 1;
          await tx.promptVersion.create({
            data: {
              promptId: prompt.id,
              version,
              body: item.body,
              note: `marketplace:${listing.id}`,
              createdBy: input.userId,
            },
          });
          await tx.prompt.update({
            where: { id: prompt.id },
            data: { activeVersion: version },
          });
          count += 1;
        }
        if (count === 0) {
          throw new ApiException(
            'validation_error',
            'Listing snapshot has no valid prompts',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        const snapshot = listing.snapshot as unknown as DatasetSnapshotPair[];
        if (!Array.isArray(snapshot) || snapshot.length === 0) {
          throw new ApiException(
            'validation_error',
            'Listing snapshot is empty',
            HttpStatus.BAD_REQUEST,
          );
        }
        const org = await tx.organization.findUnique({
          where: { id: input.organizationId },
          select: { persistSourceText: true },
        });
        if (org?.persistSourceText === false) {
          throw new ApiException(
            'persist_disabled',
            'Organization policy does not allow persisting source text (dataset install blocked)',
            HttpStatus.FORBIDDEN,
          );
        }
        for (const pair of snapshot) {
          const sourceText = normalizeTmSegment(pair.sourceText ?? '');
          const targetText = (pair.targetText ?? '').trim;
          if (!sourceText || !targetText || !pair.sourceLang || !pair.targetLang) continue;
          const sourceHash = hashTmSegment(sourceText);
          await tx.translationMemoryEntry.upsert({
            where: {
              workspaceId_sourceLang_targetLang_sourceHash: {
                workspaceId: input.workspaceId,
                sourceLang: pair.sourceLang,
                targetLang: pair.targetLang,
                sourceHash,
              },
            },
            create: {
              organizationId: input.organizationId,
              workspaceId: input.workspaceId,
              sourceLang: pair.sourceLang,
              targetLang: pair.targetLang,
              sourceText,
              targetText,
              sourceHash,
              approved: true,
            },
            update: {
              targetText,
              approved: true,
            },
          });
          count += 1;
        }
        if (count === 0) {
          throw new ApiException(
            'validation_error',
            'Listing snapshot has no valid pairs',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const install = await tx.marketplaceInstall.create({
        data: {
          listingId: listing.id,
          installerOrgId: input.organizationId,
          installerWorkspaceId: input.workspaceId,
          termsInstalled: count,
        },
      });
      return install;
    });
  }
}
