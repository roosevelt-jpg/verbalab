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
              clerkUserId: `clerk_te_${name}_${Date.now}_${Math.random}`,
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

describe('Translation Engine Phase 8',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

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

    const org = await seedOrg(prisma, 'engine');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'engine-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async  => {
    await app.close;
  });

  it('ships ADR and docs',  => {
    expect(existsSync(join(root, 'docs/adr/0061-translation-engine-phase-8.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/TRANSLATE.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/TRANSLATE.md'), 'utf8')).toContain('/v1/translate/formats');
  });

  it('exposes engine catalog with honest deferred channels', async  => {
    const res = await request(app.getHttpServer).get('/v1/translate/engine').expect(200);
    expect(res.body.product).toMatch(/Translate/i);
    expect(res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'html' && c.status === 'shipped')).toBe(
      true,
    );
    expect(
      res.body.capabilities.some((c: { id: string; status: string }) => c.id === 'whatsapp' && c.status === 'deferred'),
    ).toBe(true);
    expect(res.body.engines.translationMemory.status).toBe('partial');
  });

  it('translates HTML preserving tags', async  => {
    const res = await request(app.getHttpServer)
      .post('/v1/translate/formats')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        format: 'html',
        content: '<p>Hello <strong>world</strong></p>',
        source: 'en',
        target: 'sw',
      })
      .expect(200);
    expect(res.body.content).toContain('<p>');
    expect(res.body.content).toContain('<strong>');
    expect(res.body.content).toContain('[sw]');
    expect(res.body.segmentCount).toBeGreaterThan(0);
  });

  it('translates SRT keeping timestamps', async  => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hello there

`;
    const res = await request(app.getHttpServer)
      .post('/v1/translate/formats')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ format: 'srt', content: srt, source: 'en', target: 'sw' })
      .expect(200);
    expect(res.body.content).toContain('00:00:01,000 --> 00:00:04,000');
    expect(res.body.content).toContain('[sw]');
  });

  it('translates chat messages', async  => {
    const res = await request(app.getHttpServer)
      .post('/v1/translate/chat')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        source: 'en',
        target: 'sw',
        messages: [{ role: 'user', content: 'Hi' }],
      })
      .expect(200);
    expect(res.body.messages[0].content).toContain('[sw]');
  });

  it('streams SSE chunks', async  => {
    const res = await request(app.getHttpServer)
      .post('/v1/translate/stream')
      .set('Authorization', `Bearer ${rawKey}`)
      .set('Accept', 'text/event-stream')
      .send({ text: 'Hello. World.', source: 'en', target: 'sw' })
      .expect(200);

    const body = res.text;
    expect(body).toContain('event":"start"');
    expect(body).toContain('event":"done"');
    expect(body).toContain('[sw]');
  });

  it('exposes GraphQL translate mutation', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `mutation($input: TranslateInput!) {
          translate(input: $input) { text provider characters }
        }`,
        variables: { input: { text: 'Hello', source: 'en', target: 'sw' } },
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.translate.text).toContain('[sw]');
  });
});
