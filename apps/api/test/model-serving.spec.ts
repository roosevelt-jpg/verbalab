import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_ms_${name}_${Date.now()}_${Math.random()}`,
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

describe('Model Serving (VL-206)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_MODEL_SERVING_MODE;
  const prevMax = process.env.LUGEMI_MODEL_SERVING_MAX_ACTIVE;

  beforeAll(async () => {
    process.env.LUGEMI_MODEL_SERVING_MODE = 'sandbox';
    process.env.LUGEMI_MODEL_SERVING_MAX_ACTIVE = '2';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_MODEL_SERVING_MODE;
    else process.env.LUGEMI_MODEL_SERVING_MODE = prevMode;
    if (prevMax === undefined) delete process.env.LUGEMI_MODEL_SERVING_MAX_ACTIVE;
    else process.env.LUGEMI_MODEL_SERVING_MAX_ACTIVE = prevMax;
    await app.close();
  });

  it('documents Model Serving honesty', () => {
    const doc = join(root, 'docs/MODEL_SERVING.md');
    const adr = join(root, 'docs/adr/0117-model-serving.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/vLLM|KServe|Triton/i);
    expect(text).toMatch(/does \*\*not\*\*|not a vLLM/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
    expect(text).toContain('VL-206');
    expect(text).toMatch(/Gateway/i);
  });

  it('exposes engine with honesty + kinds + endpoints', async () => {
    const res = await request(app.getHttpServer()).get('/v1/model-serving/engine').expect(200);
    expect(res.body.product).toContain('Model Serving');
    expect(res.body.honesty.vllmOs).toBe(false);
    expect(res.body.honesty.kserveOs).toBe(false);
    expect(res.body.honesty.tritonOs).toBe(false);
    expect(res.body.honesty.selfHostedGpuServingOs).toBe(false);
    expect(res.body.honesty.regeneratesAiGateway).toBe(false);
    expect(res.body.honesty.extendsAiGateway).toBe(true);
    expect(res.body.honesty.extendsModelRegistry).toBe(true);
    expect(res.body.honesty.sandboxDeploymentsOnly).toBe(true);
    expect(res.body.ceilings.maxActiveDeployments).toBe(2);
    expect(res.body.ceilings.mode).toBe('sandbox');

    const kinds = await request(app.getHttpServer()).get('/v1/model-serving/kinds').expect(200);
    const ids = kinds.body.kinds.map((k: { id: string }) => k.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'llm',
        'speech',
        'voice',
        'ocr',
        'embedding',
        'vision',
        'reasoning',
      ]),
    );
    expect(kinds.body.kinds.find((k: { id: string }) => k.id === 'vision').status).toBe(
      'deferred',
    );

    const modes = await request(app.getHttpServer()).get('/v1/model-serving/modes').expect(200);
    expect(modes.body.modes.some((m: { id: string }) => m.id === 'canary')).toBe(true);
    expect(modes.body.modes.find((m: { id: string }) => m.id === 'autoscaling').status).toBe(
      'deferred',
    );

    const endpoints = await request(app.getHttpServer())
      .get('/v1/model-serving/endpoints?kind=llm')
      .expect(200);
    expect(endpoints.body.endpoints.length).toBeGreaterThan(0);
    expect(endpoints.body.honesty.extendsAiGateway).toBe(true);
  });

  it('deploys canary, promotes, versions, rolls back, enforces ceiling', async () => {
    const org = await seedOrg(prisma, `ms_${Date.now()}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'ms-test',
    });

    const a1 = await request(app.getHttpServer())
      .post('/v1/model-serving/deployments')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kind: 'llm',
        modelSlug: 'vendor-chat-openai',
        version: 'v1',
        strategy: 'canary',
        trafficPercent: 10,
      })
      .expect(201);
    expect(a1.body.deployment.status).toBe('canary');
    expect(a1.body.deployment.trafficPercent).toBe(10);
    expect(a1.body.honesty.vllmOs).toBe(false);

    const promoted = await request(app.getHttpServer())
      .post(`/v1/model-serving/deployments/${a1.body.deployment.id}/promote`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(200);
    expect(promoted.body.deployment.status).toBe('active');
    expect(promoted.body.deployment.trafficPercent).toBe(100);

    const a2 = await request(app.getHttpServer())
      .post(`/v1/model-serving/deployments/${a1.body.deployment.id}/redeploy`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ version: 'v2', trafficPercent: 20 })
      .expect(201);
    expect(a2.body.deployment.version).toBe('v2');
    expect(a2.body.deployment.previousVersion).toBe('v1');

    // Ceiling = 2 active/canary (v1 active + v2 canary); third should 402
    const over = await request(app.getHttpServer())
      .post('/v1/model-serving/deployments')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        kind: 'embedding',
        modelSlug: 'vendor-embeddings-openai',
        version: 'v1',
        strategy: 'rolling',
      })
      .expect(402);
    expect(JSON.stringify(over.body)).toMatch(/ceiling|maxActive/i);

    const rolled = await request(app.getHttpServer())
      .post(`/v1/model-serving/deployments/${a2.body.deployment.id}/rollback`)
      .set('Authorization', `Bearer ${key.secret}`)
      .send({})
      .expect(200);
    expect(rolled.body.deployment.version).toBe('v1');
    expect(rolled.body.deployment.status).toBe('active');

    const mon = await request(app.getHttpServer())
      .get('/v1/model-serving/monitoring')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(mon.body.honesty.extendsAiGateway).toBe(true);
  });

  it('exposes modelServingEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ modelServingEngine { product vllmOs kserveOs regeneratesAiGateway extendsAiGateway extendsModelRegistry sandboxDeploymentsOnly orgWorkspaceScoped maxActiveDeployments servingMode capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.data.modelServingEngine.vllmOs).toBe(false);
    expect(res.body.data.modelServingEngine.kserveOs).toBe(false);
    expect(res.body.data.modelServingEngine.regeneratesAiGateway).toBe(false);
    expect(res.body.data.modelServingEngine.extendsAiGateway).toBe(true);
    expect(res.body.data.modelServingEngine.extendsModelRegistry).toBe(true);
    expect(res.body.data.modelServingEngine.sandboxDeploymentsOnly).toBe(true);
    expect(res.body.data.modelServingEngine.maxActiveDeployments).toBe(2);
  });
});
