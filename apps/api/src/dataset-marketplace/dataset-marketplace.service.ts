import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { DatasetsService } from '../datasets/datasets.service';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import type { DatasetSnapshotPair } from '../marketplace/marketplace.types';
import { hashTmSegment, normalizeTmSegment } from '../tm/tm-hash';
import {
  DATASET_MARKETPLACE_CATEGORIES,
  DATASET_MARKETPLACE_LICENSE_TYPES,
  datasetMarketplaceEngineCatalog,
  type DatasetMarketplaceCategory,
} from './dataset-marketplace.catalog';

const LISTING_KIND = 'dataset';
const REVIEW_RUNTIME = 'dataset-marketplace';
const PLATFORM_FEE_BPS = 1500;
const HUB = 'dataset-marketplace';

type DatasetSnapshot = {
  hub: typeof HUB;
  source: 'tm_corpus' | 'dataset_asset';
  category: DatasetMarketplaceCategory;
  licenseType: string;
  datasetVersion: string;
  verified: boolean;
  labelStudioOs: false;
  datasetCloudOs: false;
  assetId: string | null;
  assetTitle: string | null;
  pairCount: number;
  pairs: DatasetSnapshotPair[];
  ratingSum: number;
  ratingCount: number;
  sourceLang: string | null;
  targetLang: string | null;
};

@Injectable
export class DatasetMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly datasets: DatasetsService,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine {
    return datasetMarketplaceEngineCatalog;
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private parseSnapshot(raw: Prisma.JsonValue): DatasetSnapshot {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApiException(
        'validation_error',
        'Invalid dataset listing snapshot',
        HttpStatus.BAD_REQUEST,
      );
    }
    const snap = raw as unknown as DatasetSnapshot;
    if (snap.hub !== HUB) {
      throw new ApiException(
        'validation_error',
        'Listing is not a Dataset Marketplace hub listing',
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

  private parseCategory(raw?: string): DatasetMarketplaceCategory {
    const value = (raw ?? 'translation').trim.toLowerCase;
    if (!(DATASET_MARKETPLACE_CATEGORIES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `category must be one of ${DATASET_MARKETPLACE_CATEGORIES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value as DatasetMarketplaceCategory;
  }

  private parseLicense(raw?: string): string {
    const value = (raw ?? 'commercial').trim.toLowerCase;
    if (!(DATASET_MARKETPLACE_LICENSE_TYPES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `licenseType must be one of ${DATASET_MARKETPLACE_LICENSE_TYPES.join(', ')}`,
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
      source: snap.source,
      category: snap.category,
      licenseType: snap.licenseType,
      datasetVersion: snap.datasetVersion,
      verified: snap.verified,
      labelStudioOs: snap.labelStudioOs,
      datasetCloudOs: snap.datasetCloudOs,
      assetId: snap.assetId,
      pairCount: snap.pairCount,
      sourceLang: snap.sourceLang,
      targetLang: snap.targetLang,
      priceCents: row.priceCents,
      currency: row.currency,
      ratingAverage: avg != null ? Number(avg.toFixed(2)) : null,
      ratingCount: snap.ratingCount,
      publisherOrgId: row.publisherOrgId,
      publisherWorkspaceId: row.publisherWorkspaceId,
      publisherName: row.publisherOrg?.name ?? null,
      createdAt: row.createdAt.toISOString,
      updatedAt: row.updatedAt.toISOString,
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
          installedAt: r.installedAt.toISOString,
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
          createdAt: r.createdAt.toISOString,
        })),
      honesty: {
        platformFeeBps: PLATFORM_FEE_BPS,
        stripeOrEquivalentRequired: true,
        storesRawCardData: false,
        creatorPayoutMathVerifiedLive: false,
      },
      note: 'Recorded receipts only. Creator Economy expands payout math.',
    };
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    source?: string;
    assetId?: string;
    title?: string;
    description?: string;
    category?: string;
    licenseType?: string;
    datasetVersion?: string;
    priceCents?: number;
    currency?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'dataset-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const source = (input.source ?? (input.assetId ? 'dataset_asset' : 'tm_corpus')).trim;
    if (source !== 'tm_corpus' && source !== 'dataset_asset') {
      throw new ApiException(
        'validation_error',
        'source must be tm_corpus or dataset_asset',
        HttpStatus.BAD_REQUEST,
      );
    }

    const category = this.parseCategory(input.category);
    const licenseType = this.parseLicense(input.licenseType);
    const datasetVersion = (input.datasetVersion ?? 'v1').trim.slice(0, 64) || 'v1';
    const priceCents = Math.max(0, Math.floor(Number(input.priceCents ?? 0) || 0));
    const currency = (input.currency ?? 'usd').trim.toLowerCase.slice(0, 8) || 'usd';

    let snapshot: DatasetSnapshot;
    let title: string;
    let description: string | null;

    if (source === 'dataset_asset') {
      const assetId = (input.assetId ?? '').trim;
      if (!assetId) {
        throw new ApiException(
          'validation_error',
          'assetId is required for dataset_asset source',
          HttpStatus.BAD_REQUEST,
        );
      }
      const asset = await this.datasets.get(input.organizationId, assetId);
      title = (input.title ?? asset.title).trim.slice(0, 120);
      description =
        input.description?.trim.slice(0, 500) ||
        `DatasetAsset listing (${asset.licenseTag})`;
      snapshot = {
        hub: HUB,
        source: 'dataset_asset',
        category,
        licenseType: input.licenseType ? licenseType : asset.licenseTag,
        datasetVersion: asset.latestVersion
          ? `v${asset.latestVersion.version}`
          : datasetVersion,
        verified: true,
        labelStudioOs: false,
        datasetCloudOs: false,
        assetId: asset.id,
        assetTitle: asset.title,
        pairCount: 0,
        pairs: [],
        ratingSum: 0,
        ratingCount: 0,
        sourceLang: asset.sourceLang,
        targetLang: asset.targetLang,
      };
    } else {
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
          'Workspace has no approved TM pairs to publish as a translation corpus',
          HttpStatus.BAD_REQUEST,
        );
      }
      const pairs: DatasetSnapshotPair[] = entries.map((e) => ({
        sourceLang: e.sourceLang,
        targetLang: e.targetLang,
        sourceText: e.sourceText,
        targetText: e.targetText,
      }));
      title = (input.title ?? 'Translation corpus').trim.slice(0, 120);
      description =
        input.description?.trim.slice(0, 500) ||
        `${pairs.length} approved TM pairs`;
      snapshot = {
        hub: HUB,
        source: 'tm_corpus',
        category: category === 'public' ? 'translation' : category,
        licenseType,
        datasetVersion,
        verified: true,
        labelStudioOs: false,
        datasetCloudOs: false,
        assetId: null,
        assetTitle: null,
        pairCount: pairs.length,
        pairs,
        ratingSum: 0,
        ratingCount: 0,
        sourceLang: pairs[0]?.sourceLang ?? null,
        targetLang: pairs[0]?.targetLang ?? null,
      };
    }

    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        publisherOrgId: input.organizationId,
        publisherWorkspaceId: input.workspaceId,
        kind: LISTING_KIND,
        title,
        description,
        status: 'published',
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        termCount: snapshot.pairCount || 1,
        priceCents,
        currency,
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'dataset_marketplace.published',
      route: 'POST /v1/dataset-marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        source: snapshot.source,
        category: snapshot.category,
        pairCount: snapshot.pairCount,
        assetId: snapshot.assetId,
      },
    });

    return {
      listing: this.serialize(listing),
      honesty: this.engine.honesty,
      note:
        'Dataset listing published under content-marketplace dataset kind with Dataset Marketplace hub marker. Not Label Studio OS.',
    };
  }

  async updateListing(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    datasetVersion?: string;
    description?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'dataset-marketplace',
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
    const next: DatasetSnapshot = {
      ...snap,
      datasetVersion:
        (input.datasetVersion ?? snap.datasetVersion).trim.slice(0, 64) || snap.datasetVersion,
      verified: true,
      labelStudioOs: false,
      datasetCloudOs: false,
    };

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: {
        snapshot: next as unknown as Prisma.InputJsonValue,
        description: input.description?.trim.slice(0, 500) ?? listing.description,
        status: 'published',
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'dataset_marketplace.updated',
      route: 'POST /v1/dataset-marketplace/listings/:id/update',
      ip: input.ip,
      metadata: { listingId: listing.id, datasetVersion: next.datasetVersion },
    });

    return {
      listing: this.serialize(updated),
      note: `Listing updated to dataset version ${next.datasetVersion}.`,
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
      bus: 'dataset-marketplace',
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
    if (!snap.verified || snap.labelStudioOs || snap.datasetCloudOs) {
      throw new ApiException(
        'dataset_marketplace_unverified',
        'Listing failed Dataset Marketplace honesty checks',
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

    let termsInstalled = 0;
    if (snap.source === 'tm_corpus') {
      if (!Array.isArray(snap.pairs) || snap.pairs.length === 0) {
        throw new ApiException(
          'validation_error',
          'TM corpus listing has no pairs to install',
          HttpStatus.BAD_REQUEST,
        );
      }
      const org = await this.prisma.organization.findUnique({
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
      for (const pair of snap.pairs) {
        const sourceText = normalizeTmSegment(pair.sourceText ?? '');
        const targetText = (pair.targetText ?? '').trim;
        if (!sourceText || !targetText || !pair.sourceLang || !pair.targetLang) continue;
        const sourceHash = hashTmSegment(sourceText);
        await this.prisma.translationMemoryEntry.upsert({
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
        termsInstalled += 1;
      }
      if (termsInstalled === 0) {
        throw new ApiException(
          'validation_error',
          'Listing snapshot has no valid pairs',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const install = await this.prisma.marketplaceInstall.create({
      data: {
        listingId: listing.id,
        installerOrgId: input.organizationId,
        installerWorkspaceId: input.workspaceId,
        termsInstalled: termsInstalled || 1,
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
      action: 'dataset_marketplace.installed',
      route: 'POST /v1/dataset-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        installId: install.id,
        source: snap.source,
        termsInstalled,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: listing.id,
        source: snap.source,
        termsInstalled,
        installedAt: install.installedAt.toISOString,
      },
      entitlement: {
        workspaceId: input.workspaceId,
        source: snap.source,
        assetId: snap.assetId,
        licenseType: snap.licenseType,
        pairsCopied: termsInstalled,
        labelStudioOs: false,
        datasetCloudOs: false,
        note:
          snap.source === 'tm_corpus'
            ? 'Approved TM pairs copied into buyer workspace.'
            : 'License entitlement for DatasetAsset metadata — files are not re-hosted as Dataset Cloud.',
      },
      sale,
      honesty: this.engine.honesty,
      note: 'Dataset marketplace install completed. Not Label Studio / Dataset Cloud OS.',
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        deletedAt: null,
        key: { startsWith: `dataset-marketplace-review:${listingId}:` },
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

    const key = `dataset-marketplace-review:${listing.id}:${input.organizationId}`;
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
      body: input.body?.trim.slice(0, 1000) || undefined,
      createdAt: new Date.toISOString,
    };

    if (existing) {
      await this.prisma.memoryRecord.update({
        where: { id: existing.id },
        data: {
          content: JSON.stringify(review),
          metadata: {
            runtime: REVIEW_RUNTIME,
            type: 'dataset_marketplace_review',
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
            type: 'dataset_marketplace_review',
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
      action: 'dataset_marketplace.reviewed',
      route: 'POST /v1/dataset-marketplace/listings/:id/reviews',
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
      action: 'dataset_marketplace.unpublished',
      route: 'DELETE /v1/dataset-marketplace/listings/:id',
      ip: input.ip,
      metadata: { listingId: listing.id },
    });
    return { listing: this.serialize(updated), note: 'Listing unpublished.' };
  }

  async analytics(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const listings = await this.prisma.marketplaceListing.findMany({
      where: { publisherOrgId: organizationId, kind: LISTING_KIND },
      select: { id: true, snapshot: true },
    });
    const hubIds = listings.filter((l) => this.isHubListing(l.snapshot)).map((l) => l.id);
    const [installs, sales, reviews] = await Promise.all([
      this.prisma.marketplaceInstall.count({ where: { listingId: { in: hubIds } } }),
      this.prisma.marketplaceSale.count({ where: { listingId: { in: hubIds } } }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'dataset_marketplace.reviewed' },
      }),
    ]);
    return {
      listings: hubIds.length,
      installs,
      sales,
      reviews,
      honesty: this.engine.honesty,
      note: 'Dataset marketplace aggregates. Payout depth deferred to Creator Economy.',
    };
  }

  monitoring {
    const engine = this.engine;
    return {
      mode: 'dataset-marketplace',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Dataset Marketplace monitoring snapshot.',
    };
  }
}
