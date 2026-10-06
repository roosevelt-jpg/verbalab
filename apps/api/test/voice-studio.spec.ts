import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { compileSsmlLite } from '../src/voice-studio/ssml-lite';
import { applyPronunciationLexicon } from '../src/voice-studio/pronunciation-lexicon';

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
              clerkUserId: `clerk_vs_${name}_${Date.now}_${Math.random}`,
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

describe('Voice Studio',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setTtsProviderForTests({
      name: 'fixture',
      listVoices {
        return [
          {
            id: 'alloy',
            name: 'Alloy',
            gender: 'neutral',
            languages: ['en'],
            provider: 'fixture',
          },
          {
            id: 'nova',
            name: 'Nova',
            gender: 'female',
            languages: ['en'],
            provider: 'fixture',
          },
        ];
      },
      async synthesize(input) {
        return {
          audio: Buffer.from(`AUDIO:${input.voice}:${input.text}`),
          mimeType: 'audio/mpeg',
          format: 'mp3',
          voice: input.voice,
          characters: [...input.text].length,
          provider: 'fixture',
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async  => {
    await app.close;
  });

  it('documents Voice Studio as non-DAW with SSML lite honesty',  => {
    const doc = join(root, 'docs/VOICE_STUDIO.md');
    const adr = join(root, 'docs/adr/0085-voice-studio.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('SSML lite');
    expect(text).toMatch(/is \*\*not\*\* a full nonlinear/i);
  });

  it('compiles SSML lite without spoken stage directions',  => {
    const plan = compileSsmlLite(
      '<speak>Hello <prosody rate="slow">world</prosody>. <break time="200ms"/><phoneme alphabet="ipa" ph="vɝbəlæb">Lugemi</phoneme></speak>',
    );
    expect(plan.plainText.toLowerCase).toContain('hello');
    expect(plan.plainText.toLowerCase).toContain('vɝbəlæb');
    expect(plan.segments.some((s) => s.kind === 'pause')).toBe(true);
    expect(plan.plainText.toLowerCase).not.toContain('say slowly');
  });

  it('applies pronunciation lexicon as word aliases',  => {
    const out = applyPronunciationLexicon('Welcome to Lugemi studio', [
      { grapheme: 'Lugemi', alias: 'Verba Lab' },
    ]);
    expect(out).toBe('Welcome to Verba Lab studio');
  });

  it('exposes engine with nonlinearDaw=false', async  => {
    const engine = await request(app.getHttpServer).get('/v1/voice-studio/engine').expect(200);
    expect(engine.body.product).toBe('Lugemi Voice Studio');
    expect(engine.body.architecture.nonlinearDaw).toBe(false);
    expect(engine.body.honesty.vendorSsmlPassthrough).toBe(false);
    const timeline = engine.body.capabilities.find((c: { id: string }) => c.id === 'timeline-editing');
    expect(timeline.status).toBe('partial');
  });

  it('upserts pronunciation, previews with lexicon, and compares voices', async  => {
    const org = await seedOrg(prisma, 'vs');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'vs-key',
    });

    const lex = await request(app.getHttpServer)
      .post('/v1/voice-studio/pronunciation')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ grapheme: 'Lugemi', alias: 'Verba Lab' });
    expect([200, 201]).toContain(lex.status);
    expect(lex.body.alias).toBe('Verba Lab');

    const preview = await request(app.getHttpServer)
      .post('/v1/voice-studio/preview')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hello Lugemi', voice: 'alloy' })
      .expect(200);

    expect(preview.headers['x-lugemi-voice']).toBe('alloy');
    expect(Buffer.from(preview.body).toString('utf8')).toContain('AUDIO:alloy:Hello Verba Lab');

    const compare = await request(app.getHttpServer)
      .post('/v1/voice-studio/compare')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hi', voices: ['alloy', 'nova'] });
    expect([200, 201]).toContain(compare.status);
    expect(compare.body.clips).toHaveLength(2);
    expect(compare.body.clips[0].voice).toBe('alloy');
    expect(compare.body.clips[1].voice).toBe('nova');

    const project = await request(app.getHttpServer)
      .post('/v1/voice-studio/projects')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        name: 'Demo',
        timeline: [{ text: 'One' }, { text: 'Two', pauseMsAfter: 100 }],
      });
    expect([200, 201]).toContain(project.status);

    const timeline = await request(app.getHttpServer)
      .post('/v1/voice-studio/timeline/render')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ projectId: project.body.id, defaultVoice: 'alloy' });
    expect([200, 201]).toContain(timeline.status);

    expect(timeline.body.clips).toHaveLength(2);
    expect(timeline.body.note).toMatch(/not nonlinear/i);
  });

  it('exposes voiceStudioEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: '{ voiceStudioEngine { product nonlinearDaw capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.voiceStudioEngine.nonlinearDaw).toBe(false);
    expect(res.body.data.voiceStudioEngine.capabilities.length).toBeGreaterThan(5);
  });
});
