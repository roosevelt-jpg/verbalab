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
import { GatewayService } from '../src/gateway/gateway.service';
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
              clerkUserId: `clerk_l10n_${name}_${Date.now()}_${Math.random()}`,
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

describe('Localization Platform Phase 9 (VL-141)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    app.get(GatewayService).setProviderForTests({
      name: 'fixture',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
    const org = await seedOrg(prisma, 'l10n');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'l10n-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships ADR and docs', () => {
    expect(existsSync(join(root, 'docs/adr/0062-localization-platform-phase-9.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/LOCALIZATION.md'), 'utf8')).toContain('/v1/localize/qa');
  });

  it('exposes platform catalog with deferred websites', async () => {
    const res = await request(app.getHttpServer()).get('/v1/localization').expect(200);
    expect(res.body.product).toMatch(/Localization/i);
    expect(res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'websites' && c.status === 'deferred')).toBe(
      true,
    );
    expect(res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'localization_qa' && c.status === 'shipped')).toBe(
      true,
    );
  });

  it('validates and formats ICU plurals', async () => {
    const message = '{count, plural, one {# item} other {# items}}';
    const v = await request(app.getHttpServer())
      .post('/v1/icu/validate')
      .send({ message })
      .expect(200);
    expect(v.body.valid).toBe(true);
    expect(v.body.hasPlural).toBe(true);

    const f = await request(app.getHttpServer())
      .post('/v1/icu/format')
      .send({ message, locale: 'en', values: { count: 3 } })
      .expect(200);
    expect(f.body.formatted).toBe('3 items');
  });

  it('runs localization QA', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/localize/qa')
      .send({
        format: 'json',
        sourceContent: { a: 'Hello', b: '{n}' },
        targetContent: { a: 'Habari' },
      })
      .expect(200);
    expect(res.body.passed).toBe(false);
    expect(res.body.issues.some((i: { code: string }) => i.code === 'missing_key')).toBe(true);
  });

  it('returns RTL layout metadata', async () => {
    const res = await request(app.getHttpServer()).get('/v1/locales/ar/layout').expect(200);
    expect(res.body.rtl).toBe(true);
    expect(res.body.dir).toBe('rtl');
  });

  it('formats with timezone', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/locales/format')
      .send({
        code: 'en',
        date: '2026-09-07T12:00:00.000Z',
        timeZone: 'Africa/Johannesburg',
        number: 1000,
        currencyValue: 12.5,
      })
      .expect(200);
    expect(res.body.dateTime).toBeTruthy();
    expect(res.body.currency).toBeTruthy();
  });

  it('exposes GraphQL localizationPlatform', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ localizationPlatform { product shippedCount } }' })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.localizationPlatform.shippedCount).toBeGreaterThan(3);
  });

  it('localizes via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `mutation($input: LocalizeInput!) {
          localize(input: $input) { format strings translated serialized }
        }`,
        variables: {
          input: {
            content: JSON.stringify({ hi: 'Hello' }),
            source: 'en',
            target: 'sw',
            format: 'json',
          },
        },
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.localize.serialized).toContain('[sw]');
  });
});
