import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
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
              clerkUserId: `clerk_cb_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'ak' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Corridor Benchmarks (09_BENCHMARKS)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
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

  it('archives 09_BENCHMARKS brief and has no TODO markers', () => {
    expect(existsSync(join(root, 'docs/next-model-portfolio/09_BENCHMARKS.md'))).toBe(true);
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'corridor-benchmarks'))) {
      if (banned.test(readFileSync(file, 'utf8'))) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes comparison matrix and 14 integration cases with expected behaviors', async () => {
    const engine = await request(app.getHttpServer()).get('/v1/corridor-benchmarks/engine').expect(200);
    expect(engine.body.product).toBe('Lugemi Advantage Protocol');
    expect(engine.body.comparison_matrix.length).toBe(6);
    expect(engine.body.integration_cases).toHaveLength(14);
    expect(JSON.stringify(engine.body)).not.toMatch(/confidence_score|sota|outperform eleven/i);

    const cases = await request(app.getHttpServer())
      .get('/v1/corridor-benchmarks/integration-cases')
      .expect(200);
    expect(cases.body.cases).toHaveLength(14);
    for (const c of cases.body.cases) {
      expect(c.expected_behavior.length).toBeGreaterThan(20);
      expect(c.outcome).toBeTruthy();
    }
  });

  it('preregisters study, requires denominator when scoring errors, validates claims', async () => {
    const org = await seedOrg(prisma, 'cb');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'cb-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    await request(app.getHttpServer())
      .post('/v1/corridor-benchmarks/studies')
      .set(auth)
      .send({})
      .expect(400);

    const study = await request(app.getHttpServer())
      .post('/v1/corridor-benchmarks/studies')
      .set(auth)
      .send({
        primaryOutcome: 'Relative reduction in critical meaning errors at matched coverage',
      })
      .expect(201);
    expect(study.body.status).toBe('preregistered');
    expect(study.body.sets.blinded_final_test).toMatch(/^set_test_/);

    await request(app.getHttpServer())
      .post(`/v1/corridor-benchmarks/studies/${study.body.study_id}/score`)
      .set(auth)
      .send({ criticalMeaningErrors: 3 })
      .expect(400);

    const scored = await request(app.getHttpServer())
      .post(`/v1/corridor-benchmarks/studies/${study.body.study_id}/score`)
      .set(auth)
      .send({
        criticalMeaningErrors: 3,
        denominator: 500,
        modelId: 'lugemi-mix',
        comparatorConfig: 'lugemi-cascade-baseline',
        exclusions: ['hausa not evaluated'],
      })
      .expect(200);
    expect(scored.body.status).toBe('scored');
    expect(scored.body.score.dataset_split_hash).toBeTruthy();
    expect(scored.body.score.denominator).toBe(500);

    const badClaim = await request(app.getHttpServer())
      .post('/v1/corridor-benchmarks/claims/validate')
      .set(auth)
      .send({
        datasetVersion: 'x',
        corridorTask: 'twi',
        lugemiVersion: 'v1',
        definedError: 'err',
        measuredChange: 'better than ElevenLabs at everything',
        comparator: 'baseline',
        coverageLatencyCost: 'ok',
        testedDate: '2026-10-06',
        interval: 'ci',
        denominator: 10,
      })
      .expect(200);
    expect(badClaim.body.valid).toBe(false);
    expect(badClaim.body.banned_phrase_hits.length).toBeGreaterThan(0);

    const goodClaim = await request(app.getHttpServer())
      .post('/v1/corridor-benchmarks/claims/validate')
      .set(auth)
      .send({
        datasetVersion: 'pilot-holdout-1',
        corridorTask: 'twi-english mixed ASR critical meaning errors',
        lugemiVersion: 'lugemi-mix pilot-1',
        definedError: 'critical meaning errors',
        measuredChange: 'recorded held-out delta',
        comparator: 'lugemi-cascade-baseline',
        coverageLatencyCost: 'coverage 0.8',
        testedDate: '2026-10-06',
        interval: 'cluster-aware 95%',
        denominator: 500,
      })
      .expect(200);
    expect(goodClaim.body.valid).toBe(true);
    expect(goodClaim.body.formatted_claim).toContain('Denominator=500');
  });

  it('runs mandatory integration cases with concrete outcomes', async () => {
    const org = await seedOrg(prisma, 'cb2');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'cb2-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    for (const id of [
      'unsupported_language',
      'late_negation',
      'withdrawn_training_permission',
      'cloud_forbidden_mode',
      'unresolvable_visual_reference',
    ]) {
      const res = await request(app.getHttpServer())
        .post(`/v1/corridor-benchmarks/integration-cases/${id}/run`)
        .set(auth)
        .send({ simulatePass: true })
        .expect(200);
      expect(res.body.passed).toBe(true);
      expect(res.body.expected_behavior.length).toBeGreaterThan(20);
      expect(res.body.observed_outcome).toBeTruthy();
    }
  });

  it('lists data + benchmarks in portfolio engine', async () => {
    const res = await request(app.getHttpServer()).get('/v1/portfolio/engine').expect(200);
    const ids = res.body.pillars.map((p: { id: string }) => p.id);
    expect(ids).toContain('data_advantage');
    expect(ids).toContain('corridor_benchmarks');
    expect(res.body.links.dataAdvantage).toBe('/data-advantage');
    expect(res.body.links.corridorBenchmarks).toBe('/corridor-benchmarks');
  });
});
