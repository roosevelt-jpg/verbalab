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
              clerkUserId: `clerk_chat_${name}_${Date.now}_${Math.random}`,
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

describe('AI Chat',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const gateway = app.get(GatewayService);
    gateway.setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        const lastUser = [...input.messages].reverse.find((m) => m.role === 'user');
        return {
          message: {
            role: 'assistant',
            content: `Echo: ${lastUser?.content ?? ''}`,
          },
          model: 'fixture-model',
          provider: 'fixture_chat',
          promptTokens: 12,
          completionTokens: 4,
          totalTokens: 16,
          latencyMs: 1,
        };
      },
    });
    gateway.setDetectProviderForTests({
      name: 'fixture_detect',
      async detect {
        return { language: 'en', confidence: 0.99, provider: 'fixture_detect' };
      },
    });
    gateway.setProviderForTests({
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

  afterAll(async  => {
    await app.close;
  });

  it('completes chat and meters tokens', async  => {
    const org = await seedOrg(prisma, 'chat');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'chat-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/chat/completions')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        messages: [{ role: 'user', content: 'What is a glossary?' }],
      })
      .expect(200);

    expect(res.body.object).toBe('chat.completion');
    expect(res.body.choices[0].message.content).toBe('Echo: What is a glossary?');
    expect(res.body.provider).toBe('fixture_chat');
    expect(res.body.usage.total_tokens).toBe(16);
    expect(res.body.translated).toBe(false);

    const events = await prisma.usageEvent.findMany({
      where: { organizationId: org.id, feature: 'chat' },
    });
    expect(events.length).toBe(1);
    expect(events[0]!.units).toBe(16);
  });

  it('optionally translates the reply', async  => {
    const org = await seedOrg(prisma, 'chatmt');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'chat-mt-key',
    });

    const res = await request(app.getHttpServer)
      .post('/v1/chat/completions')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        messages: [{ role: 'user', content: 'Hello' }],
        translateReplyTo: 'sw',
      })
      .expect(200);

    expect(res.body.translated).toBe(true);
    expect(res.body.translateReplyTo).toBe('sw');
    expect(res.body.choices[0].message.content).toBe('[sw] Echo: Hello');
  });

  it('rejects empty messages', async  => {
    const org = await seedOrg(prisma, 'chatbad');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'chat-bad-key',
    });

    await request(app.getHttpServer)
      .post('/v1/chat/completions')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ messages: [] })
      .expect(400);
  });
});
