import { Document, Packer, Paragraph, TextRun } from 'docx';
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
import { JobsService } from '../src/jobs/jobs.service';
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
              clerkUserId: `clerk_doc_${name}_${Date.now()}_${Math.random()}`,
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

async function waitForJob(jobs: JobsService, organizationId: string, jobId: string) {
  const start = Date.now();
  while (Date.now() - start < 8000) {
    const job = await jobs.get(organizationId, jobId);
    if (job.status === 'succeeded' || job.status === 'failed') return job;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`Job ${jobId} timed out`);
}

describe('Document translation (VL-040)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let jobs: JobsService;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'lugemi-docs-'));
    process.env.DOCUMENT_STORAGE_DIR = storageDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    jobs = app.get(JobsService);

    app.get(GatewayService).setProviderForTests({
      name: 'fixture',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('translates a DOCX upload via job and serves download', async () => {
    const org = await seedOrg(prisma, 'docx');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'doc-key',
    });

    const docx = await Packer.toBuffer(
      new Document({
        sections: [
          {
            children: [
              new Paragraph({ children: [new TextRun('Hello world')] }),
              new Paragraph({ children: [new TextRun('Second paragraph')] }),
            ],
          },
        ],
      }),
    );

    const created = await request(app.getHttpServer())
      .post('/v1/documents/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('source', 'en')
      .field('target', 'sw')
      .attach('file', docx, {
        filename: 'sample.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      .expect(201);

    expect(created.body.type).toBe('document_translate');
    expect(created.body.status).toBe('queued');

    const done = await waitForJob(jobs, org.id, created.body.id);
    expect(done.status).toBe('succeeded');
    expect(done.result).toMatchObject({
      provider: 'fixture',
      chunks: 1,
    });
    const result = done.result as {
      outputDocumentId: string;
      downloadPath: string;
      preview: string;
    };
    expect(result.preview).toContain('[sw]');
    expect(result.downloadPath).toBe(`/v1/documents/${result.outputDocumentId}/content`);

    const download = await request(app.getHttpServer())
      .get(result.downloadPath)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(download.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(Buffer.isBuffer(download.body) ? download.body.length : download.text.length).toBeGreaterThan(0);
  });

  it('rejects oversized uploads', async () => {
    process.env.DOCUMENT_MAX_BYTES = '32';
    const org = await seedOrg(prisma, 'big');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'big-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/documents/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('source', 'en')
      .field('target', 'yo')
      .attach('file', Buffer.from('this text is definitely longer than thirty two bytes'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      });

    expect([400, 413]).toContain(res.status);
    delete process.env.DOCUMENT_MAX_BYTES;
  });
});
