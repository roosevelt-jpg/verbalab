import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { ACCENT_IDENTITY_SEEDS } from '../src/accents/accent-identity-seeds';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_aid_${name}_${Date.now()}_${Math.random()}`,
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

describe('Accent Identity Packs', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/accents/identity lists seeded identity packs', async () => {
    const res = await request(app.getHttpServer()).get('/v1/accents/identity').expect(200);
    expect(res.body.count).toBe(ACCENT_IDENTITY_SEEDS.length);
    expect(res.body.total).toBe(ACCENT_IDENTITY_SEEDS.length);
    expect(res.body.data.some((p: { id: string }) => p.id === 'gh-pidgin')).toBe(true);
    expect(res.body.data.some((p: { id: string }) => p.id === 'ng-pidgin')).toBe(true);
    expect(res.body.data.some((p: { id: string }) => p.id === 'ph-filipino-english')).toBe(true);
    expect(res.body.data.some((p: { id: string }) => p.id === 'za-township')).toBe(true);
    expect(res.body.data[0].identityProfile).toBeTruthy();
    expect(res.body.data[0].pronunciationMarkers.length).toBeGreaterThan(0);
    expect(res.body.data[0].samplePhrase).toBeTruthy();
  });

  it('GET /v1/accents/identity/:id returns one pack with demo meta', async () => {
    const res = await request(app.getHttpServer()).get('/v1/accents/identity/gh-pidgin').expect(200);
    expect(res.body.id).toBe('gh-pidgin');
    expect(res.body.countryLabel).toBe('Ghana');
    expect(res.body.echoModelDisplayName).toMatch(/Lugemi Echo Voice/);

    const demo = await request(app.getHttpServer())
      .get('/v1/accents/identity/gh-pidgin/demo')
      .expect(200);
    expect(demo.body.samplePhrase).toContain('Chale');
  });

  it('GET /v1/accents/identity?country=NG filters Nigeria packs', async () => {
    const res = await request(app.getHttpServer()).get('/v1/accents/identity?country=NG').expect(200);
    expect(res.body.count).toBeGreaterThanOrEqual(4);
    expect(res.body.data.every((p: { country: string }) => p.country === 'NG')).toBe(true);
  });

  it('GET /v1/dialects/identity lists dialect-linked packs', async () => {
    const res = await request(app.getHttpServer()).get('/v1/dialects/identity').expect(200);
    expect(res.body.count).toBeGreaterThan(10);
    expect(res.body.data.every((p: { dialectCode?: string }) => p.dialectCode)).toBe(true);
  });

  it('POST /v1/tts/synthesize accepts accentId for identity playback', async () => {
    const org = await seedOrg(prisma, 'aidtts');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'aid-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/tts/synthesize')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ accentId: 'ng-pidgin' })
      .expect(200);

    expect(res.headers['x-lugemi-accent-identity']).toBe('ng-pidgin');
    expect(res.headers['content-type']).toMatch(/audio/);
    expect(Number(res.headers['content-length'])).toBeGreaterThan(0);
  });
});
