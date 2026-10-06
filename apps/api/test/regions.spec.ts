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

describe('Multi-region residency (VL-075)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let regions: RegionsService;
  const prevRegion = process.env.VERBALAB_REGION;

  beforeAll(async () => {
    process.env.VERBALAB_REGION = 'us';
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
    process.env.VERBALAB_REGION = prevRegion;
    await app.close();
  });

  it('ships separate EU Fly configs (not a mesh)', () => {
    expect(existsSync(join(root, 'infra/fly/api.eu.toml'))).toBe(true);
    expect(existsSync(join(root, 'infra/fly/web.eu.toml'))).toBe(true);
    const eu = readFileSync(join(root, 'infra/fly/api.eu.toml'), 'utf8');
    expect(eu).toContain("app = 'verbalab-api-eu'");
    expect(eu).toContain("primary_region = 'ams'");
    expect(eu).toContain("VERBALAB_REGION = 'eu'");
    expect(eu).toContain('prisma migrate deploy');
  });

  it('GET /v1/regions is public and health reports region', async () => {
    const regionsRes = await request(app.getHttpServer()).get('/v1/regions').expect(200);
    expect(regionsRes.body.currentRegion).toBe('us');
    expect(regionsRes.body.regions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'us' }),
        expect.objectContaining({ code: 'eu', flyRegion: 'ams' }),
      ]),
    );

    const health = await request(app.getHttpServer()).get('/health').expect(200);
    expect(health.body.region).toBe('us');
    expect(health.headers['x-verbalab-region']).toBe('us');
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
