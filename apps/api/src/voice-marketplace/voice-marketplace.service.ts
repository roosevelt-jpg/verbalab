import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import {
  LANGUAGE_PACK_CATALOG,
  LANGUAGE_PACK_COUNT,
  LANGUAGE_PACK_DEFAULT_PRICE_CENTS,
  voiceMarketplaceEngineCatalog,
} from './voice-marketplace.catalog';

const KINDS = ['voice', 'pack', 'language_pack', 'enterprise'] as const;
const LICENSE_TYPES = ['personal', 'commercial', 'broadcast', 'enterprise', 'subscription'] as const;

const STOCK_PUBLISHER_NAME = 'Lugemi Studio Stock';

@Injectable()
export class VoiceMarketplaceService implements OnModuleInit {
  private readonly logger = new Logger(VoiceMarketplaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
  ) {}

  async onModuleInit() {
    if (!this.prisma.isReady()) {
      this.logger.warn('DATABASE_URL unset — skipping voice marketplace language pack seed');
      return;
    }
    await this.seedLanguagePackListingsSafe();
  }

  engine() {
    return voiceMarketplaceEngineCatalog();
  }

  languagePacks() {
    return {
      packs: Object.entries(LANGUAGE_PACK_CATALOG).map(([id, p]) => ({
        id,
        title: p.title,
        language: p.language,
        voices: p.voices,
        description: p.description,
        nameEn: p.nameEn,
        nameNative: p.nameNative ?? null,
        licenseType: 'commercial',
        priceCents: LANGUAGE_PACK_DEFAULT_PRICE_CENTS,
        sourceVoiceId: `language_pack:${id}`,
      })),
      count: LANGUAGE_PACK_COUNT,
      note: `One commercial language pack per registry language (${LANGUAGE_PACK_COUNT}). Celebrity packs deferred.`,
    };
  }

  async seedLanguagePackListingsSafe() {
    try {
      await this.seedLanguagePackListings();
    } catch (err) {
      this.logger.warn(
        `[voice-marketplace] language pack seed skipped: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async seedLanguagePackListings() {
    if (!this.prisma.isReady()) return { seeded: 0, deduped: 0 };

    const publisher = await this.ensureStockPublisher();
    const workspaceId = publisher.workspaces[0]!.id;

    const existing = await this.prisma.voiceListing.findMany({
      where: { kind: 'language_pack' },
      orderBy: { createdAt: 'asc' },
    });

    const bySource = new Map<string, typeof existing>();
    for (const row of existing) {
      const list = bySource.get(row.sourceVoiceId) ?? [];
      list.push(row);
      bySource.set(row.sourceVoiceId, list);
    }

    let deduped = 0;
    for (const rows of bySource.values()) {
      const keep = rows.find((r) => r.status === 'published') ?? rows[0]!;
      for (const dup of rows) {
        if (dup.id === keep.id) continue;
        if (dup.status === 'unpublished') continue;
        await this.prisma.voiceListing.update({
          where: { id: dup.id },
          data: { status: 'unpublished' },
        });
        deduped += 1;
      }
    }

    const publishedPackSources = new Set(
      [...bySource.entries()]
        .filter(([, rows]) => rows.some((r) => r.status === 'published'))
        .map(([source]) => source),
    );
    const catalogComplete =
      publishedPackSources.size >= LANGUAGE_PACK_COUNT &&
      Object.keys(LANGUAGE_PACK_CATALOG).every((id) =>
        publishedPackSources.has(`language_pack:${id}`),
      );

    if (catalogComplete && deduped === 0) {
      return { seeded: 0, deduped: 0, catalog: LANGUAGE_PACK_COUNT };
    }

    let seeded = 0;
    for (const [packId, pack] of Object.entries(LANGUAGE_PACK_CATALOG)) {
      const sourceVoiceId = `language_pack:${packId}`;
      const snapshot = {
        languagePackId: packId,
        voices: pack.voices,
        nameEn: pack.nameEn,
        nameNative: pack.nameNative ?? null,
      } as Prisma.InputJsonValue;

      const kept =
        (bySource.get(sourceVoiceId) ?? []).find((r) => r.status === 'published') ??
        bySource.get(sourceVoiceId)?.[0];

      if (kept) {
        await this.prisma.voiceListing.update({
          where: { id: kept.id },
          data: {
            title: pack.title,
            description: pack.description,
            language: pack.language,
            sourceType: 'pack',
            sourceVoiceId,
            licenseType: 'commercial',
            rightsAttested: true,
            celebrityClaim: false,
            priceCents: LANGUAGE_PACK_DEFAULT_PRICE_CENTS,
            currency: 'usd',
            status: 'published',
            snapshot,
            publisherOrgId: kept.publisherOrgId || publisher.id,
            publisherWorkspaceId: kept.publisherWorkspaceId || workspaceId,
          },
        });
      } else {
        await this.prisma.voiceListing.create({
          data: {
            publisherOrgId: publisher.id,
            publisherWorkspaceId: workspaceId,
            kind: 'language_pack',
            sourceType: 'pack',
            sourceVoiceId,
            title: pack.title,
            description: pack.description,
            language: pack.language,
            licenseType: 'commercial',
            licenseNotes: '',
            rightsAttested: true,
            celebrityClaim: false,
            priceCents: LANGUAGE_PACK_DEFAULT_PRICE_CENTS,
            currency: 'usd',
            status: 'published',
            snapshot,
          },
        });
        seeded += 1;
      }
    }

    this.logger.log(
      JSON.stringify({
        event: 'voice_marketplace.language_packs_seeded',
        catalog: LANGUAGE_PACK_COUNT,
        seeded,
        deduped,
      }),
    );
    return { seeded, deduped, catalog: LANGUAGE_PACK_COUNT };
  }

  private async ensureStockPublisher() {
    const existing = await this.prisma.organization.findFirst({
      where: { name: STOCK_PUBLISHER_NAME },
      include: { workspaces: true },
    });
    if (existing?.workspaces[0]) return existing;

    return this.prisma.organization.create({
      data: {
        name: STOCK_PUBLISHER_NAME,
        plan: 'enterprise',
        workspaces: {
          create: {
            name: 'Catalog',
            defaultSourceLang: 'en',
            defaultTargetLang: 'sw',
          },
        },
      },
      include: { workspaces: true },
    });
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private serialize(row: {
    id: string;
    kind: string;
    sourceType: string;
    sourceVoiceId: string;
    voiceCloneId: string | null;
    title: string;
    description: string;
    language: string | null;
    gender: string | null;
    licenseType: string;
    licenseNotes: string;
    rightsAttested: boolean;
    celebrityClaim: boolean;
    priceCents: number;
    currency: string;
    subscriptionInterval: string | null;
    status: string;
    ratingSum: number;
    ratingCount: number;
    snapshot: Prisma.JsonValue;
    publisherOrgId: string;
    publisherWorkspaceId: string;
    createdAt: Date;
    updatedAt: Date;
    publisherOrg?: { name: string };
  }) {
    const avg = row.ratingCount > 0 ? row.ratingSum / row.ratingCount : null;
    const snap =
      row.snapshot && typeof row.snapshot === 'object' && !Array.isArray(row.snapshot)
        ? (row.snapshot as Record<string, unknown>)
        : {};
    const voices = Array.isArray(snap.voices)
      ? (snap.voices as unknown[]).filter((v): v is string => typeof v === 'string')
      : [];
    const previewVoiceId =
      voices[0] ??
      (row.kind === 'language_pack' && row.language
        ? `own:${row.language}-pack`
        : row.sourceVoiceId);
    return {
      id: row.id,
      kind: row.kind,
      sourceType: row.sourceType,
      sourceVoiceId: row.sourceVoiceId,
      voiceCloneId: row.voiceCloneId,
      title: row.title,
      description: row.description,
      language: row.language,
      gender: row.gender,
      licenseType: row.licenseType,
      licenseNotes: row.licenseNotes,
      rightsAttested: row.rightsAttested,
      celebrityClaim: row.celebrityClaim,
      priceCents: row.priceCents,
      currency: row.currency,
      subscriptionInterval: row.subscriptionInterval,
      status: row.status,
      ratingAverage: avg != null ? Number(avg.toFixed(2)) : null,
      ratingCount: row.ratingCount,
      snapshot: row.snapshot,
      previewVoiceId,
      publisherOrgId: row.publisherOrgId,
      publisherWorkspaceId: row.publisherWorkspaceId,
      publisherName: row.publisherOrg?.name ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listPublished(organizationId: string, kind?: string) {
    await this.billing.assertPro(organizationId);
    await this.seedLanguagePackListingsSafe();
    const rows = await this.prisma.voiceListing.findMany({
      where: {
        status: 'published',
        ...(kind ? { kind } : {}),
      },
      include: { publisherOrg: { select: { name: true } } },
      orderBy: [{ language: 'asc' }, { title: 'asc' }, { createdAt: 'desc' }],
    });
    return { listings: rows.map((r) => this.serialize(r)), languagePackCount: LANGUAGE_PACK_COUNT };
  }

  async listMine(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.voiceListing.findMany({
      where: { publisherOrgId: organizationId },
      include: { publisherOrg: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { listings: rows.map((r) => this.serialize(r)) };
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    title?: string;
    description?: string;
    kind?: string;
    sourceType?: string;
    sourceVoiceId?: string;
    voiceCloneId?: string;
    language?: string;
    gender?: string;
    licenseType?: string;
    licenseNotes?: string;
    rightsAttested?: boolean;
    celebrityClaim?: boolean;
    priceCents?: number;
    currency?: string;
    subscriptionInterval?: string | null;
    packMemberIds?: string[];
    languagePackId?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    if (input.celebrityClaim) {
      throw new ApiException(
        'validation_error',
        'Celebrity voice SKUs are forbidden without a verified rights chain ( out of scope).',
        HttpStatus.BAD_REQUEST,
      );
    }

    const kind = (input.kind ?? 'voice').trim().toLowerCase();
    if (!(KINDS as readonly string[]).includes(kind)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of ${KINDS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const licenseType = (input.licenseType ?? 'personal').trim().toLowerCase();
    if (!(LICENSE_TYPES as readonly string[]).includes(licenseType)) {
      throw new ApiException(
        'validation_error',
        `licenseType must be one of ${LICENSE_TYPES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let sourceType = (input.sourceType ?? 'stock').trim().toLowerCase();
    let sourceVoiceId = input.sourceVoiceId?.trim() ?? '';
    let voiceCloneId: string | null = input.voiceCloneId?.trim() || null;
    let title = input.title?.trim() ?? '';
    let description = input.description?.trim() ?? '';
    let language = input.language?.trim() || null;
    let snapshot: Record<string, unknown> = {};

    if (kind === 'language_pack') {
      const packId = input.languagePackId?.trim() || language || '';
      const pack = LANGUAGE_PACK_CATALOG[packId];
      if (!pack) {
        throw new ApiException(
          'validation_error',
          `languagePackId must be a registry language code (see GET /v1/voice-marketplace/language-packs; ${LANGUAGE_PACK_COUNT} packs)`,
          HttpStatus.BAD_REQUEST,
        );
      }
      sourceType = 'pack';
      sourceVoiceId = `language_pack:${packId}`;
      title = title || pack.title;
      description = description || pack.description;
      language = pack.language;
      snapshot = {
        languagePackId: packId,
        voices: pack.voices,
        nameEn: pack.nameEn,
        nameNative: pack.nameNative ?? null,
      };

      const existingPack = await this.prisma.voiceListing.findFirst({
        where: { kind: 'language_pack', sourceVoiceId, status: 'published' },
        include: { publisherOrg: { select: { name: true } } },
      });
      if (existingPack) {
        const priceCentsUpsert = Math.max(
          0,
          Math.floor(Number(input.priceCents ?? existingPack.priceCents) || 0),
        );
        const updated = await this.prisma.voiceListing.update({
          where: { id: existingPack.id },
          data: {
            title,
            description,
            language,
            licenseType:
              (LICENSE_TYPES as readonly string[]).includes(licenseType) && input.licenseType
                ? licenseType
                : existingPack.licenseType || 'commercial',
            licenseNotes: input.licenseNotes?.trim() || existingPack.licenseNotes,
            rightsAttested: Boolean(input.rightsAttested) || existingPack.rightsAttested,
            priceCents: priceCentsUpsert,
            currency:
              (input.currency ?? existingPack.currency ?? 'usd').trim().toLowerCase() || 'usd',
            snapshot: snapshot as Prisma.InputJsonValue,
          },
          include: { publisherOrg: { select: { name: true } } },
        });
        await this.audit.record({
          organizationId: input.organizationId,
          userId: input.userId,
          action: 'voice_marketplace.published',
          route: 'POST /v1/voice-marketplace/listings',
          ip: input.ip,
          metadata: {
            listingId: updated.id,
            kind,
            sourceType,
            priceCents: priceCentsUpsert,
            upsert: true,
          },
        });
        return this.serialize(updated);
      }
    } else if (kind === 'pack') {
      const members = Array.isArray(input.packMemberIds) ? input.packMemberIds.filter(Boolean) : [];
      if (members.length < 2) {
        throw new ApiException(
          'validation_error',
          'pack requires packMemberIds with at least 2 published listing ids',
          HttpStatus.BAD_REQUEST,
        );
      }
      const existing = await this.prisma.voiceListing.count({
        where: { id: { in: members }, status: 'published' },
      });
      if (existing !== members.length) {
        throw new ApiException(
          'validation_error',
          'All packMemberIds must be published voice listings',
          HttpStatus.BAD_REQUEST,
        );
      }
      sourceType = 'pack';
      sourceVoiceId = `pack:${members.join('+').slice(0, 80)}`;
      title = title || 'Voice Pack';
      snapshot = { memberIds: members };
    } else {
      if (!sourceVoiceId && !voiceCloneId) {
        throw new ApiException(
          'validation_error',
          'sourceVoiceId or voiceCloneId is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (voiceCloneId || sourceVoiceId.startsWith('clone:')) {
        const cloneId = voiceCloneId || sourceVoiceId.replace(/^clone:/, '');
        const clone = await this.prisma.voiceClone.findFirst({
          where: {
            id: cloneId,
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            status: 'approved',
          },
        });
        if (!clone) {
          throw new ApiException(
            'validation_error',
            'Only approved workspace clones can be published',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!clone.ownershipAttested || !clone.consentAttested) {
          throw new ApiException(
            'validation_error',
            'Clone must have consent + ownership attestation before marketplace publish',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!input.rightsAttested) {
          throw new ApiException(
            'validation_error',
            'rightsAttested=true is required to publish a clone voice SKU',
            HttpStatus.BAD_REQUEST,
          );
        }
        sourceType = 'clone';
        sourceVoiceId = `clone:${clone.id}`;
        voiceCloneId = clone.id;
        title = title || clone.name;
        snapshot = {
          cloneMode: clone.cloneMode,
          licenseType: clone.licenseType,
          watermarkRequired: clone.watermarkRequired,
        };
        if (kind === 'enterprise') {
          // keep kind enterprise
        }
      } else if (sourceVoiceId.startsWith('own:')) {
        sourceType = 'own';
      } else {
        sourceType = 'stock';
      }
      if (!title) {
        throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
      }
      if ((sourceType === 'clone' || kind === 'enterprise') && !input.rightsAttested) {
        throw new ApiException(
          'validation_error',
          'rightsAttested=true is required for clone/enterprise listings',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const priceCents = Math.max(0, Math.floor(Number(input.priceCents) || 0));
    const subscriptionInterval =
      licenseType === 'subscription'
        ? input.subscriptionInterval === 'yearly'
          ? 'yearly'
          : 'monthly'
        : input.subscriptionInterval === 'monthly' || input.subscriptionInterval === 'yearly'
          ? input.subscriptionInterval
          : null;

    const row = await this.prisma.voiceListing.create({
      data: {
        publisherOrgId: input.organizationId,
        publisherWorkspaceId: input.workspaceId,
        kind,
        sourceType,
        sourceVoiceId,
        voiceCloneId,
        title,
        description,
        language,
        gender: input.gender?.trim() || null,
        licenseType,
        licenseNotes: input.licenseNotes?.trim() || '',
        rightsAttested: Boolean(input.rightsAttested) || sourceType !== 'clone',
        celebrityClaim: false,
        priceCents:
          kind === 'language_pack' && input.priceCents == null
            ? LANGUAGE_PACK_DEFAULT_PRICE_CENTS
            : priceCents,
        currency: (input.currency ?? 'usd').trim().toLowerCase() || 'usd',
        subscriptionInterval,
        status: 'published',
        snapshot: snapshot as Prisma.InputJsonValue,
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_marketplace.published',
      route: 'POST /v1/voice-marketplace/listings',
      ip: input.ip,
      metadata: { listingId: row.id, kind, sourceType, priceCents },
    });

    return this.serialize(row);
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
    const row = await this.prisma.voiceListing.findFirst({
      where: { id: input.listingId, publisherOrgId: input.organizationId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }
    const updated = await this.prisma.voiceListing.update({
      where: { id: row.id },
      data: { status: 'unpublished' },
      include: { publisherOrg: { select: { name: true } } },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_marketplace.unpublished',
      route: 'DELETE /v1/voice-marketplace/listings/:id',
      ip: input.ip,
      metadata: { listingId: row.id },
    });
    return this.serialize(updated);
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
    const listing = await this.prisma.voiceListing.findFirst({
      where: { id: input.listingId, status: 'published' },
    });
    if (!listing) {
      throw new ApiException('not_found', 'Published listing not found', HttpStatus.NOT_FOUND);
    }

    const existing = await this.prisma.voiceListingInstall.findUnique({
      where: {
        listingId_installerWorkspaceId: {
          listingId: listing.id,
          installerWorkspaceId: input.workspaceId,
        },
      },
    });
    if (existing) {
      return {
        install: {
          id: existing.id,
          listingId: existing.listingId,
          licenseType: existing.licenseType,
          installedAt: existing.installedAt.toISOString(),
        },
        alreadyInstalled: true,
        note: 'License entitlement already present for this workspace.',
      };
    }

    const install = await this.prisma.voiceListingInstall.create({
      data: {
        listingId: listing.id,
        installerOrgId: input.organizationId,
        installerWorkspaceId: input.workspaceId,
        licenseType: listing.licenseType,
      },
    });

    let sale = null;
    if (listing.priceCents > 0) {
      const fee = Math.floor(listing.priceCents * 0.1);
      sale = await this.prisma.voiceListingSale.create({
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
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_marketplace.installed',
      route: 'POST /v1/voice-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        priceCents: listing.priceCents,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: install.listingId,
        licenseType: install.licenseType,
        installedAt: install.installedAt.toISOString(),
      },
      sale: sale
        ? {
            id: sale.id,
            amountCents: sale.amountCents,
            applicationFeeCents: sale.applicationFeeCents,
            status: sale.status,
          }
        : null,
      alreadyInstalled: false,
      note:
        'Workspace license entitlement recorded. Cross-tenant clone synthesis is not enabled — entitlement is catalog/licensing only.',
    };
  }

  async listInstalls(organizationId: string, workspaceId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.voiceListingInstall.findMany({
      where: { installerOrgId: organizationId, installerWorkspaceId: workspaceId },
      include: {
        listing: { include: { publisherOrg: { select: { name: true } } } },
      },
      orderBy: { installedAt: 'desc' },
    });
    return {
      installs: rows.map((r) => ({
        id: r.id,
        listingId: r.listingId,
        licenseType: r.licenseType,
        installedAt: r.installedAt.toISOString(),
        listing: this.serialize(r.listing),
      })),
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.voiceListingReview.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      reviews: rows.map((r) => ({
        id: r.id,
        listingId: r.listingId,
        organizationId: r.organizationId,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async upsertReview(input: {
    organizationId: string;
    listingId: string;
    userId?: string;
    rating?: number;
    body?: string;
    ip?: string;
  }) {
    await this.billing.assertPro(input.organizationId);
    const rating = Math.floor(Number(input.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new ApiException(
        'validation_error',
        'rating must be an integer from 1 to 5',
        HttpStatus.BAD_REQUEST,
      );
    }
    const listing = await this.prisma.voiceListing.findFirst({
      where: { id: input.listingId, status: 'published' },
    });
    if (!listing) {
      throw new ApiException('not_found', 'Published listing not found', HttpStatus.NOT_FOUND);
    }

    const existing = await this.prisma.voiceListingReview.findUnique({
      where: {
        listingId_organizationId: {
          listingId: listing.id,
          organizationId: input.organizationId,
        },
      },
    });

    const review = existing
      ? await this.prisma.voiceListingReview.update({
          where: { id: existing.id },
          data: {
            rating,
            body: input.body?.trim() || '',
            userId: input.userId,
          },
        })
      : await this.prisma.voiceListingReview.create({
          data: {
            listingId: listing.id,
            organizationId: input.organizationId,
            userId: input.userId,
            rating,
            body: input.body?.trim() || '',
          },
        });

    const agg = await this.prisma.voiceListingReview.aggregate({
      where: { listingId: listing.id },
      _sum: { rating: true },
      _count: { _all: true },
    });
    await this.prisma.voiceListing.update({
      where: { id: listing.id },
      data: {
        ratingSum: agg._sum.rating ?? 0,
        ratingCount: agg._count._all,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_marketplace.reviewed',
      route: 'POST /v1/voice-marketplace/listings/:id/reviews',
      ip: input.ip,
      metadata: { listingId: listing.id, rating },
    });

    return {
      id: review.id,
      listingId: review.listingId,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async analytics(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const [published, installs, sales, reviews] = await Promise.all([
      this.prisma.voiceListing.count({
        where: { publisherOrgId: organizationId, status: 'published' },
      }),
      this.prisma.voiceListingInstall.count({
        where: {
          listing: { publisherOrgId: organizationId },
        },
      }),
      this.prisma.voiceListingSale.aggregate({
        where: { publisherOrgId: organizationId },
        _sum: { amountCents: true },
        _count: { _all: true },
      }),
      this.prisma.voiceListingReview.count({
        where: { listing: { publisherOrgId: organizationId } },
      }),
    ]);
    return {
      publishedListings: published,
      installsOnMyListings: installs,
      salesCount: sales._count._all,
      revenueCents: sales._sum.amountCents ?? 0,
      reviewsReceived: reviews,
      languagePackCatalogCount: LANGUAGE_PACK_COUNT,
      product: 'Lugemi Voice Marketplace',
      note: 'Publisher-side aggregates. Full Voice Analytics lives in the Voice Analytics hub.',
      docs: '/docs/VOICE_MARKETPLACE.md',
    };
  }

  async listSales(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.voiceListingSale.findMany({
      where: {
        OR: [{ publisherOrgId: organizationId }, { buyerOrgId: organizationId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      sales: rows.map((r) => ({
        id: r.id,
        listingId: r.listingId,
        buyerOrgId: r.buyerOrgId,
        publisherOrgId: r.publisherOrgId,
        amountCents: r.amountCents,
        applicationFeeCents: r.applicationFeeCents,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
