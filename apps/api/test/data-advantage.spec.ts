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
              clerkUserId: `clerk_da_${name}_${Date.now()}_${Math.random()}`,
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

describe('Data Advantage (08_DATA)', () => {
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

  it('archives 08_DATA brief and has no TODO markers', () => {
    expect(existsSync(join(root, 'docs/next-model-portfolio/08_DATA.md'))).toBe(true);
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'data-advantage'))) {
      if (banned.test(readFileSync(file, 'utf8'))) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine with seven streams and no invented confidence', async () => {
    const res = await request(app.getHttpServer()).get('/v1/data-advantage/engine').expect(200);
    expect(res.body.product).toBe('Lugemi Data Advantage');
    expect(res.body.streams).toHaveLength(7);
    expect(JSON.stringify(res.body)).not.toMatch(/confidence_score|fake.?accuracy/i);
    expect(res.body.note).toMatch(/No silent online gradient updates/i);
  });

  it('registers contributor, ingests record, denies withdrawn export', async () => {
    const org = await seedOrg(prisma, 'da');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'da-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    const contrib = await request(app.getHttpServer())
      .post('/v1/data-advantage/contributors')
      .set(auth)
      .send({
        permittedPurposes: ['service_processing', 'model_training'],
        territories: ['GH'],
      })
      .expect(201);
    expect(contrib.body.contributor_id).toMatch(/^contrib_/);
    expect(contrib.body.permitted_purposes).toContain('model_training');

    const ingest = await request(app.getHttpServer())
      .post('/v1/data-advantage/records')
      .set(auth)
      .send({
        contributorId: contrib.body.contributor_id,
        artifactContent: `twi-english contrast ${Date.now()}`,
        sourceLanguageTags: ['ak', 'en'],
        varietyId: 'ak-GH-twi',
        streamId: 'meaning_contrasts',
        labelStatus: 'adjudicated',
        split: 'train',
      })
      .expect(201);
    expect(ingest.body.record.record_id).toMatch(/^record_/);
    expect(ingest.body.record.split).toBe('train');
    expect(ingest.body.record.artifact_hash).toHaveLength(64);

    const okExport = await request(app.getHttpServer())
      .post('/v1/data-advantage/records/export-check')
      .set(auth)
      .send({ recordIds: [ingest.body.record.record_id], requiredPurpose: 'model_training' })
      .expect(200);
    expect(okExport.body.denied_count).toBe(0);

    await request(app.getHttpServer())
      .post(`/v1/data-advantage/contributors/${contrib.body.contributor_id}/withdraw`)
      .set(auth)
      .send({})
      .expect(200);

    const denied = await request(app.getHttpServer())
      .post('/v1/data-advantage/records/export-check')
      .set(auth)
      .send({ recordIds: [ingest.body.record.record_id], requiredPurpose: 'model_training' })
      .expect(200);
    expect(denied.body.denied_count).toBe(1);
    expect(denied.body.results[0].reason).toBe('withdrawn_contributor');

    await request(app.getHttpServer())
      .post('/v1/data-advantage/records')
      .set(auth)
      .send({
        contributorId: contrib.body.contributor_id,
        artifactContent: `after withdraw ${Date.now()}`,
        sourceLanguageTags: ['ak', 'en'],
        streamId: 'mixed_conversation',
        labelStatus: 'raw',
      })
      .expect(403);
  });

  it('rejects invented language tags and samples error loop', async () => {
    const org = await seedOrg(prisma, 'da2');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'da2-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    const contrib = await request(app.getHttpServer())
      .post('/v1/data-advantage/contributors')
      .set(auth)
      .send({ permittedPurposes: ['model_training'] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/data-advantage/records')
      .set(auth)
      .send({
        contributorId: contrib.body.contributor_id,
        artifactContent: 'x',
        sourceLanguageTags: ['xx-invented'],
        streamId: 'mixed_conversation',
      })
      .expect(400);

    const sample = await request(app.getHttpServer())
      .post('/v1/data-advantage/error-loop/sample')
      .set(auth)
      .send({ streamId: 'meaning_contrasts', corridor: 'twi-english' })
      .expect(200);
    expect(sample.body.silent_online_updates).toBe(false);
    expect(sample.body.steps.length).toBe(6);
  });

  it('freezes release only when rights and review gates pass', async () => {
    const org = await seedOrg(prisma, 'da3');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'da3-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };
    const contrib = await request(app.getHttpServer())
      .post('/v1/data-advantage/contributors')
      .set(auth)
      .send({ permittedPurposes: ['model_training'] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/data-advantage/records')
      .set(auth)
      .send({
        contributorId: contrib.body.contributor_id,
        datasetVersion: 'mix-pilot-freeze',
        artifactContent: `freeze-${Date.now()}`,
        sourceLanguageTags: ['yo', 'en'],
        streamId: 'mixed_conversation',
        labelStatus: 'raw',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/data-advantage/releases')
      .set(auth)
      .send({ datasetVersion: 'mix-pilot-freeze' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/v1/data-advantage/records')
      .set(auth)
      .send({
        contributorId: contrib.body.contributor_id,
        datasetVersion: 'mix-pilot-ok',
        artifactContent: `freeze-ok-${Date.now()}`,
        sourceLanguageTags: ['yo', 'en'],
        streamId: 'mixed_conversation',
        labelStatus: 'adjudicated',
        split: 'test',
      })
      .expect(201);

    const release = await request(app.getHttpServer())
      .post('/v1/data-advantage/releases')
      .set(auth)
      .send({ datasetVersion: 'mix-pilot-ok' })
      .expect(201);
    expect(release.body.gates.every_item_has_permitted_purpose).toBe(true);
    expect(release.body.split_audit.test).toBe(1);
  });
});
