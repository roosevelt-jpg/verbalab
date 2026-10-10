import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
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
              clerkUserId: `clerk_loc_${name}_${Date.now()}_${Math.random()}`,
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

describe('Localize files', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('translates JSON preserving keys and ICU', async () => {
    const org = await seedOrg(prisma, 'loc');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'loc-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/localize')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        format: 'json',
        source: 'en',
        target: 'sw',
        content: {
          app: {
            title: 'Welcome',
            cart: 'You have {count, plural, one {# item} other {# items}}',
          },
        },
      })
      .expect(200);

    expect(res.body.format).toBe('json');
    expect(res.body.strings).toBe(2);
    expect(res.body.content.app.title).toBe('[sw] Welcome');
    expect(res.body.content.app.cart).toContain('{count, plural, one {# item} other {# items}}');
    expect(res.body.content.app.cart).toContain('[sw]');
    expect(res.body.serialized).toContain('"title"');
  });

  it('translates YAML via file upload', async () => {
    const org = await seedOrg(prisma, 'locyml');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'yml-key',
    });

    const yaml = 'greeting: Hello\nfarewell: Goodbye\n';
    const res = await request(app.getHttpServer())
      .post('/v1/localize/file')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('source', 'en')
      .field('target', 'yo')
      .attach('file', Buffer.from(yaml, 'utf8'), {
        filename: 'en.yaml',
        contentType: 'application/yaml',
      })
      .expect(200);

    expect(res.body.format).toBe('yaml');
    expect(res.body.content.greeting).toBe('[yo] Hello');
    expect(res.body.content.farewell).toBe('[yo] Goodbye');
  });
});
