import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { AgentRuntimeService } from '../agent-runtime/agent-runtime.service';
import { AgentPolicyGate } from '../agent-runtime/agent-policy.gate';
import {
  AGENT_DENIED_ACTIONS,
  AGENT_PERMISSIONS,
} from '../agent-runtime/agent-runtime.catalog';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import {
  AGENT_MARKETPLACE_CATEGORIES,
  agentMarketplaceEngineCatalog,
  type AgentMarketplaceCategory,
} from './agent-marketplace.catalog';

const LISTING_KIND = 'agent';
const REVIEW_RUNTIME = 'agent-marketplace';
const PLATFORM_FEE_BPS = 1500;
const HUB = 'agent-marketplace';

type AgentSnapshot = {
  hub: typeof HUB;
  sourceAgentId: string;
  name: string;
  category: AgentMarketplaceCategory;
  permissions: string[];
  goal?: string;
  description?: string;
  agentVersion: string;
  verified: boolean;
  sandboxOnly: true;
  liveToolExecution: false;
  ratingSum: number;
  ratingCount: number;
  installedAgentIds?: Record<string, string>;
};

@Injectable()
export class AgentMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly agentRuntime: AgentRuntimeService,
    private readonly agentGate: AgentPolicyGate,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine() {
    return agentMarketplaceEngineCatalog();
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private parseSnapshot(raw: Prisma.JsonValue): AgentSnapshot {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApiException(
        'validation_error',
        'Invalid agent listing snapshot',
        HttpStatus.BAD_REQUEST,
      );
    }
    const snap = raw as unknown as AgentSnapshot;
    if (snap.hub !== HUB) {
      throw new ApiException(
        'validation_error',
        'Listing is not an Agent Marketplace hub listing',
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

  private parseCategory(raw?: string): AgentMarketplaceCategory {
    const value = (raw ?? 'business').trim().toLowerCase();
    if (!(AGENT_MARKETPLACE_CATEGORIES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `category must be one of ${AGENT_MARKETPLACE_CATEGORIES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value as AgentMarketplaceCategory;
  }

  private verifyPermissions(permissions: string[]) {
    const normalized = this.agentGate.normalizePermissions(permissions);
    for (const p of normalized) {
      if ((AGENT_DENIED_ACTIONS as readonly string[]).includes(p)) {
        throw new ApiException(
          'agent_marketplace_unverified',
          `Permission "${p}" is globally denied and cannot be published`,
          HttpStatus.FORBIDDEN,
        );
      }
      if (!(AGENT_PERMISSIONS as readonly string[]).includes(p)) {
        throw new ApiException(
          'agent_marketplace_unverified',
          `Permission "${p}" is not grantable in Agent Runtime sandbox`,
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
      sourceAgentId: snap.sourceAgentId,
      category: snap.category,
      agentVersion: snap.agentVersion,
      permissions: snap.permissions,
      goal: snap.goal ?? null,
      verified: snap.verified,
      sandboxOnly: snap.sandboxOnly,
      liveToolExecution: snap.liveToolExecution,
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
      note: 'Recorded receipts only. Creator Economy expands payout math.',
    };
  }

  async publish(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    agentId?: string;
    title?: string;
    description?: string;
    category?: string;
    agentVersion?: string;
    priceCents?: number;
    currency?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'agent-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const { agent } = await this.agentRuntime.getAgent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: input.agentId,
      userId: input.userId,
      ip: input.ip,
    });

    const permissions = this.verifyPermissions(agent.permissions);
    await this.agentGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      agentId: agent.id,
      action: permissions[0]!,
      permissions,
    });

    const category = this.parseCategory(input.category);
    const title = (input.title ?? agent.name).trim().slice(0, 120);
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }

    const priceCents = Math.max(0, Math.floor(Number(input.priceCents ?? 0) || 0));
    const currency = (input.currency ?? 'usd').trim().toLowerCase().slice(0, 8) || 'usd';
    const agentVersion = (input.agentVersion ?? 'v1').trim().slice(0, 64) || 'v1';
    const snapshot: AgentSnapshot = {
      hub: HUB,
      sourceAgentId: agent.id,
      name: agent.name,
      category,
      permissions,
      goal: agent.goal,
      description: input.description?.trim().slice(0, 500) || agent.goal,
      agentVersion,
      verified: true,
      sandboxOnly: true,
      liveToolExecution: false,
      ratingSum: 0,
      ratingCount: 0,
      installedAgentIds: {},
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
      action: 'agent_marketplace.published',
      route: 'POST /v1/agent-marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        agentId: agent.id,
        category,
        verified: true,
        sandboxOnly: true,
      },
    });

    return {
      listing: this.serialize(listing),
      honesty: this.engine().honesty,
      note:
        'Agent listing published. Buyers install into Agent Runtime sandbox; run is Policy-gated. Not LangGraph/AutoGPT OS.',
    };
  }

  async updateListing(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    agentVersion?: string;
    description?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'agent-marketplace',
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
    const { agent } = await this.agentRuntime.getAgent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: snap.sourceAgentId,
      userId: input.userId,
      ip: input.ip,
    });
    const permissions = this.verifyPermissions(agent.permissions);
    const next: AgentSnapshot = {
      ...snap,
      name: agent.name,
      permissions,
      goal: agent.goal,
      description:
        input.description?.trim().slice(0, 500) || agent.goal || snap.description,
      agentVersion:
        (input.agentVersion ?? snap.agentVersion).trim().slice(0, 64) || snap.agentVersion,
      verified: true,
      sandboxOnly: true,
      liveToolExecution: false,
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
      action: 'agent_marketplace.updated',
      route: 'POST /v1/agent-marketplace/listings/:id/update',
      ip: input.ip,
      metadata: { listingId: listing.id, agentVersion: next.agentVersion },
    });

    return {
      listing: this.serialize(updated),
      note: `Listing updated to agent version ${next.agentVersion}.`,
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
      bus: 'agent-marketplace',
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
    if (!snap.verified || snap.liveToolExecution !== false || snap.sandboxOnly !== true) {
      throw new ApiException(
        'agent_marketplace_unverified',
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

    const created = await this.agentRuntime.createAgent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      name: snap.name,
      permissions,
      goal: snap.goal ?? `Marketplace install of ${listing.title}`,
    });

    const activated = await this.agentRuntime.lifecycle({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      id: created.agent.id,
      status: 'active',
    });

    await this.agentGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      agentId: activated.agent.id,
      action: permissions[0]!,
      permissions: activated.agent.permissions,
    });

    const install = await this.prisma.marketplaceInstall.create({
      data: {
        listingId: listing.id,
        installerOrgId: input.organizationId,
        installerWorkspaceId: input.workspaceId,
        termsInstalled: permissions.length,
      },
    });

    const nextSnap: AgentSnapshot = {
      ...snap,
      installedAgentIds: {
        ...(snap.installedAgentIds ?? {}),
        [input.workspaceId]: activated.agent.id,
      },
      sandboxOnly: true,
      liveToolExecution: false,
    };
    await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { snapshot: nextSnap as unknown as Prisma.InputJsonValue },
    });

    let sale: {
      id: string;
      amountCents: number;
      applicationFeeCents: number;
    } | null = null;
    if (listing.priceCents > 0 && listing.publisherOrgId !== input.organizationId) {
      const fee = Math.floor((listing.priceCents * PLATFORM_FEE_BPS) / 10000);
      const saleRow = await this.prisma.marketplaceSale.create({
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
        id: saleRow.id,
        amountCents: saleRow.amountCents,
        applicationFeeCents: saleRow.applicationFeeCents,
      };
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'agent_marketplace.installed',
      route: 'POST /v1/agent-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        installId: install.id,
        agentId: activated.agent.id,
        sandbox: true,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: listing.id,
        agentId: activated.agent.id,
        installedAt: install.installedAt.toISOString(),
      },
      agent: activated.agent,
      sale,
      honesty: this.engine().honesty,
      note:
        'Installed into Agent Runtime as active sandboxed agent. Run via POST /v1/agent-marketplace/listings/:id/run (Policy-gated).',
    };
  }

  async run(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    goal?: string;
    actions?: Array<{ action: string; input?: Record<string, unknown> }>;
    ip?: string;
  }) {
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'agent-marketplace',
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
    if (!install || install.listing.kind !== LISTING_KIND || !this.isHubListing(install.listing.snapshot)) {
      throw new ApiException(
        'not_installed',
        'Install this agent listing before running it',
        HttpStatus.FORBIDDEN,
      );
    }

    const snap = this.parseSnapshot(install.listing.snapshot);
    if (snap.liveToolExecution !== false || snap.sandboxOnly !== true) {
      throw new ApiException(
        'agent_marketplace_unverified',
        'Listing forbids live tools; run blocked',
        HttpStatus.FORBIDDEN,
      );
    }

    let agentId = snap.installedAgentIds?.[input.workspaceId];
    if (!agentId) {
      const agents = await this.agentRuntime.listAgents({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      });
      const match = agents.agents.find(
        (a) =>
          a.name === snap.name &&
          a.permissions.every((perm) => snap.permissions.includes(perm)),
      );
      if (!match) {
        throw new ApiException(
          'not_found',
          'Installed marketplace agent not found in Agent Runtime registry',
          HttpStatus.NOT_FOUND,
        );
      }
      agentId = match.id;
    }

    const result = await this.agentRuntime.run({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      agentId,
      goal: input.goal ?? snap.goal,
      actions: input.actions?.length
        ? input.actions
        : [{ action: 'reason.plan', input: { problem: input.goal ?? snap.goal ?? snap.name } }],
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'agent_marketplace.ran',
      route: 'POST /v1/agent-marketplace/listings/:id/run',
      ip: input.ip,
      metadata: {
        listingId: input.listingId,
        agentId,
        sandbox: true,
        liveToolExecution: false,
        status: result.run.status,
      },
    });

    return {
      ...result,
      listingId: input.listingId,
      honesty: {
        ...this.engine().honesty,
        ...result.honesty,
      },
      note:
        'Marketplace run completed via Agent Runtime sandbox + AgentPolicyGate. Not open tool execution / LangGraph OS.',
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        deletedAt: null,
        key: { startsWith: `agent-marketplace-review:${listingId}:` },
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

    const key = `agent-marketplace-review:${listing.id}:${input.organizationId}`;
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
            type: 'agent_marketplace_review',
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
            type: 'agent_marketplace_review',
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
      action: 'agent_marketplace.reviewed',
      route: 'POST /v1/agent-marketplace/listings/:id/reviews',
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
      action: 'agent_marketplace.unpublished',
      route: 'DELETE /v1/agent-marketplace/listings/:id',
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
    const [installs, sales, reviews, runs] = await Promise.all([
      this.prisma.marketplaceInstall.count({ where: { listingId: { in: hubIds } } }),
      this.prisma.marketplaceSale.count({ where: { listingId: { in: hubIds } } }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'agent_marketplace.reviewed' },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'agent_marketplace.ran' },
      }),
    ]);
    return {
      listings: hubIds.length,
      installs,
      sales,
      reviews,
      runs,
      honesty: this.engine().honesty,
      note: 'Agent marketplace aggregates. Payout depth deferred to Creator Economy.',
    };
  }

  monitoring() {
    const engine = this.engine();
    return {
      mode: 'agent-marketplace',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Agent Marketplace monitoring snapshot.',
    };
  }
}
