import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DatasetsService } from '../src/datasets/datasets.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { ApiException } from '../src/common/errors/api-exception';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_ds_${name}_${Date.now()}_${Math.random()}`,
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

function fakeFile(name: string, text: string): Express.Multer.File {
  const buffer = Buffer.from(text, 'utf8');
  return {
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype: 'text/plain',
    size: buffer.length,
    buffer,
    destination: '',
    filename: name,
    path: '',
    stream: undefined as never,
  };
}

describe('Dataset program', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let datasets: DatasetsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    datasets = app.get(DatasetsService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires license tag and consent notes', async () => {
    const org = await seedOrg(prisma, `dsreq_${Date.now()}`);
    await expect(
      datasets.create({
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        userId: org.memberships[0].userId,
        role: 'owner',
        title: 'Pack',
        licenseTag: 'not-a-license',
        consentNotes: 'ok',
        file: fakeFile('a.txt', 'hello'),
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });

    await expect(
      datasets.create({
        organizationId: org.id,
        workspaceId: org.workspaces[0].id,
        userId: org.memberships[0].userId,
        role: 'owner',
        title: 'Pack',
        licenseTag: 'cc-by-4.0',
        consentNotes: ' ',
        file: fakeFile('a.txt', 'hello'),
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });
  });

  it('stores a versioned asset and reads content back', async () => {
    const org = await seedOrg(prisma, `dsok_${Date.now()}`);
    const created = await datasets.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      role: 'owner',
      title: 'Swahili clinic pack',
      licenseTag: 'university-mou',
      consentNotes: 'MOU-2026-01 with Example University',
      containsPii: false,
      sourceLang: 'en',
      targetLang: 'sw',
      partnerOrgName: 'Example University',
      file: fakeFile('clinic.tsv', 'en\tsw\nhello\thabari\n'),
    });

    expect(created.licenseTag).toBe('university-mou');
    expect(created.latestVersion?.version).toBe(1);
    expect(created.containsPii).toBe(false);

    const v2 = await datasets.addVersion({
      organizationId: org.id,
      assetId: created.id,
      role: 'owner',
      userId: org.memberships[0].userId,
      note: 'corrected lines',
      file: fakeFile('clinic-v2.tsv', 'en\tsw\nhello\thabari\nclinic\tkliniki\n'),
    });
    expect(v2.latestVersion?.version).toBe(2);

    const content = await datasets.readContent({
      organizationId: org.id,
      assetId: created.id,
      version: 2,
    });
    expect(content.buffer.toString('utf8')).toContain('kliniki');

    const listed = await datasets.list(org.id, org.workspaces[0].id);
    expect(listed.some((r) => r.id === created.id)).toBe(true);
  });

  it('isolates assets across organizations', async () => {
    const a = await seedOrg(prisma, `dsa_${Date.now()}`);
    const b = await seedOrg(prisma, `dsb_${Date.now()}`);
    const created = await datasets.create({
      organizationId: a.id,
      workspaceId: a.workspaces[0].id,
      userId: a.memberships[0].userId,
      role: 'owner',
      title: 'Private pack',
      licenseTag: 'proprietary',
      consentNotes: 'internal only',
      file: fakeFile('x.txt', 'secret'),
    });

    await expect(datasets.get(b.id, created.id)).rejects.toBeInstanceOf(ApiException);
  });
});
