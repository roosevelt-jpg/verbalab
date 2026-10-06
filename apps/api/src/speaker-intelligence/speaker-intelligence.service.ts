import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { AudioService } from '../audio/audio.service';
import { ApiException } from '../common/errors/api-exception';
import { speakerEngineCatalog } from './speaker-engine.catalog';
import {
  computeVoiceFingerprint,
  cosineSimilarity,
  diarizeSegmentsByGaps,
  VoiceFingerprint,
} from './fingerprint';
import {
  encryptFingerprint,
  isEncryptedFingerprint,
  resolveFingerprint,
} from '../voice-biometrics/fingerprint-crypto';

const DEFAULT_VERIFY_THRESHOLD = 0.82;
const DEFAULT_IDENTIFY_THRESHOLD = 0.78;

@Injectable
export class SpeakerIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
    private readonly audio: AudioService,
  ) {}

  engine {
    return speakerEngineCatalog;
  }

  async listProfiles(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.speakerProfile.findMany({
      where: { organizationId, workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: rows.map((r) => this.profileDto(r)),
      note: 'Workspace speaker profiles — local fingerprints only.',
    };
  }

  async getProfile(organizationId: string, workspaceId: string, id: string) {
    const row = await this.requireProfile(organizationId, workspaceId, id);
    return this.profileDto(row);
  }

  async createProfile(input: {
    organizationId: string;
    workspaceId: string;
    displayName: string;
    externalRef?: string;
    userId?: string;
    ip?: string;
  }) {
    const displayName = input.displayName.trim;
    if (!displayName || displayName.length > 120) {
      throw new ApiException(
        'validation_error',
        'displayName must be 1–120 characters',
        HttpStatus.BAD_REQUEST,
      );
    }
    const count = await this.prisma.speakerProfile.count({
      where: { organizationId: input.organizationId, workspaceId: input.workspaceId },
    });
    if (count >= 100) {
      throw new ApiException(
        'validation_error',
        'Maximum 100 speaker profiles per workspace',
        HttpStatus.BAD_REQUEST,
      );
    }
    const row = await this.prisma.speakerProfile.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        displayName,
        externalRef: input.externalRef?.trim || null,
      },
    });
    await this.recordEvent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      profileId: row.id,
      action: 'profile_created',
      metadata: { displayName },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speaker.profile_created',
      route: 'POST /v1/speakers/profiles',
      ip: input.ip,
      metadata: { profileId: row.id },
    });
    return this.profileDto(row);
  }

  async enroll(input: {
    organizationId: string;
    workspaceId: string;
    profileId: string;
    file: Express.Multer.File;
    userId?: string;
    ip?: string;
    /** : store fingerprint AES-GCM encrypted at rest. */
    encryptAtRest?: boolean;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const profile = await this.requireProfile(
      input.organizationId,
      input.workspaceId,
      input.profileId,
    );
    const fp = computeVoiceFingerprint(input.file.buffer);
    const existingPlain = resolveFingerprint(profile.fingerprintJson);
    const merged = existingPlain?.vector?.length
      ? averageFingerprints(existingPlain, fp)
      : fp;
    const storeEncrypted =
      input.encryptAtRest === true || isEncryptedFingerprint(profile.fingerprintJson);
    const stored = storeEncrypted ? encryptFingerprint(merged) : merged;

    const updated = await this.prisma.speakerProfile.update({
      where: { id: profile.id },
      data: {
        fingerprintJson: stored as unknown as Prisma.InputJsonValue,
        enrolledAt: new Date,
        enrollmentCount: { increment: 1 },
        status: 'enrolled',
        ...(storeEncrypted ? { fingerprintEncrypted: true } : {}),
        deletedAt: null,
      },
    });

    await this.recordEvent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      profileId: profile.id,
      action: 'enroll',
      metadata: { dims: merged.dims, durationSeconds: fp.durationSeconds },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speaker.enrolled',
      route: 'POST /v1/speakers/profiles/:id/enroll',
      ip: input.ip,
      metadata: { profileId: profile.id },
    });

    return {
      profile: this.profileDto(updated),
      fingerprint: {
        version: merged.version,
        dims: merged.dims,
        durationSeconds: merged.durationSeconds,
        enrolled: true,
      },
      fingerprintEncrypted: storeEncrypted,
      note: storeEncrypted
        ? 'Local envelope fingerprint encrypted at rest (AES-256-GCM) — not a commercial biometric template.'
        : 'Local envelope fingerprint stored — not a commercial biometric template.',
    };
  }

  async verify(input: {
    organizationId: string;
    workspaceId: string;
    profileId: string;
    file: Express.Multer.File;
    threshold?: number;
    userId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const profile = await this.requireProfile(
      input.organizationId,
      input.workspaceId,
      input.profileId,
    );
    if (profile.deletedAt) {
      throw new ApiException(
        'validation_error',
        'Biometric profile has been deleted',
        HttpStatus.BAD_REQUEST,
      );
    }
    const enrolled = resolveFingerprint(profile.fingerprintJson);
    if (!enrolled?.vector?.length) {
      throw new ApiException(
        'validation_error',
        'Profile has no enrolled fingerprint',
        HttpStatus.BAD_REQUEST,
      );
    }
    const probe = computeVoiceFingerprint(input.file.buffer);
    const score = cosineSimilarity(enrolled.vector, probe.vector);
    const threshold = clampThreshold(input.threshold, DEFAULT_VERIFY_THRESHOLD);
    const match = score >= threshold;
    const decision = match ? 'accept' : 'reject';

    await this.recordEvent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      profileId: profile.id,
      action: 'verify',
      score,
      decision,
      metadata: { threshold },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speaker.verified',
      route: 'POST /v1/speakers/verify',
      ip: input.ip,
      metadata: { profileId: profile.id, score, decision },
    });

    return {
      profileId: profile.id,
      displayName: profile.displayName,
      score,
      threshold,
      match,
      decision,
      provider: 'lugemi_fingerprint_v1',
      note: 'Cosine similarity on local fingerprints — not anti-spoof speaker verification.',
    };
  }

  async identify(input: {
    organizationId: string;
    workspaceId: string;
    file: Express.Multer.File;
    threshold?: number;
    topK?: number;
    userId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const profiles = await this.prisma.speakerProfile.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        fingerprintJson: { not: Prisma.DbNull },
        status: { in: ['enrolled', 'active'] },
        deletedAt: null,
      },
    });
    const probe = computeVoiceFingerprint(input.file.buffer);
    const threshold = clampThreshold(input.threshold, DEFAULT_IDENTIFY_THRESHOLD);
    const topK = Math.min(10, Math.max(1, input.topK ?? 3));

    const candidates = profiles
      .map((p) => {
        const fp = resolveFingerprint(p.fingerprintJson);
        if (!fp?.vector?.length) return null;
        return {
          profileId: p.id,
          displayName: p.displayName,
          score: cosineSimilarity(fp.vector, probe.vector),
        };
      })
      .filter((c): c is NonNullable<typeof c> => c != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const best = candidates[0] ?? null;
    const match = Boolean(best && best.score >= threshold);
    const decision = match ? 'identified' : 'unknown';

    await this.recordEvent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      profileId: match ? best!.profileId : null,
      action: 'identify',
      score: best?.score ?? null,
      decision,
      metadata: { threshold, candidateCount: candidates.length },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speaker.identified',
      route: 'POST /v1/speakers/identify',
      ip: input.ip,
      metadata: { decision, score: best?.score ?? null },
    });

    return {
      match,
      decision,
      threshold,
      best,
      candidates,
      provider: 'lugemi_fingerprint_v1',
      note: '1:N local fingerprint match — not a speaker recognition research system.',
    };
  }

  async diarize(input: {
    organizationId: string;
    workspaceId: string;
    file: Express.Multer.File;
    language?: string;
    gapSeconds?: number;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    this.audio.assertAllowedAudio(input.file);
    const result = await this.gateway.transcribe({
      buffer: input.file.buffer,
      filename: input.file.originalname,
      mimeType: input.file.mimetype || 'application/octet-stream',
      language: input.language,
    });

    const durationSeconds = Math.max(1, Math.ceil(result.durationSeconds));
    await this.usage.recordStt({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      seconds: durationSeconds,
      provider: result.provider,
    });

    const segments = result.segments?.length
      ? result.segments
      : result.text
        ? [
            {
              id: 0,
              start: 0,
              end: result.durationSeconds,
              text: result.text,
              confidence: result.confidence,
            },
          ]
        : [];

    const gap = typeof input.gapSeconds === 'number' && input.gapSeconds > 0 ? input.gapSeconds : 0.85;
    const turns = diarizeSegmentsByGaps(segments, gap);
    const speakers = [...new Set(turns.map((t) => t.speakerLabel))];

    await this.recordEvent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      action: 'diarize',
      metadata: {
        speakerCount: speakers.length,
        turnCount: turns.length,
        provider: result.provider,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speaker.diarized',
      route: 'POST /v1/speakers/diarize',
      ip: input.ip,
      metadata: { speakerCount: speakers.length, turnCount: turns.length },
    });

    return {
      text: result.text,
      language: result.language ?? input.language ?? null,
      durationSeconds,
      provider: result.provider,
      diarizationProvider: 'gap_diarization_v1',
      speakers,
      turns,
      segments,
      note: 'Gap-based turn clustering over Whisper segments — not neural speaker diarization.',
    };
  }

  async *streamDiarize(input: {
    organizationId: string;
    workspaceId: string;
    file: Express.Multer.File;
    language?: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }): AsyncGenerator<
    | { event: 'start'; provider: string }
    | { event: 'turn'; turn: { speakerLabel: string; start: number; end: number; text: string }; index: number }
    | {
        event: 'done';
        speakers: string[];
        turnCount: number;
        text: string;
        durationSeconds: number;
      }
    | { event: 'error'; message: string }
  > {
    try {
      const result = await this.diarize(input);
      yield { event: 'start', provider: result.diarizationProvider };
      for (let i = 0; i < result.turns.length; i++) {
        const t = result.turns[i]!;
        yield {
          event: 'turn',
          index: i,
          turn: {
            speakerLabel: t.speakerLabel,
            start: t.start,
            end: t.end,
            text: t.text,
          },
        };
      }
      yield {
        event: 'done',
        speakers: result.speakers,
        turnCount: result.turns.length,
        text: result.text,
        durationSeconds: result.durationSeconds,
      };
    } catch (err) {
      yield { event: 'error', message: err instanceof Error ? err.message : 'Diarization failed' };
    }
  }

  async history(organizationId: string, workspaceId: string, limit = 50) {
    const rows = await this.prisma.speakerEvent.findMany({
      where: { organizationId, workspaceId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        profileId: r.profileId,
        action: r.action,
        score: r.score,
        decision: r.decision,
        metadata: r.metadata,
        createdAt: r.createdAt.toISOString,
      })),
    };
  }

  async purgeBiometric(input: {
    organizationId: string;
    workspaceId: string;
    profileId: string;
    userId?: string;
    ip?: string;
  }) {
    const profile = await this.requireProfile(
      input.organizationId,
      input.workspaceId,
      input.profileId,
    );
    const updated = await this.prisma.speakerProfile.update({
      where: { id: profile.id },
      data: {
        fingerprintJson: Prisma.DbNull,
        fingerprintEncrypted: false,
        authFactorEnabled: false,
        status: 'deleted',
        deletedAt: new Date,
        enrollmentCount: 0,
        enrolledAt: null,
      },
    });
    await this.recordEvent({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      profileId: profile.id,
      action: 'biometric_deleted',
      metadata: {},
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'speaker.biometric_deleted',
      route: 'DELETE /v1/voice-biometrics/profiles/:id',
      ip: input.ip,
      metadata: { profileId: profile.id },
    });
    return this.profileDto(updated);
  }

  async setAuthFactor(input: {
    organizationId: string;
    workspaceId: string;
    profileId: string;
    enabled: boolean;
  }) {
    const profile = await this.requireProfile(
      input.organizationId,
      input.workspaceId,
      input.profileId,
    );
    if (profile.deletedAt) {
      throw new ApiException(
        'validation_error',
        'Cannot enable auth on a deleted biometric profile',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.enabled && !resolveFingerprint(profile.fingerprintJson)) {
      throw new ApiException(
        'validation_error',
        'Enroll a fingerprint before enabling auth factor',
        HttpStatus.BAD_REQUEST,
      );
    }
    const updated = await this.prisma.speakerProfile.update({
      where: { id: profile.id },
      data: { authFactorEnabled: input.enabled },
    });
    return this.profileDto(updated);
  }

  private async requireProfile(organizationId: string, workspaceId: string, id: string) {
    const row = await this.prisma.speakerProfile.findFirst({
      where: { id, organizationId, workspaceId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Speaker profile not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  private profileDto(row: {
    id: string;
    displayName: string;
    externalRef: string | null;
    status: string;
    fingerprintJson: Prisma.JsonValue | null;
    enrolledAt: Date | null;
    enrollmentCount: number;
    createdAt: Date;
    updatedAt: Date;
    fingerprintEncrypted?: boolean;
    authFactorEnabled?: boolean;
    deletedAt?: Date | null;
  }) {
    const fp = resolveFingerprint(row.fingerprintJson);
    const encrypted = Boolean(row.fingerprintEncrypted || isEncryptedFingerprint(row.fingerprintJson));
    return {
      id: row.id,
      displayName: row.displayName,
      externalRef: row.externalRef,
      status: row.status,
      enrolled: Boolean(fp?.vector?.length),
      enrollmentCount: row.enrollmentCount,
      enrolledAt: row.enrolledAt?.toISOString ?? null,
      fingerprintDims: fp?.dims ?? (isEncryptedFingerprint(row.fingerprintJson) ? row.fingerprintJson.dims : null),
      fingerprintEncrypted: encrypted,
      authFactorEnabled: Boolean(row.authFactorEnabled),
      deletedAt: row.deletedAt?.toISOString ?? null,
      createdAt: row.createdAt.toISOString,
      updatedAt: row.updatedAt.toISOString,
    };
  }

  private async recordEvent(input: {
    organizationId: string;
    workspaceId: string;
    profileId?: string | null;
    action: string;
    score?: number | null;
    decision?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.speakerEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        profileId: input.profileId ?? null,
        action: input.action,
        score: input.score ?? null,
        decision: input.decision ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }
}

function averageFingerprints(a: VoiceFingerprint, b: VoiceFingerprint): VoiceFingerprint {
  const n = Math.min(a.vector.length, b.vector.length);
  const vector = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    vector[i] = ((a.vector[i] ?? 0) + (b.vector[i] ?? 0)) / 2;
  }
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return {
    version: 1,
    dims: n,
    vector: vector.map((v) => Math.round((v / norm) * 1e6) / 1e6),
    durationSeconds: Math.round(((a.durationSeconds + b.durationSeconds) / 2) * 1000) / 1000,
  };
}

function clampThreshold(raw: number | undefined, fallback: number): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return fallback;
  return Math.min(0.99, Math.max(0.5, raw));
}
