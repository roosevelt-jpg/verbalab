import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');

/** Content-aware fixture embedding so semantic retrieval can find known phrases. */
function fakeEmbedding(text: string): number[] {
  const vec = Array.from({ length: 1536 }, () => 0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const t of tokens) {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    vec[Math.abs(h) % 1536] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) | 1;
  return vec.map((v) => v / norm);
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
              clerkUserId: `clerk_rag_${name}_${Date.now()}_${Math.random()}`,
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

describe('Enterprise RAG Platform', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'lugemi-erag-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const gateway = app.get(GatewayService);
    gateway.setEmbeddingProviderForTests({
      name: 'fixture_embeddings',
      async embed(input) {
        const texts = Array.isArray(input.input) ? input.input : [input.input];
        return {
          data: texts.map((text, index) => ({
            index,
            embedding: fakeEmbedding(`${text}:${index}`),
          })),
          model: 'fixture-embed',
          provider: 'fixture_embeddings',
          promptTokens: texts.length * 2,
          totalTokens: texts.length * 2,
          latencyMs: 1,
        };
      },
    });
    gateway.setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        const user = [...input.messages].reverse().find((m) => m.role === 'user');
        const content = user?.content ?? '';
        const question = (content.match(/Question:\s*([\s\S]*)$/i)?.[1] ?? '').trim();
        const ctxHasLeave = /twenty-two|22\) paid leave|paid leave days/i.test(content);
        const ctxHasRefund = /fourteen|14\) calendar|refund within/i.test(content);
        let answer = 'Insufficient context to answer from the knowledge base.';
        if (/refund/i.test(question) && ctxHasRefund) {
          answer = 'Refunds are accepted within 14 calendar days [1].';
        } else if (/leave/i.test(question) && ctxHasLeave) {
          answer = 'Employees receive 22 paid leave days per year [1].';
        } else if (ctxHasRefund && !ctxHasLeave) {
          answer = 'Refunds are accepted within 14 calendar days [1].';
        } else if (ctxHasLeave) {
          answer = 'Employees receive 22 paid leave days per year [1].';
        }
        return {
          message: { role: 'assistant', content: answer },
          model: 'fixture-model',
          provider: 'fixture_chat',
          promptTokens: 20,
          completionTokens: 12,
          totalTokens: 32,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('documents Enterprise RAG honesty (not LangChain OS; hand-verify required)', () => {
    const doc = join(root, 'docs/ENTERPRISE_RAG.md');
    const adr = join(root, 'docs/adr/0109-enterprise-rag-platform.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/LangChain/i);
    expect(text).toMatch(/hand-?verif/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
  });

  it('exposes engine with honest flags + chunk preview', async () => {
    const res = await request(app.getHttpServer()).get('/v1/enterprise-rag/engine').expect(200);
    expect(res.body.product).toContain('Enterprise RAG');
    expect(res.body.honesty.langchainOs).toBe(false);
    expect(res.body.honesty.agenticRagOs).toBe(false);
    expect(res.body.honesty.orgWorkspaceScoped).toBe(true);
    expect(res.body.honesty.extendsVl062).toBe(true);
    expect(res.body.honesty.handVerifyRequired).toBe(true);

    const chunk = await request(app.getHttpServer())
      .post('/v1/enterprise-rag/chunk')
      .send({
        text: 'Alpha paragraph about leave policy.\n\nBeta paragraph about refund windows.',
        size: 40,
        overlap: 5,
      })
      .expect(200);
    expect(chunk.body.chunkCount).toBeGreaterThanOrEqual(1);
    expect(chunk.body.chunks[0].content).toContain('Alpha');
  });

  it('hand-verifies retrieval + grounded answers on real documents with known facts', async () => {
    const org = await seedOrg(prisma, 'erag');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'erag-key',
    });

    const leaveDoc = [
      '# Employee Leave Policy',
      '',
      'Lugemi full-time employees receive twenty-two (22) paid leave days per year.',
      'Leave requests must be submitted at least five business days in advance.',
    ].join('\n');

    const refundDoc = [
      '# Customer Refund Policy',
      '',
      'Customers may request a refund within fourteen (14) calendar days of purchase.',
      'Digital goods are non-refundable after download completes.',
    ].join('\n');

    const leave = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', Buffer.from(leaveDoc), 'leave-policy.md')
      .expect(201);
    expect(leave.body.status).toBe('ready');
    expect(leave.body.chunkCount).toBeGreaterThanOrEqual(1);

    const refund = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', Buffer.from(refundDoc), 'refund-policy.md')
      .expect(201);
    expect(refund.body.status).toBe('ready');

    // Keyword retrieve — ILIKE needs a contiguous substring present in the doc.
    const leaveRetrieve = await request(app.getHttpServer())
      .post('/v1/enterprise-rag/retrieve')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'paid leave days per year', mode: 'keyword', k: 3 })
      .expect(200);

    expect(leaveRetrieve.body.citations.length).toBeGreaterThanOrEqual(1);
    expect(
      leaveRetrieve.body.passages.some(
        (p: { filename: string; content: string }) =>
          p.filename === 'leave-policy.md' && /22|twenty-two/i.test(p.content),
      ),
    ).toBe(true);
    // Top citation should be the leave document for this query.
    expect(leaveRetrieve.body.citations[0].filename).toBe('leave-policy.md');
    expect(leaveRetrieve.body.context.passageCount).toBeGreaterThanOrEqual(1);

    const refundRetrieve = await request(app.getHttpServer())
      .post('/v1/enterprise-rag/retrieve')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'calendar days of purchase', mode: 'keyword', k: 3 })
      .expect(200);
    expect(refundRetrieve.body.citations.length).toBeGreaterThanOrEqual(1);
    expect(refundRetrieve.body.citations[0].filename).toBe('refund-policy.md');
    expect(refundRetrieve.body.passages[0].content).toMatch(/14|fourteen/i);

    // Hybrid retrieve — content-aware fixture embeddings + keyword RRF.
    const hybrid = await request(app.getHttpServer())
      .post('/v1/enterprise-rag/retrieve')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ query: 'paid leave days per year', mode: 'hybrid', k: 4 })
      .expect(200);
    expect(
      hybrid.body.passages.some((p: { content: string }) =>
        /paid leave|twenty-two|22/i.test(p.content),
      ),
    ).toBe(true);

    // Grounded answers — use semantic so natural questions still retrieve the right passages.
    const leaveAnswer = await request(app.getHttpServer())
      .post('/v1/enterprise-rag/query')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        question: 'How many paid leave days do employees get?',
        mode: 'semantic',
      })
      .expect(200);
    expect(leaveAnswer.body.grounded).toBe(true);
    expect(leaveAnswer.body.answer).toMatch(/22/);
    expect(leaveAnswer.body.citations.length).toBeGreaterThanOrEqual(1);
    expect(
      leaveAnswer.body.citations.some(
        (c: { filename: string; snippet: string }) =>
          c.filename === 'leave-policy.md' && /22|twenty-two|leave/i.test(c.snippet),
      ),
    ).toBe(true);
    expect(leaveAnswer.body.honesty.langchainOs).toBe(false);

    // Keyword grounded path with a contiguous phrase from the refund doc.
    const refundAnswer = await request(app.getHttpServer())
      .post('/v1/enterprise-rag/query')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        question: 'request a refund within fourteen',
        mode: 'keyword',
      })
      .expect(200);
    expect(refundAnswer.body.answer).toMatch(/14/);
    expect(refundAnswer.body.citations[0].filename).toBe('refund-policy.md');
    expect(refundAnswer.body.citations[0].snippet).toMatch(/14|fourteen|refund/i);

    const analytics = await request(app.getHttpServer())
      .get('/v1/enterprise-rag/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.documents).toBeGreaterThanOrEqual(2);
    expect(analytics.body.retrievesLast30d).toBeGreaterThanOrEqual(1);
    expect(analytics.body.queriesLast30d).toBeGreaterThanOrEqual(1);
  });

  it('exposes enterpriseRagEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ enterpriseRagEngine { product langchainOs agenticRagOs orgWorkspaceScoped extendsVl062 handVerifyRequired capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.enterpriseRagEngine.langchainOs).toBe(false);
    expect(res.body.data.enterpriseRagEngine.agenticRagOs).toBe(false);
    expect(res.body.data.enterpriseRagEngine.orgWorkspaceScoped).toBe(true);
    expect(res.body.data.enterpriseRagEngine.handVerifyRequired).toBe(true);
  });
});
