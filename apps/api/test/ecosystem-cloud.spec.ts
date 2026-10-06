import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EcosystemCloudService } from '../src/ecosystem-cloud/ecosystem-cloud.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory) out.push(...walkTsFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_eco_${name}_${Date.now}_${Math.random}`,
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

describe('Ecosystem Cloud Foundation',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ecosystem: EcosystemCloudService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
    prisma = app.get(PrismaService);
    ecosystem = app.get(EcosystemCloudService);
  });

  afterAll(async  => {
    await app.close;
  });

  it('documents Ecosystem Cloud honesty (marketplace hub, not payment OS)',  => {
    const doc = join(root, 'docs/ECOSYSTEM_CLOUD.md');
    const adr = join(root, 'docs/adr/0151-ecosystem-cloud-foundation.md');
    const readme = join(root, 'docs/roadmap/volume11-ecosystem-cloud/README_VOLUME11.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('');
    expect(text).toContain('CQRS');
    expect(text).toMatch(/real-money|real money/i);
    expect(text).toMatch(/Stripe|payment/i);
    expect(text).toMatch(/not\*\* a payment|NOT a payment|not a payment/i);
    const readmeText = readFileSync(readme, 'utf8');
    expect(readmeText).toMatch(/real money|payments|royalt/i);
    expect(readmeText).toMatch(/Stripe|PCI|card/i);
  });

  it('has no TODO/FIXME/implement-later markers in Ecosystem Cloud source',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'ecosystem-cloud'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes public product catalog with honest architecture + safety', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/ecosystem-cloud/products')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Ecosystem Cloud');
    expect(res.body.architecture.paymentProcessorOs).toBe(false);
    expect(res.body.architecture.storesRawCardData).toBe(false);
    expect(res.body.architecture.stripeOrEquivalentRequired).toBe(true);
    expect(res.body.architecture.regeneratesVolumes1to10).toBe(false);
    expect(res.body.architecture.regeneratesMarketplaceVl090).toBe(false);
    expect(res.body.architecture.pluginAgentSandboxRequired).toBe(true);
    expect(res.body.architecture.realMoneyRiskCategory).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.honesty.taxHandlingComplete).toBe(false);
    expect(res.body.honesty.disputeChargebackComplete).toBe(false);
    expect(res.body.safety.storesRawCardData).toBe(false);
    expect(res.body.docs).toBe('/docs/ECOSYSTEM_CLOUD.md');

    const hub = res.body.products.find((p: { id: string }) => p.id === 'ecosystem-cloud');
    expect(hub.status).toBe('shipped');
    expect(hub.console).toBe('/ecosystem-cloud');

    const content = res.body.products.find((p: { id: string }) => p.id === 'content-marketplace');
    expect(content.status).toBe('shipped');
    expect(content.console).toBe('/marketplace');

    const voice = res.body.products.find((p: { id: string }) => p.id === 'voice-marketplace');
    expect(voice.status).toBe('shipped');

    const plugin = res.body.products.find((p: { id: string }) => p.id === 'plugin-marketplace');
    expect(plugin.status).toBe('shipped');
    expect(plugin.console).toBe('/plugin-marketplace');
    expect(plugin.notes).toMatch(/sandbox|Policy/i);

    const model = res.body.products.find((p: { id: string }) => p.id === 'model-marketplace');
    expect(model.status).toBe('shipped');
    expect(model.console).toBe('/model-marketplace');
    expect(model.notes).toMatch(/Hugging Face|registry|Stripe/i);

    const dataset = res.body.products.find((p: { id: string }) => p.id === 'dataset-marketplace');
    expect(dataset.status).toBe('shipped');
    expect(dataset.console).toBe('/dataset-marketplace');
    expect(dataset.notes).toMatch(/Label Studio|Dataset Cloud|Stripe/i);

    const prompt = res.body.products.find((p: { id: string }) => p.id === 'prompt-marketplace');
    expect(prompt.status).toBe('shipped');
    expect(prompt.console).toBe('/prompt-marketplace');
    expect(prompt.notes).toMatch(/prompt mesh|Prompt Fabric|Stripe/i);

    const agent = res.body.products.find((p: { id: string }) => p.id === 'agent-marketplace');
    expect(agent.status).toBe('shipped');
    expect(agent.console).toBe('/agent-marketplace');
    expect(agent.notes).toMatch(/sandbox|Policy|LangGraph|AutoGPT/i);

    const workflow = res.body.products.find((p: { id: string }) => p.id === 'workflow-marketplace');
    expect(workflow.status).toBe('shipped');
    expect(workflow.console).toBe('/workflow-marketplace');
    expect(workflow.notes).toMatch(/sandbox|Policy|Zapier|Temporal/i);

    const connector = res.body.products.find(
      (p: { id: string }) => p.id === 'connector-marketplace',
    );
    expect(connector.status).toBe('shipped');
    expect(connector.console).toBe('/connector-marketplace');
    expect(connector.notes).toMatch(/iPaaS|Zapier|Stripe|Slack/i);

    const voiceLang = res.body.products.find(
      (p: { id: string }) => p.id === 'voice-language-marketplace',
    );
    expect(voiceLang.status).toBe('shipped');
    expect(voiceLang.console).toBe('/voice-language-marketplace');
    expect(voiceLang.notes).toMatch(/third-party TTS|voice CDN||Stripe/i);

    const creator = res.body.products.find((p: { id: string }) => p.id === 'creator-economy');
    expect(creator.status).toBe('shipped');
    expect(creator.console).toBe('/creator-economy');
    expect(creator.notes).toMatch(/|royalty|tax|Stripe/i);
  });

  it('exposes routing table and org overview', async  => {
    const routing = await request(app.getHttpServer)
      .get('/v1/ecosystem-cloud/routing')
      .expect(200);
    expect(routing.body.routes.length).toBeGreaterThan(5);
    expect(
      routing.body.routes.some((r: { surface: string }) => r.surface === 'content-marketplace'),
    ).toBe(true);

    const org = await seedOrg(prisma, `eco_${Date.now}`);
    const overview = await ecosystem.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_eco',
      role: 'owner',
    });
    expect(overview.deferred.pluginMarketplace).toBe(false);
    expect(overview.deferred.modelMarketplace).toBe(false);
    expect(overview.deferred.datasetMarketplace).toBe(false);
    expect(overview.deferred.promptMarketplace).toBe(false);
    expect(overview.deferred.agentMarketplace).toBe(false);
    expect(overview.deferred.workflowMarketplace).toBe(false);
    expect(overview.deferred.connectorMarketplace).toBe(false);
    expect(overview.deferred.voiceLanguageMarketplace).toBe(false);
    expect(overview.deferred.creatorEconomyExpansion).toBe(false);
    expect(overview.deferred.regeneratesVolumes1to10).toBe(false);
    expect(overview.deferred.paymentProcessorOs).toBe(false);
    expect(overview.links.ecosystemCloud).toBe('/ecosystem-cloud');
    expect(overview.links.contentMarketplace).toBe('/marketplace');
    expect(overview.safety.pluginAgentSandboxRequired).toBe(true);
  });

  it('exposes ecosystemProducts via GraphQL CQRS façade', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: '{ ecosystemProducts { id name status api console notes } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.ecosystemProducts.length).toBeGreaterThan(8);
    expect(
      res.body.data.ecosystemProducts.some((p: { id: string }) => p.id === 'ecosystem-cloud'),
    ).toBe(true);
  });
});
