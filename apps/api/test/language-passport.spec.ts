import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { languagePassportCatalog } from '../src/language-passport/passport.catalog';
import { findPhraseSpans, contextsCompatible } from '../src/language-passport/passport.normalize';
import { resolvePassportPlan } from '../src/language-passport/passport.resolver';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      plan: 'pro',
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_lp_${name}_${Date.now()}_${Math.random()}`,
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

describe('Language Passport units', () => {
  it('catalog is fully wired without pilot/MVP stubs', () => {
    const catalog = languagePassportCatalog();
    expect(catalog.featureFlag).toBe('languagePassport');
    expect(catalog.entryTypes).toContain('local_unit_definition');
    expect(catalog.modelSync.accentIdentityPacks).toBeGreaterThan(100);
    expect(catalog.modelSync.ownTtsVoices).toBeGreaterThan(10);
    const blob = JSON.stringify(catalog).toLowerCase();
    expect(blob).not.toContain('todo');
    expect(blob).not.toContain('mvp');
    expect(blob).not.toContain('pilot');
  });

  it('does not substring-match inside unrelated words', () => {
    expect(findPhraseSpans('baggage claim', 'bag')).toHaveLength(0);
    expect(findPhraseSpans('one bag of rice', 'one bag')).toHaveLength(1);
  });

  it('rice unit definition does not apply to flour or unknown business context', () => {
    const plan = resolvePassportPlan({
      text: 'Please deliver one bag of flour',
      product: 'dealbridge',
      personalizationEnabled: true,
      context: { product: 'flour' },
      entries: [
        {
          entryId: 'e1',
          revision: 1,
          type: 'local_unit_definition',
          sourceForm: 'one bag',
          languageVariety: 'gh-ghanaian-english',
          direction: 'bidirectional',
          approvedValue: { packageCount: '1', packageSize: '25', unit: 'kg' },
          context: { category: 'rice_trade', product: 'rice', businessScopeId: 'biz_1' },
          status: 'approved',
          precedence: 'user',
        },
      ],
    });
    expect(plan.matched).toHaveLength(0);
    expect(plan.outcome).toBe('skipped');
  });

  it('task override wins over historical memory for the current task', () => {
    const plan = resolvePassportPlan({
      text: 'Send one bag tomorrow',
      product: 'dealbridge',
      personalizationEnabled: true,
      context: { product: 'rice', businessScopeId: 'biz_1' },
      taskOverrides: [{ sourceForm: 'one bag', approvedValue: { packageCount: '1', packageSize: '50', unit: 'kg' } }],
      entries: [
        {
          entryId: 'e1',
          revision: 1,
          type: 'local_unit_definition',
          sourceForm: 'one bag',
          languageVariety: 'any',
          direction: 'bidirectional',
          approvedValue: { packageCount: '1', packageSize: '25', unit: 'kg' },
          context: { product: 'rice', businessScopeId: 'biz_1' },
          status: 'approved',
          precedence: 'user',
        },
      ],
    });
    expect(plan.matched.some((m) => m.precedence === 'task_override')).toBe(true);
    expect(plan.matched.some((m) => m.entryId === 'e1')).toBe(false);
  });

  it('conflicting quantities request clarification', () => {
    const plan = resolvePassportPlan({
      text: 'one bag please',
      product: 'dealbridge',
      personalizationEnabled: true,
      context: { product: 'rice', businessScopeId: 'biz_1' },
      entries: [
        {
          entryId: 'e1',
          revision: 1,
          type: 'local_unit_definition',
          sourceForm: 'one bag',
          languageVariety: 'any',
          direction: 'bidirectional',
          approvedValue: { packageCount: '1', packageSize: '25', unit: 'kg' },
          context: { product: 'rice', businessScopeId: 'biz_1' },
          status: 'approved',
          precedence: 'user',
        },
        {
          entryId: 'e2',
          revision: 1,
          type: 'local_unit_definition',
          sourceForm: 'one bag',
          languageVariety: 'any',
          direction: 'bidirectional',
          approvedValue: { packageCount: '1', packageSize: '50', unit: 'kg' },
          context: { product: 'rice', businessScopeId: 'biz_1' },
          status: 'approved',
          precedence: 'project',
        },
      ],
    });
    expect(plan.outcome).toBe('clarification_required');
    expect(plan.conflicts.length).toBe(1);
  });

  it('preserves diacritics under NFC normalization', () => {
    const spans = findPhraseSpans('café menu', 'café');
    expect(spans).toHaveLength(1);
    expect(contextsCompatible({ product: 'rice' }, { product: 'rice' }).ok).toBe(true);
  });

  it('unsaved corrections are not resolvable (status gate)', () => {
    const plan = resolvePassportPlan({
      text: 'mobile money',
      product: 'translate',
      sourceLang: 'en',
      targetLang: 'ak',
      personalizationEnabled: true,
      entries: [
        {
          entryId: 'e1',
          revision: 1,
          type: 'approved_translation',
          sourceForm: 'mobile money',
          languageVariety: 'any',
          sourceLang: 'en',
          targetLang: 'ak',
          direction: 'source_to_target',
          approvedValue: { kind: 'translation', value: 'momo', targetLang: 'ak' },
          context: {},
          status: 'awaiting_user_approval',
          precedence: 'user',
        },
      ],
    });
    expect(plan.matched).toHaveLength(0);
  });
});

describe('Language Passport API', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    process.env.LANGUAGE_PASSPORT_ALLOW_TEST_ACTORS = '1';
    process.env.NOTIFICATIONS_DISABLED = '1';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs profile → entry → approve → resolve → grant → export/import → delete', async () => {
    const org = await seedOrg(prisma, 'langpass');
    const userId = org.memberships[0]!.userId;
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      name: 'lp-test',
      environment: 'test',
      userId,
    });

    const auth = { Authorization: `Bearer ${key.secret}`, 'X-Language-Passport-Actor-Id': userId };

    const me = await request(app.getHttpServer()).get('/v1/passport/me').set(auth).expect(200);
    expect(me.body.ownerUserId).toBe(userId);
    expect(me.body.promise).toMatch(/Your language/i);

    const prefs = await request(app.getHttpServer())
      .patch('/v1/passport/preferences')
      .set(auth)
      .send({
        preferredVarieties: ['gh-ghanaian-english'],
        preferredVoiceIds: ['own:en-gh-female'],
        personalizationEnabled: true,
      })
      .expect(200);
    expect(prefs.body.preferredVarieties).toContain('gh-ghanaian-english');

    // Unapproved entry must not resolve
    const pending = await request(app.getHttpServer())
      .post('/v1/passport/entries')
      .set(auth)
      .send({
        type: 'approved_translation',
        sourceForm: 'mobile money',
        languageVariety: 'gh-ghanaian-english',
        sourceLang: 'en',
        targetLang: 'ak',
        approvedValue: { kind: 'translation', value: 'sika a ɛnam telefon so', targetLang: 'ak' },
        autoApprove: false,
      })
      .expect(201);
    expect(pending.body.status).toBe('awaiting_user_approval');

    const skipped = await request(app.getHttpServer())
      .post('/v1/passport/resolutions')
      .set(auth)
      .send({
        product: 'translate',
        text: 'I use mobile money daily',
        sourceLang: 'en',
        targetLang: 'ak',
        languageVariety: 'gh-ghanaian-english',
      })
      .expect(200);
    expect(skipped.body.outcome).toBe('skipped');

    await request(app.getHttpServer())
      .post(`/v1/passport/entries/${pending.body.id}/approvals`)
      .set(auth)
      .send({})
      .expect(200);

    const applied = await request(app.getHttpServer())
      .post('/v1/passport/resolutions')
      .set(auth)
      .send({
        product: 'translate',
        text: 'I use mobile money daily',
        sourceLang: 'en',
        targetLang: 'ak',
        languageVariety: 'gh-ghanaian-english',
        pinSnapshot: true,
      })
      .expect(200);
    expect(applied.body.outcome).toBe('applied');
    expect(applied.body.glossaryTerms.length).toBeGreaterThan(0);
    expect(applied.body.snapshotId).toBeTruthy();

    // Unit definition with context
    const unit = await request(app.getHttpServer())
      .post('/v1/passport/entries')
      .set(auth)
      .send({
        type: 'local_unit_definition',
        sourceForm: 'one bag',
        languageVariety: 'gh-ghanaian-english',
        approvedValue: { packageCount: '1', packageSize: '25', unit: 'kg' },
        context: { category: 'rice_trade', product: 'rice', businessScopeId: 'biz_rice' },
        autoApprove: true,
      })
      .expect(201);

    const flour = await request(app.getHttpServer())
      .post('/v1/passport/resolutions')
      .set(auth)
      .send({
        product: 'dealbridge',
        text: 'Deliver one bag tomorrow',
        languageVariety: 'gh-ghanaian-english',
        context: { product: 'flour', businessScopeId: 'biz_rice' },
      })
      .expect(200);
    expect(flour.body.matched).toHaveLength(0);

    const rice = await request(app.getHttpServer())
      .post('/v1/passport/resolutions')
      .set(auth)
      .send({
        product: 'dealbridge',
        text: 'Deliver one bag tomorrow',
        languageVariety: 'gh-ghanaian-english',
        context: { product: 'rice', businessScopeId: 'biz_rice' },
      })
      .expect(200);
    expect(rice.body.unitClarifications[0].packageSize).toBe('25');

    const grant = await request(app.getHttpServer())
      .post('/v1/passport/grants')
      .set(auth)
      .send({
        entryIds: [unit.body.id],
        purpose: 'relay_booking',
        permittedProducts: ['relay'],
        granteeResource: 'booking_demo',
        ttlHours: 2,
      })
      .expect(201);

    await request(app.getHttpServer()).delete(`/v1/passport/grants/${grant.body.id}`).set(auth).expect(200);

    const exported = await request(app.getHttpServer()).post('/v1/passport/exports').set(auth).send({}).expect(200);
    expect(exported.body.schemaVersion).toBe('lugemi.language_passport.v1');
    expect(exported.body.checksum).toMatch(/^[a-f0-9]{64}$/);

    const preview = await request(app.getHttpServer())
      .post('/v1/passport/import-previews')
      .set(auth)
      .send({
        schemaVersion: exported.body.schemaVersion,
        entries: [
          {
            type: 'preferred_name',
            sourceForm: 'Kofi',
            languageVariety: 'gh-ghanaian-english',
            approvedValue: { kind: 'text', value: 'Kofi' },
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/passport/imports/${preview.body.id}/confirm`)
      .set(auth)
      .expect(200);

    // Foreign grants rejected
    await request(app.getHttpServer())
      .post('/v1/passport/import-previews')
      .set(auth)
      .send({
        schemaVersion: 'lugemi.language_passport.v1',
        entries: [],
        grants: [{ id: 'evil' }],
      })
      .expect(400);

    await request(app.getHttpServer()).delete('/v1/passport/me').set(auth).expect(200);

    const glossary = await prisma.glossaryTerm.findFirst({
      where: {
        workspaceId: org.workspaces[0]!.id,
        sourceTerm: 'mobile money',
      },
    });
    expect(glossary?.targetTerm).toMatch(/sika|telefon|momo/i);
  });
});
