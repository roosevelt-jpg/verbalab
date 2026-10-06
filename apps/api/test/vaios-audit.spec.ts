import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

const VOLUME19_HUBS = ["vaios", "ai-scheduler", "runtime-manager", "resource-manager", "workflow-operating-system", "agent-operating-system", "ai-memory-operating-system", "knowledge-operating-system", "plugin-operating-system"];
const ORCH_HUBS = ["ai-scheduler", "runtime-manager", "resource-manager", "workflow-operating-system", "agent-operating-system", "ai-memory-operating-system", "knowledge-operating-system", "plugin-operating-system"];

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...walkTsFiles(p));
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

describe('VAIOS Production Audit', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit pack ', () => {
    expect(existsSync(join(root, 'docs/adr/0245-vaios-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/VAIOS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/ARCHITECTURE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/PERFORMANCE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/COVERAGE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/DEPLOYMENT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/VAIOS_READINESS_REPORT.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers across Volume 19 hubs', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const slug of VOLUME19_HUBS) {
      const dir = join(apiSrc, slug);
      if (!existsSync(dir)) {
        hits.push(`missing:${slug}`);
        continue;
      }
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('foundation catalogs all shipped products', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/vaios/products')
      .expect(200);
    expect(res.body.honesty.unifyingOrchestrationLayer).toBe(true);
    expect(res.body.honesty.duplicatesKernelOrFabric).toBe(false);
    expect(res.body.honesty.notLinux).toBe(true);
    expect(res.body.honesty.notKubernetes).toBe(true);
    expect(res.body.honesty.enterpriseEngineeringSystemOs).toBe(false);
    const ids = res.body.products.map((p: { id: string }) => p.id);
    for (const slug of ORCH_HUBS) {
      expect(ids).toContain(slug);
    }
    expect(ids).toContain('vaios');
  });

  it('each hub is unifyingOrchestrationLayer with non-empty routesTo', async () => {
    for (const slug of ORCH_HUBS) {
      const res = await request(app.getHttpServer())
        .get(`/v1/${slug}/engine`)
        .expect(200);
      expect(res.body.honesty.unifyingOrchestrationLayer).toBe(true);
      expect(res.body.honesty.duplicatesKernelOrFabric).toBe(false);
      expect(res.body.honesty.notLinux).toBe(true);
      expect(res.body.honesty.notKubernetes).toBe(true);
      expect(res.body.honesty.literalOsKernel).toBe(false);
      expect(res.body.routesTo.length).toBeGreaterThan(0);
    }
  });

  it('rejects third parallel agent/workflow/memory implementation', () => {
    const bannedImpl = /class AgentExecutor|new WorkflowEngine|Mem0Client|createSandboxVm|linuxSyscallTable/i;
    const hits: string[] = [];
    for (const slug of ORCH_HUBS) {
      for (const file of walkTsFiles(join(apiSrc, slug))) {
        if (bannedImpl.test(readFileSync(file, 'utf8'))) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
    const readiness = readFileSync(
      join(root, 'docs/vaios-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/third parallel|Rejected inventions/i);
  });

  it('rejects Enterprise Engineering System invention', () => {
    const readiness = readFileSync(
      join(root, 'docs/vaios-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/enterpriseEngineeringSystemOs=false|Enterprise Engineering System/i);
    const adr = readFileSync(
      join(root, 'docs/adr/0245-vaios-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/enterpriseEngineeringSystemOs=false|Enterprise Engineering System/i);
    const foundation = readFileSync(join(apiSrc, 'vaios/vaios.catalog.ts'), 'utf8');
    expect(foundation).toMatch(/enterpriseEngineeringSystemOs:\s*false/);
  });

  it('resource manager GPU budget honesty', async () => {
    const res = await request(app.getHttpServer()).get('/v1/resource-manager/engine').expect(200);
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.kubernetesResourceOs).toBe(false);
  });

  it('auth smoke on overview', async () => {
    const res = await request(app.getHttpServer()).get('/v1/vaios/overview');
    expect([401, 403, 503]).toContain(res.status);
  });

  it('GraphQL honesty fields', async () => {
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          vaiosProducts { id name status }
          aiSchedulerEngine { product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }
          runtimeManagerEngine { product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }
          resourceManagerEngine { product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }
          workflowOperatingSystemEngine { product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }
          agentOperatingSystemEngine { product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }
          aiMemoryOperatingSystemEngine { product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }
          knowledgeOperatingSystemEngine { product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }
          pluginOperatingSystemEngine { product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }
        }`,
      })
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.vaiosProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.aiSchedulerEngine.unifyingOrchestrationLayer).toBe(true);
    expect(gql.body.data.aiSchedulerEngine.duplicatesKernelOrFabric).toBe(false);
    expect(gql.body.data.agentOperatingSystemEngine.notLinux).toBe(true);
    expect(gql.body.data.pluginOperatingSystemEngine.notKubernetes).toBe(true);
    expect(gql.body.data.resourceManagerEngine.enterpriseEngineeringSystemOs).toBe(false);
  });

  it('documents VAIOS in CLOUD_BLUEPRINT', () => {
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/VAIOS/);
    expect(blueprint).toMatch(/);
  });
});
