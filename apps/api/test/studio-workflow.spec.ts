import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { generateSpeechWav } from '../src/gateway/own-tts.adapter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_swf_${name}_${Date.now()}_${Math.random()}`,
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

describe('Voice Studio workspace workflow', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let key: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const fixtureWav = {
      name: 'fixture_wav',
      listVoices() {
        return [
          {
            id: 'own:sw-ke-female',
            name: 'Aisha',
            gender: 'female',
            languages: ['sw'],
            locale: 'sw-KE',
            provider: 'fixture',
          },
        ];
      },
      async synthesize(input: { text: string; voice?: string }) {
        const wav = generateSpeechWav(input.text, input.voice || 'own:sw-ke-female', 'sw-KE', {
          allowFormant: false,
        });
        return {
          audio: wav.audio,
          mimeType: 'audio/wav',
          format: 'wav' as const,
          voice: input.voice || 'own:sw-ke-female',
          provider: 'fixture_wav',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    };
    app.get(GatewayService).setTtsProviderForTests(fixtureWav);
    app.get(GatewayService).setOwnTtsProviderForTests(fixtureWav);

    const org = await seedOrg(prisma, `studio_wf_${Date.now()}`);
    const minted = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'studio-workflow-test',
      environment: 'test',
    });
    key = minted.secret;
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('runs script → edition → generate → assemble → approve → export', async () => {
    const create = await request(app.getHttpServer())
      .post('/v1/voice-studio/workspace/projects')
      .set('Authorization', `Bearer ${key}`)
      .send({
        name: 'Pilot announcement',
        sourceLanguage: 'en',
        reviewPolicy: 'producer_self_preview',
      })
      .expect(201);

    // Nest may return 200 depending on config — accept either via no .expect if needed
    const projectId = create.body.id as string;
    expect(projectId).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/projects/${projectId}/scripts`)
      .set('Authorization', `Bearer ${key}`)
      .send({
        script:
          'Welcome to Lugemi.\n\nWe can deliver fifty bags by Friday for 200 dollars.\n\nPlease confirm.',
      })
      .expect(201);

    const editionRes = await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/projects/${projectId}/editions`)
      .set('Authorization', `Bearer ${key}`)
      .send({ languageVariety: 'sw-KE', voiceId: 'own:sw-ke-female' });
    expect([200, 201]).toContain(editionRes.status);
    const editionId = editionRes.body.edition.id as string;
    const rev = editionRes.body.edition.expectedRevision as number;

    const tr = await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/editions/${editionId}/translations`)
      .set('Authorization', `Bearer ${key}`)
      .send({ expectedRevision: rev });
    expect([200, 201]).toContain(tr.status);

    // Unsupported voice must not fake success
    const bad = await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/projects/${projectId}/editions`)
      .set('Authorization', `Bearer ${key}`)
      .send({ languageVariety: 'yo-NG', voiceId: 'own:yo-ng-male' });
    expect(bad.status).toBe(422);

    const gen = await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/editions/${editionId}/generations`)
      .set('Authorization', `Bearer ${key}`)
      .send({ expectedRevision: tr.body.edition.expectedRevision });
    expect([200, 201]).toContain(gen.status);
    expect(gen.body.takes.length).toBeGreaterThan(0);
    expect(gen.body.takes[0].audioSha256).toMatch(/^[a-f0-9]{64}$/);

    const takeId = gen.body.takes[0].id as string;
    const audio = await request(app.getHttpServer())
      .get(`/v1/voice-studio/workspace/takes/${takeId}/audio`)
      .set('Authorization', `Bearer ${key}`)
      .expect(200);
    expect(audio.headers['content-type']).toMatch(/audio/);
    expect(audio.body.toString('ascii', 0, 4)).toBe('RIFF');

    for (const take of gen.body.takes as Array<{ id: string }>) {
      await request(app.getHttpServer())
        .post(`/v1/voice-studio/workspace/takes/${take.id}/reviews`)
        .set('Authorization', `Bearer ${key}`)
        .send({
          decision: 'approved',
          qualifications: ['sw-KE'],
          ratings: {
            intelligibility: 4,
            naturalness: 4,
            lexicalTone: 4,
            varietyAuthenticity: 4,
            meaningPreservation: 4,
            joinQuality: 4,
          },
        })
        .expect((res) => expect([200, 201]).toContain(res.status));
    }

    const asm = await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/editions/${editionId}/assemblies`)
      .set('Authorization', `Bearer ${key}`)
      .send({ takeIds: gen.body.takes.map((t: { id: string }) => t.id), pauseMs: 120 });
    expect([200, 201]).toContain(asm.status);
    const assemblyId = asm.body.assembly.id as string;
    const assemblyHash = asm.body.assembly.audioSha256 as string;

    const release = await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/assemblies/${assemblyId}/approvals`)
      .set('Authorization', `Bearer ${key}`)
      .send({ assemblyHash });
    expect([200, 201]).toContain(release.status);

    // Stale hash rejected
    await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/assemblies/${assemblyId}/approvals`)
      .set('Authorization', `Bearer ${key}`)
      .send({ assemblyHash: '0'.repeat(64) })
      .expect(409);

    const exp = await request(app.getHttpServer())
      .post(`/v1/voice-studio/workspace/releases/${release.body.release.id}/exports`)
      .set('Authorization', `Bearer ${key}`)
      .send({ format: 'wav' });
    expect([200, 201]).toContain(exp.status);
    expect(exp.body.export.manifest.releaseId).toBe(release.body.release.id);
    expect(exp.body.export.manifest.assemblyHash).toBe(assemblyHash);
    expect(exp.body.export.checksum).toBeTruthy();
  }, 120_000);
});
