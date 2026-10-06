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

const VOLUME18_HUBS = ["data-plane-cloud", "translation-runtime", "speech-runtime", "voice-runtime", "vision-runtime", "knowledge-runtime", "embedding-runtime", "data-plane-streaming", "gpu-runtime"];
const RUNTIME_HUBS = ["translation-runtime", "speech-runtime", "voice-runtime", "vision-runtime", "knowledge-runtime", "embedding-runtime", "data-plane-streaming", "gpu-runtime"];

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...walkTsFiles(p));
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

describe('Data Plane Cloud Production Audit',  => {
  let app: INestApplication<App>;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
  }, 120_000);

  afterAll(async  => {
    await app.close;
  });

  it('ships audit pack and ADR-0235',  => {
    expect(existsSync(join(root, 'docs/adr/0235-data-plane-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/DATA_PLANE_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/data-plane-cloud-audit/DATA_PLANE_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);
  });

  it('has no TODO/FIXME markers across Volume 18 hubs',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const slug of VOLUME18_HUBS) {
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

  it('foundation catalogs all shipped products', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/data-plane-cloud/products')
      .expect(200);
    expect(res.body.honesty.managesOrgsPoliciesBilling).toBe(false);
    expect(res.body.honesty.serviceMeshOs).toBe(false);
    const ids = res.body.products.map((p: { id: string }) => p.id);
    for (const slug of RUNTIME_HUBS) {
      expect(ids).toContain(slug);
    }
    expect(ids).toContain('data-plane-cloud');
  });

  it('each runtime is a thinExecutionLayer with routesTo', async  => {
    for (const slug of RUNTIME_HUBS) {
      const res = await request(app.getHttpServer)
        .get(`/v1/${slug}/engine`)
        .expect(200);
      expect(res.body.honesty.thinExecutionLayer).toBe(true);
      expect(res.body.honesty.duplicatesProductLogic).toBe(false);
      expect(res.body.honesty.managesOrgsPoliciesBilling).toBe(false);
      expect(res.body.routesTo.length).toBeGreaterThan(0);
    }
  });

  it('spot-checks runtimes do not contain full MT/STT implementations',  => {
    const bannedImpl = /class TranslateService|decodeAudioBuffer|whisperTranscribe|tesseractRecognize|neuralTtsEngine|buildRagIndex/i;
    const hits: string[] = [];
    for (const slug of RUNTIME_HUBS) {
      for (const file of walkTsFiles(join(apiSrc, slug))) {
        if (bannedImpl.test(readFileSync(file, 'utf8'))) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('does not create a second streaming-runtime module under data plane',  => {
    expect(existsSync(join(apiSrc, 'data-plane-streaming'))).toBe(true);
    // Volume 7 module remains the sole streaming-runtime implementation directory name for product logic
    expect(existsSync(join(apiSrc, 'streaming-runtime'))).toBe(true);
    const facade = readFileSync(join(apiSrc, 'data-plane-streaming/data-plane-streaming.catalog.ts'), 'utf8');
    expect(facade).toMatch(/extendsStreamingRuntime:\s*true/);
    expect(facade).toMatch(/streaming-runtime/);
  });

  it('GPU budget honesty', async  => {
    const res = await request(app.getHttpServer).get('/v1/gpu-runtime/engine').expect(200);
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.rayOs).toBe(false);
    expect(res.body.honesty.kubernetesGpuOs).toBe(false);
  });

  it('auth smoke on overview', async  => {
    const res = await request(app.getHttpServer).get('/v1/data-plane-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });

  it('GraphQL honesty fields', async  => {
    const started = Date.now;
    const gql = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: `{
          dataPlaneCloudProducts { id name status }
          translationRuntimeEngine { product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }
          speechRuntimeEngine { product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }
          voiceRuntimeEngine { product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }
          visionRuntimeEngine { product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }
          knowledgeRuntimeEngine { product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }
          embeddingRuntimeEngine { product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }
          dataPlaneStreamingEngine { product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }
          gpuRuntimeEngine { product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }
        }`,
      })
      .expect(200);
    expect(Date.now - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined;
    expect(gql.body.data.dataPlaneCloudProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.translationRuntimeEngine.thinExecutionLayer).toBe(true);
    expect(gql.body.data.translationRuntimeEngine.duplicatesProductLogic).toBe(false);
    expect(gql.body.data.gpuRuntimeEngine.managesOrgsPoliciesBilling).toBe(false);
    expect(gql.body.data.dataPlaneStreamingEngine.serviceMeshOs).toBe(false);
  });

  it('rejects inventing Service Mesh / VAIOS in this volume',  => {
    const readiness = readFileSync(
      join(root, 'docs/data-plane-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/serviceMeshOs=false|Service Mesh.*rejected|Rejected/i);
    const adr = readFileSync(
      join(root, 'docs/adr/0235-data-plane-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/serviceMeshOs=false|reject Service Mesh|VAIOS/i);
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Data Plane/);
  });
});
