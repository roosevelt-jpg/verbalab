import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModelTrainingPlatformService } from '../src/model-training-platform/model-training-platform.service';
import { ModelEvaluationPlatformService } from '../src/model-evaluation-platform/model-evaluation-platform.service';
import { ModelRegistryService } from '../src/model-registry/model-registry.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory) {
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
              clerkUserId: `clerk_fmcaudit_${name}_${Date.now}_${Math.random}`,
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

describe('Foundation Model Cloud Production Audit',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let training: ModelTrainingPlatformService;
  let evaluation: ModelEvaluationPlatformService;
  let registry: ModelRegistryService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
    prisma = app.get(PrismaService);
    training = app.get(ModelTrainingPlatformService);
    evaluation = app.get(ModelEvaluationPlatformService);
    registry = app.get(ModelRegistryService);
  }, 120_000);

  afterAll(async  => {
    await app.close;
  });

  it('ships audit ADR and report pack',  => {
    expect(existsSync(join(root, 'docs/adr/0139-foundation-model-cloud-production-audit.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/foundation-model-cloud-audit/PRODUCTION_READINESS.md')),
    ).toBe(true);
    expect(
      existsSync(join(root, 'docs/foundation-model-cloud-audit/ARCHITECTURE_REPORT.md')),
    ).toBe(true);
    expect(existsSync(join(root, 'docs/foundation-model-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/foundation-model-cloud-audit/COVERAGE_REPORT.md'))).toBe(
      true,
    );
    expect(existsSync(join(root, 'docs/foundation-model-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(
      true,
    );
    expect(
      existsSync(join(root, 'docs/foundation-model-cloud-audit/FMC_READINESS_REPORT.md')),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/foundation-model-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/not.*frontier|Rejected/i);
    expect(readiness).toContain('bounded');
    expect(readiness).toMatch(/trainsCompetitiveFoundationWeights|trained competitive/i);
    expect(readiness).toMatch(/AI Fabric|Volume 10/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0139-foundation-model-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/review gate|checklist/i);
    expect(adr).toMatch(/AI Fabric/i);
    expect(adr).toMatch(/do not implement|Rejected|not implement/i);
  });

  it('has no TODO/FIXME/implement-later markers in Foundation Model Cloud source trees',  => {
    const roots = [
      join(apiSrc, 'foundation-model-cloud'),
      join(apiSrc, 'model-training-platform'),
      join(apiSrc, 'model-evaluation-platform'),
      join(apiSrc, 'model-registry'),
    ];
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

  it('exposes integrated FMC + MLOps catalogs', async  => {
    const paths = [
      '/v1/foundation-model-cloud/products',
      '/v1/foundation-model-cloud/engine',
      '/v1/foundation-model-cloud/monitoring',
      '/v1/model-training-platform/engine',
      '/v1/model-training-platform/methods',
      '/v1/model-evaluation-platform/engine',
      '/v1/model-evaluation-platform/suites',
      '/v1/model-registry/engine',
      '/v1/model-registry/capabilities',
      '/v1/model-registry/cards',
      '/v1/models/live',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer).get(path).expect(200);
      expect(res.body).toBeTruthy;
    }

    const products = await request(app.getHttpServer)
      .get('/v1/foundation-model-cloud/products')
      .expect(200);
    expect(products.body.honesty.trainsCompetitiveFoundationWeights).toBe(false);
    expect(products.body.honesty.openAiReplacementOs).toBe(false);
    const byId = Object.fromEntries(
      products.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    expect(byId['foundation-model-cloud']).toBe('shipped');
    expect(byId['model-training-platform']).toBe('partial');
    expect(byId['model-evaluation-platform']).toBe('partial');
    expect(byId['model-registry']).toBe('partial');
    expect(byId.atlas).toBe('partial');
  });

  it('rejects unauthenticated sensitive FMC routes', async  => {
    const paths = [
      '/v1/foundation-model-cloud/overview',
      '/v1/model-training-platform/overview',
      '/v1/model-training-platform/experiments',
      '/v1/model-evaluation-platform/overview',
      '/v1/model-evaluation-platform/runs',
      '/v1/model-registry/overview',
      '/v1/model-registry/versions',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer).get(path);
      expect([401, 403, 503]).toContain(res.status);
    }
  });

  it('exercises Training / Evaluation / Registry operational paths', async  => {
    const org = await seedOrg(prisma, 'fmc');
    const session = {
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_fmca',
      role: 'owner',
    };

    const experiment = training.createExperiment(session, {
      method: 'lora',
      name: 'audit-lora',
    });
    const launched = training.launchExperiment(session, experiment.experiment.id);
    expect(launched.handoff.api).toBe('POST /v1/training-jobs');
    expect(launched.honesty.trainsCompetitiveFoundationWeights).toBe(false);

    const evalRun = evaluation.createRun(session, { suite: 'safety', label: 'audit-safety' });
    expect(evalRun.run.status).toBe('completed');
    expect(evalRun.honesty.sotaClaimsForbidden).toBe(true);

    const version = registry.createVersion(session, {
      modelSlug: 'google-translate',
      version: 'audit-1',
    });
    registry.approveVersion(session, version.version.id);
    const deploy = registry.createDeployment(session, {
      versionId: version.version.id,
      strategy: 'canary',
      canaryPercent: 5,
    });
    expect(deploy.honesty.trafficMeshOs).toBe(false);
    expect(deploy.handoff.console).toBe('/model-serving');
  });

  it('exposes FMC GraphQL façades', async  => {
    const queries = [
      '{ foundationModelCloudProducts { id name status } }',
      '{ modelTrainingMethods { id name launchable } }',
      '{ modelEvaluationSuites { id name runnable } }',
      '{ modelRegistryCapabilities { id name status } }',
    ];
    for (const query of queries) {
      const res = await request(app.getHttpServer).post('/graphql').send({ query }).expect(200);
      expect(res.body.errors).toBeUndefined;
    }
  });

  it('keeps serving/monitoring operational via existing surfaces', async  => {
    const serving = await request(app.getHttpServer)
      .get('/v1/model-serving/engine')
      .expect(200);
    expect(serving.body).toBeTruthy;

    const monitoring = await request(app.getHttpServer)
      .get('/v1/foundation-model-cloud/monitoring')
      .expect(200);
    expect(monitoring.body.mode).toBe('foundation');
    expect(
      monitoring.body.products.some(
        (p: { id: string; status: string }) =>
          p.id === 'model-training-platform' && p.status === 'partial',
      ),
    ).toBe(true);
  });
});
