import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FoundationModelCloudService } from '../src/foundation-model-cloud/foundation-model-cloud.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory) out.push(...walkTsFiles(full));
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
              clerkUserId: `clerk_fmc_${name}_${Date.now}_${Math.random}`,
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

describe('Foundation Model Cloud Foundation',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cloud: FoundationModelCloudService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    cloud = app.get(FoundationModelCloudService);
  });

  afterAll(async  => {
    await app.close;
  });

  it('documents Foundation Model Cloud honesty (no trained weights)',  => {
    const doc = join(root, 'docs/FOUNDATION_MODEL_CLOUD.md');
    const adr = join(root, 'docs/adr/0135-foundation-model-cloud-foundation.md');
    const readme = join(
      root,
      'docs/roadmap/volume9-foundation-model-cloud/README_VOLUME9.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/not.*trained competitive|no trained competitive/i);
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('');
    expect(text).toMatch(/MLOps/i);
    const readmeText = readFileSync(readme, 'utf8');
    expect(readmeText).toMatch(/cannot actually \*train\*|cannot actually train/i);
    expect(readmeText).toMatch(/102–104|Training Platform|Model Registry/i);
  });

  it('has no TODO/FIXME/implement-later markers in Foundation Model Cloud source',  => {
    const roots = [join(apiSrc, 'foundation-model-cloud')];
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const dir of roots) {
      if (!existsSync(dir)) continue;
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes public product catalog with honest architecture', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/foundation-model-cloud/products')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Foundation Model Cloud');
    expect(res.body.architecture.customerFacingProduct).toBe(true);
    expect(res.body.architecture.trainsCompetitiveFoundationWeights).toBe(false);
    expect(res.body.architecture.openAiReplacementOs).toBe(false);
    expect(res.body.architecture.regeneratesVolumes1to8).toBe(false);
    expect(res.body.architecture.hexagonalRewrite).toBe(false);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.architecture.extendsInferenceCloud).toBe(true);
    expect(res.body.architecture.extendsAiKernel).toBe(true);
    expect(res.body.honesty.trainsCompetitiveFoundationWeights).toBe(false);
    expect(res.body.honesty.shipsTrainedAtlasBaobabEtc).toBe(false);
    expect(res.body.honesty.mLOpsPlatformShipped).toBe(false);
    expect(res.body.safety.noFakeTrainedWeights).toBe(true);
    expect(res.body.docs).toBe('/docs/FOUNDATION_MODEL_CLOUD.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'foundation-model-cloud',
        'atlas',
        'baobab',
        'echo',
        'voice',
        'vision',
        'vector',
        'reason',
        'edge',
        'fusion',
        'translate',
        'model-training-platform',
        'model-evaluation-platform',
        'model-registry',
      ]),
    );

    const hub = res.body.products.find(
      (p: { id: string }) => p.id === 'foundation-model-cloud',
    );
    expect(hub.status).toBe('shipped');
    expect(hub.console).toBe('/foundation-model-cloud');

    const atlas = res.body.products.find((p: { id: string }) => p.id === 'atlas');
    expect(atlas.status).toBe('partial');
    expect(atlas.console).toBe('/atlas');

    const training = res.body.products.find(
      (p: { id: string }) => p.id === 'model-training-platform',
    );
    expect(training.status).toBe('partial');
    expect(training.console).toBe('/model-training-platform');

    const evaluation = res.body.products.find(
      (p: { id: string }) => p.id === 'model-evaluation-platform',
    );
    expect(evaluation.status).toBe('partial');
    expect(evaluation.console).toBe('/model-evaluation-platform');

    const registry = res.body.products.find((p: { id: string }) => p.id === 'model-registry');
    expect(registry.status).toBe('partial');
    expect(registry.console).toBe('/model-registry');
  });

  it('returns org overview with deferred families', async  => {
    const org = await seedOrg(prisma, `fmc_${Date.now}`);
    const overview = await cloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_fmc',
      role: 'owner',
    });
    expect(overview.usage.chat).toBeDefined;
    expect(overview.deferred.atlas).toBe(false);
    expect(overview.deferred.baobab).toBe(true);
    expect(overview.deferred.modelTrainingPlatform).toBe(false);
    expect(overview.deferred.modelEvaluationPlatform).toBe(false);
    expect(overview.deferred.modelRegistry).toBe(false);
    expect(overview.deferred.regeneratesVolumes1to8).toBe(false);
    expect(overview.honesty.trainsCompetitiveFoundationWeights).toBe(false);
    expect(overview.links.foundationModelCloud).toBe('/foundation-model-cloud');
    expect(overview.links.inferenceCloud).toBe('/inference-cloud');
    expect(overview.links.aiKernel).toBe('/ai-kernel');
    expect(overview.architecture.extendsInferenceCloud).toBe(true);
  });

  it('exposes foundationModelCloudProducts via GraphQL CQRS façade', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ foundationModelCloudProducts { id name status api console modality notes } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.foundationModelCloudProducts.length).toBeGreaterThan(10);
    expect(
      res.body.data.foundationModelCloudProducts.some(
        (r: { id: string }) => r.id === 'foundation-model-cloud',
      ),
    ).toBe(true);
  });

  it('serves engine and monitoring aliases', async  => {
    const engine = await request(app.getHttpServer)
      .get('/v1/foundation-model-cloud/engine')
      .expect(200);
    expect(engine.body.honesty.trainsCompetitiveFoundationWeights).toBe(false);

    const monitoring = await request(app.getHttpServer)
      .get('/v1/foundation-model-cloud/monitoring')
      .expect(200);
    expect(monitoring.body.mode).toBe('foundation');
    expect(monitoring.body.products.some((p: { id: string }) => p.id === 'atlas')).toBe(
      true,
    );
  });
});
