import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ModelsService } from '../src/models/models.service';
import { ResidencyService } from '../src/residency/residency.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import {
  defaultHostingForModelSlug,
  preferredDataCenterForCountry,
} from '../src/residency/residency.catalog';

describe('Identity / model residency', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let models: ModelsService;
  let residency: ResidencyService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    models = app.get(ModelsService);
    residency = app.get(ResidencyService);
    await models.ensureVendorDefaults();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/residency returns plain-text policy', async () => {
    const res = await request(app.getHttpServer()).get('/v1/residency').expect(200);
    expect(res.text).toMatch(/Person \/ user residency/i);
    expect(res.text).toMatch(/Model \/ LLM residency/i);
    expect(res.text).toMatch(/af-west-1/i);
  });

  it('GET /v1/residency?format=json lists data centers', async () => {
    const res = await request(app.getHttpServer()).get('/v1/residency?format=json').expect(200);
    expect(res.body.dataCenters.some((d: { code: string }) => d.code === 'af-west-1')).toBe(true);
    expect(res.body.dataCenters.some((d: { code: string }) => d.code === 'eu-west')).toBe(true);
  });

  it('seeds Lugemi models with Africa-first hosting residency', async () => {
    const baobab = await prisma.modelRegistryEntry.findUniqueOrThrow({
      where: { slug: 'lugemi-baobab-translate' },
    });
    expect(baobab.dataCenter).toBe('af-west-1');
    expect(baobab.hostedRegion).toBe('af');
    expect(baobab.hostedResidency).toMatch(/Accra/i);

    const atlas = await prisma.modelRegistryEntry.findUniqueOrThrow({
      where: { slug: 'lugemi-atlas-reason' },
    });
    expect(atlas.dataCenter).toBe('af-west-1');

    const lex = await prisma.modelRegistryEntry.findUniqueOrThrow({
      where: { slug: 'lugemi-lex' },
    });
    expect(lex.dataCenter).toBe('eu-west');
  });

  it('GET /v1/models/live includes hostedResidency / servingFrom', async () => {
    const res = await request(app.getHttpServer()).get('/v1/models/live').expect(200);
    const translate = res.body.features.find((f: { feature: string }) => f.feature === 'translate');
    const baobab = translate.models.find(
      (m: { slug: string }) => m.slug === 'lugemi-baobab-translate',
    );
    expect(baobab.hostedResidency).toMatch(/Accra/i);
    expect(baobab.dataCenter).toBe('af-west-1');
    expect(baobab.servingFrom).toBeTruthy();
  });

  it('selector prefers Accra models for GH residency', async () => {
    expect(preferredDataCenterForCountry('GH').code).toBe('af-west-1');
    expect(defaultHostingForModelSlug('lugemi-echo-voice-ng-pidgin').dataCenter).toBe('af-west-2');

    const picked = await residency.selectModelsByResidency({
      feature: 'chat',
      residencyCountry: 'GH',
      limit: 5,
    });
    expect(picked.preferredDataCenter.code).toBe('af-west-1');
    expect(picked.selected[0]?.dataCenter).toBe('af-west-1');
    expect(picked.selected[0]?.servingFrom).toMatch(/Accra|af-west-1/i);
  });

  it('persists user and org residency fields', async () => {
    const stamp = Date.now();
    const org = await prisma.organization.create({
      data: {
        name: `residency_org_${stamp}`,
        residencyCountry: 'NG',
        residencyRegion: 'Africa · Lagos',
        registeredFrom: 'NG',
      },
    });
    const user = await prisma.user.create({
      data: {
        clerkUserId: `clerk_residency_${stamp}`,
        email: `residency_${stamp}@example.com`,
        residencyCountry: 'GH',
        residencyRegion: 'Africa · Accra',
        registeredFrom: 'GH',
      },
    });

    const patched = await residency.patchUserResidency({
      userId: user.id,
      organizationId: org.id,
      residencyCountry: 'ZA',
      residencyRegion: 'Africa · Cape Town',
    });
    expect(patched.residencyCountry).toBe('ZA');
    expect(patched.residencyRegion).toMatch(/Cape Town/i);

    const orgPatched = await residency.patchOrgResidency({
      organizationId: org.id,
      userId: user.id,
      role: 'owner',
      residencyCountry: 'KE',
    });
    expect(orgPatched.residencyCountry).toBe('KE');
    expect(orgPatched.residencyRegion).toMatch(/Nairobi|Africa/i);
  });
});
