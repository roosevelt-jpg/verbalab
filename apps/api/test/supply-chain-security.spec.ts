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

describe('Supply Chain Security',  => {
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
    expect(existsSync(join(root, 'docs/adr/0212-supply-chain-security.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/SUPPLY_CHAIN_SECURITY.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'supply-chain-security');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/supply-chain-security/engine')
      .expect(200);
    expect(res.body.product).toBeTruthy;
    expect(res.body.honesty.snykOs).toBe(false);

    expect(res.body.honesty.snykOs).toBe(false);
    expect(res.body.honesty.fullVulnDb).toBe(false);
    expect(res.body.findings.length).toBeGreaterThan(0);

    const scan = await request(app.getHttpServer)
      .get('/v1/supply-chain-security/scan')
      .expect(200);
    expect(scan.body.packages.length).toBeGreaterThan(0);
    expect(scan.body.findings.length).toBeGreaterThan(0);
    expect(scan.body.honesty.snykOs).toBe(false);

    const findings = await request(app.getHttpServer)
      .get('/v1/supply-chain-security/findings')
      .expect(200);
    expect(findings.body.findings.length).toBeGreaterThan(0);

  });

  it('exposes monitoring', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/supply-chain-security/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy;
  });
});
