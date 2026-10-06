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

describe('Organization Control',  => {
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
    expect(existsSync(join(root, 'docs/adr/0217-organization-control.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ORGANIZATION_CONTROL.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'organization-control');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/organization-control/engine')
      .expect(200);
    expect(res.body.product).toBeTruthy;
    expect(res.body.honesty.leastPrivilegeRequired).toBe(true);
    expect(res.body.honesty.executesInference).toBe(false);

    expect(res.body.honesty.leastPrivilegeRequired).toBe(true);
    expect(res.body.honesty.controlPlaneAdminNotDefault).toBe(true);
    expect(res.body.roles.some((r: { id: string; isDefault: boolean }) => r.id === 'control_plane_admin' && r.isDefault === false)).toBe(true);
    expect(res.body.roles.some((r: { id: string; isDefault: boolean }) => r.id === 'viewer' && r.isDefault === true)).toBe(true);

    const roles = await request(app.getHttpServer)
      .get('/v1/organization-control/roles')
      .expect(200);
    expect(roles.body.leastPrivilegeRequired).toBe(true);
    expect(roles.body.controlPlaneAdminNotDefault).toBe(true);
    expect(roles.body.defaultRole).toBe('viewer');

  });

  it('exposes monitoring', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/organization-control/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy;
  });
});
