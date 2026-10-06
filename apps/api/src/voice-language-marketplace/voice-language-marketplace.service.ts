import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import {
  VOICE_LANGUAGE_PACK_TYPES,
  findVoiceLanguagePackEntry,
  voiceLanguageMarketplaceEngineCatalog,
  type VoiceLanguagePackType,
} from './voice-language-marketplace.catalog';

const LISTING_KIND = 'voice_language';
const REVIEW_RUNTIME = 'voice-language-marketplace';
const PLATFORM_FEE_BPS = 1500;
const HUB = 'voice-language-marketplace';

type VoiceLanguageSnapshot = {
  hub: typeof HUB;
  packKey: string;
  packName: string;
  packType: VoiceLanguagePackType;
  catalogStatus: string;
  extendsApi: string | null;
  packVersion: string;
  verified: boolean;
  voiceCdnHosted: false;
  celebrityWithoutRights: false;
  crossTenantCloneSynthesis: false;
  storesRawCardData: false;
  ratingSum: number;
  ratingCount: number;
};

@Injectable()
export class VoiceLanguageMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine() {
    return voiceLanguageMarketplaceEngineCatalog();
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private parseSnapshot(raw: Prisma.JsonValue): VoiceLanguageSnapshot {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApiException(
        'validation_error',
        'Invalid voice/language listing snapshot',
        HttpStatus.BAD_REQUEST,
      );
    }
    const snap = raw as unknown as VoiceLanguageSnapshot;
    if (snap.hub !== HUB) {
      throw new ApiException(
        'validation_error',
        'Listing is not a Voice & Language Marketplace hub listing',
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

  private parsePackType(raw?: string): VoiceLanguagePackType {
    const value = (raw ?? '').trim().toLowerCase();
    if (!(VOICE_LANGUAGE_PACK_TYPES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `packType must be one of ${VOICE_LANGUAGE_PACK_TYPES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value as VoiceLanguagePackType;
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
      packKey: snap.packKey,
      packName: snap.packName,
      packType: snap.packType,
      catalogStatus: snap.catalogStatus,
      extendsApi: snap.extendsApi,
      packVersion: snap.packVersion,
      verified: snap.verified,
      voiceCdnHosted: snap.voiceCdnHosted,
      celebrityWithoutRights: snap.celebrityWithoutRights,
      crossTenantCloneSynthesis: snap.crossTenantCloneSynthesis,
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

  async listPublished(organizationId: string, packType?: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceListing.findMany({
      where: { status: 'published', kind: LISTING_KIND },
      include: { publisherOrg: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    let listings = rows.filter((r) => this.isHubListing(r.snapshot)).map((r) => this.serialize(r));
    if (packType) {
      const pt = this.parsePackType(packType);
      listings = listings.filter((l) => l.packType === pt);
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
        celebrityWithoutRights: false,
        voiceCdnHosted: false,
      },
      note: 'Recorded receipts only. Creator Economy (VL-258) expands payout math — hand-check before live creators.',
    };
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    packKey?: string;
    title?: string;
    description?: string;
    packType?: string;
    packVersion?: string;
    priceCents?: number;
    currency?: string;
    celebrityClaim?: boolean;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    if (input.celebrityClaim) {
      throw new ApiException(
        'celebrity_without_rights',
        'Celebrity SKUs without a verified rights chain are forbidden',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'voice-language-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const key = (input.packKey ?? '').trim().toLowerCase();
    if (!key) {
      throw new ApiException('validation_error', 'packKey is required', HttpStatus.BAD_REQUEST);
    }

    const catalogEntry = findVoiceLanguagePackEntry(key);
    if (!catalogEntry) {
      throw new ApiException(
        'not_found',
        `Pack key "${key}" not found in Voice & Language Marketplace catalog`,
        HttpStatus.NOT_FOUND,
      );
    }

    const packType = input.packType
      ? this.parsePackType(input.packType)
      : catalogEntry.packType;
    if (packType !== catalogEntry.packType) {
      throw new ApiException(
        'validation_error',
        `packType must match catalog entry (${catalogEntry.packType})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const title = (input.title ?? catalogEntry.name).trim().slice(0, 120);
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }

    const priceCents = Math.max(0, Math.floor(Number(input.priceCents ?? 0) || 0));
    const currency = (input.currency ?? 'usd').trim().toLowerCase().slice(0, 8) || 'usd';
    const packVersion = (input.packVersion ?? 'v1').trim().slice(0, 64) || 'v1';

    const snapshot: VoiceLanguageSnapshot = {
      hub: HUB,
      packKey: catalogEntry.key,
      packName: catalogEntry.name,
      packType,
      catalogStatus: catalogEntry.status,
      extendsApi: catalogEntry.extendsApi,
      packVersion,
      verified: true,
      voiceCdnHosted: false,
      celebrityWithoutRights: false,
      crossTenantCloneSynthesis: false,
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
      action: 'voice_language_marketplace.published',
      route: 'POST /v1/voice-language-marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        packKey: catalogEntry.key,
        packType,
        priceCents,
        voiceCdnHosted: false,
        celebrityWithoutRights: false,
        storesRawCardData: false,
      },
    });

    return {
      listing: this.serialize(listing),
      honesty: this.engine().honesty,
      note:
        'Voice/language pack listing published as an entitlement SKU over VL-177 + Volume 1 surfaces. Install grants entitlement — not voice CDN hosting.',
    };
  }

  async updateListing(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    packVersion?: string;
    description?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'voice-language-marketplace',
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
    const next: VoiceLanguageSnapshot = {
      ...snap,
      packVersion:
        (input.packVersion ?? snap.packVersion).trim().slice(0, 64) || snap.packVersion,
      verified: true,
      voiceCdnHosted: false,
      celebrityWithoutRights: false,
      crossTenantCloneSynthesis: false,
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
      action: 'voice_language_marketplace.updated',
      route: 'POST /v1/voice-language-marketplace/listings/:id/update',
      ip: input.ip,
      metadata: { listingId: listing.id, packVersion: next.packVersion },
    });

    return {
      listing: this.serialize(updated),
      note: `Listing updated to pack version ${next.packVersion}.`,
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
      bus: 'voice-language-marketplace',
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
      snap.voiceCdnHosted !== false ||
      snap.celebrityWithoutRights !== false ||
      snap.crossTenantCloneSynthesis !== false ||
      snap.storesRawCardData !== false
    ) {
      throw new ApiException(
        'voice_language_marketplace_unverified',
        'Listing is not verified as entitlement-only; install blocked',
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
      action: 'voice_language_marketplace.installed',
      route: 'POST /v1/voice-language-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        installId: install.id,
        packKey: snap.packKey,
        voiceCdnHosted: false,
        celebrityWithoutRights: false,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: listing.id,
        packKey: snap.packKey,
        packVersion: snap.packVersion,
        installedAt: install.installedAt.toISOString(),
      },
      entitlement: {
        workspaceId: input.workspaceId,
        packKey: snap.packKey,
        packType: snap.packType,
        extendsApi: snap.extendsApi,
        voiceCdnHosted: false,
        celebrityWithoutRights: false,
        crossTenantCloneSynthesis: false,
        storesRawCardData: false,
        note:
          'Pack entitlement only — voice synthesis stays on VL-177 / Voice Cloud paths; language packs extend Volume 1 surfaces.',
      },
      sale,
      honesty: this.engine().honesty,
      note: 'Installed voice/language pack entitlement. Not a third-party voice OS or voice CDN hosting.',
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        deletedAt: null,
        key: { startsWith: `voice-language-marketplace-review:${listingId}:` },
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

    const key = `voice-language-marketplace-review:${listing.id}:${input.organizationId}`;
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
            type: 'voice_language_marketplace_review',
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
            type: 'voice_language_marketplace_review',
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
      action: 'voice_language_marketplace.reviewed',
      route: 'POST /v1/voice-language-marketplace/listings/:id/reviews',
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
      action: 'voice_language_marketplace.unpublished',
      route: 'DELETE /v1/voice-language-marketplace/listings/:id',
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
        where: { organizationId, action: 'voice_language_marketplace.reviewed' },
      }),
    ]);
    return {
      listings,
      installs,
      sales,
      reviews,
      honesty: this.engine().honesty,
      note: 'Voice & language marketplace aggregates. Payout depth deferred to Creator Economy (VL-258).',
    };
  }

  monitoring() {
    const engine = this.engine();
    return {
      mode: 'voice-language-marketplace',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Voice & Language Marketplace monitoring snapshot (VL-257).',
    };
  }
}
