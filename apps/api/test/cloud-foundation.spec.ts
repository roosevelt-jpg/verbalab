import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspacesService } from '../src/workspaces/workspaces.service';
import { FeatureFlagsService } from '../src/cloud-foundation/feature-flags.service';
import { CloudOverviewService } from '../src/cloud-foundation/cloud-overview.service';
import { IdentityService } from '../src/identity/identity.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { App } from 'supertest/types';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string, plan: string = 'free') {
  return prisma.organization.create({
    data: {
      name,
      plan,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_cf_${name}_${Date.now()}_${Math.random()}`,
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

describe('Cloud Platform Foundation (VL-125)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let workspaces: WorkspacesService;
  let flags: FeatureFlagsService;
  let overview: CloudOverviewService;
  let identity: IdentityService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    workspaces = app.get(WorkspacesService);
    flags = app.get(FeatureFlagsService);
    overview = app.get(CloudOverviewService);
    identity = app.get(IdentityService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents foundation mapping and ADR (no AZ / discovery fake)', () => {
    const doc = join(root, 'docs/CLOUD_PLATFORM_FOUNDATION.md');
    const adr = join(root, 'docs/adr/0046-cloud-platform-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Projects');
    expect(text).toContain('Workspaces');
    expect(text).toContain('Availability Zones');
    expect(text).toContain('Not applicable');
    expect(text).toContain('Service Discovery');
    expect(text).toContain('Not built');
  });

  it('lists, creates, and patches workspaces', async () => {
    const org = await seedOrg(prisma, `cf_ws_${Date.now()}`);
    const listed = await workspaces.list(org.id, org.workspaces[0].id);
    expect(listed.data).toHaveLength(1);
    expect(listed.data[0].isCurrent).toBe(true);

    const created = await workspaces.create({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      name: 'Product',
      defaultSourceLang: 'en',
      defaultTargetLang: 'yo',
    });
    expect(created.name).toBe('Product');
    expect(created.defaultTargetLang).toBe('yo');

    const patched = await workspaces.update({
      organizationId: org.id,
      userId: org.memberships[0].userId,
      role: 'owner',
      id: created.id,
      name: 'Product Lab',
      currentWorkspaceId: created.id,
    });
    expect(patched.name).toBe('Product Lab');
    expect(patched.isCurrent).toBe(true);

    const again = await workspaces.list(org.id, org.workspaces[0].id);
    expect(again.data).toHaveLength(2);
  });

  it('rejects workspace create for members', async () => {
    const org = await seedOrg(prisma, `cf_member_${Date.now()}`);
    await expect(
      workspaces.create({
        organizationId: org.id,
        userId: org.memberships[0].userId,
        role: 'member',
        name: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('honors preferred workspace on session identity', async () => {
    const org = await seedOrg(prisma, `cf_pref_${Date.now()}`);
    const second = await prisma.workspace.create({
      data: {
        organizationId: org.id,
        name: 'Second',
        defaultSourceLang: 'en',
        defaultTargetLang: 'am',
      },
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: org.memberships[0].userId },
    });

    const defaultSession = await identity.ensureSessionIdentity({
      clerkUserId: user.clerkUserId,
      email: user.email ?? undefined,
    });
    expect(defaultSession.workspaceId).toBe(org.workspaces[0].id);

    const preferred = await identity.ensureSessionIdentity({
      clerkUserId: user.clerkUserId,
      email: user.email ?? undefined,
      preferredWorkspaceId: second.id,
    });
    expect(preferred.workspaceId).toBe(second.id);

    const ignored = await identity.ensureSessionIdentity({
      clerkUserId: user.clerkUserId,
      preferredWorkspaceId: 'does-not-exist',
    });
    expect(ignored.workspaceId).toBe(org.workspaces[0].id);
  });

  it('returns plan-aware feature flags and cloud overview', async () => {
    const free = await seedOrg(prisma, `cf_free_${Date.now()}`, 'free');
    const freeFlags = await flags.forOrganization(free.id);
    expect(freeFlags.flags.pro).toBe(false);
    expect(freeFlags.flags.marketplace).toBe(false);

    const pro = await seedOrg(prisma, `cf_pro_${Date.now()}`, 'pro');
    const proFlags = await flags.forOrganization(pro.id);
    expect(proFlags.flags.pro).toBe(true);
    expect(proFlags.flags.marketplace).toBe(true);

    const ov = await overview.get({
      userId: pro.memberships[0].userId,
      organizationId: pro.id,
      workspaceId: pro.workspaces[0].id,
      clerkUserId: `clerk_ov_${Date.now()}`,
      role: 'owner',
    });
    expect(ov.organization.id).toBe(pro.id);
    expect(ov.workspace?.id).toBe(pro.workspaces[0].id);
    expect(ov.billing.plan).toBe('pro');
    expect(ov.featureFlags.pro).toBe(true);
    expect(ov.foundation.projectsMappedTo).toBe('workspaces');
    expect(ov.foundation.availabilityZones).toBe(false);
    expect(ov.foundation.serviceDiscovery).toBe(false);
  });
});
