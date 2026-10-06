import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { PromptsService } from '../src/prompts/prompts.service';
import { LUGEMI_CHAT_SYSTEM } from '../src/chat/chat-prompt';
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
              clerkUserId: `clerk_prompt_${name}_${Date.now()}_${Math.random()}`,
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

describe('Prompt management (VL-086)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let prompts: PromptsService;
  let lastSystem: string | null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    prompts = app.get(PromptsService);
    lastSystem = null;

    app.get(GatewayService).setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        lastSystem = input.messages.find((m) => m.role === 'system')?.content ?? null;
        return {
          message: { role: 'assistant', content: 'ok' },
          model: 'fixture',
          provider: 'fixture_chat',
          promptTokens: 1,
          completionTokens: 1,
          totalTokens: 2,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('falls back to code defaults when no active version', async () => {
    const org = await seedOrg(prisma, `pf_${Date.now()}`);
    const resolved = await prompts.resolve({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      key: 'chat',
    });
    expect(resolved.source).toBe('fallback');
    expect(resolved.body).toBe(LUGEMI_CHAT_SYSTEM);
  });

  it('activates a version and rolls back; chat uses the active body', async () => {
    const org = await seedOrg(prisma, `pa_${Date.now()}`);
    const workspaceId = org.workspaces[0].id;
    const userId = org.memberships[0].userId;

    const v1 = await prompts.createVersion({
      organizationId: org.id,
      workspaceId,
      key: 'chat',
      body: 'SYSTEM_V1_PROMPT_UNIQUE',
      role: 'owner',
      userId,
      activate: true,
    });
    expect(v1.version).toBe(1);

    const v2 = await prompts.createVersion({
      organizationId: org.id,
      workspaceId,
      key: 'chat',
      body: 'SYSTEM_V2_PROMPT_UNIQUE',
      role: 'owner',
      userId,
      activate: true,
    });
    expect(v2.version).toBe(2);

    let active = await prompts.resolve({
      organizationId: org.id,
      workspaceId,
      key: 'chat',
    });
    expect(active.source).toBe('database');
    expect(active.body).toBe('SYSTEM_V2_PROMPT_UNIQUE');

    await prompts.activate({
      organizationId: org.id,
      workspaceId,
      key: 'chat',
      version: 1,
      role: 'owner',
      userId,
    });

    active = await prompts.resolve({
      organizationId: org.id,
      workspaceId,
      key: 'chat',
    });
    expect(active.version).toBe(1);
    expect(active.body).toBe('SYSTEM_V1_PROMPT_UNIQUE');

    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      userId,
      name: 'prompt-chat',
    });

    await request(app.getHttpServer())
      .post('/v1/chat/completions')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ messages: [{ role: 'user', content: 'Hi' }] })
      .expect(200);

    expect(lastSystem).toBe('SYSTEM_V1_PROMPT_UNIQUE');

    await prompts.clearActive({
      organizationId: org.id,
      workspaceId,
      key: 'chat',
      role: 'owner',
      userId,
    });
    const fallback = await prompts.resolve({
      organizationId: org.id,
      workspaceId,
      key: 'chat',
    });
    expect(fallback.source).toBe('fallback');
  });

  it('lists managed keys and rejects unknown keys', async () => {
    const org = await seedOrg(prisma, `pl_${Date.now()}`);
    const list = await prompts.list(org.id, org.workspaces[0].id);
    expect(list.map((row) => row.key)).toEqual(['chat', 'rag', 'voice_faq']);

    await expect(
      prompts.createVersion({
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        key: 'interpreter',
        body: 'nope',
        role: 'owner',
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });
  });
});
