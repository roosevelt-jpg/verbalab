import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { LocalesService } from '../src/locales/locales.service';
import { formatLocaleCurrency, formatLocaleDate, formatLocaleNumber } from '../src/locales/locale-format';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_loc_${name}_${Date.now}_${Math.random}`,
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

describe('Locale packs',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let locales: LocalesService;
  let lastText: string | null;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    locales = app.get(LocalesService);
    lastText = null;

    app.get(GatewayService).setProviderForTests({
      name: 'fixture_locale',
      async translate(input) {
        lastText = input.text;
        return {
          text: input.text.replace(/Nairobi/gi, 'MUTATED_CITY'),
          source: input.source,
          target: input.target,
          provider: 'fixture_locale',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async  => {
    await app.close;
  });

  it('formats dates/numbers/currency via Intl helpers',  => {
    expect(formatLocaleDate('2026-09-07T12:00:00.000Z', 'en-US')).toMatch(/2026|September|9/);
    expect(formatLocaleNumber(1234.5, 'fr-FR')).toMatch(/1/);
    expect(formatLocaleCurrency(10, 'sw-TZ', 'TZS')).toMatch(/10|TZS|TSh/i);
  });

  it('GET /v1/locales lists seeded packs including sw/yo/am', async  => {
    const res = await request(app.getHttpServer).get('/v1/locales').expect(200);
    const codes = res.body.data.map((p: { languageCode: string }) => p.languageCode);
    expect(codes).toEqual(expect.arrayContaining(['en', 'fr', 'sw', 'yo', 'am']));
    const sw = res.body.data.find((p: { languageCode: string }) => p.languageCode === 'sw');
    expect(sw.currencyCode).toBe('TZS');
    expect(sw.doNotTranslate).toContain('Nairobi');
  });

  it('GET /v1/locales/:code/examples returns Intl samples', async  => {
    const res = await request(app.getHttpServer).get('/v1/locales/am/examples').expect(200);
    expect(res.body.bcp47).toBe('am-ET');
    expect(res.body.currency).toBeTruthy;
  });

  it('protects locale do-not-translate entities during translate', async  => {
    const org = await seedOrg(prisma, `lprot_${Date.now}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'locale-protect',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Visit Nairobi tomorrow', source: 'en', target: 'sw' })
      .expect(200);

    expect(lastText).toMatch(/⟦VL/);
    expect(res.body.text).toContain('Nairobi');
    expect(res.body.text).not.toContain('MUTATED_CITY');
    expect(res.body.localeEntitiesProtected).toBeGreaterThan(0);

    const swTerms = await locales.doNotTranslateTerms('sw');
    expect(swTerms.some((t) => t.sourceTerm === 'Nairobi')).toBe(true);
  });
});
