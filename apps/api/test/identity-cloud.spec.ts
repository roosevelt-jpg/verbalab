import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GovernanceService } from '../src/governance/governance.service';
import { IdentityCloudService } from '../src/identity/identity-cloud.service';
import { IdentityService } from '../src/identity/identity.service';
import { mapClerkOrgRole } from '../src/identity/clerk-roles';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiKeyGuard } from '../src/common/guards/api-key.guard';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { App } from 'supertest/types';

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
              clerkUserId: `clerk_id_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
              name,
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

describe('Identity Cloud (VL-126)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let governance: GovernanceService;
  let identityCloud: IdentityCloudService;
  let identity: IdentityService;
  let apiKeys: ApiKeysService;
  let apiKeyGuard: ApiKeyGuard;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    governance = app.get(GovernanceService);
    identityCloud = app.get(IdentityCloudService);
    identity = app.get(IdentityService);
    apiKeys = app.get(ApiKeysService);
    apiKeyGuard = app.get(ApiKeyGuard);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Identity Cloud mapping (no SAML/SCIM/ABAC/Teams fake)', () => {
    const doc = join(root, 'docs/IDENTITY_CLOUD.md');
    const adr = join(root, 'docs/adr/0047-identity-cloud.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('ABAC');
    expect(text).toContain('Not built');
    expect(text).toContain('SAML');
    expect(text).toContain('SCIM');
    expect(text).toContain('Teams');
  });

  it('maps Clerk org role claims', () => {
    expect(mapClerkOrgRole('org:admin')).toBe(MembershipRole.admin);
    expect(mapClerkOrgRole('admin')).toBe(MembershipRole.admin);
    expect(mapClerkOrgRole('basic_member')).toBe(MembershipRole.member);
    expect(mapClerkOrgRole('org:owner')).toBe(MembershipRole.owner);
    expect(mapClerkOrgRole('weird')).toBeNull();
  });

  it('syncs clerk org role on session when claim present', async () => {
    const org = await seedOrg(prisma, `id_sync_${Date.now()}`);
    const clerkOrgId = `clerk_org_sync_${Date.now()}`;
    await prisma.organization.update({
      where: { id: org.id },
      data: { clerkOrgId },
    });
    const memberUser = await prisma.user.create({
      data: {
        clerkUserId: `clerk_member_${Date.now()}`,
        email: 'member@example.com',
      },
    });
    await prisma.membership.create({
      data: {
        organizationId: org.id,
        userId: memberUser.id,
        role: MembershipRole.member,
      },
    });

    const synced = await identity.ensureSessionIdentity({
      clerkUserId: memberUser.clerkUserId,
      email: memberUser.email ?? undefined,
      clerkOrgId,
      clerkOrgRole: 'org:admin',
    });
    expect(synced.organizationId).toBe(org.id);
    expect(synced.role).toBe('admin');
  });

  it('promotes, demotes, and removes members with last-owner guard', async () => {
    const org = await seedOrg(prisma, `id_rbac_${Date.now()}`);
    const ownerId = org.memberships[0].userId;
    const other = await prisma.user.create({
      data: { clerkUserId: `clerk_other_${Date.now()}`, email: 'other@example.com' },
    });
    const membership = await prisma.membership.create({
      data: {
        organizationId: org.id,
        userId: other.id,
        role: MembershipRole.member,
      },
    });

    const promoted = await governance.updateMemberRole({
      organizationId: org.id,
      actorUserId: ownerId,
      actorRole: 'owner',
      membershipId: membership.id,
      role: 'admin',
    });
    expect(promoted.role).toBe('admin');

    await expect(
      governance.updateMemberRole({
        organizationId: org.id,
        actorUserId: ownerId,
        actorRole: 'owner',
        membershipId: org.memberships[0].id,
        role: 'member',
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });

    const removed = await governance.removeMember({
      organizationId: org.id,
      actorUserId: ownerId,
      actorRole: 'owner',
      membershipId: membership.id,
    });
    expect(removed.removed).toBe(true);
  });

  it('returns identity overview and records API key lastUsedAt', async () => {
    const org = await seedOrg(prisma, `id_ov_${Date.now()}`);
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'machine-bot',
    });
    expect(created.secret).toMatch(/^lg_live_/);

    const listed = await apiKeys.list(org.id);
    expect(listed[0].kind).toBe('machine');
    expect(listed[0].lastUsedAt).toBeNull();

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: `Bearer ${created.secret}` },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(apiKeyGuard.canActivate(ctx)).resolves.toBe(true);
    await new Promise((r) => setTimeout(r, 80));

    const after = await prisma.apiKey.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.lastUsedAt).toBeTruthy();

    const overview = await identityCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_ov',
      role: 'owner',
    });
    expect(overview.machineIdentity.activeKeys).toBeGreaterThanOrEqual(1);
    expect(overview.rbac.abac).toBe(false);
    expect(overview.teams.supported).toBe(false);
    expect(overview.provider.saml).toContain('buy');
    expect(overview.members.total).toBe(1);
  });
});
