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
              clerkUserId: `clerk_pr_${name}_${Date.now}_${Math.random}`,
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

describe('Plugin Runtime',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_PLUGIN_RUNTIME_MODE;

  beforeAll(async  => {
    process.env.LUGEMI_PLUGIN_RUNTIME_MODE = 'sandbox';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        const user = [...input.messages].reverse.find((m) => m.role === 'user');
        return {
          message: {
            role: 'assistant',
            content: `Sandbox plugin plan for ${user?.content.slice(0, 40) ?? 'goal'}`,
          },
          model: input.model ?? 'fixture-model',
          provider: 'fixture_chat',
          promptTokens: 10,
          completionTokens: 8,
          totalTokens: 18,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async  => {
    if (prevMode === undefined) delete process.env.LUGEMI_PLUGIN_RUNTIME_MODE;
    else process.env.LUGEMI_PLUGIN_RUNTIME_MODE = prevMode;
    await app.close;
  });

  it('documents Plugin Runtime honesty (sandbox + permissions; not extension OS)',  => {
    const doc = join(root, 'docs/PLUGIN_RUNTIME.md');
    const adr = join(root, 'docs/adr/0132-plugin-runtime.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/sandbox/i);
    expect(text).toMatch(/permission/i);
    expect(text).toMatch(/browser|VS Code|extension/i);
    expect(text).toMatch(/hard/i);
  });

  it('exposes engine with honest safety flags', async  => {
    const res = await request(app.getHttpServer).get('/v1/plugin-runtime/engine').expect(200);
    expect(res.body.product).toContain('Plugin Runtime');
    expect(res.body.honesty.openToolExecution).toBe(false);
    expect(res.body.honesty.liveCodeExecution).toBe(false);
    expect(res.body.honesty.browserExtensionOs).toBe(false);
    expect(res.body.honesty.vsCodeExtensionOs).toBe(false);
    expect(res.body.honesty.extendsMarketplace).toBe(true);
    expect(res.body.honesty.scopedPermissionsRequired).toBe(true);
    expect(res.body.honesty.localPermissionHardGate).toBe(true);
    expect(res.body.honesty.policyRuntimeWired).toBe(true);
    expect(res.body.ceilings.liveCodeExecution).toBe(false);
    expect(res.body.links.console).toBe('/plugin-runtime');
  });

  it('denies missing permissions and completes sandbox invoke', async  => {
    const org = await seedOrg(prisma, 'pr');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'pr-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    const created = await request(app.getHttpServer)
      .post('/v1/plugin-runtime/plugins')
      .set(auth)
      .send({
        name: 'Sandbox Formatter',
        permissions: ['plugin.read', 'plugin.transform', 'memory.put'],
        description: 'formats text in sandbox',
      })
      .expect(201);
    expect(created.body.plugin.id).toMatch(/^plg_/);
    expect(created.body.plugin.status).toBe('draft');

    const pluginId = created.body.plugin.id as string;

    await request(app.getHttpServer)
      .post(`/v1/plugin-runtime/plugins/${pluginId}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);

    const denied = await request(app.getHttpServer)
      .post('/v1/plugin-runtime/invoke')
      .set(auth)
      .send({
        pluginId,
        actions: [{ action: 'shell.exec', input: { cmd: 'echo' } }],
      })
      .expect(200);
    expect(denied.body.invocation.status).toBe('denied');
    expect(denied.body.invocation.liveCodeExecution).toBe(false);
    expect(denied.body.invocation.steps[0].allowed).toBe(false);

    const missing = await request(app.getHttpServer)
      .post('/v1/plugin-runtime/invoke')
      .set(auth)
      .send({
        pluginId,
        actions: [{ action: 'context.assemble', input: { query: 'x' } }],
      })
      .expect(200);
    expect(missing.body.invocation.status).toBe('denied');
    expect(missing.body.invocation.steps[0].error).toMatch(/lacks permission/i);

    const ok = await request(app.getHttpServer)
      .post('/v1/plugin-runtime/invoke')
      .set(auth)
      .send({
        pluginId,
        actions: [
          { action: 'plugin.read' },
          { action: 'plugin.transform', input: { text: 'hello' } },
        ],
      })
      .expect(200);
    expect(ok.body.invocation.status).toBe('completed');
    expect(ok.body.invocation.sandbox).toBe(true);
    expect(ok.body.invocation.steps.every((s: { allowed: boolean }) => s.allowed)).toBe(true);

    const versioned = await request(app.getHttpServer)
      .post(`/v1/plugin-runtime/plugins/${pluginId}/version`)
      .set(auth)
      .send({ description: 'v2 sandbox' })
      .expect(200);
    expect(versioned.body.plugin.version).toBe(2);

    const depBase = await request(app.getHttpServer)
      .post('/v1/plugin-runtime/plugins')
      .set(auth)
      .send({ name: 'Dep Base', permissions: ['plugin.read'] })
      .expect(201);
    await request(app.getHttpServer)
      .post(`/v1/plugin-runtime/plugins/${depBase.body.plugin.id}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);

    const withDep = await request(app.getHttpServer)
      .post('/v1/plugin-runtime/plugins')
      .set(auth)
      .send({
        name: 'With Dep',
        permissions: ['plugin.read'],
        dependencies: [depBase.body.plugin.id],
      })
      .expect(201);
    await request(app.getHttpServer)
      .post(`/v1/plugin-runtime/plugins/${withDep.body.plugin.id}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);
    const depInvoke = await request(app.getHttpServer)
      .post('/v1/plugin-runtime/invoke')
      .set(auth)
      .send({ pluginId: withDep.body.plugin.id })
      .expect(200);
    expect(depInvoke.body.invocation.status).toBe('completed');

    const market = await request(app.getHttpServer)
      .get('/v1/plugin-runtime/marketplace')
      .set(auth)
      .expect(200);
    expect(market.body.kind).toBe('plugin');
    expect(market.body.honesty.extendsMarketplace).toBe(true);
  });

  it('exposes pluginRuntimeEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ pluginRuntimeEngine { product openToolExecution liveCodeExecution browserExtensionOs extendsMarketplace scopedPermissionsRequired sandboxRequired localPermissionHardGate mode maxPluginsPerWorkspace } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.pluginRuntimeEngine.liveCodeExecution).toBe(false);
    expect(res.body.data.pluginRuntimeEngine.extendsMarketplace).toBe(true);
    expect(res.body.data.pluginRuntimeEngine.localPermissionHardGate).toBe(true);
  });
});
