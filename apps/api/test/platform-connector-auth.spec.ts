import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { PlatformConnectorsService } from '../src/connectors/platform-connectors.service';
import {
  decryptConnectorCredentials,
  encryptConnectorCredentials,
} from '../src/connectors/connector-crypto';
import { verifyConnectorCredentials } from '../src/connectors/connector-auth.probes';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_pconn_${name}_${Date.now()}_${Math.random()}`,
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

describe('Platform connector realtime auth', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let platform: PlatformConnectorsService;

  beforeAll(async () => {
    process.env.CONNECTOR_AUTH_FIXTURE = '1';
    process.env.NODE_ENV = 'test';
    process.env.CONNECTOR_SECRET_KEY = 'test-connector-secret-key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    platform = app.get(PlatformConnectorsService);
  });

  afterAll(async () => {
    delete process.env.CONNECTOR_AUTH_FIXTURE;
    await app.close();
  });

  it('rejects empty credentials (no soft-connect)', async () => {
    const probe = await verifyConnectorCredentials('twilio', {});
    expect(probe.ok).toBe(false);

    const org = await seedOrg(prisma, 'empty');
    await expect(
      platform.connect({
        organizationId: org.id,
        workspaceId: org.workspaces[0]!.id,
        userId: org.memberships[0]!.userId,
        role: 'owner',
        connectorId: 'twilio',
        body: {},
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });
  });

  it('connects only after successful realtime auth and seals credentials', async () => {
    const org = await seedOrg(prisma, 'ok');
    const res = await platform.connect({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      role: 'owner',
      connectorId: 'twilio',
      body: { accountSid: 'ACfixture', apiKey: 'auth-token-fixture' },
    });
    expect(res.ok).toBe(true);
    expect(res.connected).toBe(true);
    expect(res.connectorId).toBe('twilio');

    const listed = await platform.listConnections(org.id, org.workspaces[0]!.id);
    expect(listed.connections).toHaveLength(1);
    expect(listed.connections[0]!.connectorId).toBe('twilio');
    expect(listed.connections[0]!.connected).toBe(true);

    const row = await prisma.platformConnectorConnection.findUniqueOrThrow({
      where: {
        workspaceId_connectorId: {
          workspaceId: org.workspaces[0]!.id,
          connectorId: 'twilio',
        },
      },
    });
    const enc = row.credentialsEnc as Record<string, unknown>;
    expect(enc.enc).toBe(1);
    expect(JSON.stringify(enc)).not.toContain('auth-token-fixture');
    const decoded = decryptConnectorCredentials(enc as never);
    expect(decoded.apiKey).toBe('auth-token-fixture');
    expect(decoded.accountSid).toBe('ACfixture');
  });

  it('forbids members from connecting', async () => {
    const org = await seedOrg(prisma, 'member');
    await expect(
      platform.connect({
        organizationId: org.id,
        workspaceId: org.workspaces[0]!.id,
        userId: org.memberships[0]!.userId,
        role: 'member',
        connectorId: 'hubspot',
        body: { apiKey: 'pat-fixture' },
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('disconnects and clears sealed credentials', async () => {
    const org = await seedOrg(prisma, 'disc');
    await platform.connect({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      role: 'owner',
      connectorId: 'slack',
      body: { apiKey: 'xoxb-fixture' },
    });
    const out = await platform.disconnect({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      role: 'owner',
      connectorId: 'slack',
    });
    expect(out.connected).toBe(false);
    const listed = await platform.listConnections(org.id, org.workspaces[0]!.id);
    expect(listed.connections).toHaveLength(0);
    const row = await prisma.platformConnectorConnection.findUniqueOrThrow({
      where: {
        workspaceId_connectorId: {
          workspaceId: org.workspaces[0]!.id,
          connectorId: 'slack',
        },
      },
    });
    expect(row.status).toBe('revoked');
    expect(row.credentialsEnc).toEqual({ revoked: true });
  });

  it('encrypt/decrypt round-trips credentials', () => {
    const sealed = encryptConnectorCredentials({ apiKey: 'secret', projectId: 'proj' });
    expect(sealed.alg).toBe('aes-256-gcm');
    expect(decryptConnectorCredentials(sealed)).toEqual({
      apiKey: 'secret',
      projectId: 'proj',
    });
  });
});
