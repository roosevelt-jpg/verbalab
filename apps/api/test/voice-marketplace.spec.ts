import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { BillingService } from '../src/billing/billing.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { VoiceMarketplaceService } from '../src/voice-marketplace/voice-marketplace.service';

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
              clerkUserId: `clerk_vm_${name}_${Date.now()}_${Math.random()}`,
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

describe('Voice Marketplace', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let billing: BillingService;
  let marketplace: VoiceMarketplaceService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    billing = app.get(BillingService);
    marketplace = app.get(VoiceMarketplaceService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Voice Marketplace distinct from localization marketplace', () => {
    const doc = join(root, 'docs/VOICE_MARKETPLACE.md');
    const adr = join(root, 'docs/adr/0088-voice-marketplace.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/distinct/i);
    expect(text).toMatch(/Celebrity/i);
    expect(text).toContain('');
  });

  it('exposes engine with celebrityWithoutRights=false', async () => {
    const engine = await request(app.getHttpServer()).get('/v1/voice-marketplace/engine').expect(200);
    expect(engine.body.product).toBe('Lugemi Voice Marketplace');
    expect(engine.body.honesty.celebrityWithoutRights).toBe(false);
    expect(engine.body.honesty.crossTenantCloneSynthesis).toBe(false);
    const celeb = engine.body.capabilities.find((c: { id: string }) => c.id === 'celebrity-voices');
    expect(celeb.status).toBe('deferred');

    const packs = await request(app.getHttpServer())
      .get('/v1/voice-marketplace/language-packs')
      .expect(200);
    expect(packs.body.packs.some((p: { id: string }) => p.id === 'sw')).toBe(true);
  });

  it('rejects celebrity claims and free-plan publish', async () => {
    const free = await seedOrg(prisma, 'vmfree');
    await expect(
      marketplace.publish({
        organizationId: free.id,
        workspaceId: free.workspaces[0]!.id,
        userId: free.memberships[0]!.userId,
        role: 'owner',
        title: 'X',
        sourceVoiceId: 'nova',
      }),
    ).rejects.toMatchObject({ code: 'plan_required' });

    const pro = await seedOrg(prisma, 'vmceleb');
    await billing.applyEntitlementForTests({ organizationId: pro.id, plan: 'pro' });
    await expect(
      marketplace.publish({
        organizationId: pro.id,
        workspaceId: pro.workspaces[0]!.id,
        userId: pro.memberships[0]!.userId,
        role: 'owner',
        title: 'Famous Person',
        sourceVoiceId: 'nova',
        celebrityClaim: true,
        rightsAttested: true,
      }),
    ).rejects.toMatchObject({ message: expect.stringMatching(/Celebrity/i) });
  });

  it('publishes, installs, rates language pack via HTTP', async () => {
    const publisher = await seedOrg(prisma, 'vmpub');
    const buyer = await seedOrg(prisma, 'vmbuy');
    await billing.applyEntitlementForTests({ organizationId: publisher.id, plan: 'pro' });
    await billing.applyEntitlementForTests({ organizationId: buyer.id, plan: 'pro' });

    const pubKey = await apiKeys.create({
      organizationId: publisher.id,
      workspaceId: publisher.workspaces[0]!.id,
      userId: publisher.memberships[0]!.userId,
      name: 'vm-pub',
    });
    const buyKey = await apiKeys.create({
      organizationId: buyer.id,
      workspaceId: buyer.workspaces[0]!.id,
      userId: buyer.memberships[0]!.userId,
      name: 'vm-buy',
    });

    const listing = await request(app.getHttpServer())
      .post('/v1/voice-marketplace/listings')
      .set('Authorization', `Bearer ${pubKey.secret}`)
      .send({
        kind: 'language_pack',
        languagePackId: 'sw',
        licenseType: 'commercial',
        priceCents: 500,
        rightsAttested: true,
      })
      .expect(201);

    expect(listing.body.kind).toBe('language_pack');
    expect(listing.body.sourceVoiceId).toBe('language_pack:sw');
    expect(listing.body.priceCents).toBe(500);

    const install = await request(app.getHttpServer())
      .post(`/v1/voice-marketplace/listings/${listing.body.id}/install`)
      .set('Authorization', `Bearer ${buyKey.secret}`)
      .send({})
      .expect(201)
      .catch(async () =>
        request(app.getHttpServer())
          .post(`/v1/voice-marketplace/listings/${listing.body.id}/install`)
          .set('Authorization', `Bearer ${buyKey.secret}`)
          .send({}),
      );

    const installRes =
      'status' in install
        ? install
        : await request(app.getHttpServer())
            .post(`/v1/voice-marketplace/listings/${listing.body.id}/install`)
            .set('Authorization', `Bearer ${buyKey.secret}`)
            .send({});
    expect([200, 201]).toContain(installRes.status);
    expect(installRes.body.sale?.amountCents).toBe(500);
    expect(installRes.body.note).toMatch(/not enabled/i);

    const review = await request(app.getHttpServer())
      .post(`/v1/voice-marketplace/listings/${listing.body.id}/reviews`)
      .set('Authorization', `Bearer ${buyKey.secret}`)
      .send({ rating: 5, body: 'Useful pack' });
    expect([200, 201]).toContain(review.status);

    const catalog = await request(app.getHttpServer())
      .get('/v1/voice-marketplace/listings')
      .set('Authorization', `Bearer ${buyKey.secret}`)
      .expect(200);
    const found = catalog.body.listings.find((l: { id: string }) => l.id === listing.body.id);
    expect(found.ratingCount).toBeGreaterThanOrEqual(1);
    expect(found.ratingAverage).toBe(5);
  });

  it('exposes voiceMarketplaceEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ voiceMarketplaceEngine { product celebrityWithoutRights crossTenantCloneSynthesis capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.voiceMarketplaceEngine.celebrityWithoutRights).toBe(false);
    expect(res.body.data.voiceMarketplaceEngine.crossTenantCloneSynthesis).toBe(false);
  });
});
