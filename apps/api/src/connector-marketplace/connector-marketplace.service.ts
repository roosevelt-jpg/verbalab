import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import {
  CONNECTOR_MARKETPLACE_CATEGORIES,
  findConnectorCatalogEntry,
  connectorMarketplaceEngineCatalog,
  type ConnectorMarketplaceCategory,
} from './connector-marketplace.catalog';

const LISTING_KIND = 'connector';
const REVIEW_RUNTIME = 'connector-marketplace';
const PLATFORM_FEE_BPS = 1500; // 15%
const HUB = 'connector-marketplace';

type ConnectorSnapshot = {
  hub: typeof HUB;
  connectorKey: string;
  connectorName: string;
  category: ConnectorMarketplaceCategory;
  catalogStatus: string;
  connectorApi: string | null;
  connectorVersion: string;
  verified: boolean;
  liveConnectorExecution: false;
  sandboxRequired: true;
  storesRawCardData: false;
  ratingSum: number;
  ratingCount: number;
};

@Injectable()
export class ConnectorMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine() {
    return connectorMarketplaceEngineCatalog();
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private parseSnapshot(raw: Prisma.JsonValue): ConnectorSnapshot {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApiException(
        'validation_error',
        'Invalid connector listing snapshot',
        HttpStatus.BAD_REQUEST,
      );
    }
    const snap = raw as unknown as ConnectorSnapshot;
    if (snap.hub !== HUB) {
      throw new ApiException(
        'validation_error',
        'Listing is not a Connector Marketplace hub listing',
        HttpStatus.BAD_REQUEST,
      );
    }
    return snap;
  }

  private isHubListing(raw: Prisma.JsonValue): boolean {
    return Boolean(
      raw &&
        typeof raw === 'object' &&
        !Array.isArray(raw) &&
        (raw as { hub?: string }).hub === HUB,
    );
  }

  private parseCategory(raw?: string): ConnectorMarketplaceCategory {
    const value = (raw ?? '').trim().toLowerCase();
    if (!(CONNECTOR_MARKETPLACE_CATEGORIES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `category must be one of ${CONNECTOR_MARKETPLACE_CATEGORIES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value as ConnectorMarketplaceCategory;
  }

  private serialize(row: {
    id: string;
    kind: string;
    title: string;
    description: string | null;
    status: string;
    snapshot: Prisma.JsonValue;
    termCount: number;
    priceCents: number;
    currency: string;
    publisherOrgId: string;
    publisherWorkspaceId: string;
    createdAt: Date;
    updatedAt: Date;
    publisherOrg?: { name: string };
  }) {
    const snap = this.parseSnapshot(row.snapshot);
    const avg = snap.ratingCount > 0 ? snap.ratingSum / snap.ratingCount : null;
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      description: row.description,
      status: row.status,
      connectorKey: snap.connectorKey,
      connectorName: snap.connectorName,
      category: snap.category,
      catalogStatus: snap.catalogStatus,
      connectorApi: snap.connectorApi,
      connectorVersion: snap.connectorVersion,
      verified: snap.verified,
      liveConnectorExecution: snap.liveConnectorExecution,
      sandboxRequired: snap.sandboxRequired,
      storesRawCardData: snap.storesRawCardData,
      priceCents: row.priceCents,
      currency: row.currency,
      ratingAverage: avg != null ? Number(avg.toFixed(2)) : null,
      ratingCount: snap.ratingCount,
      publisherOrgId: row.publisherOrgId,
      publisherWorkspaceId: row.publisherWorkspaceId,
      publisherName: row.publisherOrg?.name ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listPublished(organizationId: string, category?: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceListing.findMany({
      where: { status: 'published', kind: LISTING_KIND },
      include: { publisherOrg: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    let listings = rows.filter((r) => this.isHubListing(r.snapshot)).map((r) => this.serialize(r));
    if (category) {
      const cat = this.parseCategory(category);
      listings = listings.filter((l) => l.category === cat);
    }
    return { listings };
  }

  async listMine(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceListing.findMany({
      where: { publisherOrgId: organizationId, kind: LISTING_KIND },
      include: { publisherOrg: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      listings: rows.filter((r) => this.isHubListing(r.snapshot)).map((r) => this.serialize(r)),
    };
  }

  async listInstalls(organizationId: string, workspaceId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceInstall.findMany({
      where: {
        installerOrgId: organizationId,
        installerWorkspaceId: workspaceId,
        listing: { kind: LISTING_KIND },
      },
      include: {
        listing: { include: { publisherOrg: { select: { name: true } } } },
      },
      orderBy: { installedAt: 'desc' },
    });
    return {
      installs: rows
        .filter((r) => this.isHubListing(r.listing.snapshot))
        .map((r) => ({
          id: r.id,
          listingId: r.listingId,
          installedAt: r.installedAt.toISOString(),
          listing: this.serialize(r.listing),
        })),
    };
  }

  async listSales(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceSale.findMany({
      where: { publisherOrgId: organizationId, listing: { kind: LISTING_KIND } },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      sales: rows
        .filter((r) => this.isHubListing(r.listing.snapshot))
        .map((r) => ({
          id: r.id,
          listingId: r.listingId,
          listingTitle: r.listing.title,
          amountCents: r.amountCents,
          applicationFeeCents: r.applicationFeeCents,
          currency: r.currency,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        })),
      honesty: {
        platformFeeBps: PLATFORM_FEE_BPS,
        stripeOrEquivalentRequired: true,
        storesRawCardData: false,
        creatorPayoutMathVerifiedLive: false,
        liveConnectorExecution: false,
        ipaasOs: false,
      },
      note: 'Recorded receipts only. Creator Economy (VL-258) expands payout math — hand-check before live creators.',
    };
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    connectorKey?: string;
    title?: string;
    description?: string;
    category?: string;
    connectorVersion?: string;
    priceCents?: number;
    currency?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'connector-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const key = (input.connectorKey ?? '').trim().toLowerCase();
    if (!key) {
      throw new ApiException(
        'validation_error',
        'connectorKey is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const catalogEntry = findConnectorCatalogEntry(key);
    if (!catalogEntry) {
      throw new ApiException(
        'not_found',
        `Connector key "${key}" not found in Connector Marketplace catalog`,
        HttpStatus.NOT_FOUND,
      );
    }

    const category = input.category
      ? this.parseCategory(input.category)
      : catalogEntry.category;
    if (category !== catalogEntry.category) {
      throw new ApiException(
        'validation_error',
        `category must match catalog entry (${catalogEntry.category})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const title = (input.title ?? catalogEntry.name).trim().slice(0, 120);
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }

    const priceCents = Math.max(0, Math.floor(Number(input.priceCents ?? 0) || 0));
    const currency = (input.currency ?? 'usd').trim().toLowerCase().slice(0, 8) || 'usd';
    const connectorVersion =
      (input.connectorVersion ?? 'v1').trim().slice(0, 64) || 'v1';

    const snapshot: ConnectorSnapshot = {
      hub: HUB,
      connectorKey: catalogEntry.key,
      connectorName: catalogEntry.name,
      category,
      catalogStatus: catalogEntry.status,
      connectorApi: catalogEntry.api,
      connectorVersion,
      verified: true,
      liveConnectorExecution: false,
      sandboxRequired: true,
      storesRawCardData: false,
      ratingSum: 0,
      ratingCount: 0,
    };

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        publisherOrgId: input.organizationId,
        publisherWorkspaceId: input.workspaceId,
        kind: LISTING_KIND,
        title,
        description:
          input.description?.trim().slice(0, 500) ||
          catalogEntry.notes ||
          `${catalogEntry.name} marketplace listing`,
        status: 'published',
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        termCount: 1,
        priceCents,
        currency,
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector_marketplace.published',
      route: 'POST /v1/connector-marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        connectorKey: catalogEntry.key,
        category,
        priceCents,
        liveConnectorExecution: false,
        storesRawCardData: false,
      },
    });

    return {
      listing: this.serialize(listing),
      honesty: this.engine().honesty,
      note:
        'Connector listing published as an entitlement SKU over the built-in catalog. Install grants entitlement — not live arbitrary outbound or iPaaS.',
    };
  }

  async updateListing(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    connectorVersion?: string;
    description?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'connector-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const listing = await this.prisma.marketplaceListing.findFirst({
      where: {
        id: input.listingId,
        publisherOrgId: input.organizationId,
        kind: LISTING_KIND,
      },
    });
    if (!listing || !this.isHubListing(listing.snapshot)) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }

    const snap = this.parseSnapshot(listing.snapshot);
    const next: ConnectorSnapshot = {
      ...snap,
      connectorVersion:
        (input.connectorVersion ?? snap.connectorVersion).trim().slice(0, 64) ||
        snap.connectorVersion,
      verified: true,
      liveConnectorExecution: false,
      sandboxRequired: true,
      storesRawCardData: false,
    };

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: {
        snapshot: next as unknown as Prisma.InputJsonValue,
        description: input.description?.trim().slice(0, 500) ?? listing.description,
        status: 'published',
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector_marketplace.updated',
      route: 'POST /v1/connector-marketplace/listings/:id/update',
      ip: input.ip,
      metadata: { listingId: listing.id, connectorVersion: next.connectorVersion },
    });

    return {
      listing: this.serialize(updated),
      note: `Listing updated to connector version ${next.connectorVersion}.`,
    };
  }

  async install(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'connector-marketplace',
      action: 'marketplace.install',
      subjectId: input.userId,
      permissions: ['marketplace.install'],
    });

    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { id: input.listingId, kind: LISTING_KIND, status: 'published' },
    });
    if (!listing || !this.isHubListing(listing.snapshot)) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }

    const snap = this.parseSnapshot(listing.snapshot);
    if (
      !snap.verified ||
      snap.liveConnectorExecution !== false ||
      snap.storesRawCardData !== false ||
      snap.sandboxRequired !== true
    ) {
      throw new ApiException(
        'connector_marketplace_unverified',
        'Listing is not verified as entitlement/sandbox-only; install blocked',
        HttpStatus.FORBIDDEN,
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
        'already_installed',
        'Listing already installed in this workspace',
        HttpStatus.CONFLICT,
      );
    }

    const install = await this.prisma.marketplaceInstall.create({
      data: {
        listingId: listing.id,
        installerOrgId: input.organizationId,
        installerWorkspaceId: input.workspaceId,
        termsInstalled: 1,
      },
    });

    let sale: {
      id: string;
      amountCents: number;
      applicationFeeCents: number;
    } | null = null;
    if (listing.priceCents > 0 && listing.publisherOrgId !== input.organizationId) {
      const fee = Math.floor((listing.priceCents * PLATFORM_FEE_BPS) / 10000);
      const created = await this.prisma.marketplaceSale.create({
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
      sale = {
        id: created.id,
        amountCents: created.amountCents,
        applicationFeeCents: created.applicationFeeCents,
      };
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector_marketplace.installed',
      route: 'POST /v1/connector-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        installId: install.id,
        connectorKey: snap.connectorKey,
        liveConnectorExecution: false,
        storesRawCardData: false,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: listing.id,
        connectorKey: snap.connectorKey,
        connectorVersion: snap.connectorVersion,
        installedAt: install.installedAt.toISOString(),
      },
      entitlement: {
        workspaceId: input.workspaceId,
        connectorKey: snap.connectorKey,
        category: snap.category,
        connectorApi: snap.connectorApi,
        liveConnectorExecution: false,
        storesRawCardData: false,
        note:
          'Connector entitlement only — Slack uses existing /v1/connectors/slack paths; generic SKUs are metadata entitlements, not live iPaaS outbound.',
      },
      sale,
      honesty: this.engine().honesty,
      note: 'Installed connector entitlement. Not Zapier/iPaaS or live arbitrary outbound.',
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        deletedAt: null,
        key: { startsWith: `connector-marketplace-review:${listingId}:` },
        metadata: { path: ['runtime'], equals: REVIEW_RUNTIME },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const reviews = rows
      .map((r) => {
        try {
          return JSON.parse(r.content) as {
            listingId: string;
            organizationId: string;
            rating: number;
            body?: string;
            createdAt: string;
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return { reviews };
  }

  async upsertReview(input: {
    organizationId: string;
    workspaceId: string;
    listingId: string;
    userId?: string;
    rating?: number;
    body?: string;
    ip?: string;
  }) {
    await this.billing.assertPro(input.organizationId);
    const rating = Math.floor(Number(input.rating ?? 0));
    if (rating < 1 || rating > 5) {
      throw new ApiException('validation_error', 'rating must be 1–5', HttpStatus.BAD_REQUEST);
    }

    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { id: input.listingId, kind: LISTING_KIND, status: 'published' },
    });
    if (!listing || !this.isHubListing(listing.snapshot)) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }

    const key = `connector-marketplace-review:${listing.id}:${input.organizationId}`;
    const existing = await this.prisma.memoryRecord.findFirst({
      where: {
        organizationId: input.organizationId,
        key,
        deletedAt: null,
        metadata: { path: ['runtime'], equals: REVIEW_RUNTIME },
      },
    });

    const snap = this.parseSnapshot(listing.snapshot);
    let ratingSum = snap.ratingSum;
    let ratingCount = snap.ratingCount;
    let previous: number | null = null;
    if (existing) {
      try {
        previous = (JSON.parse(existing.content) as { rating: number }).rating;
      } catch {
        previous = null;
      }
    }
    if (previous != null) ratingSum = ratingSum - previous + rating;
    else {
      ratingSum += rating;
      ratingCount += 1;
    }

    const review = {
      listingId: listing.id,
      organizationId: input.organizationId,
      rating,
      body: input.body?.trim().slice(0, 1000) || undefined,
      createdAt: new Date().toISOString(),
    };

    if (existing) {
      await this.prisma.memoryRecord.update({
        where: { id: existing.id },
        data: {
          content: JSON.stringify(review),
          metadata: {
            runtime: REVIEW_RUNTIME,
            type: 'connector_marketplace_review',
            listingId: listing.id,
          } as Prisma.InputJsonValue,
        },
      });
    } else {
      await this.prisma.memoryRecord.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          scope: 'workspace',
          kind: 'long_term',
          key,
          content: JSON.stringify(review),
          metadata: {
            runtime: REVIEW_RUNTIME,
            type: 'connector_marketplace_review',
            listingId: listing.id,
          } as Prisma.InputJsonValue,
        },
      });
    }

    await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: {
        snapshot: { ...snap, ratingSum, ratingCount } as unknown as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector_marketplace.reviewed',
      route: 'POST /v1/connector-marketplace/listings/:id/reviews',
      ip: input.ip,
      metadata: { listingId: listing.id, rating },
    });

    return { review, note: 'Review saved.' };
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
      where: {
        id: input.listingId,
        publisherOrgId: input.organizationId,
        kind: LISTING_KIND,
      },
    });
    if (!listing || !this.isHubListing(listing.snapshot)) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }
    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { status: 'unpublished' },
      include: { publisherOrg: { select: { name: true } } },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'connector_marketplace.unpublished',
      route: 'DELETE /v1/connector-marketplace/listings/:id',
      ip: input.ip,
      metadata: { listingId: listing.id },
    });
    return { listing: this.serialize(updated), note: 'Listing unpublished.' };
  }

  async analytics(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const [listings, installs, sales, reviews] = await Promise.all([
      this.prisma.marketplaceListing.count({
        where: { publisherOrgId: organizationId, kind: LISTING_KIND },
      }),
      this.prisma.marketplaceInstall.count({
        where: { listing: { publisherOrgId: organizationId, kind: LISTING_KIND } },
      }),
      this.prisma.marketplaceSale.count({
        where: { publisherOrgId: organizationId, listing: { kind: LISTING_KIND } },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'connector_marketplace.reviewed' },
      }),
    ]);
    return {
      listings,
      installs,
      sales,
      reviews,
      honesty: this.engine().honesty,
      note: 'Connector marketplace aggregates. Payout depth deferred to Creator Economy (VL-258).',
    };
  }

  monitoring() {
    const engine = this.engine();
    return {
      mode: 'connector-marketplace',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Connector Marketplace monitoring snapshot (VL-256).',
    };
  }
}
