import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import type { PromptSnapshotItem } from '../marketplace/marketplace.types';
import { isPromptSnapshotItem } from '../marketplace/marketplace.types';
import { isPromptKey } from '../prompts/prompt-defaults';
import {
  PROMPT_MARKETPLACE_CATEGORIES,
  PROMPT_MARKETPLACE_LICENSE_TYPES,
  promptMarketplaceEngineCatalog,
  type PromptMarketplaceCategory,
} from './prompt-marketplace.catalog';

const LISTING_KIND = 'prompt';
const REVIEW_RUNTIME = 'prompt-marketplace';
const PLATFORM_FEE_BPS = 1500;
const HUB = 'prompt-marketplace';

type PromptSnapshot = {
  hub: typeof HUB;
  category: PromptMarketplaceCategory;
  licenseType: string;
  promptVersion: string;
  verified: boolean;
  promptMeshOs: false;
  autoPromptResearchOs: false;
  keys: string[];
  promptCount: number;
  prompts: PromptSnapshotItem[];
  ratingSum: number;
  ratingCount: number;
};

@Injectable()
export class PromptMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine() {
    return promptMarketplaceEngineCatalog();
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private parseSnapshot(raw: Prisma.JsonValue): PromptSnapshot {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApiException(
        'validation_error',
        'Invalid prompt listing snapshot',
        HttpStatus.BAD_REQUEST,
      );
    }
    const snap = raw as unknown as PromptSnapshot;
    if (snap.hub !== HUB) {
      throw new ApiException(
        'validation_error',
        'Listing is not a Prompt Marketplace hub listing',
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

  private parseCategory(raw?: string): PromptMarketplaceCategory {
    const value = (raw ?? 'packs').trim().toLowerCase();
    if (!(PROMPT_MARKETPLACE_CATEGORIES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `category must be one of ${PROMPT_MARKETPLACE_CATEGORIES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value as PromptMarketplaceCategory;
  }

  private parseLicense(raw?: string): string {
    const value = (raw ?? 'commercial').trim().toLowerCase();
    if (!(PROMPT_MARKETPLACE_LICENSE_TYPES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `licenseType must be one of ${PROMPT_MARKETPLACE_LICENSE_TYPES.join(', ')}`,
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
      category: snap.category,
      licenseType: snap.licenseType,
      promptVersion: snap.promptVersion,
      verified: snap.verified,
      promptMeshOs: snap.promptMeshOs,
      autoPromptResearchOs: snap.autoPromptResearchOs,
      keys: snap.keys,
      promptCount: snap.promptCount,
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
      },
      note: 'Recorded receipts only. Creator Economy (VL-258) expands payout math.',
    };
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    title?: string;
    description?: string;
    category?: string;
    licenseType?: string;
    promptVersion?: string;
    keys?: string[];
    priceCents?: number;
    currency?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'prompt-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const category = this.parseCategory(input.category);
    const licenseType = this.parseLicense(input.licenseType);
    const promptVersion = (input.promptVersion ?? 'v1').trim().slice(0, 64) || 'v1';
    const priceCents = Math.max(0, Math.floor(Number(input.priceCents ?? 0) || 0));
    const currency = (input.currency ?? 'usd').trim().toLowerCase().slice(0, 8) || 'usd';

    const filterKeys =
      Array.isArray(input.keys) && input.keys.length > 0
        ? input.keys.map((k) => k.trim()).filter((k) => isPromptKey(k))
        : null;

    const prompts = await this.prisma.prompt.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        activeVersion: { not: null },
        ...(filterKeys ? { key: { in: filterKeys } } : {}),
      },
      include: { versions: true },
    });

    const snapshotPrompts: PromptSnapshotItem[] = [];
    for (const prompt of prompts) {
      if (!isPromptKey(prompt.key) || prompt.activeVersion == null) continue;
      const version = prompt.versions.find((v) => v.version === prompt.activeVersion);
      if (!version?.body?.trim()) continue;
      snapshotPrompts.push({ key: prompt.key, body: version.body });
    }
    if (snapshotPrompts.length === 0) {
      throw new ApiException(
        'validation_error',
        'Workspace has no active managed prompts to publish as a pack',
        HttpStatus.BAD_REQUEST,
      );
    }

    const title = (input.title ?? 'Prompt pack').trim().slice(0, 120);
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }
    const description =
      input.description?.trim().slice(0, 500) ||
      `${snapshotPrompts.length} managed prompts (${snapshotPrompts.map((p) => p.key).join(', ')})`;

    const snapshot: PromptSnapshot = {
      hub: HUB,
      category,
      licenseType,
      promptVersion,
      verified: true,
      promptMeshOs: false,
      autoPromptResearchOs: false,
      keys: snapshotPrompts.map((p) => p.key),
      promptCount: snapshotPrompts.length,
      prompts: snapshotPrompts,
      ratingSum: 0,
      ratingCount: 0,
    };

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        publisherOrgId: input.organizationId,
        publisherWorkspaceId: input.workspaceId,
        kind: LISTING_KIND,
        title,
        description,
        status: 'published',
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        termCount: snapshot.promptCount,
        priceCents,
        currency,
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt_marketplace.published',
      route: 'POST /v1/prompt-marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        category: snapshot.category,
        promptCount: snapshot.promptCount,
        keys: snapshot.keys,
      },
    });

    return {
      listing: this.serialize(listing),
      honesty: this.engine().honesty,
      note:
        'Prompt listing published under content-marketplace prompt kind with Prompt Marketplace hub marker. Not a prompt mesh OS.',
    };
  }

  async updateListing(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    promptVersion?: string;
    description?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'prompt-marketplace',
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
    const next: PromptSnapshot = {
      ...snap,
      promptVersion:
        (input.promptVersion ?? snap.promptVersion).trim().slice(0, 64) || snap.promptVersion,
      verified: true,
      promptMeshOs: false,
      autoPromptResearchOs: false,
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
      action: 'prompt_marketplace.updated',
      route: 'POST /v1/prompt-marketplace/listings/:id/update',
      ip: input.ip,
      metadata: { listingId: listing.id, promptVersion: next.promptVersion },
    });

    return {
      listing: this.serialize(updated),
      note: `Listing updated to prompt version ${next.promptVersion}.`,
    };
  }

  async testListing(input: {
    organizationId: string;
    listingId: string;
  }) {
    await this.billing.assertPro(input.organizationId);
    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { id: input.listingId, kind: LISTING_KIND, status: 'published' },
    });
    if (!listing || !this.isHubListing(listing.snapshot)) {
      throw new ApiException('not_found', 'Listing not found', HttpStatus.NOT_FOUND);
    }
    const snap = this.parseSnapshot(listing.snapshot);
    const results = (snap.prompts ?? []).map((item) => {
      const valid = isPromptSnapshotItem(item);
      return {
        key: item?.key ?? null,
        valid,
        bodyChars: typeof item?.body === 'string' ? item.body.length : 0,
        note: valid
          ? 'Snapshot item ready for install / Prompt Fabric resolve.'
          : 'Invalid key or empty body.',
      };
    });
    const passed = results.every((r) => r.valid) && results.length > 0;
    return {
      listingId: listing.id,
      promptVersion: snap.promptVersion,
      passed,
      results,
      honesty: {
        promptMeshOs: false,
        autoPromptResearchOs: false,
        dryRunOnly: true,
      },
      note: 'Dry-run prompt test — no workspace writes. Use Prompt Runtime / Prompt Fabric for live execute.',
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
      bus: 'prompt-marketplace',
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
    if (!snap.verified || snap.promptMeshOs || snap.autoPromptResearchOs) {
      throw new ApiException(
        'prompt_marketplace_unverified',
        'Listing failed Prompt Marketplace honesty checks',
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

    if (!Array.isArray(snap.prompts) || snap.prompts.length === 0) {
      throw new ApiException(
        'validation_error',
        'Prompt listing has no prompts to install',
        HttpStatus.BAD_REQUEST,
      );
    }

    let promptsInstalled = 0;
    for (const item of snap.prompts) {
      if (!isPromptSnapshotItem(item)) continue;
      const prompt = await this.prisma.prompt.upsert({
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
      const latest = await this.prisma.promptVersion.findFirst({
        where: { promptId: prompt.id },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const version = (latest?.version ?? 0) + 1;
      await this.prisma.promptVersion.create({
        data: {
          promptId: prompt.id,
          version,
          body: item.body,
          note: `prompt-marketplace:${listing.id}`,
          createdBy: input.userId,
        },
      });
      await this.prisma.prompt.update({
        where: { id: prompt.id },
        data: { activeVersion: version },
      });
      promptsInstalled += 1;
    }
    if (promptsInstalled === 0) {
      throw new ApiException(
        'validation_error',
        'Listing snapshot has no valid prompts',
        HttpStatus.BAD_REQUEST,
      );
    }

    const install = await this.prisma.marketplaceInstall.create({
      data: {
        listingId: listing.id,
        installerOrgId: input.organizationId,
        installerWorkspaceId: input.workspaceId,
        termsInstalled: promptsInstalled,
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
      action: 'prompt_marketplace.installed',
      route: 'POST /v1/prompt-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        installId: install.id,
        promptsInstalled,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: listing.id,
        promptsInstalled,
        installedAt: install.installedAt.toISOString(),
      },
      entitlement: {
        workspaceId: input.workspaceId,
        keys: snap.keys,
        licenseType: snap.licenseType,
        promptsCopied: promptsInstalled,
        promptMeshOs: false,
        autoPromptResearchOs: false,
        note: 'Managed prompt versions installed into buyer workspace for Prompt Runtime / Prompt Fabric.',
      },
      sale,
      honesty: this.engine().honesty,
      note: 'Prompt marketplace install completed. Not a prompt mesh OS.',
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        deletedAt: null,
        key: { startsWith: `prompt-marketplace-review:${listingId}:` },
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

    const key = `prompt-marketplace-review:${listing.id}:${input.organizationId}`;
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
            type: 'prompt_marketplace_review',
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
            type: 'prompt_marketplace_review',
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
      action: 'prompt_marketplace.reviewed',
      route: 'POST /v1/prompt-marketplace/listings/:id/reviews',
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
      action: 'prompt_marketplace.unpublished',
      route: 'DELETE /v1/prompt-marketplace/listings/:id',
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
        where: { organizationId, action: 'prompt_marketplace.reviewed' },
      }),
    ]);
    return {
      listings: hubIds.length,
      installs,
      sales,
      reviews,
      honesty: this.engine().honesty,
      note: 'Prompt marketplace aggregates. Payout depth deferred to Creator Economy (VL-258).',
    };
  }

  monitoring() {
    const engine = this.engine();
    return {
      mode: 'prompt-marketplace',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Prompt Marketplace monitoring snapshot (VL-253).',
    };
  }
}
