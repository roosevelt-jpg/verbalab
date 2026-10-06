import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { ModelRegistryService } from '../model-registry/model-registry.service';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import {
  MODEL_LICENSE_TYPES,
  MODEL_MARKETPLACE_CATEGORIES,
  modelMarketplaceEngineCatalog,
  type ModelMarketplaceCategory,
} from './model-marketplace.catalog';

const LISTING_KIND = 'model';
const REVIEW_RUNTIME = 'model-marketplace';
const PLATFORM_FEE_BPS = 1500; // 15%

type ModelSnapshot = {
  modelSlug: string;
  modelId: string | null;
  displayName: string;
  feature: string | null;
  registryKind: string | null;
  category: ModelMarketplaceCategory;
  licenseType: string;
  modelVersion: string;
  verified: boolean;
  weightHosted: false;
  ratingSum: number;
  ratingCount: number;
};

@Injectable()
export class ModelMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly registry: ModelRegistryService,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine() {
    return modelMarketplaceEngineCatalog();
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private parseSnapshot(raw: Prisma.JsonValue): ModelSnapshot {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApiException(
        'validation_error',
        'Invalid model listing snapshot',
        HttpStatus.BAD_REQUEST,
      );
    }
    return raw as unknown as ModelSnapshot;
  }

  private parseCategory(raw?: string): ModelMarketplaceCategory {
    const value = (raw ?? 'commercial').trim().toLowerCase();
    if (!(MODEL_MARKETPLACE_CATEGORIES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `category must be one of ${MODEL_MARKETPLACE_CATEGORIES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value as ModelMarketplaceCategory;
  }

  private parseLicense(raw?: string): string {
    const value = (raw ?? 'commercial').trim().toLowerCase();
    if (!(MODEL_LICENSE_TYPES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `licenseType must be one of ${MODEL_LICENSE_TYPES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
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
      modelSlug: snap.modelSlug,
      modelId: snap.modelId,
      displayName: snap.displayName,
      feature: snap.feature,
      registryKind: snap.registryKind,
      category: snap.category,
      licenseType: snap.licenseType,
      modelVersion: snap.modelVersion,
      verified: snap.verified,
      weightHosted: snap.weightHosted,
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
    let listings = rows.map((r) => this.serialize(r));
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
    return { listings: rows.map((r) => this.serialize(r)) };
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
      installs: rows.map((r) => ({
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
      sales: rows.map((r) => ({
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
      },
      note: 'Recorded receipts only. Creator Economy expands payout math — hand-check before live creators.',
    };
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    modelSlug?: string;
    title?: string;
    description?: string;
    category?: string;
    licenseType?: string;
    modelVersion?: string;
    priceCents?: number;
    currency?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'model-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const slug = (input.modelSlug ?? '').trim();
    if (!slug) {
      throw new ApiException('validation_error', 'modelSlug is required', HttpStatus.BAD_REQUEST);
    }

    const cards = await this.registry.cards();
    const card = cards.cards.find((c) => c.slug === slug || c.id === slug);
    if (!card) {
      throw new ApiException(
        'not_found',
        `Model slug "${slug}" not found in Model Registry / cards`,
        HttpStatus.NOT_FOUND,
      );
    }

    const category = this.parseCategory(input.category);
    const licenseType = this.parseLicense(input.licenseType);
    const title = (input.title ?? card.displayName).trim().slice(0, 120);
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }

    const priceCents = Math.max(0, Math.floor(Number(input.priceCents ?? 0) || 0));
    const currency = (input.currency ?? 'usd').trim().toLowerCase().slice(0, 8) || 'usd';
    const modelVersion = (input.modelVersion ?? 'v1').trim().slice(0, 64) || 'v1';

    const snapshot: ModelSnapshot = {
      modelSlug: card.slug,
      modelId: card.id,
      displayName: card.displayName,
      feature: card.feature ?? null,
      registryKind: card.kind ?? null,
      category,
      licenseType,
      modelVersion,
      verified: true,
      weightHosted: false,
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
          card.notes ||
          `${card.displayName} marketplace listing`,
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
      action: 'model_marketplace.published',
      route: 'POST /v1/model-marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        modelSlug: card.slug,
        category,
        licenseType,
        priceCents,
      },
    });

    return {
      listing: this.serialize(listing),
      honesty: this.engine().honesty,
      note:
        'Model listing published as a license SKU over registry metadata. Install grants entitlement — not weight hosting.',
    };
  }

  async updateListing(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    modelVersion?: string;
    description?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'model-marketplace',
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
    if (!listing) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }

    const snap = this.parseSnapshot(listing.snapshot);
    const next: ModelSnapshot = {
      ...snap,
      modelVersion: (input.modelVersion ?? snap.modelVersion).trim().slice(0, 64) || snap.modelVersion,
      verified: true,
      weightHosted: false,
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
      action: 'model_marketplace.updated',
      route: 'POST /v1/model-marketplace/listings/:id/update',
      ip: input.ip,
      metadata: { listingId: listing.id, modelVersion: next.modelVersion },
    });

    return {
      listing: this.serialize(updated),
      note: `Listing updated to model version ${next.modelVersion}.`,
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
      bus: 'model-marketplace',
      action: 'marketplace.install',
      subjectId: input.userId,
      permissions: ['marketplace.install'],
    });

    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { id: input.listingId, kind: LISTING_KIND, status: 'published' },
    });
    if (!listing) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }

    const snap = this.parseSnapshot(listing.snapshot);
    if (!snap.verified || snap.weightHosted !== false) {
      throw new ApiException(
        'model_marketplace_unverified',
        'Listing is not verified as metadata/license-only; install blocked',
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
      action: 'model_marketplace.installed',
      route: 'POST /v1/model-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        installId: install.id,
        modelSlug: snap.modelSlug,
        licenseType: snap.licenseType,
        weightHosted: false,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: listing.id,
        modelSlug: snap.modelSlug,
        licenseType: snap.licenseType,
        installedAt: install.installedAt.toISOString(),
      },
      entitlement: {
        workspaceId: input.workspaceId,
        modelSlug: snap.modelSlug,
        licenseType: snap.licenseType,
        weightDownload: false,
        note: 'License entitlement only — inference still uses existing gateway/model serving paths.',
      },
      sale,
      honesty: this.engine().honesty,
      note: 'Installed model license entitlement. Not a weight download or public model-hub clone.',
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        deletedAt: null,
        key: { startsWith: `model-marketplace-review:${listingId}:` },
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
    if (!listing) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }

    const key = `model-marketplace-review:${listing.id}:${input.organizationId}`;
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
            type: 'model_marketplace_review',
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
            type: 'model_marketplace_review',
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
      action: 'model_marketplace.reviewed',
      route: 'POST /v1/model-marketplace/listings/:id/reviews',
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
    if (!listing) {
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
      action: 'model_marketplace.unpublished',
      route: 'DELETE /v1/model-marketplace/listings/:id',
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
        where: { organizationId, action: 'model_marketplace.reviewed' },
      }),
    ]);
    return {
      listings,
      installs,
      sales,
      reviews,
      honesty: this.engine().honesty,
      note: 'Model marketplace aggregates. Payout depth deferred to Creator Economy.',
    };
  }

  monitoring() {
    const engine = this.engine();
    return {
      mode: 'model-marketplace',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Model Marketplace monitoring snapshot.',
    };
  }
}
