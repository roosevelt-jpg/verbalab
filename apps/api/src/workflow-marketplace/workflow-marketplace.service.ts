import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';
import { WorkflowPolicyGate } from '../workflow-runtime/workflow-policy.gate';
import {
  WORKFLOW_DENIED_ACTIONS,
  WORKFLOW_PERMISSIONS,
} from '../workflow-runtime/workflow-runtime.catalog';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import {
  WORKFLOW_MARKETPLACE_CATEGORIES,
  workflowMarketplaceEngineCatalog,
  type WorkflowMarketplaceCategory,
} from './workflow-marketplace.catalog';

const LISTING_KIND = 'workflow';
const REVIEW_RUNTIME = 'workflow-marketplace';
const PLATFORM_FEE_BPS = 1500;
const HUB = 'workflow-marketplace';

type WorkflowStep = { action: string; input?: Record<string, unknown> };

type WorkflowSnapshot = {
  hub: typeof HUB;
  sourceWorkflowId: string;
  name: string;
  category: WorkflowMarketplaceCategory;
  permissions: string[];
  mode: 'sequential' | 'parallel';
  steps: WorkflowStep[];
  requiresApproval: boolean;
  description?: string;
  workflowVersion: number;
  verified: boolean;
  sandboxOnly: true;
  liveStepExecution: false;
  ratingSum: number;
  ratingCount: number;
  installedWorkflowIds?: Record<string, string>;
};

@Injectable()
export class WorkflowMarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly workflowRuntime: WorkflowRuntimeService,
    private readonly workflowGate: WorkflowPolicyGate,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  engine() {
    return workflowMarketplaceEngineCatalog();
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin role required', HttpStatus.FORBIDDEN);
    }
  }

  private parseSnapshot(raw: Prisma.JsonValue): WorkflowSnapshot {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApiException(
        'validation_error',
        'Invalid workflow listing snapshot',
        HttpStatus.BAD_REQUEST,
      );
    }
    const snap = raw as unknown as WorkflowSnapshot;
    if (snap.hub !== HUB) {
      throw new ApiException(
        'validation_error',
        'Listing is not a Workflow Marketplace hub listing',
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

  private parseCategory(raw?: string): WorkflowMarketplaceCategory {
    const value = (raw ?? 'templates').trim().toLowerCase();
    if (!(WORKFLOW_MARKETPLACE_CATEGORIES as readonly string[]).includes(value)) {
      throw new ApiException(
        'validation_error',
        `category must be one of ${WORKFLOW_MARKETPLACE_CATEGORIES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value as WorkflowMarketplaceCategory;
  }

  private verifyPermissions(permissions: string[]) {
    const normalized = this.workflowGate.normalizePermissions(permissions);
    for (const p of normalized) {
      if ((WORKFLOW_DENIED_ACTIONS as readonly string[]).includes(p)) {
        throw new ApiException(
          'workflow_marketplace_unverified',
          `Permission "${p}" is globally denied and cannot be published`,
          HttpStatus.FORBIDDEN,
        );
      }
      if (!(WORKFLOW_PERMISSIONS as readonly string[]).includes(p)) {
        throw new ApiException(
          'workflow_marketplace_unverified',
          `Permission "${p}" is not grantable in Workflow Runtime sandbox`,
          HttpStatus.FORBIDDEN,
        );
      }
    }
    return normalized;
  }

  private verifySteps(steps: WorkflowStep[], permissions: string[]) {
    for (const step of steps) {
      const action = (step.action ?? '').trim();
      if ((WORKFLOW_DENIED_ACTIONS as readonly string[]).includes(action)) {
        throw new ApiException(
          'workflow_marketplace_unverified',
          `Step action "${action}" is globally denied and cannot be published`,
          HttpStatus.FORBIDDEN,
        );
      }
      if (!(WORKFLOW_PERMISSIONS as readonly string[]).includes(action)) {
        throw new ApiException(
          'workflow_marketplace_unverified',
          `Step action "${action}" is not grantable in Workflow Runtime sandbox`,
          HttpStatus.FORBIDDEN,
        );
      }
      if (!permissions.includes(action)) {
        throw new ApiException(
          'workflow_marketplace_unverified',
          `Step action "${action}" is not on the workflow permission allowlist`,
          HttpStatus.FORBIDDEN,
        );
      }
    }
    return steps.map((s) => ({
      action: s.action.trim(),
      ...(s.input ? { input: s.input } : {}),
    }));
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
      sourceWorkflowId: snap.sourceWorkflowId,
      category: snap.category,
      workflowVersion: snap.workflowVersion,
      permissions: snap.permissions,
      mode: snap.mode,
      stepCount: snap.steps.length,
      requiresApproval: snap.requiresApproval,
      verified: snap.verified,
      sandboxOnly: snap.sandboxOnly,
      liveStepExecution: snap.liveStepExecution,
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
    workflowId?: string;
    title?: string;
    description?: string;
    category?: string;
    priceCents?: number;
    currency?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'workflow-marketplace',
      action: 'marketplace.publish',
      subjectId: input.userId,
      permissions: ['marketplace.publish'],
    });

    const { workflow } = await this.workflowRuntime.getWorkflow({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: input.workflowId,
      userId: input.userId,
      ip: input.ip,
    });

    const permissions = this.verifyPermissions(workflow.permissions);
    const steps = this.verifySteps(workflow.steps ?? [], permissions);
    await this.workflowGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      workflowId: workflow.id,
      action: permissions[0]!,
      permissions,
    });

    const category = this.parseCategory(input.category);
    const title = (input.title ?? workflow.name).trim().slice(0, 120);
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }

    const priceCents = Math.max(0, Math.floor(Number(input.priceCents ?? 0) || 0));
    const currency = (input.currency ?? 'usd').trim().toLowerCase().slice(0, 8) || 'usd';
    const snapshot: WorkflowSnapshot = {
      hub: HUB,
      sourceWorkflowId: workflow.id,
      name: workflow.name,
      category,
      permissions,
      mode: workflow.mode === 'parallel' ? 'parallel' : 'sequential',
      steps,
      requiresApproval: Boolean(workflow.requiresApproval),
      description: input.description?.trim().slice(0, 500) || undefined,
      workflowVersion: workflow.version,
      verified: true,
      sandboxOnly: true,
      liveStepExecution: false,
      ratingSum: 0,
      ratingCount: 0,
      installedWorkflowIds: {},
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
        termCount: Math.max(permissions.length, steps.length, 1),
        priceCents,
        currency,
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow_marketplace.published',
      route: 'POST /v1/workflow-marketplace/listings',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        workflowId: workflow.id,
        category,
        verified: true,
        sandboxOnly: true,
      },
    });

    return {
      listing: this.serialize(listing),
      honesty: this.engine().honesty,
      note:
        'Workflow listing published. Buyers install into Workflow Runtime sandbox; run is Policy-gated. Not Zapier/Temporal OS.',
    };
  }

  async updateListing(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    description?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'workflow-marketplace',
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
    const bumped = await this.workflowRuntime.version({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: snap.sourceWorkflowId,
      userId: input.userId,
      ip: input.ip,
    });
    const permissions = this.verifyPermissions(bumped.workflow.permissions);
    const steps = this.verifySteps(bumped.workflow.steps ?? [], permissions);
    const next: WorkflowSnapshot = {
      ...snap,
      name: bumped.workflow.name,
      permissions,
      mode: bumped.workflow.mode === 'parallel' ? 'parallel' : 'sequential',
      steps,
      requiresApproval: Boolean(bumped.workflow.requiresApproval),
      description:
        input.description?.trim().slice(0, 500) || snap.description,
      workflowVersion: bumped.workflow.version,
      verified: true,
      sandboxOnly: true,
      liveStepExecution: false,
    };

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: {
        snapshot: next as unknown as Prisma.InputJsonValue,
        description: next.description ?? null,
        termCount: Math.max(permissions.length, steps.length, 1),
        status: 'published',
      },
      include: { publisherOrg: { select: { name: true } } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow_marketplace.updated',
      route: 'POST /v1/workflow-marketplace/listings/:id/update',
      ip: input.ip,
      metadata: { listingId: listing.id, workflowVersion: next.workflowVersion },
    });

    return {
      listing: this.serialize(updated),
      note: `Listing updated to workflow version ${next.workflowVersion}.`,
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
      bus: 'workflow-marketplace',
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
    if (!snap.verified || snap.liveStepExecution !== false || snap.sandboxOnly !== true) {
      throw new ApiException(
        'workflow_marketplace_unverified',
        'Listing is not sandbox-verified; install blocked',
        HttpStatus.FORBIDDEN,
      );
    }
    const permissions = this.verifyPermissions(snap.permissions);
    const steps = this.verifySteps(snap.steps ?? [], permissions);

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

    const created = await this.workflowRuntime.createWorkflow({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      name: snap.name,
      permissions,
      mode: snap.mode,
      steps,
      requiresApproval: snap.requiresApproval,
    });

    const activated = await this.workflowRuntime.lifecycle({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      id: created.workflow.id,
      status: 'active',
    });

    await this.workflowGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      workflowId: activated.workflow.id,
      action: permissions[0]!,
      permissions: activated.workflow.permissions,
    });

    const install = await this.prisma.marketplaceInstall.create({
      data: {
        listingId: listing.id,
        installerOrgId: input.organizationId,
        installerWorkspaceId: input.workspaceId,
        termsInstalled: Math.max(permissions.length, steps.length, 1),
      },
    });

    const nextSnap: WorkflowSnapshot = {
      ...snap,
      installedWorkflowIds: {
        ...(snap.installedWorkflowIds ?? {}),
        [input.workspaceId]: activated.workflow.id,
      },
      sandboxOnly: true,
      liveStepExecution: false,
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
      action: 'workflow_marketplace.installed',
      route: 'POST /v1/workflow-marketplace/listings/:id/install',
      ip: input.ip,
      metadata: {
        listingId: listing.id,
        installId: install.id,
        workflowId: activated.workflow.id,
        sandbox: true,
        saleId: sale?.id ?? null,
      },
    });

    return {
      install: {
        id: install.id,
        listingId: listing.id,
        workflowId: activated.workflow.id,
        installedAt: install.installedAt.toISOString(),
      },
      workflow: activated.workflow,
      sale,
      honesty: this.engine().honesty,
      note:
        'Installed into Workflow Runtime as active sandboxed workflow. Run via POST /v1/workflow-marketplace/listings/:id/run (Policy-gated).',
    };
  }

  async run(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    listingId: string;
    approved?: boolean;
    actions?: Array<{ action: string; input?: Record<string, unknown> }>;
    ip?: string;
  }) {
    await this.billing.assertPro(input.organizationId);

    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'workflow-marketplace',
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
    if (
      !install ||
      install.listing.kind !== LISTING_KIND ||
      !this.isHubListing(install.listing.snapshot)
    ) {
      throw new ApiException(
        'not_installed',
        'Install this workflow listing before running it',
        HttpStatus.FORBIDDEN,
      );
    }

    const snap = this.parseSnapshot(install.listing.snapshot);
    if (snap.liveStepExecution !== false || snap.sandboxOnly !== true) {
      throw new ApiException(
        'workflow_marketplace_unverified',
        'Listing forbids live steps; run blocked',
        HttpStatus.FORBIDDEN,
      );
    }

    let workflowId = snap.installedWorkflowIds?.[input.workspaceId];
    if (!workflowId) {
      const workflows = await this.workflowRuntime.listWorkflows({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      });
      const match = workflows.workflows.find(
        (w) =>
          w.name === snap.name &&
          w.permissions.every((perm) => snap.permissions.includes(perm)),
      );
      if (!match) {
        throw new ApiException(
          'not_found',
          'Installed marketplace workflow not found in Workflow Runtime registry',
          HttpStatus.NOT_FOUND,
        );
      }
      workflowId = match.id;
    }

    // Probe denied actions without mutating the installed workflow definition.
    if (input.actions?.length) {
      const probeSteps: Array<{
        action: string;
        allowed: boolean;
        simulated: boolean;
        error?: string;
        at: string;
      }> = [];
      for (const step of input.actions) {
        const at = new Date().toISOString();
        try {
          await this.workflowGate.assertAllowed({
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            workflowId,
            action: step.action,
            permissions: snap.permissions,
          });
          probeSteps.push({ action: step.action, allowed: true, simulated: true, at });
        } catch (err) {
          const message = err instanceof ApiException ? err.message : 'Action denied';
          probeSteps.push({
            action: step.action,
            allowed: false,
            simulated: true,
            error: message,
            at,
          });
          break;
        }
      }
      if (probeSteps.some((s) => !s.allowed)) {
        await this.audit.record({
          organizationId: input.organizationId,
          userId: input.userId,
          action: 'workflow_marketplace.ran',
          route: 'POST /v1/workflow-marketplace/listings/:id/run',
          ip: input.ip,
          metadata: {
            listingId: input.listingId,
            workflowId,
            sandbox: true,
            liveStepExecution: false,
            status: 'denied',
            probe: true,
          },
        });
        return {
          run: {
            id: `wprobe_${Date.now()}`,
            workflowId,
            status: 'denied',
            sandbox: true,
            liveStepExecution: false,
            steps: probeSteps,
            createdAt: new Date().toISOString(),
          },
          listingId: input.listingId,
          honesty: this.engine().honesty,
          note:
            'Marketplace probe denied by WorkflowPolicyGate. Not live step execution / Zapier OS.',
        };
      }
    }

    const result = await this.workflowRuntime.run({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      workflowId,
      approved: input.approved ?? !snap.requiresApproval,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow_marketplace.ran',
      route: 'POST /v1/workflow-marketplace/listings/:id/run',
      ip: input.ip,
      metadata: {
        listingId: input.listingId,
        workflowId,
        sandbox: true,
        liveStepExecution: false,
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
        'Marketplace run completed via Workflow Runtime sandbox + WorkflowPolicyGate. Not live Zapier/Temporal execution.',
    };
  }

  async listReviews(listingId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        deletedAt: null,
        key: { startsWith: `workflow-marketplace-review:${listingId}:` },
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

    const key = `workflow-marketplace-review:${listing.id}:${input.organizationId}`;
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
            type: 'workflow_marketplace_review',
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
            type: 'workflow_marketplace_review',
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
      action: 'workflow_marketplace.reviewed',
      route: 'POST /v1/workflow-marketplace/listings/:id/reviews',
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
      action: 'workflow_marketplace.unpublished',
      route: 'DELETE /v1/workflow-marketplace/listings/:id',
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
        where: { organizationId, action: 'workflow_marketplace.reviewed' },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'workflow_marketplace.ran' },
      }),
    ]);
    return {
      listings: hubIds.length,
      installs,
      sales,
      reviews,
      runs,
      honesty: this.engine().honesty,
      note: 'Workflow marketplace aggregates. Payout depth deferred to Creator Economy.',
    };
  }

  monitoring() {
    const engine = this.engine();
    return {
      mode: 'workflow-marketplace',
      products: engine.capabilities.map((c) => ({ id: c.id, status: c.status })),
      honesty: engine.honesty,
      safety: engine.safety,
      note: 'Workflow Marketplace monitoring snapshot.',
    };
  }
}
