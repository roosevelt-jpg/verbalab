import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { LocalStorageService } from '../documents/local-storage.service';
import {
  VendorVoiceCloneAdapter,
  FixtureVoiceCloneAdapter,
  type VoiceCloneSample,
} from './vendor-voice-clone.adapter';

export const VOICE_CLONE_PREFIX = 'clone:';

export function voiceCloneIdFromVoice(voice: string): string | null {
  if (!voice.startsWith(VOICE_CLONE_PREFIX)) return null;
  return voice.slice(VOICE_CLONE_PREFIX.length) || null;
}

@Injectable()
export class VoiceClonesService {
  private fixtureOverride: FixtureVoiceCloneAdapter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly audit: AuditService,
    private readonly storage: LocalStorageService,
  ) {}

  setFixtureForTests(adapter: FixtureVoiceCloneAdapter | null) {
    this.fixtureOverride = adapter;
  }

  private assertOwnerOrAdmin(role: string) {
    if (role !== 'owner' && role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Owner or admin role required for voice cloning',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private provider() {
    if (this.fixtureOverride) return this.fixtureOverride;
    if (process.env.VOICE_CLONE_FIXTURE === '1') return new FixtureVoiceCloneAdapter();
    return new VendorVoiceCloneAdapter(process.env.ELEVENLABS_API_KEY ?? '');
  }

  serialize(row: {
    id: string;
    name: string;
    status: string;
    cloneMode?: string;
    consentAttested: boolean;
    consentNotes: string;
    consentAttestedAt: Date;
    ownershipAttested?: boolean;
    ownershipNotes?: string;
    ownerUserId?: string | null;
    licenseType?: string;
    licenseNotes?: string;
    permissions?: Prisma.JsonValue;
    enrollmentVerified?: boolean;
    enrollmentVerifiedAt?: Date | null;
    enrollmentVerifyNotes?: string | null;
    watermarkRequired: boolean;
    sampleCount: number;
    provider: string;
    providerVoiceId: string | null;
    reviewNotes: string | null;
    reviewedAt: Date | null;
    disabledReason: string | null;
    createdByUserId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      voice: `${VOICE_CLONE_PREFIX}${row.id}`,
      name: row.name,
      status: row.status,
      cloneMode: row.cloneMode ?? 'instant',
      consentAttested: row.consentAttested,
      consentNotes: row.consentNotes,
      consentAttestedAt: row.consentAttestedAt,
      ownershipAttested: row.ownershipAttested ?? false,
      ownershipNotes: row.ownershipNotes ?? '',
      ownerUserId: row.ownerUserId ?? row.createdByUserId ?? null,
      licenseType: row.licenseType ?? 'internal',
      licenseNotes: row.licenseNotes ?? '',
      permissions: normalizePermissions(row.permissions),
      enrollmentVerified: row.enrollmentVerified ?? false,
      enrollmentVerifiedAt: row.enrollmentVerifiedAt ?? null,
      enrollmentVerifyNotes: row.enrollmentVerifyNotes ?? null,
      watermarkRequired: row.watermarkRequired,
      sampleCount: row.sampleCount,
      provider: row.provider,
      providerVoiceId: row.providerVoiceId,
      reviewNotes: row.reviewNotes,
      reviewedAt: row.reviewedAt,
      disabledReason: row.disabledReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      usable: row.status === 'approved' && Boolean(row.providerVoiceId),
    };
  }

  list(organizationId: string, workspaceId: string) {
    return this.prisma.voiceClone
      .findMany({
        where: { organizationId, workspaceId },
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  async get(organizationId: string, workspaceId: string, id: string) {
    const row = await this.prisma.voiceClone.findFirst({
      where: { id, organizationId, workspaceId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  async create(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    name: string;
    consentAttested: boolean;
    consentNotes: string;
    files: Express.Multer.File[];
    ip?: string;
    cloneMode?: 'instant' | 'professional';
    ownershipAttested?: boolean;
    ownershipNotes?: string;
    licenseType?: 'internal' | 'commercial' | 'restricted';
    licenseNotes?: string;
    permissions?: Partial<VoiceClonePermissions>;
    route?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertFeature(
      input.organizationId,
      'voiceClones',
      'Voice clones require Creator plan or higher. Upgrade under Billing.',
    );

    if (!input.consentAttested) {
      throw new ApiException(
        'validation_error',
        'consentAttested must be true — you must attest speaker rights and informed consent',
        HttpStatus.BAD_REQUEST,
      );
    }
    const notes = input.consentNotes?.trim() ?? '';
    if (notes.length < 8) {
      throw new ApiException(
        'validation_error',
        'consentNotes must describe the consent basis (min 8 chars)',
        HttpStatus.BAD_REQUEST,
      );
    }
    const name = input.name?.trim() ?? '';
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    if (!input.files?.length) {
      throw new ApiException(
        'validation_error',
        'At least one sample audio file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cloneMode = input.cloneMode === 'professional' ? 'professional' : 'instant';
    const minSamples = cloneMode === 'professional' ? 3 : 1;
    if (input.files.length < minSamples) {
      throw new ApiException(
        'validation_error',
        `${cloneMode} cloning requires at least ${minSamples} sample recording(s)`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const ownershipAttested = Boolean(input.ownershipAttested);
    const ownershipNotes = input.ownershipNotes?.trim() ?? '';
    if (cloneMode === 'professional') {
      if (!ownershipAttested || ownershipNotes.length < 8) {
        throw new ApiException(
          'validation_error',
          'Professional cloning requires ownershipAttested=true and ownershipNotes (min 8 chars)',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const licenseType = normalizeLicenseType(input.licenseType);
    const permissions = normalizePermissions(input.permissions);

    const keys: string[] = [];
    for (const file of input.files) {
      const key = `voices/${input.organizationId}/${randomUUID()}-${file.originalname}`;
      await this.storage.writeBuffer(key, file.buffer);
      keys.push(key);
    }

    const row = await this.prisma.voiceClone.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        name,
        status: 'pending_review',
        cloneMode,
        consentAttested: true,
        consentNotes: notes,
        consentAttestedAt: new Date(),
        consentAttestedBy: input.userId,
        ownershipAttested,
        ownershipNotes,
        ownerUserId: input.userId,
        licenseType,
        licenseNotes: input.licenseNotes?.trim() ?? '',
        permissions: permissions as unknown as Prisma.InputJsonValue,
        watermarkRequired: true,
        sampleStorageKeys: keys as Prisma.InputJsonValue,
        sampleCount: keys.length,
        provider: 'elevenlabs',
        createdByUserId: input.userId,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.created',
      route: input.route ?? 'POST /v1/voice-clones',
      ip: input.ip,
      metadata: {
        voiceCloneId: row.id,
        sampleCount: keys.length,
        status: row.status,
        cloneMode,
        licenseType,
        ownershipAttested,
      },
    });

    return this.serialize(row);
  }

  async updateOwnership(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    id: string;
    ownershipAttested: boolean;
    ownershipNotes: string;
    ownerUserId?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const row = await this.requireClone(input.organizationId, input.workspaceId, input.id);
    const notes = input.ownershipNotes?.trim() ?? '';
    if (input.ownershipAttested && notes.length < 8) {
      throw new ApiException(
        'validation_error',
        'ownershipNotes must describe ownership basis (min 8 chars)',
        HttpStatus.BAD_REQUEST,
      );
    }
    const updated = await this.prisma.voiceClone.update({
      where: { id: row.id },
      data: {
        ownershipAttested: input.ownershipAttested,
        ownershipNotes: notes,
        ownerUserId: input.ownerUserId ?? input.userId ?? row.ownerUserId,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.ownership_updated',
      route: `PATCH /v1/voice-cloning/clones/${row.id}/ownership`,
      ip: input.ip,
      metadata: { voiceCloneId: row.id, ownershipAttested: input.ownershipAttested },
    });
    return this.serialize(updated);
  }

  async updateLicense(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    id: string;
    licenseType: string;
    licenseNotes?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const row = await this.requireClone(input.organizationId, input.workspaceId, input.id);
    const licenseType = normalizeLicenseType(input.licenseType);
    const updated = await this.prisma.voiceClone.update({
      where: { id: row.id },
      data: {
        licenseType,
        licenseNotes: input.licenseNotes?.trim() ?? row.licenseNotes,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.license_updated',
      route: `PATCH /v1/voice-cloning/clones/${row.id}/license`,
      ip: input.ip,
      metadata: { voiceCloneId: row.id, licenseType },
    });
    return this.serialize(updated);
  }

  async updatePermissions(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    id: string;
    permissions: Partial<VoiceClonePermissions>;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const row = await this.requireClone(input.organizationId, input.workspaceId, input.id);
    const permissions = {
      ...normalizePermissions(row.permissions),
      ...normalizePermissions(input.permissions),
    };
    const updated = await this.prisma.voiceClone.update({
      where: { id: row.id },
      data: { permissions: permissions as unknown as Prisma.InputJsonValue },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.permissions_updated',
      route: `PATCH /v1/voice-cloning/clones/${row.id}/permissions`,
      ip: input.ip,
      metadata: { voiceCloneId: row.id, permissions },
    });
    return this.serialize(updated);
  }

  async verifyEnrollment(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    id: string;
    notes?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const row = await this.requireClone(input.organizationId, input.workspaceId, input.id);
    const minSamples = row.cloneMode === 'professional' ? 3 : 1;
    if (row.sampleCount < minSamples) {
      throw new ApiException(
        'validation_error',
        `Enrollment verification requires at least ${minSamples} samples for ${row.cloneMode} mode`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!row.consentAttested) {
      throw new ApiException(
        'validation_error',
        'Cannot verify enrollment without consent attestation',
        HttpStatus.BAD_REQUEST,
      );
    }
    const updated = await this.prisma.voiceClone.update({
      where: { id: row.id },
      data: {
        enrollmentVerified: true,
        enrollmentVerifiedAt: new Date(),
        enrollmentVerifyNotes:
          input.notes?.trim() ||
          `Sample count ${row.sampleCount} meets ${row.cloneMode} enrollment bar; consent present`,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.enrollment_verified',
      route: `POST /v1/voice-cloning/clones/${row.id}/verify-enrollment`,
      ip: input.ip,
      metadata: {
        voiceCloneId: row.id,
        cloneMode: row.cloneMode,
        sampleCount: row.sampleCount,
      },
    });
    return this.serialize(updated);
  }

  private async requireClone(organizationId: string, workspaceId: string, id: string) {
    const row = await this.prisma.voiceClone.findFirst({
      where: { id, organizationId, workspaceId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  async review(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    id: string;
    decision: 'approved' | 'rejected';
    reviewNotes?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    await this.billing.assertFeature(
      input.organizationId,
      'voiceClones',
      'Voice clones require Creator plan or higher. Upgrade under Billing.',
    );

    const row = await this.prisma.voiceClone.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }
    if (row.status !== 'pending_review') {
      throw new ApiException(
        'conflict',
        `Voice clone is ${row.status}; only pending_review can be reviewed`,
        HttpStatus.CONFLICT,
      );
    }

    if (input.decision === 'rejected') {
      const updated = await this.prisma.voiceClone.update({
        where: { id: row.id },
        data: {
          status: 'rejected',
          reviewNotes: input.reviewNotes?.trim() || 'Rejected in abuse review',
          reviewedBy: input.userId,
          reviewedAt: new Date(),
        },
      });
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'voice_clone.rejected',
        route: `POST /v1/voice-clones/${row.id}/review`,
        ip: input.ip,
        metadata: { voiceCloneId: row.id },
      });
      return this.serialize(updated);
    }

    const keys = row.sampleStorageKeys as string[];
    const samples: VoiceCloneSample[] = [];
    for (const key of keys) {
      const buffer = await this.storage.readBuffer(key);
      const filename = key.split('/').pop() ?? 'sample.wav';
      samples.push({
        filename,
        mimeType: filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav',
        buffer,
      });
    }

    const created = await this.provider().createClone({
      name: row.name,
      description: `Lugemi clone ${row.id}. Consent: ${row.consentNotes}`,
      samples,
    });

    const updated = await this.prisma.voiceClone.update({
      where: { id: row.id },
      data: {
        status: 'approved',
        provider: created.provider,
        providerVoiceId: created.providerVoiceId,
        reviewNotes: input.reviewNotes?.trim() || 'Approved after consent abuse review',
        reviewedBy: input.userId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.approved',
      route: `POST /v1/voice-clones/${row.id}/review`,
      ip: input.ip,
      metadata: {
        voiceCloneId: row.id,
        providerVoiceId: created.providerVoiceId,
        provider: created.provider,
      },
    });

    return this.serialize(updated);
  }

  async disable(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    role: string;
    id: string;
    reason?: string;
    ip?: string;
  }) {
    this.assertOwnerOrAdmin(input.role);
    const row = await this.prisma.voiceClone.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.voiceClone.update({
      where: { id: row.id },
      data: {
        status: 'disabled',
        disabledReason: input.reason?.trim() || 'Disabled for abuse / policy',
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'voice_clone.disabled',
      route: `POST /v1/voice-clones/${row.id}/disable`,
      ip: input.ip,
      metadata: { voiceCloneId: row.id, reason: updated.disabledReason },
    });

    return this.serialize(updated);
  }

  /** Resolve an approved clone for TTS; enforces watermark requirement. */
  async resolveForSpeech(input: {
    organizationId: string;
    workspaceId: string;
    voice: string;
  }) {
    const id = voiceCloneIdFromVoice(input.voice);
    if (!id) return null;

    const row = await this.prisma.voiceClone.findFirst({
      where: {
        id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Voice clone not found', HttpStatus.NOT_FOUND);
    }
    if (row.status !== 'approved' || !row.providerVoiceId) {
      throw new ApiException(
        'forbidden',
        `Voice clone is not usable (status=${row.status})`,
        HttpStatus.FORBIDDEN,
      );
    }
    if (!row.watermarkRequired) {
      throw new ApiException(
        'forbidden',
        'Cloned voices require watermarking; this profile is misconfigured',
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      profile: this.serialize(row),
      providerVoiceId: row.providerVoiceId,
      watermarkRequired: true as const,
    };
  }

  async synthesizeClone(input: {
    text: string;
    voice: string;
    providerVoiceId: string;
    format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
    voiceSettings?: {
      stability: number;
      similarity_boost: number;
      style: number;
    };
  }) {
    return this.provider().synthesize({
      text: input.text,
      voice: input.voice,
      providerVoiceId: input.providerVoiceId,
      format: input.format ?? 'mp3',
      voiceSettings: input.voiceSettings,
    });
  }
}

export type VoiceClonePermissions = {
  canSynthesize: boolean;
  canShare: boolean;
  canExport: boolean;
  allowedRoles: string[];
};

const DEFAULT_PERMISSIONS: VoiceClonePermissions = {
  canSynthesize: true,
  canShare: false,
  canExport: false,
  allowedRoles: ['owner', 'admin'],
};

export function normalizePermissions(value: unknown): VoiceClonePermissions {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const roles = Array.isArray(raw.allowedRoles)
    ? raw.allowedRoles.filter((r): r is string => typeof r === 'string')
    : DEFAULT_PERMISSIONS.allowedRoles;
  return {
    canSynthesize: raw.canSynthesize === undefined ? true : Boolean(raw.canSynthesize),
    canShare: Boolean(raw.canShare),
    canExport: Boolean(raw.canExport),
    allowedRoles: roles.length ? roles : DEFAULT_PERMISSIONS.allowedRoles,
  };
}

function normalizeLicenseType(value?: string): 'internal' | 'commercial' | 'restricted' {
  if (value === 'commercial' || value === 'restricted' || value === 'internal') return value;
  return 'internal';
}
