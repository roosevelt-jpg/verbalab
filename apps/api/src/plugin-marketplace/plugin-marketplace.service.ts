import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { PluginRuntimeService } from '../plugin-runtime/plugin-runtime.service';
import { PluginPolicyGate } from '../plugin-runtime/plugin-policy.gate';
import {
  PLUGIN_DENIED_ACTIONS,
  PLUGIN_PERMISSIONS,
} from '../plugin-runtime/plugin-runtime.catalog';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import { pluginMarketplaceEngineCatalog } from './plugin-marketplace.catalog';

const LISTING_KIND = 'plugin';
const REVIEW_RUNTIME = 'plugin-marketplace';

type PluginSnapshot = {
  sourcePluginId: string;
  name: string;
  version: number;
  permissions: string[];
  dependencies: string[];
  description?: string;
  verified: boolean;
  sandboxOnly: true;
  liveCodeExecution: false;
  ratingSum: number;
  ratingCount: number;
  installedPluginIds?: Record<string, string>;
};

@Injectable
export class PluginMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly pluginRuntime: PluginRuntimeService,
    private readonly pluginGate: PluginPolicyGate,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine {
    return pluginMarketplaceEngineCatalog;
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private parseSnapshot(raw: Prisma.JsonValue): PluginSnapshot {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApiException('validation_error', 'Invalid plugin listing snapshot', HttpStatus.BAD_REQUEST);
    }
    return raw as unknown as PluginSnapshot;
  }

  private verifyPermissions(permissions: string[]) {
    const normalized = this.pluginGate.normalizePermissions(permissions);
    for (const p of normalized) {
      if ((PLUGIN_DENIED_ACTIONS as readonly string[]).includes(p)) {
        throw new ApiException(
          'plugin_marketplace_unverified',
          `Permission "${p}" is globally denied and cannot be published`,
          HttpStatus.FORBIDDEN,
        );
      }
      if (!(PLUGIN_PERMISSIONS as readonly string[]).includes(p)) {
        throw new ApiException(
          'plugin_marketplace_unverified',
          `Permission "${p}" is not grantable in Plugin Runtime sandbox`,
          HttpStatus.FORBIDDEN,
        );
      }
    }
    return normalized;
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
      sourcePluginId: snap.sourcePluginId,
      pluginVersion: snap.version,
      permissions: snap.permissions,
      dependencies: snap.dependencies,
      verified: snap.verified,
      sandboxOnly: snap.sandboxOnly,
      liveCodeExecution: snap.liveCodeExecution,
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

  async listPublished(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const rows = await this.prisma.marketplaceListing.findMany({
      where: { status: 'published', kind: LISTING_KIND },
      include: { publisherOrg: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { listings: rows.map((r) => this.serialize(r)) };
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
      sales: rows.map((r) => ({
        id: r.id,
        listingId: r.listingId,
        listingTitle: r.listing.title,
        amountCents: r.amountCents,
        applicationFeeCents: r.applicationFeeCents,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt.toISOString,
      })),
    };
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    pluginId?: string;
    title?: string;
    description?: string;
    priceCents?: number;
    currency?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'plugin-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const { plugin } = await this.pluginRuntime.getPlugin({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: input.pluginId,
      userId: input.userId,
      ip: input.ip,
    });

    const permissions = this.verifyPermissions(plugin.permissions);
    await this.pluginGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      pluginId: plugin.id,
      action: 'plugin.read',
      permissions,
    });

    const title = (input.title ?? plugin.name).trim.slice(0, 120);
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }

    const priceCents = Math.max(0, Math.floor(Number(input.priceCents ?? 0) || 0));
    const currency = (input.currency ?? 'usd').trim.toLowerCase.slice(0, 8) || 'usd';
    const snapshot: PluginSnapshot = {
      sourcePluginId: plugin.id,
      name: plugin.name,
      version: plugin.version,
      permissions,
      dependencies: plugin.dependencies ?? [],
      description: input.description?.trim.slice(0, 500) || plugin.description,
      verified: true,
      sandboxOnly: true,
      liveCodeExecution: false,
      ratingSum: 0,
      ratingCount: 0,
    };

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        publisherOrgId: input.organizationId,
        publisherWorkspaceId: input.workspaceId,
        kind: LISTING_KIND,
        title,
        description: snapshot.description ?? null,
        status: 'published',
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        termCount: permissions.length,
        priceCents,
        currency,
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'plugin_marketplace.published',
      route: 'POST /v1/plugin-marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        pluginId: plugin.id,
        version: plugin.version,
        verified: true,
      },
    });

    return {
      listing: this.serialize(listing),
      honesty: this.engine.honesty,
      note: 'Plugin listing published. Buyers install into Plugin Runtime sandbox; invoke is Policy-gated.',
    };
  }

  async updateListing(input: {
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
      bus: 'plugin-marketplace',
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
    const bumped = await this.pluginRuntime.version({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: snap.sourcePluginId,
      userId: input.userId,
      ip: input.ip,
    });
    const permissions = this.verifyPermissions(bumped.plugin.permissions);
    const next: PluginSnapshot = {
      ...snap,
      name: bumped.plugin.name,
      version: bumped.plugin.version,
      permissions,
      dependencies: bumped.plugin.dependencies ?? [],
      description: bumped.plugin.description ?? snap.description,
      verified: true,
      sandboxOnly: true,
      liveCodeExecution: false,
    };

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: {
        snapshot: next as unknown as Prisma.InputJsonValue,
        description: next.description ?? null,
        termCount: permissions.length,
        status: 'published',
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'plugin_marketplace.updated',
      route: 'POST /v1/plugin-marketplace/listings/:id/update',
      ip: input.ip,
      metadata: { listingId: listing.id, version: next.version },
    });

    return {
      listing: this.serialize(updated),
      note: `Listing updated to plugin version ${next.version}.`,
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
      bus: 'plugin-marketplace',
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
    if (!snap.verified || snap.liveCodeExecution !== false || snap.sandboxOnly !== true) {
      throw new ApiException(
        'plugin_marketplace_unverified',
        'Listing is not sandbox-verified; install blocked',
        HttpStatus.FORBIDDEN,
      );
    }
    const permissions = this.verifyPermissions(snap.permissions);

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

    const registered = await this.pluginRuntime.register({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      name: snap.name,
      permissions,
      dependencies: [],
      description: `Marketplace install of ${listing.title} (v${snap.version})`,
    });

    const activated = await this.pluginRuntime.lifecycle({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      id: registered.plugin.id,
      status: 'active',
    });

    await this.pluginGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      pluginId: activated.plugin.id,
      action: 'plugin.read',
      permissions: activated.plugin.permissions,
    });

    const install = await this.prisma.marketplaceInstall.create({
      data: {
        listingId: listing.id,
        installerOrgId: input.organizationId,
        installerWorkspaceId: input.workspaceId,
        termsInstalled: permissions.length,
      },
    });

    let sale: { id: string; amountCents: number } | null = null;
    if (listing.priceCents > 0 && listing.publisherOrgId !== input.organizationId) {
      const fee = Math.floor(listing.priceCents * 0.15);
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
      sale = { id: created.id, amountCents: created.amountCents };
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'plugin_marketplace.installed',
      route: 'POST /v1/plugin-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        installId: install.id,
        pluginId: registered.plugin.id,
        sandbox: true,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: listing.id,
        pluginId: activated.plugin.id,
        installedAt: install.installedAt.toISOString,
      },
      plugin: activated.plugin,
      sale,
      honesty: this.engine.honesty,
      note:
        'Installed into Plugin Runtime as active sandboxed plugin. Run via POST /v1/plugin-marketplace/listings/:id/run (Policy-gated).',
    };
  }

  async run(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    actions?: Array<{ action: string; input?: Record<string, unknown> }>;
    ip?: string;
  }) {
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'plugin-marketplace',
      action: 'marketplace.invoke',
      subjectId: input.userId,
      permissions: ['marketplace.invoke'],
    });

    const install = await this.prisma.marketplaceInstall.findUnique({
      where: {
        listingId_installerWorkspaceId: {
          listingId: input.listingId,
          installerWorkspaceId: input.workspaceId,
        },
      },
      include: { listing: true },
    });
    if (!install || install.listing.kind !== LISTING_KIND) {
      throw new ApiException(
        'not_installed',
        'Install this plugin listing before running it',
        HttpStatus.FORBIDDEN,
      );
    }

    const snap = this.parseSnapshot(install.listing.snapshot);
    if (snap.liveCodeExecution !== false || snap.sandboxOnly !== true) {
      throw new ApiException(
        'plugin_marketplace_unverified',
        'Listing forbids live code; run blocked',
        HttpStatus.FORBIDDEN,
      );
    }

    const plugins = await this.pluginRuntime.listPlugins({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
    });
    const match = plugins.plugins.find(
      (p) =>
        p.name === snap.name &&
        p.permissions.every((perm) => snap.permissions.includes(perm)),
    );
    if (!match) {
      throw new ApiException(
        'not_found',
        'Installed marketplace plugin not found in Plugin Runtime registry',
        HttpStatus.NOT_FOUND,
      );
    }

    const result = await this.pluginRuntime.invoke({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      pluginId: match.id,
      actions: input.actions?.length
        ? input.actions
        : [{ action: 'plugin.read', input: {} }],
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'plugin_marketplace.ran',
      route: 'POST /v1/plugin-marketplace/listings/:id/run',
      ip: input.ip,
      metadata: {
        listingId: input.listingId,
        pluginId: match.id,
        sandbox: true,
        liveCodeExecution: false,
        status: result.invocation.status,
      },
    });

    return {
      ...result,
      listingId: input.listingId,
      honesty: {
        ...this.engine.honesty,
        ...result.honesty,
      },
      note:
        'Marketplace run completed via Plugin Runtime sandbox + PluginPolicyGate. Not live code execution.',
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        deletedAt: null,
        key: { startsWith: `plugin-marketplace-review:${listingId}:` },
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

    const key = `plugin-marketplace-review:${listing.id}:${input.organizationId}`;
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
    if (previous != null) {
      ratingSum = ratingSum - previous + rating;
    } else {
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
            type: 'plugin_marketplace_review',
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
            type: 'plugin_marketplace_review',
            listingId: listing.id,
          } as Prisma.InputJsonValue,
        },
      });
    }

    await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: {
        snapshot: {
          ...snap,
          ratingSum,
          ratingCount,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'plugin_marketplace.reviewed',
      route: 'POST /v1/plugin-marketplace/listings/:id/reviews',
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
      action: 'plugin_marketplace.unpublished',
      route: 'DELETE /v1/plugin-marketplace/listings/:id',
      ip: input.ip,
      metadata: { listingId: listing.id },
    });
    return { listing: this.serialize(updated), note: 'Listing unpublished.' };
  }

  async analytics(organizationId: string) {
    await this.billing.assertPro(organizationId);
    const [listings, installs, sales, runs] = await Promise.all([
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
        where: { organizationId, action: 'plugin_marketplace.ran' },
      }),
    ]);
    return {
      listings,
      installs,
      sales,
      runs,
      honesty: this.engine.honesty,
      note: 'Plugin marketplace aggregates. Commerce depth deferred to Creator Economy.',
    };
  }

  monitoring {
    const engine = this.engine;
    return {
      mode: 'plugin-marketplace',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Plugin Marketplace monitoring snapshot.',
    };
  }
}
