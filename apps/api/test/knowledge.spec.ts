import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_know_${name}_${Date.now()}_${Math.random()}`,
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

/** Deterministic pseudo-embedding from text length for cosine ranking. */
function fakeEmbedding(seed: number): number[] {
  return Array.from({ length: 1536 }, (_, i) => Math.sin((seed + 1) * (i + 1) * 0.01) * 0.1);
}

describe('Knowledge + RAG (VL-062)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'verbalab-know-'));
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
            embedding: fakeEmbedding(text.length + index),
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
        return {
          message: {
            role: 'assistant',
            content: `Based on context [1]: VerbaLab HQ is in Nairobi. (q=${user?.content.slice(-40)})`,
          },
          model: 'fixture-model',
          provider: 'fixture_chat',
          promptTokens: 20,
          completionTokens: 10,
          totalTokens: 30,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('uploads a text document, lists it, and answers with citations', async () => {
    const org = await seedOrg(prisma, 'rag');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'know-key',
    });

    const body = Buffer.from(
      'VerbaLab headquarters is located in Nairobi, Kenya. The platform focuses on African language intelligence.',
      'utf8',
    );

    const upload = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', body, 'hq.txt')
      .expect(201);

    expect(upload.body.status).toBe('ready');
    expect(upload.body.chunkCount).toBeGreaterThanOrEqual(1);

    const listed = await request(app.getHttpServer())
      .get('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(listed.body.data.some((d: { id: string }) => d.id === upload.body.id)).toBe(true);

    const answer = await request(app.getHttpServer())
      .post('/v1/knowledge/query')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ question: 'Where is VerbaLab HQ?' })
      .expect(200);

    expect(answer.body.answer).toContain('Nairobi');
    expect(answer.body.citations.length).toBeGreaterThanOrEqual(1);
    expect(answer.body.citations[0].filename).toBe('hq.txt');
    expect(answer.body.provider).toBe('fixture_chat');
  });

  it('deletes a knowledge document', async () => {
    const org = await seedOrg(prisma, 'ragdel');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'del-key',
    });

    const upload = await request(app.getHttpServer())
      .post('/v1/knowledge/documents')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', Buffer.from('Short note about Swahili greetings: Habari.'), 'note.txt')
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/v1/knowledge/documents/${upload.body.id}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);

    const chunks = await prisma.knowledgeChunk.count({ where: { documentId: upload.body.id } });
    expect(chunks).toBe(0);
  });
});
