import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModelRegistryService } from '../src/model-registry/model-registry.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkTsFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
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
              clerkUserId: `clerk_mr_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Model Registry hub', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let registry: ModelRegistryService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    registry = app.get(ModelRegistryService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents registry honesty (no MLflow / traffic mesh)', () => {
    const doc = join(root, 'docs/MODEL_REGISTRY.md');
    const adr = join(root, 'docs/adr/0138-model-registry-hub.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/models\/live/i);
    expect(text).toMatch(/MLflow|trafficMesh/i);
    expect(text).toContain('CQRS');
  });

  it('has no TODO/FIXME/implement-later markers in Model Registry source', () => {
    const roots = [join(apiSrc, 'model-registry')];
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const dir of roots) {
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes public engine with honest capabilities + bridge', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/model-registry/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Model Registry');
    expect(res.body.honesty.mlflowOs).toBe(false);
    expect(res.body.honesty.trafficMeshOs).toBe(false);
    expect(res.body.honesty.regeneratesVl110).toBe(false);
    expect(res.body.architecture.extendsVl110).toBe(true);
    expect(res.body.liveSummary.featureCount).toBeGreaterThan(0);
    expect(res.body.docs).toBe('/docs/MODEL_REGISTRY.md');

    const cards = await request(app.getHttpServer())
      .get('/v1/model-registry/cards')
      .expect(200);
    expect(cards.body.cards.length).toBeGreaterThan(0);
    expect(cards.body.cards[0].card.limitations).toMatch(/not a full Model Cards/i);
  });

  it('versions, approvals, canary deploy plan, and rollback', async () => {
    const org = await seedOrg(prisma, `mr_${Date.now()}`);
    const session = {
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_mr',
      role: 'owner',
    };

    const v1 = registry.createVersion(session, {
      modelSlug: 'google-translate',
      version: 'v1',
    });
    expect(v1.version.status).toBe('pending_approval');
    registry.approveVersion(session, v1.version.id);

    const deploy = registry.createDeployment(session, {
      versionId: v1.version.id,
      strategy: 'canary',
      canaryPercent: 10,
    });
    expect(deploy.deployment.strategy).toBe('canary');
    expect(deploy.deployment.canaryPercent).toBe(10);
    expect(deploy.handoff.console).toBe('/model-serving');
    expect(deploy.honesty.trafficMeshOs).toBe(false);

    const v2 = registry.createVersion(session, {
      modelSlug: 'google-translate',
      version: 'v2',
    });
    registry.approveVersion(session, v2.version.id);
    registry.createDeployment(session, {
      versionId: v2.version.id,
      strategy: 'direct',
    });

    const rb = registry.rollbackVersion(session, v2.version.id);
    expect(rb.rolledBack.status).toBe('rolled_back');
    expect(rb.active.id).toBe(v1.version.id);
    expect(rb.active.status).toBe('active');
  });

  it('exposes modelRegistryCapabilities via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ modelRegistryCapabilities { id name status api notes } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.modelRegistryCapabilities.length).toBeGreaterThan(5);
    expect(
      res.body.data.modelRegistryCapabilities.some(
        (c: { id: string }) => c.id === 'model-cards',
      ),
    ).toBe(true);
  });
});
