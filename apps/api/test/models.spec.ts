import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModelsService } from '../src/models/models.service';
import { VENDOR_MODEL_SEEDS } from '../src/models/model-registry.seeds';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

describe('Model registry',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let models: ModelsService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    models = app.get(ModelsService);
    await models.ensureVendorDefaults;
  });

  afterAll(async  => {
    await app.close;
  });

  it('seeds vendor defaults for each gateway feature', async  => {
    const rows = await prisma.modelRegistryEntry.findMany({
      where: { kind: 'vendor' },
    });
    for (const seed of VENDOR_MODEL_SEEDS) {
      expect(rows.some((r) => r.slug === seed.slug && r.status === 'ready')).toBe(true);
    }
  });

  it('GET /v1/models/live is public and lists features with configured flags', async  => {
    const res = await request(app.getHttpServer).get('/v1/models/live').expect(200);
    expect(res.body.disclaimer).toMatch(/not MLflow/i);
    expect(res.body.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feature: 'translate' }),
        expect.objectContaining({ feature: 'stt' }),
        expect.objectContaining({ feature: 'detect' }),
      ]),
    );
    const translate = res.body.features.find(
      (f: { feature: string }) => f.feature === 'translate',
    );
    expect(translate.models.some((m: { slug: string }) => m.slug === 'vendor-translate-google')).toBe(
      true,
    );
    const detect = res.body.features.find((f: { feature: string }) => f.feature === 'detect');
    expect(detect.models.some((m: { slug: string; configured: boolean }) => m.slug === 'vendor-detect-franc' && m.configured)).toBe(
      true,
    );
  });

  it('platform admin can set an external W&B URL on a registry entry', async  => {
    const org = await prisma.organization.create({
      data: { name: `models_audit_${Date.now}` },
    });
    const updated = await models.setExternalUrl({
      idOrSlug: 'vendor-translate-google',
      externalUrl: 'https://wandb.ai/lugemi/example/runs/abc',
      organizationId: org.id,
    });
    expect(updated.externalUrl).toContain('wandb.ai');

    await expect(
      models.setExternalUrl({
        idOrSlug: 'vendor-translate-google',
        externalUrl: 'not-a-url',
        organizationId: org.id,
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });
  });
});
