import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RegionsService } from '../src/regions/regions.service';
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
              clerkUserId: `clerk_reg_${name}_${Date.now()}_${Math.random()}`,
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

describe('Multi-region residency', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let regions: RegionsService;
  const prevRegion = process.env.LUGEMI_REGION;

  beforeAll(async () => {
    process.env.LUGEMI_REGION = 'us';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    regions = app.get(RegionsService);
  });

  afterAll(async () => {
    process.env.LUGEMI_REGION = prevRegion;
    await app.close();
  });

  it('ships separate EU Fly configs (not a mesh)', () => {
    expect(existsSync(join(root, 'infra/fly/api.eu.toml'))).toBe(true);
    expect(existsSync(join(root, 'infra/fly/web.eu.toml'))).toBe(true);
    const eu = readFileSync(join(root, 'infra/fly/api.eu.toml'), 'utf8');
    expect(eu).toContain("app = 'lugemi-api-eu'");
    expect(eu).toContain("primary_region = 'ams'");
    expect(eu).toContain("LUGEMI_REGION = 'eu'");
    expect(eu).toContain('fly-migrate.sh');
  });

  it('ships Africa jnb Fly configs for verbalab (not a mesh)', () => {
    expect(existsSync(join(root, 'Dockerfile'))).toBe(true);
    expect(existsSync(join(root, 'fly.toml'))).toBe(true);
    expect(existsSync(join(root, 'infra/fly/api.jnb.toml'))).toBe(true);
    expect(existsSync(join(root, 'infra/fly/web.jnb.toml'))).toBe(true);
    const af = readFileSync(join(root, 'infra/fly/api.jnb.toml'), 'utf8');
    expect(af).toContain("app = 'verbalab-api'");
    expect(af).toContain("primary_region = 'jnb'");
    expect(af).toContain("LUGEMI_REGION = 'af'");
    expect(af).toContain('fly-migrate.sh');
    const rootFly = readFileSync(join(root, 'fly.toml'), 'utf8');
    expect(rootFly).toContain("app = 'verbalab'");
    expect(rootFly).toContain("primary_region = 'jnb'");
    expect(rootFly).toContain('fly-migrate.sh');
    expect(existsSync(join(root, 'apps/api/scripts/fly-migrate.sh'))).toBe(true);
  });

  it('GET /v1/regions is public and health reports region', async () => {
    const regionsRes = await request(app.getHttpServer()).get('/v1/regions').expect(200);
    expect(regionsRes.body.currentRegion).toBe('us');
    expect(regionsRes.body.regions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'us' }),
        expect.objectContaining({ code: 'eu', flyRegion: 'ams' }),
        expect.objectContaining({ code: 'af', flyRegion: 'jnb' }),
      ]),
    );

    const health = await request(app.getHttpServer()).get('/health').expect(200);
    expect(health.body.region).toBe('us');
    expect(health.headers['x-lugemi-region']).toBe('us');
  });

  it('pins org residency and rejects mismatched deploy', async () => {
    const org = await seedOrg(prisma, `regpin_${Date.now()}`);
    const set = await regions.setOrgResidency({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      dataRegion: 'eu',
    });
    expect(set.dataRegion).toBe('eu');
    expect(set.matchesCurrentDeploy).toBe(false);

    await expect(regions.assertOrgMatchesDeploy(org.id)).rejects.toMatchObject({
      code: 'residency_mismatch',
    });

    await regions.setOrgResidency({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      dataRegion: 'us',
    });
    await expect(regions.assertOrgMatchesDeploy(org.id)).resolves.toBeUndefined();
  });
});
