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

describe('Enterprise Engineering System',  => {
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

  it('ships ADR and product doc',  => {
    expect(existsSync(join(root, 'docs/adr/0246-enterprise-engineering-system.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ENTERPRISE_ENGINEERING_SYSTEM.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'enterprise-engineering-system');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/enterprise-engineering-system/products')
      .expect(200);
    expect(res.body.product).toBeTruthy;
    expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);

    expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);
    expect(res.body.honesty.customerFacingProductCloud).toBe(false);
    expect(res.body.honesty.architectureKnowledgeBaseOs).toBe(false);
    expect(res.body.honesty.adrFactoryOs).toBe(false);
    expect(res.body.honesty.jiraOs).toBe(false);
    expect(res.body.honesty.confluenceOs).toBe(false);
    expect(res.body.honesty.sonarqubeOs).toBe(false);
    expect(res.body.products.length).toBeGreaterThan(8);
    expect(res.body.hubInventory.length).toBeGreaterThan(5);
    expect(res.body.extendsSurfaces.length).toBeGreaterThan(3);
    for (const row of res.body.hubInventory) {
      expect(row.engineeringOsForHumansAndCursor).toBe(true);
      expect(row.customerFacingProductCloud).toBe(false);
      expect(row.adrFactoryOs).toBe(false);
      expect(row.architectureKnowledgeBaseOs).toBe(false);
      expect(Array.isArray(row.routesTo)).toBe(true);
      expect(row.routesTo.length).toBeGreaterThan(0);
    }

  });

  it('exposes monitoring', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/enterprise-engineering-system/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy;
  });

  it('rejects unauthenticated overview (auth smoke)', async  => {
    const res = await request(app.getHttpServer).get('/v1/enterprise-engineering-system/overview');
    expect([401, 403, 503]).toContain(res.status);
  });
});
