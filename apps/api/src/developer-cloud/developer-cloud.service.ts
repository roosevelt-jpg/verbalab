import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { sdkCatalog } from './sdk-catalog';

@Injectable()
export class DeveloperCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly usage: UsageService,
  ) {}

  sdk() {
    return sdkCatalog();
  }

  async overview(session: SessionContext) {
    const [org, keys, workspaces, billing, usage] = await Promise.all([
      this.prisma.organization.findUniqueOrThrow({
        where: { id: session.organizationId },
        select: { id: true, name: true, plan: true },
      }),
      this.prisma.apiKey.findMany({
        where: { organizationId: session.organizationId },
        select: {
          id: true,
          name: true,
          prefix: true,
          environment: true,
          revokedAt: true,
          lastUsedAt: true,
          createdAt: true,
          workspaceId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.workspace.findMany({
        where: { organizationId: session.organizationId },
        select: { id: true, name: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.billing.getSummary(session.organizationId),
      this.usage.summary(session.organizationId),
    ]);

    const active = keys.filter((k) => !k.revokedAt);
    return {
      organization: org,
      workspaceId: session.workspaceId,
      applications: {
        mappedTo: 'workspaces',
        data: workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          kind: 'workspace',
          isCurrent: w.id === session.workspaceId,
        })),
      },
      apiKeys: {
        active: active.length,
        live: active.filter((k) => k.environment === 'live').length,
        test: active.filter((k) => k.environment === 'test').length,
        recent: keys.map((k) => ({
          id: k.id,
          name: k.name,
          prefix: k.prefix,
          environment: k.environment,
          kind: 'machine' as const,
          revokedAt: k.revokedAt,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
          workspaceId: k.workspaceId,
        })),
      },
      billing: {
        plan: billing.plan,
        planName: billing.planName,
        charactersUsed: billing.charactersUsed,
        characterQuota: billing.characterQuota,
        charactersRemaining: billing.charactersRemaining,
      },
      usage: {
        characters: usage.characters,
        requests: usage.requests,
        periodStart: usage.periodStart,
      },
      sdk: sdkCatalog(),
      links: {
        docs: '/docs',
        playground: '/playground',
        openapi: '/v1/openapi.json',
        keys: '/keys',
        billing: '/billing',
        usage: '/usage',
        analytics: '/analytics',
      },
      sandbox: {
        mode: 'soft_key_environment',
        separateCluster: false,
        note: 'lg_test_ keys hit the same API/DB and share quota with live.',
      },
      oauthClients: {
        supported: false,
        note: 'Human OAuth is Clerk; machine auth is API keys.',
      },
      docs: '/docs/DEVELOPER_CLOUD.md',
    };
  }
}
