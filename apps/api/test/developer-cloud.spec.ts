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
import { DeveloperCloudService } from '../src/developer-cloud/developer-cloud.service';
import { generateApiKeySecret, looksLikeApiKey } from '../src/common/crypto/api-keys';
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
              clerkUserId: `clerk_dev_${name}_${Date.now()}_${Math.random()}`,
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

describe('Developer Cloud Foundation (VL-127)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let developer: DeveloperCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    developer = app.get(DeveloperCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Developer Cloud mapping (no OAuth AS / sandbox cluster)', () => {
    const doc = join(root, 'docs/DEVELOPER_CLOUD.md');
    const adr = join(root, 'docs/adr/0048-developer-cloud-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('OAuth Clients');
    expect(text).toContain('Not built');
    expect(text).toContain('same');
    expect(text).toContain('@verbalab/cli');
  });

  it('ships thin CLI package wrapping the SDK', () => {
    expect(existsSync(join(root, 'packages/cli/package.json'))).toBe(true);
    expect(existsSync(join(root, 'packages/cli/src/cli.ts'))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'), 'utf8')) as {
      name: string;
      bin: Record<string, string>;
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe('@verbalab/cli');
    expect(pkg.bin.verbalab).toBeTruthy();
    expect(pkg.dependencies['@verbalab/sdk']).toBe('workspace:*');
  });

  it('creates live and test API keys with correct prefixes', async () => {
    const live = generateApiKeySecret('live');
    const test = generateApiKeySecret('test');
    expect(live.secret.startsWith('vl_live_')).toBe(true);
    expect(test.secret.startsWith('vl_test_')).toBe(true);
    expect(looksLikeApiKey(live.secret)).toBe(true);
    expect(looksLikeApiKey(test.secret)).toBe(true);
    expect(looksLikeApiKey('sk_test')).toBe(false);

    const org = await seedOrg(prisma, `dev_keys_${Date.now()}`);
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'sandbox',
      environment: 'test',
    });
    expect(created.secret.startsWith('vl_test_')).toBe(true);
    expect(created.environment).toBe('test');

    const listed = await apiKeys.list(org.id);
    expect(listed[0].environment).toBe('test');
    expect(listed[0].kind).toBe('machine');
  });

  it('exposes public SDK catalog and authenticated developer overview', async () => {
    const sdkRes = await request(app.getHttpServer()).get('/v1/developer/sdk').expect(200);
    expect(sdkRes.body.typescript.name).toBe('@verbalab/sdk');
    expect(sdkRes.body.cli.bin).toBe('verbalab');
    expect(sdkRes.body.auth.testPrefix).toBe('vl_test_');

    const org = await seedOrg(prisma, `dev_ov_${Date.now()}`);
    await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'live-bot',
      environment: 'live',
    });

    const overview = await developer.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_dev',
      role: 'owner',
    });
    expect(overview.apiKeys.active).toBeGreaterThanOrEqual(1);
    expect(overview.applications.mappedTo).toBe('workspaces');
    expect(overview.sandbox.separateCluster).toBe(false);
    expect(overview.oauthClients.supported).toBe(false);
    expect(overview.sdk.cli.name).toBe('@verbalab/cli');
  });
});
