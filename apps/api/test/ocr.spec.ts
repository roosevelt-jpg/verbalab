import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { UsageService } from '../src/usage/usage.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { GoogleVisionOcrAdapter } from '../src/gateway/google-vision-ocr.adapter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_ocr_${name}_${Date.now()}_${Math.random()}`,
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

/** Minimal 1x1 PNG */
function tinyPng(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

describe('OCR (VL-043)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let usage: UsageService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    usage = app.get(UsageService);

    const gateway = app.get(GatewayService);
    gateway.setOcrProviderForTests({
      name: 'fixture',
      async extract() {
        return {
          text: 'Habari dunia',
          pages: 1,
          provider: 'fixture',
          latencyMs: 1,
        };
      },
    });
    gateway.setProviderForTests({
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
  });

  it('extracts text and meters OCR pages', async () => {
    const org = await seedOrg(prisma, 'ocr');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ocr-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/ocr')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('languageHint', 'sw')
      .attach('file', tinyPng(), { filename: 'scan.png', contentType: 'image/png' })
      .expect(200);

    expect(res.body).toMatchObject({
      text: 'Habari dunia',
      pages: 1,
      provider: 'fixture',
      characters: 12,
      translatedText: null,
    });

    const summary = await usage.summary(org.id);
    expect(summary.ocr.requests).toBe(1);
    expect(summary.ocr.pages).toBe(1);
  });

  it('optionally translates OCR text', async () => {
    const org = await seedOrg(prisma, 'ocrx');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ocr-tr',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/ocr')
      .set('Authorization', `Bearer ${key.secret}`)
      .field('source', 'sw')
      .field('target', 'en')
      .attach('file', tinyPng(), { filename: 'scan.png', contentType: 'image/png' })
      .expect(200);

    expect(res.body.translatedText).toBe('[en] Habari dunia');
    expect(res.body.translateProvider).toBe('fixture');
  });

  it('rejects non-image uploads', async () => {
    const org = await seedOrg(prisma, 'ocrbad');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ocr-bad',
    });

    await request(app.getHttpServer())
      .post('/v1/ocr')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', Buffer.from('not-an-image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('Vision adapter reports not configured without key', async () => {
    const adapter = new GoogleVisionOcrAdapter('');
    await expect(
      adapter.extract({
        buffer: tinyPng(),
        filename: 'a.png',
        mimeType: 'image/png',
      }),
    ).rejects.toMatchObject({ code: 'provider_not_configured' });
  });
});
