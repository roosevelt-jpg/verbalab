import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModelEvaluationPlatformService } from '../src/model-evaluation-platform/model-evaluation-platform.service';
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
              clerkUserId: `clerk_mep_${name}_${Date.now()}_${Math.random()}`,
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

describe('Model Evaluation Platform', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let platform: ModelEvaluationPlatformService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    platform = app.get(ModelEvaluationPlatformService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents evaluation platform honesty (no SOTA / MMLU OS)', () => {
    const doc = join(root, 'docs/MODEL_EVALUATION_PLATFORM.md');
    const adr = join(root, 'docs/adr/0137-model-evaluation-platform.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('');
    expect(text).toMatch(/|eval\/run|coverage/i);
    expect(text).toMatch(/SOTA|leaderboard/i);
    expect(text).toContain('CQRS');
    expect(text).toMatch(/MMLU/i);
  });

  it('has no TODO/FIXME/implement-later markers in Model Evaluation Platform source', () => {
    const roots = [join(apiSrc, 'model-evaluation-platform')];
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

  it('exposes public engine with honest suites', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/model-evaluation-platform/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Model Evaluation Platform');
    expect(res.body.honesty.globalLeaderboardOs).toBe(false);
    expect(res.body.honesty.mmluOs).toBe(false);
    expect(res.body.honesty.sotaClaimsForbidden).toBe(true);
    expect(res.body.honesty.regeneratesVl100).toBe(false);
    expect(res.body.architecture.extendsVl100Coverage).toBe(true);
    expect(res.body.safety.sotaClaimsForbidden).toBe(true);
    expect(res.body.docs).toBe('/docs/MODEL_EVALUATION_PLATFORM.md');

    const translation = res.body.suites.find((s: { id: string }) => s.id === 'translation');
    expect(translation.runnable).toBe(true);
    expect(translation.status).toBe('partial');

    const mmlu = res.body.suites.find((s: { id: string }) => s.id === 'mmlu');
    expect(mmlu.runnable).toBe(false);
    expect(mmlu.status).toBe('deferred');
  });

  it('runs sandbox safety and hands off translation to ', async () => {
    const org = await seedOrg(prisma, `mep_${Date.now()}`);
    const session = {
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_mep',
      role: 'owner',
    };

    const safety = platform.createRun(session, { suite: 'safety', label: 'safe-1' });
    expect(safety.run.status).toBe('completed');
    expect(safety.run.score).toBeGreaterThan(0);
    expect(safety.run.metrics.sandbox).toBe(true);

    const translation = platform.createRun(session, {
      suite: 'translation',
      label: 'mt-1',
    });
    expect(translation.run.status).toBe('handed_off');
    expect(translation.handoff?.api).toBe('POST /v1/eval/run');

    const board = platform.leaderboard(session);
    expect(board.entries.length).toBeGreaterThan(0);
    expect(board.honesty.globalLeaderboardOs).toBe(false);

    const reports = platform.reports(session);
    expect(reports.disclaimer).toMatch(/not claim market leadership|SOTA/i);

    expect(() =>
      platform.executeRun(
        session,
        platform.createRun(session, { suite: 'mmlu', execute: false }).run.id,
      ),
    ).toThrow(/not runnable/i);
  });

  it('exposes modelEvaluationSuites via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ modelEvaluationSuites { id name status runnable existingApi notes } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.modelEvaluationSuites.length).toBeGreaterThan(5);
    expect(
      res.body.data.modelEvaluationSuites.some((s: { id: string }) => s.id === 'translation'),
    ).toBe(true);
  });
});
