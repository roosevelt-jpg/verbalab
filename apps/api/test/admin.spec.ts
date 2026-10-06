import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { AdminService } from '../src/admin/admin.service';
import { GovernanceService } from '../src/governance/governance.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { isPlatformAdmin } from '../src/common/admin/platform-admin';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_admin_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
              name: `${name} Owner`,
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

describe('Admin + customer portal', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let admin: AdminService;
  let governance: GovernanceService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    admin = app.get(AdminService);
    governance = app.get(GovernanceService);

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

  it('isPlatformAdmin respects allowlists', () => {
    const prevEmails = process.env.ADMIN_EMAILS;
    const prevIds = process.env.ADMIN_USER_IDS;
    process.env.ADMIN_EMAILS = 'ops@lugemi.test';
    process.env.ADMIN_USER_IDS = 'clerk_ops_1';
    expect(isPlatformAdmin({ email: 'ops@lugemi.test', clerkUserId: 'x' })).toBe(true);
    expect(isPlatformAdmin({ email: 'other@x.com', clerkUserId: 'clerk_ops_1' })).toBe(true);
    expect(isPlatformAdmin({ email: 'other@x.com', clerkUserId: 'nope' })).toBe(false);
    process.env.ADMIN_EMAILS = prevEmails;
    process.env.ADMIN_USER_IDS = prevIds;
  });

  it('lists organization members for the customer portal', async () => {
    const org = await seedOrg(prisma, 'portalMembers');
    const members = await governance.listMembers(org.id);
    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe('owner');
    expect(members[0]!.user.email).toBe('portalMembers@example.com');
  });

  it('filters organizations by the four Lugemi plans', async () => {
    const freeOrg = await seedOrg(prisma, 'adminPlanFree');
    const proOrg = await seedOrg(prisma, 'adminPlanPro');
    await prisma.organization.update({
      where: { id: proOrg.id },
      data: { plan: 'pro', characterQuota: 2_000_000 },
    });
    const businessOrg = await seedOrg(prisma, 'adminPlanBusiness');
    await prisma.organization.update({
      where: { id: businessOrg.id },
      data: { plan: 'business', characterQuota: 11_000_000 },
    });

    const plans = admin.listPlanFilters();
    expect(plans.map((p) => p.id)).toEqual(['free', 'pro', 'business', 'enterprise']);

    const freeOnly = await admin.searchOrganizations('adminPlan', undefined, 'free');
    expect(freeOnly.some((o) => o.id === freeOrg.id)).toBe(true);
    expect(freeOnly.every((o) => o.plan === 'free')).toBe(true);

    const proOnly = await admin.searchOrganizations('adminPlan', undefined, 'pro');
    expect(proOnly.some((o) => o.id === proOrg.id)).toBe(true);
    expect(proOnly.every((o) => o.plan === 'pro')).toBe(true);

    const businessOnly = await admin.searchOrganizations('adminPlan', undefined, 'business');
    expect(businessOnly.some((o) => o.id === businessOrg.id)).toBe(true);
  });

  it('searches orgs and disables them, revoking keys', async () => {
    const org = await seedOrg(prisma, 'adminSearchTarget');
    const other = await seedOrg(prisma, 'adminOther');

    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'to-kill',
    });

    const found = await admin.searchOrganizations('adminSearchTarget');
    expect(found.some((o) => o.id === org.id)).toBe(true);
    expect(found.some((o) => o.id === other.id)).toBe(false);

    const detail = await admin.getOrganization(org.id);
    expect(detail.members).toHaveLength(1);
    expect(detail.apiKeys.some((k) => k.prefix === key.prefix)).toBe(true);

    // Suspend without revoke-all: API keys must still fail closed
    await prisma.organization.update({
      where: { id: org.id },
      data: { disabledAt: new Date(), disabledReason: 'manual' },
    });
    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hello', source: 'en', target: 'sw' })
      .expect(403);

    await admin.setDisabled({
      organizationId: org.id,
      actorUserId: org.memberships[0]!.userId,
      disabled: true,
      reason: 'abuse',
    });

    const reloaded = await prisma.organization.findUniqueOrThrow({ where: { id: org.id } });
    expect(reloaded.disabledAt).not.toBeNull();
    expect(reloaded.disabledReason).toBe('abuse');
    const revoked = await prisma.apiKey.findUniqueOrThrow({ where: { id: key.id } });
    expect(revoked.revokedAt).not.toBeNull();

    await admin.setDisabled({
      organizationId: org.id,
      actorUserId: org.memberships[0]!.userId,
      disabled: false,
    });
    const enabled = await prisma.organization.findUniqueOrThrow({ where: { id: org.id } });
    expect(enabled.disabledAt).toBeNull();
  });

  it('lists workspaces with filters, updates entitlements, and supports open-as', async () => {
    const org = await seedOrg(prisma, 'adminWorkspaceSlice');
    await prisma.organization.update({
      where: { id: org.id },
      data: { plan: 'pro', dataRegion: 'eu' },
    });

    const listed = await admin.listWorkspaces({ q: 'adminWorkspaceSlice', plan: 'pro', region: 'eu' });
    expect(listed.total).toBeGreaterThanOrEqual(1);
    expect(listed.items.some((o) => o.id === org.id)).toBe(true);

    const updated = await admin.updateWorkspace(org.id, org.memberships[0]!.userId, {
      featureOverrides: { marketplace: true, sso: true },
      characterQuota: 9_000_000,
    });
    expect(updated.featureOverrides.marketplace).toBe(true);
    expect(updated.characterQuota).toBe(9_000_000);

    const detail = await admin.getWorkspace(org.id);
    expect(detail.featureFlags.marketplace).toBe(true);
    expect(detail.members).toHaveLength(1);

    const opened = await admin.openAsWorkspace({
      organizationId: org.id,
      actorUserId: org.memberships[0]!.userId,
    });
    expect(opened.organizationId).toBe(org.id);
    expect(opened.workspaceId).toBeTruthy();

    const created = await admin.createWorkspace({
      actorUserId: org.memberships[0]!.userId,
      name: 'Admin Created Co',
      plan: 'business',
      ownerEmail: 'customer-admin-created@example.com',
      dataRegion: 'us',
    });
    expect(created.name).toBe('Admin Created Co');
    expect(created.plan).toBe('business');

    const analytics = await admin.crossWorkspaceAnalytics();
    expect(analytics.totals.workspaces).toBeGreaterThanOrEqual(2);

    const bulk = await admin.bulkAction({
      actorUserId: org.memberships[0]!.userId,
      action: 'export',
      organizationIds: [org.id, created.id],
    });
    expect(bulk.action).toBe('export');
    expect(bulk.csv).toContain(org.id);

    const audit = await admin.listPlatformAudit({ limit: 20 });
    expect(audit.some((e) => e.action === 'admin.workspace_created')).toBe(true);
  });

  it('isPlatformAdmin respects LUGEMI_PLATFORM_ADMIN_EMAILS alias', () => {
    const prevEmails = process.env.ADMIN_EMAILS;
    const prevLugemi = process.env.LUGEMI_PLATFORM_ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = '';
    process.env.LUGEMI_PLATFORM_ADMIN_EMAILS = 'platform@lugemi.test';
    expect(isPlatformAdmin({ email: 'platform@lugemi.test', clerkUserId: 'x' })).toBe(true);
    process.env.ADMIN_EMAILS = prevEmails;
    process.env.LUGEMI_PLATFORM_ADMIN_EMAILS = prevLugemi;
  });

});
