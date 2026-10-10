import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EnterpriseCloudService } from '../src/enterprise-cloud/enterprise-cloud.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { App } from 'supertest/types';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      plan: 'pro',
      allowVendorTraining: false,
      persistSourceText: true,
      retentionDays: 90,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_ent_${name}_${Date.now()}_${Math.random()}`,
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

describe('Enterprise Cloud Foundation', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let enterprise: EnterpriseCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    enterprise = app.get(EnterpriseCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Enterprise Cloud mapping (no policy engine / cert product)', () => {
    const doc = join(root, 'docs/ENTERPRISE_CLOUD.md');
    const adr = join(root, 'docs/adr/0049-enterprise-cloud-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Compliance Policies');
    expect(text).toContain('no cert product');
    expect(text).toContain('Policy-as-Code');
    expect(text).toContain('Tenant Isolation');
  });

  it('returns derived policies and overview', async () => {
    const org = await seedOrg(prisma, `ent_${Date.now()}`);
    const policies = await enterprise.policies(org.id);
    expect(policies.organization.security.tenantIsolation).toBe(true);
    expect(policies.organization.security.abac).toBe(false);
    expect(policies.organization.compliance.allowVendorTraining).toBe(false);
    expect(policies.organization.compliance.retentionDays).toBe(90);
    expect(policies.organization.compliance.automatedRetentionSweeper).toBe(false);
    expect(policies.organization.compliance.certificationsProduct).toBe(false);
    expect(policies.organization.compliance.vendorTrainingEnforcement).toBe('contractual_default');
    expect(policies.organization.billing.plan).toBe('pro');
    expect(policies.organization.cloud.availabilityZones).toBe(false);
    expect(policies.organization.governance.workspaces).toBe(1);

    const overview = await enterprise.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_ent',
      role: 'owner',
    });
    expect(overview.workspaces[0].isCurrent).toBe(true);
    expect(overview.docs).toContain('ENTERPRISE_CLOUD');
    expect(overview.links.data).toBe('/data');
  });

  it('surfaces vendor policy for audit from org settings', async () => {
    const org = await seedOrg(prisma, `ent_vp_${Date.now()}`);
    await prisma.organization.update({
      where: { id: org.id },
      data: { allowVendorTraining: true, persistSourceText: false },
    });
    const vp = await enterprise.vendorPolicyForAudit(org.id);
    expect(vp.allowVendorTraining).toBe(true);
    expect(vp.persistSourceText).toBe(false);
    expect(vp.vendorTrainingEnforcement).toBe('contractual_default');
  });
});
