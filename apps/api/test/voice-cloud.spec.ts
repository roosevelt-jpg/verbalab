import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VoiceCloudService } from '../src/voice-cloud/voice-cloud.service';
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
              clerkUserId: `clerk_voice_${name}_${Date.now()}_${Math.random()}`,
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

describe('Voice Cloud Foundation', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let voiceCloud: VoiceCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    voiceCloud = app.get(VoiceCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Voice Cloud mapping (no fake emotion-TTS / marketplace OS)', () => {
    const doc = join(root, 'docs/VOICE_CLOUD.md');
    const adr = join(root, 'docs/adr/0081-voice-cloud-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Neural TTS');
    expect(text).toContain('Voice Cloning');
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('af-south-1');
    expect(text).toContain('consent');
    expect(text).toMatch(/is \*\*not\*\* third-party TTS/i);
  });

  it('exposes public product catalog with honest statuses', async () => {
    const res = await request(app.getHttpServer()).get('/v1/voice-cloud/products').expect(200);
    expect(res.body.architecture.graphql).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.batch).toBe(true);
    expect(res.body.architecture.streaming).toBe(true);
    expect(res.body.architecture.billing).toBe(true);
    expect(res.body.architecture.monitoring).toBe(true);
    expect(res.body.architecture.consentAndAudit).toBe(true);
    expect(res.body.architecture.watermarkOnClones).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.docs).toBe('/docs/VOICE_CLOUD.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'voice',
        'neural-tts',
        'voice-cloning',
        'instant-voice-cloning',
        'voice-studio',
        'emotion-voice',
        'voice-marketplace',
        'voice-analytics',
        'voice-biometrics',
      ]),
    );

    const tts = res.body.products.find((p: { id: string }) => p.id === 'neural-tts');
    expect(tts.status).toBe('shipped');
    expect(tts.api).toContain('/v1/tts/engine');

    const studio = res.body.products.find((p: { id: string }) => p.id === 'voice-studio');
    expect(studio.status).toBe('shipped');
    expect(studio.api).toContain('/v1/voice-studio/engine');
    expect(studio.console).toBe('/voice-studio');

    const cloning = res.body.products.find((p: { id: string }) => p.id === 'voice-cloning');
    expect(cloning.status).toBe('shipped');
    expect(cloning.api).toContain('/v1/voice-cloning/engine');

    const emotion = res.body.products.find((p: { id: string }) => p.id === 'emotion-voice');
    expect(emotion.status).toBe('shipped');
    expect(emotion.api).toContain('/v1/emotion-voice/engine');

    const enhancement = res.body.products.find((p: { id: string }) => p.id === 'voice-enhancement');
    expect(enhancement.status).toBe('shipped');
    expect(enhancement.api).toContain('/v1/voice-enhancement/engine');

    const marketplace = res.body.products.find((p: { id: string }) => p.id === 'voice-marketplace');
    expect(marketplace.status).toBe('shipped');
    expect(marketplace.api).toContain('/v1/voice-marketplace/engine');

    const voiceAnalytics = res.body.products.find((p: { id: string }) => p.id === 'voice-analytics');
    expect(voiceAnalytics.status).toBe('shipped');
    expect(voiceAnalytics.api).toContain('/v1/voice-analytics/engine');
    expect(voiceAnalytics.console).toBe('/voice-analytics');

    const biometrics = res.body.products.find((p: { id: string }) => p.id === 'voice-biometrics');
    expect(biometrics.status).toBe('shipped');
    expect(biometrics.api).toContain('/v1/voice-biometrics/engine');
  });

  it('returns org voice overview with TTS usage + deferred flags', async () => {
    const org = await seedOrg(prisma, `voice_${Date.now()}`);

    const overview = await voiceCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_voice',
      role: 'owner',
    });

    expect(overview.usage.tts).toBeDefined();
    expect(overview.workspace.voiceClones).toBeGreaterThanOrEqual(0);
    expect(overview.workspace.speakerProfiles).toBeGreaterThanOrEqual(0);
    expect(overview.deferred.neuralTtsProductization).toBe(false);
    expect(overview.deferred.streamingTts).toBe(true);
    expect(overview.deferred.emotionVoiceSynthesis).toBe(false);
    expect(overview.deferred.trainedExpressiveTts).toBe(true);
    expect(overview.deferred.ssmlTimelineStudio).toBe(false);
    expect(overview.deferred.nonlinearDaw).toBe(true);
    expect(overview.links.emotionVoice).toBe('/emotion-voice');
    expect(overview.links.neuralTts).toBe('/neural-tts');
    expect(overview.links.voiceStudio).toBe('/voice-studio');
    expect(overview.links.voiceEnhancement).toBe('/voice-enhancement');
    expect(overview.links.voiceBiometrics).toBe('/voice-biometrics');
    expect(overview.deferred.voiceRestoration).toBe(false);
    expect(overview.deferred.liveAec).toBe(true);
    expect(overview.deferred.antiSpoofLiveness).toBe(false);
    expect(overview.deferred.certifiedPad).toBe(true);
    expect(overview.deferred.voiceMarketplace).toBe(false);
    expect(overview.deferred.celebrityVoiceSkus).toBe(true);
    expect(overview.links.voiceMarketplace).toBe('/voice-marketplace');
    expect(overview.deferred.voiceAnalyticsProduct).toBe(false);
    expect(overview.deferred.biVoiceDashboard).toBe(true);
    expect(overview.links.voiceAnalytics).toBe('/voice-analytics');
    expect(overview.deferred.nistVoiceBiometrics).toBe(true);
    expect(overview.links.audio).toBe('/audio');
    expect(overview.links.speakers).toBe('/speaker-intelligence');
    expect(overview.links.voiceCloud).toBe('/voice-cloud');
    expect(overview.links.graphql).toBe('/graphql');
    expect(overview.architecture.hexagonalRewrite).toBe(false);
  });

  it('exposes voiceProducts via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ voiceProducts { id name status } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    const products = res.body.data.voiceProducts as Array<{ id: string; status: string }>;
    expect(products.length).toBeGreaterThan(5);
    expect(products.some((p) => p.id === 'neural-tts' && p.status === 'shipped')).toBe(true);
    expect(products.some((p) => p.id === 'emotion-voice' && p.status === 'shipped')).toBe(true);
  });
});
