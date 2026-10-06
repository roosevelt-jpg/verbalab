import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');

const FABRIC_DIRS = [
  'ai-fabric',
  'event-fabric',
  'context-fabric',
  'knowledge-fabric',
  'prompt-fabric',
  'reasoning-fabric',
  'memory-fabric',
  'agent-fabric',
  'policy-fabric',
];

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkTsFiles(p, out);
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_afa_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: [
          { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
          { name: 'Peer', defaultSourceLang: 'en', defaultTargetLang: 'fr' },
        ],
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('AI Fabric Production Audit (VL-248)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    process.env.EVENT_FABRIC_MEMORY = '1';
    process.env.LUGEMI_POLICY_RUNTIME_MODE = 'enforce';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit ADR and report pack', () => {
    expect(existsSync(join(root, 'docs/adr/0150-ai-fabric-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-fabric-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-fabric-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-fabric-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-fabric-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-fabric-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-fabric-audit/AI_FABRIC_READINESS_REPORT.md'))).toBe(
      true,
    );

    const readiness = readFileSync(
      join(root, 'docs/ai-fabric-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/hard gate|hard-gate/i);
    expect(readiness).toMatch(/not log-only|Rejected/i);
    expect(readiness).toContain('bounded');
    expect(readiness).toMatch(/Volume 11|Ecosystem/i);

    const adr = readFileSync(join(root, 'docs/adr/0150-ai-fabric-production-audit.md'), 'utf8');
    expect(adr).toMatch(/review gate|checklist/i);
    expect(adr).toMatch(/do not implement|Rejected|not implement/i);
  });

  it('has no TODO/FIXME/implement-later markers in fabric source trees', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of FABRIC_DIRS) {
      const dir = join(apiSrc, name);
      if (!existsSync(dir)) {
        hits.push(`missing:${name}`);
        continue;
      }
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes all fabric catalogs as shipped with monitoring', async () => {
    const paths = [
      '/v1/ai-fabric/products',
      '/v1/ai-fabric/monitoring',
      '/v1/event-fabric/products',
      '/v1/event-fabric/monitoring',
      '/v1/context-fabric/products',
      '/v1/context-fabric/monitoring',
      '/v1/knowledge-fabric/products',
      '/v1/knowledge-fabric/monitoring',
      '/v1/prompt-fabric/products',
      '/v1/prompt-fabric/monitoring',
      '/v1/reasoning-fabric/products',
      '/v1/reasoning-fabric/monitoring',
      '/v1/memory-fabric/products',
      '/v1/memory-fabric/monitoring',
      '/v1/agent-fabric/products',
      '/v1/agent-fabric/monitoring',
      '/v1/policy-fabric/products',
      '/v1/policy-fabric/monitoring',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }

    const hub = await request(app.getHttpServer()).get('/v1/ai-fabric/products').expect(200);
    expect(hub.body.architecture.customerFacingProduct).toBe(false);
    const byId = Object.fromEntries(
      hub.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    for (const id of [
      'ai-fabric',
      'event-fabric',
      'context-fabric',
      'knowledge-fabric',
      'prompt-fabric',
      'reasoning-fabric',
      'memory-fabric',
      'agent-fabric',
      'policy-fabric',
    ]) {
      expect(byId[id]).toBe('shipped');
    }

    const policy = await request(app.getHttpServer())
      .get('/v1/policy-fabric/products')
      .expect(200);
    expect(policy.body.architecture.hardGate).toBe(true);
    expect(policy.body.architecture.logOnlyMode).toBe(false);
  });

  it('rejects unauthenticated sensitive fabric routes (security smoke)', async () => {
    const paths = [
      '/v1/ai-fabric/overview',
      '/v1/event-fabric/overview',
      '/v1/context-fabric/overview',
      '/v1/knowledge-fabric/overview',
      '/v1/prompt-fabric/overview',
      '/v1/reasoning-fabric/overview',
      '/v1/memory-fabric/overview',
      '/v1/agent-fabric/overview',
      '/v1/policy-fabric/overview',
      '/v1/policy-fabric/assert',
    ];
    for (const path of paths) {
      const res =
        path.endsWith('/assert')
          ? await request(app.getHttpServer()).post(path).send({ action: 'fabric.distribute' })
          : await request(app.getHttpServer()).get(path);
      expect([401, 403, 503]).toContain(res.status);
    }
  });

  it('hard-gates policy fabric and connects same-org distribute (resilience smoke)', async () => {
    const org = await seedOrg(prisma, `afa_${Date.now()}`);
    const primary = org.workspaces.find((w) => w.name === 'Default')!;
    const peer = org.workspaces.find((w) => w.name === 'Peer')!;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: primary.id,
      userId: org.memberships[0]!.userId,
      name: 'afa-key',
    });

    await request(app.getHttpServer())
      .post('/v1/policy-fabric/assert')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ bus: 'policy-fabric', action: 'fabric.bypass_policy' })
      .expect(403);

    const started = Date.now();
    const dist = await request(app.getHttpServer())
      .post('/v1/policy-fabric/distribute')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ publishEvent: true, topic: 'ai-fabric-audit' })
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(dist.body.distribution.targets).toContain(peer.id);

    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          aiFabricBuses { id name status }
          policyFabricCapabilities { id status }
          agentFabricRoutes { kind }
        }`,
      })
      .expect(200);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.aiFabricBuses.length).toBeGreaterThan(5);
    expect(gql.body.data.policyFabricCapabilities.length).toBeGreaterThan(5);
  });
});
