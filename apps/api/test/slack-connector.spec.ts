import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { SlackConnectorService } from '../src/connectors/slack.service';
import { ResendStyleMemorySlackClient } from '../src/connectors/slack.client';
import { signSlackRequest } from '../src/connectors/slack-signature';
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
              clerkUserId: `clerk_slack_${name}_${Date.now()}_${Math.random()}`,
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

describe('Slack connector (VL-082)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let slack: SlackConnectorService;
  const signingSecret = 'slack_test_signing_secret';

  beforeAll(async () => {
    process.env.SLACK_SIGNING_SECRET = signingSecret;
    delete process.env.SLACK_CONNECTOR_DISABLED;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    slack = app.get(SlackConnectorService);
    slack.setClientForTests(new ResendStyleMemorySlackClient());

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
    app.get(GatewayService).setDetectProviderForTests({
      name: 'fixture-detect',
      async detect() {
        return { language: 'en', confidence: 0.99, provider: 'fixture-detect' };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function signed(body: string, contentType: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signSlackRequest(signingSecret, timestamp, body);
    return { body, timestamp, signature, contentType };
  }

  it('returns url_verification challenge', async () => {
    const payload = JSON.stringify({ type: 'url_verification', challenge: 'abc123' });
    const { timestamp, signature } = signed(payload, 'application/json');

    const res = await request(app.getHttpServer())
      .post('/v1/connectors/slack/events')
      .set('Content-Type', 'application/json')
      .set('X-Slack-Signature', signature)
      .set('X-Slack-Request-Timestamp', timestamp)
      .send(payload)
      .expect(200);

    expect(res.body.challenge).toBe('abc123');
  });

  it('translates a slash command for a linked workspace', async () => {
    const org = await seedOrg(prisma, 'slackCmd');
    const teamId = `T_SLACK_CMD_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    await prisma.slackInstallation.create({
      data: {
        teamId,
        teamName: 'Cmd Team',
        organizationId: org.id,
        workspaceId: org.workspaces[0]!.id,
        defaultTargetLang: 'sw',
      },
    });

    const form = new URLSearchParams({
      team_id: teamId,
      channel_id: 'C1',
      user_id: 'U1',
      command: '/verbalab',
      text: 'sw Hello there',
    }).toString();
    const { timestamp, signature } = signed(form, 'application/x-www-form-urlencoded');

    const res = await request(app.getHttpServer())
      .post('/v1/connectors/slack/commands')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-Slack-Signature', signature)
      .set('X-Slack-Request-Timestamp', timestamp)
      .send(form)
      .expect(200);

    expect(res.body.response_type).toBe('in_channel');
    expect(res.body.text).toContain('[sw] Hello there');
  });

  it('rejects unknown team and bad signatures', async () => {
    const form = new URLSearchParams({
      team_id: `T_UNKNOWN_${Date.now()}`,
      text: 'sw hi',
    }).toString();
    const { timestamp, signature } = signed(form, 'application/x-www-form-urlencoded');

    await request(app.getHttpServer())
      .post('/v1/connectors/slack/commands')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-Slack-Signature', signature)
      .set('X-Slack-Request-Timestamp', timestamp)
      .send(form)
      .expect(404);

    await request(app.getHttpServer())
      .post('/v1/connectors/slack/commands')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('X-Slack-Signature', 'v0=nope')
      .set('X-Slack-Request-Timestamp', timestamp)
      .send(form)
      .expect(401);
  });

  it('upserts installations via service', async () => {
    const org = await seedOrg(prisma, 'slackInstall');
    const teamId = `T_INSTALL_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const row = await slack.upsertInstallation({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      teamId,
      teamName: 'Install Team',
      defaultTargetLang: 'fr',
      userId: org.memberships[0]!.userId,
      role: 'owner',
    });
    expect(row.teamId).toBe(teamId);
    expect(row.defaultTargetLang).toBe('fr');
    const listed = await slack.listInstallations(org.id);
    expect(listed.some((i) => i.teamId === teamId)).toBe(true);
  });
});
