import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
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

describe('Financial Intelligence (VL-266)', () => {
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

  it('documents Financial Intelligence + ADR', () => {
    expect(existsSync(join(root, 'docs/FINANCIAL_INTELLIGENCE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0168-financial-intelligence.md'))).toBe(true);
    const text = readFileSync(join(root, 'docs/FINANCIAL_INTELLIGENCE.md'), 'utf8');
    expect(text).toContain('VL-266');
  });

  it('has no TODO/FIXME/implement-later markers', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'financial-intelligence'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/financial-intelligence/engine')
      .expect(200);
    expect(res.body.product).toBe('VerbaLab Financial Intelligence');

    expect(res.body.honesty.notInvestmentAdvice).toBe(true);
    expect(res.body.honesty.fairLendingConsiderationsFlagged).toBe(true);

  });
});
