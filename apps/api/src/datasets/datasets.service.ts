import { createHash, randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocalStorageService } from '../documents/local-storage.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { datasetMaxBytes, isDatasetLicenseTag } from './datasets.types';

@Injectable()
export class DatasetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly audit: AuditService,
  ) {}

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required for dataset program',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private serializeAsset(
    asset: {
      id: string;
      organizationId: string;
      workspaceId: string;
      title: string;
      licenseTag: string;
      consentNotes: string;
      containsPii: boolean;
      sourceLang: string | null;
      targetLang: string | null;
      partnerOrgName: string | null;
      status: string;
      createdBy: string | null;
      createdAt: Date;
      updatedAt: Date;
      versions?: Array<{
        id: string;
        version: number;
        filename: string;
        mimeType: string;
        sizeBytes: number;
        checksumSha256: string | null;
        note: string | null;
        status: string;
        createdAt: Date;
      }>;
    },
  ) {
    const versions = [...(asset.versions ?? [])].sort((a, b) => b.version - a.version);
    return {
      id: asset.id,
      title: asset.title,
      licenseTag: asset.licenseTag,
      consentNotes: asset.consentNotes,
      containsPii: asset.containsPii,
      sourceLang: asset.sourceLang,
      targetLang: asset.targetLang,
      partnerOrgName: asset.partnerOrgName,
      status: asset.status,
      createdBy: asset.createdBy,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      latestVersion: versions[0]
        ? {
            version: versions[0].version,
            filename: versions[0].filename,
            mimeType: versions[0].mimeType,
            sizeBytes: versions[0].sizeBytes,
            checksumSha256: versions[0].checksumSha256,
            createdAt: versions[0].createdAt,
          }
        : null,
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        filename: v.filename,
        mimeType: v.mimeType,
        sizeBytes: v.sizeBytes,
        checksumSha256: v.checksumSha256,
        note: v.note,
        status: v.status,
        createdAt: v.createdAt,
      })),
    };
  }

  list(organizationId: string, workspaceId: string) {
    return this.prisma.datasetAsset
      .findMany({
        where: { organizationId, workspaceId },
        include: { versions: true },
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => rows.map((r) => this.serializeAsset(r)));
  }

  async get(organizationId: string, assetId: string) {
    const asset = await this.prisma.datasetAsset.findFirst({
      where: { id: assetId, organizationId },
      include: { versions: true },
    });
    if (!asset) {
      throw new ApiException('not_found', 'Dataset asset not found', HttpStatus.NOT_FOUND);
    }
    return this.serializeAsset(asset);
  }

  async create(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    title: string;
    licenseTag: string;
    consentNotes: string;
    containsPii?: boolean | string;
    sourceLang?: string;
    targetLang?: string;
    partnerOrgName?: string;
    note?: string;
    file: Express.Multer.File;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const title = input.title.trim();
    const licenseTag = input.licenseTag.trim();
    const consentNotes = input.consentNotes.trim();
    if (!title) {
      throw new ApiException('validation_error', 'title is required', HttpStatus.BAD_REQUEST);
    }
    if (!isDatasetLicenseTag(licenseTag)) {
      throw new ApiException(
        'validation_error',
        'licenseTag must be a known license tag',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!consentNotes) {
      throw new ApiException(
        'validation_error',
        'consentNotes are required (MOU / donor consent reference)',
        HttpStatus.BAD_REQUEST,
      );
    }
    this.assertFile(input.file);

    const asset = await this.prisma.datasetAsset.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        title,
        licenseTag,
        consentNotes,
        containsPii: this.parseBool(input.containsPii),
        sourceLang: input.sourceLang?.trim() || null,
        targetLang: input.targetLang?.trim() || null,
        partnerOrgName: input.partnerOrgName?.trim() || null,
        status: 'active',
        createdBy: input.userId,
      },
    });

    await this.addVersionInternal({
      asset,
      file: input.file,
      note: input.note,
      userId: input.userId,
      ip: input.ip,
      route: 'POST /v1/datasets',
    });

    return this.get(input.organizationId, asset.id);
  }

  async updateMetadata(input: {
    organizationId: string;
    assetId: string;
    role: string;
    userId?: string;
    title?: string;
    licenseTag?: string;
    consentNotes?: string;
    containsPii?: boolean;
    sourceLang?: string | null;
    targetLang?: string | null;
    partnerOrgName?: string | null;
    status?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const existing = await this.prisma.datasetAsset.findFirst({
      where: { id: input.assetId, organizationId: input.organizationId },
    });
    if (!existing) {
      throw new ApiException('not_found', 'Dataset asset not found', HttpStatus.NOT_FOUND);
    }

    if (input.licenseTag != null && !isDatasetLicenseTag(input.licenseTag.trim())) {
      throw new ApiException(
        'validation_error',
        'licenseTag must be a known license tag',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.status != null && !['active', 'archived', 'draft'].includes(input.status)) {
      throw new ApiException(
        'validation_error',
        'status must be active, archived, or draft',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.datasetAsset.update({
      where: { id: existing.id },
      data: {
        ...(input.title != null ? { title: input.title.trim() } : {}),
        ...(input.licenseTag != null ? { licenseTag: input.licenseTag.trim() } : {}),
        ...(input.consentNotes != null ? { consentNotes: input.consentNotes.trim() } : {}),
        ...(input.containsPii != null ? { containsPii: input.containsPii } : {}),
        ...(input.sourceLang !== undefined
          ? { sourceLang: input.sourceLang?.trim() || null }
          : {}),
        ...(input.targetLang !== undefined
          ? { targetLang: input.targetLang?.trim() || null }
          : {}),
        ...(input.partnerOrgName !== undefined
          ? { partnerOrgName: input.partnerOrgName?.trim() || null }
          : {}),
        ...(input.status != null ? { status: input.status } : {}),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'dataset.updated',
      route: `PATCH /v1/datasets/${input.assetId}`,
      ip: input.ip,
      metadata: { assetId: input.assetId },
    });

    return this.get(input.organizationId, existing.id);
  }

  async addVersion(input: {
    organizationId: string;
    assetId: string;
    role: string;
    userId?: string;
    note?: string;
    file: Express.Multer.File;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    this.assertFile(input.file);
    const asset = await this.prisma.datasetAsset.findFirst({
      where: { id: input.assetId, organizationId: input.organizationId },
    });
    if (!asset) {
      throw new ApiException('not_found', 'Dataset asset not found', HttpStatus.NOT_FOUND);
    }
    if (asset.status === 'archived') {
      throw new ApiException(
        'conflict',
        'Cannot upload versions to an archived dataset',
        HttpStatus.CONFLICT,
      );
    }

    await this.addVersionInternal({
      asset,
      file: input.file,
      note: input.note,
      userId: input.userId,
      ip: input.ip,
      route: `POST /v1/datasets/${input.assetId}/versions`,
    });

    return this.get(input.organizationId, asset.id);
  }

  async archive(input: {
    organizationId: string;
    assetId: string;
    role: string;
    userId?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const asset = await this.prisma.datasetAsset.findFirst({
      where: { id: input.assetId, organizationId: input.organizationId },
      include: { versions: true },
    });
    if (!asset) {
      throw new ApiException('not_found', 'Dataset asset not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.datasetAsset.update({
      where: { id: asset.id },
      data: { status: 'archived' },
    });

    for (const version of asset.versions) {
      await this.storage.tryUnlink(version.storageKey);
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'dataset.archived',
      route: `DELETE /v1/datasets/${input.assetId}`,
      ip: input.ip,
      metadata: { assetId: asset.id, versions: asset.versions.length },
    });

    return { id: asset.id, status: 'archived' };
  }

  async readContent(input: {
    organizationId: string;
    assetId: string;
    version: number;
  }) {
    const asset = await this.prisma.datasetAsset.findFirst({
      where: { id: input.assetId, organizationId: input.organizationId },
    });
    if (!asset) {
      throw new ApiException('not_found', 'Dataset asset not found', HttpStatus.NOT_FOUND);
    }
    const row = await this.prisma.datasetVersion.findUnique({
      where: {
        assetId_version: { assetId: asset.id, version: input.version },
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Dataset version not found', HttpStatus.NOT_FOUND);
    }
    const buffer = await this.storage.readBuffer(row.storageKey);
    return {
      buffer,
      filename: row.filename,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
    };
  }

  private async addVersionInternal(input: {
    asset: { id: string; organizationId: string; workspaceId: string };
    file: Express.Multer.File;
    note?: string;
    userId?: string;
    ip?: string;
    route: string;
  }) {
    const latest = await this.prisma.datasetVersion.findFirst({
      where: { assetId: input.asset.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    const safeName = input.file.originalname.replace(/[^\w.-]+/g, '_').slice(0, 180);
    const storageKey = `datasets/${input.asset.organizationId}/${input.asset.id}/v${version}-${randomUUID()}-${safeName}`;
    const checksum = createHash('sha256').update(input.file.buffer).digest('hex');

    await this.storage.writeBuffer(storageKey, input.file.buffer);
    await this.prisma.datasetVersion.create({
      data: {
        assetId: input.asset.id,
        version,
        storageKey,
        filename: input.file.originalname,
        mimeType: input.file.mimetype || 'application/octet-stream',
        sizeBytes: input.file.size,
        checksumSha256: checksum,
        note: input.note?.trim() || null,
        status: 'ready',
      },
    });

    await this.audit.record({
      organizationId: input.asset.organizationId,
      userId: input.userId,
      action: 'dataset.version_uploaded',
      route: input.route,
      ip: input.ip,
      metadata: {
        assetId: input.asset.id,
        version,
        filename: input.file.originalname,
        sizeBytes: input.file.size,
      },
    });
  }

  private assertFile(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new ApiException('validation_error', 'file is required', HttpStatus.BAD_REQUEST);
    }
    if (file.size > datasetMaxBytes()) {
      throw new ApiException(
        'validation_error',
        `file exceeds DATASET_MAX_BYTES (${datasetMaxBytes()})`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private parseBool(value?: boolean | string) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value === '1' || value.toLowerCase() === 'true';
    }
    return false;
  }
}
