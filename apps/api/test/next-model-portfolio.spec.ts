import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

const PORTFOLIO_MODULES = [
  'portfolio',
  'mix',
  'fidelity',
  'live',
  'pragmatics',
  'language-kits',
  'edge-packs',
  'grounded',
  'data-advantage',
  'corridor-benchmarks',
] as const;

const BRIEF_FILES = [
  '00_START_HERE.md',
  '01_MIX.md',
  '02_FIDELITY.md',
  '03_LIVE.md',
  '04_PRAGMATICS.md',
  '05_LANGUAGE_KIT.md',
  '06_EDGE.md',
  '07_GROUNDED.md',
  '08_DATA.md',
  '09_BENCHMARKS.md',
  'LUGEMI_NEXT_MODEL_PORTFOLIO.md',
] as const;

const REGISTRY_SLUGS = [
  'lugemi-mix',
  'lugemi-fidelity',
  'lugemi-live',
  'lugemi-pragmatics',
  'lugemi-language-kit',
  'lugemi-edge',
  'lugemi-grounded',
  'lugemi-data-advantage',
  'lugemi-corridor-benchmarks',
] as const;

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkTsFiles(full));
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
              clerkUserId: `clerk_nmp_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'ak' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Next model portfolio (00–07 contracts)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('archives briefs 00–09 and has no TODO/FIXME in portfolio modules', () => {
    for (const file of BRIEF_FILES) {
      expect(existsSync(join(root, 'docs/next-model-portfolio', file))).toBe(true);
    }
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented|throw new Error\(['"]Not implemented/i;
    const hits: string[] = [];
    for (const mod of PORTFOLIO_MODULES) {
      for (const file of walkTsFiles(join(apiSrc, mod))) {
        if (banned.test(readFileSync(file, 'utf8'))) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('registers all portfolio model slugs', async () => {
    const rows = await prisma.modelRegistryEntry.findMany({
      where: { slug: { in: [...REGISTRY_SLUGS] } },
      select: { slug: true, feature: true, kind: true },
    });
    expect(rows.map((r) => r.slug).sort()).toEqual([...REGISTRY_SLUGS].sort());
    expect(rows.every((r) => r.kind === 'lugemi')).toBe(true);
  });

  it('exposes portfolio engines with shared meta fields (00)', async () => {
    const engine = await request(app.getHttpServer()).get('/v1/portfolio/engine').expect(200);
    expect(engine.body.product).toMatch(/Verified Interpreter/i);
    const corridors = await request(app.getHttpServer()).get('/v1/portfolio/corridors').expect(200);
    expect(corridors.body.corridors.length).toBeGreaterThanOrEqual(200);
    expect(corridors.body.total).toBe(corridors.body.corridors.length);
    expect(corridors.body.corridors.some((c: { id: string }) => c.id === 'twi-english')).toBe(true);
    expect(corridors.body.corridors.some((c: { id: string }) => c.id === 'yoruba-english')).toBe(true);
    const mixEngine = await request(app.getHttpServer()).get('/v1/mix/engine').expect(200);
    expect(mixEngine.body.corridor_count).toBe(corridors.body.total);
    expect(mixEngine.body.evaluated_varieties.length).toBe(corridors.body.total);
  });

  it('Mix transcribe-translate returns spans and entity alignment (01)', async () => {
    const org = await seedOrg(prisma, 'mix');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'mix-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };
    const res = await request(app.getHttpServer())
      .post('/v1/mix/transcribe-translate')
      .set(auth)
      .send({
        textHint: 'Caller said mepɛ sika five hundred for Kwame Mensah then corrected to fifty',
        target: 'en',
        sourceHints: ['ak', 'en'],
        varietyId: 'ak-GH-twi',
      })
      .expect(200);
    expect(res.body.model_id).toBe('lugemi-mix');
    expect(res.body.request_id).toBeTruthy();
    expect(res.body.original_transcript).toMatch(/Kwame Mensah/);
    expect(res.body.spans.length).toBeGreaterThan(0);
    expect(res.body.entity_alignment.names[0].source).toMatch(/Kwame/);
    expect(res.body.status).toMatch(/preview|supported/);
    expect(JSON.stringify(res.body)).not.toMatch(/confidence_score/);
  });

  it('Fidelity flags negation/quantity and clarify rejects silence as confirmation (02)', async () => {
    const org = await seedOrg(prisma, 'fid');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'fid-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };
    const verify = await request(app.getHttpServer())
      .post('/v1/fidelity/verify')
      .set(auth)
      .send({
        source: 'I did not approve the transfer of 500',
        target: 'I approved the transfer of 5,000',
        sourceLanguage: 'en',
        targetLanguage: 'en',
      })
      .expect(200);
    expect(verify.body.decision).toMatch(/clarify|review|retry/);
    expect(verify.body.error_spans.some((e: { category: string }) => e.category === 'negation')).toBe(
      true,
    );
    expect(verify.body.clarify_id).toBeTruthy();
    expect(verify.body.calibration_version).toBeTruthy();
    expect(verify.body.error_event_definition).toBeTruthy();

    const silence = await request(app.getHttpServer())
      .post('/v1/fidelity/clarify')
      .set(auth)
      .send({ clarifyId: verify.body.clarify_id, answer: '' })
      .expect(200);
    expect(silence.body.resolution).toBe('unresolved');
    expect(silence.body.confirmed_value).toBeNull();
  });

  it('Live sessions commit/repair over SSE and refuse fake WebSocket upgrade (03)', async () => {
    const org = await seedOrg(prisma, 'live');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'live-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    const engine = await request(app.getHttpServer()).get('/v1/live/engine').expect(200);
    expect(engine.body.transport).toMatch(/SSE/i);
    expect(engine.body.transport).not.toMatch(/Native WebSocket upgrade mirrors/i);

    const session = await request(app.getHttpServer())
      .post('/v1/live/sessions')
      .set(auth)
      .send({
        sampleRate: 16000,
        sourceLanguage: 'yo',
        targetLanguage: 'en',
        transport: 'websocket',
      })
      .expect(201);
    expect(session.body.transport).toBe('sse');
    expect(session.body.warnings.join(' ')).toMatch(/SSE/i);

    const audio = await request(app.getHttpServer())
      .post(`/v1/live/sessions/${session.body.session_id}/audio`)
      .set(auth)
      .send({ sourceSequence: 1, textHint: 'Send fifty tomorrow not today', endOfUtterance: true })
      .expect(200);
    const spoken = audio.body.events.find((e: { type: string }) => e.type === 'translation.spoken');
    const committed = audio.body.events.find(
      (e: { type: string }) => e.type === 'translation.committed',
    );
    expect(spoken || committed).toBeTruthy();
    const segmentId = (spoken ?? committed).segment_id;

    const repair = await request(app.getHttpServer())
      .post(`/v1/live/sessions/${session.body.session_id}/repair`)
      .set(auth)
      .send({ segmentId, correctedText: 'Send fifty tomorrow, not today — correction' })
      .expect(200);
    expect(repair.body.events.some((e: { type: string }) => /repair/i.test(e.type))).toBe(true);
  });

  it('Pragmatics preserves request act and blocks refusal→consent (04)', async () => {
    const org = await seedOrg(prisma, 'prag');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'prag-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };
    const res = await request(app.getHttpServer())
      .post('/v1/pragmatics/translate')
      .set(auth)
      .send({
        text: 'Could you possibly send the receipt when you have a moment?',
        source: 'en',
        target: 'yo',
        mode: 'faithful',
      })
      .expect(200);
    expect(res.body.mode).toBe('faithful');
    expect(res.body.speech_act.act).toBe('request');
    expect(res.body.preserved_act_checks.ok).toBe(true);
  });

  it('Language kits create draft and expose coverage without claiming release (05)', async () => {
    const org = await seedOrg(prisma, 'kit');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'kit-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };
    const created = await request(app.getHttpServer())
      .post('/v1/language-kits')
      .set(auth)
      .send({ languageTag: 'ee', varietyId: 'ee-GH', displayName: 'Ewe ASR pilot' })
      .expect(201);
    expect(created.body.stage).toBe('draft');
    expect(created.body.note).toMatch(/not a model release/i);

    const coverage = await request(app.getHttpServer())
      .get(`/v1/language-kits/${created.body.id}/coverage`)
      .set(auth)
      .expect(200);
    expect(coverage.body.coverage.asr).toBeTruthy();
    expect(coverage.body.coverage.synthesis).toBeTruthy();
  });

  it('Edge packs verify hashes and never silent-cloud in cloud_forbidden (06)', async () => {
    const org = await seedOrg(prisma, 'edge');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'edge-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };
    const packs = await request(app.getHttpServer()).get('/v1/edge/packs').expect(200);
    expect(packs.body.packs.length).toBeGreaterThanOrEqual(200);
    expect(packs.body.total).toBeGreaterThanOrEqual(200);
    const packId = packs.body.packs[0].pack_id;

    const verify = await request(app.getHttpServer())
      .post(`/v1/edge/packs/${packId}/verify`)
      .send({})
      .expect(200);
    expect(verify.body.signature_valid).toBe(true);

    const run = await request(app.getHttpServer())
      .post(`/v1/edge/packs/${packId}/run`)
      .set(auth)
      .send({ mode: 'cloud_forbidden', text: 'Send fifty tomorrow', cloudAuthorized: false })
      .expect(200);
    expect(run.body.used_cloud).toBe(false);

    await request(app.getHttpServer())
      .post(`/v1/edge/packs/${packId}/run`)
      .set(auth)
      .send({ mode: 'cloud_forbidden', text: 'Send fifty tomorrow', cloudAuthorized: true })
      .expect(403);
  });

  it('Grounded preserves document amount GHS 500 over Line 2 ordinal (07)', async () => {
    const org = await seedOrg(prisma, 'gnd');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'gnd-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };
    const res = await request(app.getHttpServer())
      .post('/v1/grounded/interpret')
      .set(auth)
      .send({
        documentRef: 'doc://bill-1',
        documentHash: 'hash-audit-1',
        documentText: 'Line 2 Charge: GHS 500 Late fee',
        region: { page: 1, x: 10, y: 20, width: 200, height: 40 },
        utterance: 'what is this charge',
        sourceLanguage: 'en',
        targetLanguage: 'yo',
      })
      .expect(200);
    expect(res.body.resolved_referent.amount).toMatch(/GHS\s*500/i);
    expect(res.body.resolved_referent.currency).toMatch(/GHS/i);
    expect(res.body.document_evidence).toBeTruthy();
    expect(res.body.speaker_claim).toBeTruthy();
    expect(res.body.translation).toBeTruthy();

    const conflict = await request(app.getHttpServer())
      .post('/v1/grounded/interpret')
      .set(auth)
      .send({
        documentRef: 'doc://bill-1',
        documentHash: 'hash-audit-2',
        documentText: 'Line 2 Charge: GHS 500 Late fee',
        region: { page: 1, x: 10, y: 20, width: 200, height: 40 },
        utterance: 'what is this charge',
        sourceLanguage: 'en',
        targetLanguage: 'yo',
      })
      .expect(409);
    expect(conflict.body.error.code).toBe('validation_error');
  });
});
