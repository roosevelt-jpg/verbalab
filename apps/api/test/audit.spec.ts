import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { AuditService } from '../src/audit/audit.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

async function seedOrg(prisma: PrismaService, name: string, role: MembershipRole = MembershipRole.owner) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role,
          user: {
            create: {
              clerkUserId: `clerk_audit_${name}_${Date.now()}_${Math.random()}`,
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

describe('Audit log', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let audit: AuditService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    audit = app.get(AuditService);

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

  it('records api_key.created, translate.completed, api_key.revoked', async () => {
    const org = await seedOrg(prisma, 'auditA');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'audit-key',
      ip: '203.0.113.10',
    });

    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${created.secret}`)
      .set('X-Forwarded-For', '198.51.100.7')
      .send({ text: 'Hello', source: 'en', target: 'sw' })
      .expect(200);

    await apiKeys.revoke(org.id, created.id, {
      userId: org.memberships[0]!.userId,
      ip: '203.0.113.10',
    });

    const events = await audit.listForOrg(org.id, 20);
    const actions = events.map((e) => e.action);
    expect(actions).toContain('api_key.created');
    expect(actions).toContain('translate.completed');
    expect(actions).toContain('api_key.revoked');

    const translateEvent = events.find((e) => e.action === 'translate.completed');
    expect(translateEvent?.apiKeyPrefix).toBe(created.prefix);
    expect(translateEvent?.ip).toBe('198.51.100.7');
    expect(translateEvent?.route).toBe('POST /v1/translate');
  });

  it('isolates audit events by organization', async () => {
    const orgA = await seedOrg(prisma, 'isoA');
    const orgB = await seedOrg(prisma, 'isoB');

    await apiKeys.create({
      organizationId: orgA.id,
      workspaceId: orgA.workspaces[0]!.id,
      userId: orgA.memberships[0]!.userId,
      name: 'a',
    });

    const aEvents = await audit.listForOrg(orgA.id);
    const bEvents = await audit.listForOrg(orgB.id);
    expect(aEvents.some((e) => e.action === 'api_key.created')).toBe(true);
    expect(bEvents.length).toBe(0);
  });

  it('records at most one session.sign_in per user per day', async () => {
    const org = await seedOrg(prisma, 'signin');
    const userId = org.memberships[0]!.userId;

    await audit.recordSignInIfNeeded({ organizationId: org.id, userId, ip: '127.0.0.1' });
    await audit.recordSignInIfNeeded({ organizationId: org.id, userId, ip: '127.0.0.1' });

    const events = await prisma.auditEvent.findMany({
      where: { organizationId: org.id, action: 'session.sign_in' },
    });
    expect(events).toHaveLength(1);
  });
});
