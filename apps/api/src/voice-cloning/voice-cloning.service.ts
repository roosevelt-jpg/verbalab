import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  VoiceClonePermissions,
  VoiceClonesService,
} from '../voice-clones/voice-clones.service';
import {
  voiceCloningConsentPolicy,
  voiceCloningEngineCatalog,
} from './voice-cloning.catalog';

@Injectable()
export class VoiceCloningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clones: VoiceClonesService,
  ) {}

  engine() {
    return voiceCloningEngineCatalog();
  }

  consentPolicy() {
    return voiceCloningConsentPolicy();
  }

  async analytics(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.voiceClone.findMany({
      where: { organizationId, workspaceId },
      select: {
        status: true,
        cloneMode: true,
        consentAttested: true,
        ownershipAttested: true,
        enrollmentVerified: true,
        licenseType: true,
      },
    });
    const byStatus: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    const byLicense: Record<string, number> = {};
    let consentCount = 0;
    let ownershipCount = 0;
    let enrollmentVerified = 0;
    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
      byMode[row.cloneMode] = (byMode[row.cloneMode] ?? 0) + 1;
      byLicense[row.licenseType] = (byLicense[row.licenseType] ?? 0) + 1;
      if (row.consentAttested) consentCount += 1;
      if (row.ownershipAttested) ownershipCount += 1;
      if (row.enrollmentVerified) enrollmentVerified += 1;
    }
    return {
      product: 'Lugemi Voice Cloning',
      total: rows.length,
      byStatus,
      byMode,
      byLicense,
      consentAttested: consentCount,
      ownershipAttested: ownershipCount,
      enrollmentVerified,
      note: 'Clone inventory analytics. Full Voice Analytics deferred to the Voice Analytics hub.',
      docs: '/docs/VOICE_CLONING.md',
    };
  }

  async library(organizationId: string, workspaceId: string) {
    const items = await this.clones.list(organizationId, workspaceId);
    return {
      library: items,
      count: items.length,
      consentPolicy: this.consentPolicy().required,
      docs: '/docs/VOICE_CLONING.md',
    };
  }

  enroll(input: {
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
  }) {
    return this.clones.create({
      ...input,
      route: 'POST /v1/voice-cloning/enroll',
    });
  }

  async *enrollStream(input: Parameters<VoiceCloningService['enroll']>[0]): AsyncGenerator<{
    event: 'accepted' | 'stored' | 'pending_review' | 'done' | 'error';
    [key: string]: unknown;
  }> {
    try {
      yield {
        event: 'accepted',
        cloneMode: input.cloneMode === 'professional' ? 'professional' : 'instant',
        note: 'Consent and sample validation starting',
      };
      const created = await this.enroll(input);
      yield {
        event: 'stored',
        id: created.id,
        sampleCount: created.sampleCount,
        watermarkRequired: created.watermarkRequired,
      };
      yield {
        event: 'pending_review',
        id: created.id,
        status: created.status,
        note: 'Human abuse review required before synthesis',
      };
      yield { event: 'done', clone: created };
    } catch (error) {
      yield {
        event: 'error',
        message: error instanceof Error ? error.message : 'Enrollment failed',
      };
    }
  }

  updateOwnership(input: Parameters<VoiceClonesService['updateOwnership']>[0]) {
    return this.clones.updateOwnership(input);
  }

  updateLicense(input: Parameters<VoiceClonesService['updateLicense']>[0]) {
    return this.clones.updateLicense(input);
  }

  updatePermissions(input: Parameters<VoiceClonesService['updatePermissions']>[0]) {
    return this.clones.updatePermissions(input);
  }

  verifyEnrollment(input: Parameters<VoiceClonesService['verifyEnrollment']>[0]) {
    return this.clones.verifyEnrollment(input);
  }
}
