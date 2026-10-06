import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModelTrainingPlatformService } from '../src/model-training-platform/model-training-platform.service';
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
              clerkUserId: `clerk_mtp_${name}_${Date.now()}_${Math.random()}`,
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

describe('Model Training Platform (VL-235)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let platform: ModelTrainingPlatformService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    platform = app.get(ModelTrainingPlatformService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents training platform honesty (no distributed/RLHF lab)', () => {
    const doc = join(root, 'docs/MODEL_TRAINING_PLATFORM.md');
    const adr = join(root, 'docs/adr/0136-model-training-platform.md');
    const readme = join(
      root,
      'docs/roadmap/volume9-foundation-model-cloud/README_VOLUME9.md',
    );
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('VL-235');
    expect(text).toMatch(/VL-111|training-jobs/i);
    expect(text).toMatch(/not.*distributed|Deferred/i);
    expect(text).toMatch(/RLHF/i);
    expect(text).toContain('CQRS');
  });

  it('has no TODO/FIXME/implement-later markers in Model Training Platform source', () => {
    const roots = [join(apiSrc, 'model-training-platform')];
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const dir of roots) {
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes public engine with honest methods + launchers', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/model-training-platform/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Model Training Platform');
    expect(res.body.honesty.trainsCompetitiveFoundationWeights).toBe(false);
    expect(res.body.honesty.distributedTrainingOs).toBe(false);
    expect(res.body.honesty.rlhfLabOs).toBe(false);
    expect(res.body.honesty.regeneratesVl111).toBe(false);
    expect(res.body.architecture.extendsTrainingJobs).toBe(true);
    expect(res.body.safety.noFakeGpuSuccess).toBe(true);
    expect(res.body.docs).toBe('/docs/MODEL_TRAINING_PLATFORM.md');

    const lora = res.body.methods.find((m: { id: string }) => m.id === 'lora');
    expect(lora.launchable).toBe(true);
    expect(lora.status).toBe('partial');

    const rlhf = res.body.methods.find((m: { id: string }) => m.id === 'rlhf');
    expect(rlhf.launchable).toBe(false);
    expect(rlhf.status).toBe('deferred');

    expect(res.body.launchers.launchers.some((l: { name: string }) => l.name === 'manual')).toBe(
      true,
    );
  });

  it('creates LoRA experiment, checkpoints, and launches handoff to VL-111', async () => {
    const org = await seedOrg(prisma, `mtp_${Date.now()}`);
    const session = {
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_mtp',
      role: 'owner',
    };

    const created = platform.createExperiment(session, {
      method: 'lora',
      name: 'test-lora',
      sourceLang: 'en',
      targetLang: 'sw',
      hyperparams: { rank: 8 },
    });
    expect(created.experiment.status).toBe('ready_to_launch');
    expect(created.experiment.method).toBe('lora');

    const ckpt = platform.checkpointExperiment(session, created.experiment.id, {
      note: 'epoch-0',
    });
    expect(ckpt.experiment.checkpointIndex).toBe(1);
    expect(ckpt.experiment.status).toBe('checkpointed');

    const launched = platform.launchExperiment(session, created.experiment.id);
    expect(launched.experiment.status).toBe('handed_off');
    expect(launched.handoff.api).toBe('POST /v1/training-jobs');
    expect(launched.handoff.body.launcher).toBe('manual');

    expect(() =>
      platform.launchExperiment(session, platform.createExperiment(session, { method: 'rlhf' })
        .experiment.id),
    ).toThrow(/not launchable/i);
  });

  it('exposes modelTrainingMethods via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ modelTrainingMethods { id name status launchable existingApi notes } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.modelTrainingMethods.length).toBeGreaterThan(5);
    expect(
      res.body.data.modelTrainingMethods.some((m: { id: string }) => m.id === 'lora'),
    ).toBe(true);
  });

  it('rejects unknown methods and enforces deferred launch', async () => {
    const org = await seedOrg(prisma, `mtp_bad_${Date.now()}`);
    const session = {
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_mtp',
      role: 'owner',
    };
    expect(() => platform.createExperiment(session, { method: 'warp_drive' })).toThrow(
      /Unknown training method/i,
    );
  });
});
