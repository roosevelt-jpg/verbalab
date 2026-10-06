import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AudioService } from '../audio/audio.service';
import { SpeakerIntelligenceService } from '../speaker-intelligence/speaker-intelligence.service';
import { ApiException } from '../common/errors/api-exception';
import { voiceBiometricsEngineCatalog } from './voice-biometrics.catalog';
import {
  assessAntiSpoof,
  assessLiveness,
  createLivenessChallenge,
} from './anti-spoof';

export type BioAuth = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class VoiceBiometricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly audio: AudioService,
    private readonly speakers: SpeakerIntelligenceService,
  ) {}

  engine() {
    return voiceBiometricsEngineCatalog();
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { startsWith: 'voice_biometrics.' },
        createdAt: { gte: since },
      },
      select: { action: true },
      take: 5000,
    });
    const byAction: Record<string, number> = {};
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    }
    return {
      windowDays: 30,
      total: events.length,
      byAction,
      product: 'Lugemi Voice Biometrics',
      note: 'Biometric action counts from audit. Not NIST quality metrics.',
      docs: '/docs/VOICE_BIOMETRICS.md',
    };
  }

  async enroll(
    auth: BioAuth,
    input: { profileId: string; file: Express.Multer.File; enableAuthFactor?: boolean },
  ) {
    const result = await this.speakers.enroll({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      profileId: input.profileId,
      file: input.file,
      userId: auth.userId,
      ip: auth.ip,
      encryptAtRest: true,
    });
    if (input.enableAuthFactor) {
      await this.speakers.setAuthFactor({
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        profileId: input.profileId,
        enabled: true,
      });
    }
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_biometrics.enrolled',
      route: 'POST /v1/voice-biometrics/enroll',
      ip: auth.ip,
      metadata: { profileId: input.profileId, encrypted: true },
    });
    return {
      ...result,
      product: 'Voice Biometrics',
      encryptionAtRest: true,
      note: 'Encrypted enrollment via VL-176. Not a commercial biometric template / NIST enrollment.',
    };
  }

  async verify(
    auth: BioAuth,
    input: { profileId: string; file: Express.Multer.File; threshold?: number },
  ) {
    const result = await this.speakers.verify({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      profileId: input.profileId,
      file: input.file,
      threshold: input.threshold,
      userId: auth.userId,
      ip: auth.ip,
    });
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_biometrics.verified',
      route: 'POST /v1/voice-biometrics/verify',
      ip: auth.ip,
      metadata: { profileId: input.profileId, decision: result.decision, score: result.score },
    });
    return { ...result, product: 'Voice Biometrics' };
  }

  async identify(
    auth: BioAuth,
    input: { file: Express.Multer.File; threshold?: number; topK?: number },
  ) {
    const result = await this.speakers.identify({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      file: input.file,
      threshold: input.threshold,
      topK: input.topK,
      userId: auth.userId,
      ip: auth.ip,
    });
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_biometrics.identified',
      route: 'POST /v1/voice-biometrics/identify',
      ip: auth.ip,
      metadata: { decision: result.decision },
    });
    return { ...result, product: 'Voice Biometrics' };
  }

  antiSpoof(file: Express.Multer.File) {
    this.audio.assertAllowedAudio(file);
    return assessAntiSpoof(file.buffer);
  }

  livenessChallenge() {
    return createLivenessChallenge();
  }

  async livenessCheck(auth: BioAuth, file: Express.Multer.File, minDurationSeconds?: number) {
    this.audio.assertAllowedAudio(file);
    const result = assessLiveness(file.buffer, { minDurationSeconds });
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_biometrics.liveness',
      route: 'POST /v1/voice-biometrics/liveness',
      ip: auth.ip,
      metadata: { passed: result.passed, durationSeconds: result.durationSeconds },
    });
    return result;
  }

  async risk(auth: BioAuth, profileId?: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.speakerEvent.findMany({
      where: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        createdAt: { gte: since },
        ...(profileId ? { profileId } : {}),
        action: { in: ['verify', 'identify', 'biometric_deleted'] },
      },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });
    const verifies = events.filter((e) => e.action === 'verify');
    const rejects = verifies.filter((e) => e.decision === 'reject').length;
    const rejectRate = verifies.length ? rejects / verifies.length : 0;
    let riskScore = Number((rejectRate * 0.7).toFixed(3));
    if (rejects >= 5) riskScore = Math.min(1, riskScore + 0.2);
    const decision = riskScore >= 0.6 ? 'high' : riskScore >= 0.3 ? 'medium' : 'low';

    return {
      windowDays: 7,
      profileId: profileId ?? null,
      verifyCount: verifies.length,
      rejectCount: rejects,
      rejectRate: Number(rejectRate.toFixed(3)),
      riskScore,
      decision,
      note: 'Heuristic fraud/risk from recent verify rejects — not a fraud ML platform.',
      certifiedFraudModel: false,
    };
  }

  async authenticate(
    auth: BioAuth,
    input: { profileId: string; file: Express.Multer.File; threshold?: number },
  ) {
    this.audio.assertAllowedAudio(input.file);
    if (!input.profileId?.trim()) {
      throw new ApiException('validation_error', 'profileId is required', HttpStatus.BAD_REQUEST);
    }

    const spoof = assessAntiSpoof(input.file.buffer);
    const liveness = assessLiveness(input.file.buffer);
    const verify = await this.speakers.verify({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      profileId: input.profileId.trim(),
      file: input.file,
      threshold: input.threshold,
      userId: auth.userId,
      ip: auth.ip,
    });
    const workspaceRisk = await this.risk(auth, input.profileId.trim());

    let riskScore = spoof.riskScore * 0.45;
    if (!verify.match) riskScore += 0.35;
    if (!liveness.passed) riskScore += 0.15;
    riskScore += workspaceRisk.riskScore * 0.2;
    riskScore = Math.min(1, Number(riskScore.toFixed(3)));

    let decision: 'accept' | 'step_up' | 'reject' = 'accept';
    if (!verify.match || spoof.decision === 'fail' || riskScore >= 0.7) {
      decision = 'reject';
    } else if (spoof.decision === 'review' || !liveness.passed || riskScore >= 0.35) {
      decision = 'step_up';
    }

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_biometrics.authenticated',
      route: 'POST /v1/voice-biometrics/authenticate',
      ip: auth.ip,
      metadata: {
        profileId: input.profileId,
        decision,
        riskScore,
        verifyScore: verify.score,
        spoof: spoof.decision,
      },
    });

    return {
      decision,
      riskScore,
      verify: {
        match: verify.match,
        score: verify.score,
        threshold: verify.threshold,
        profileId: verify.profileId,
      },
      antiSpoof: {
        decision: spoof.decision,
        riskScore: spoof.riskScore,
        flags: spoof.flags,
        certifiedPad: false,
      },
      liveness: {
        passed: liveness.passed,
        certifiedLiveness: false,
      },
      workspaceRisk: {
        decision: workspaceRisk.decision,
        riskScore: workspaceRisk.riskScore,
      },
      note:
        'Composite voice auth decision from local fingerprints + heuristics. Not NIST-certified MFA. Prefer specialist vendor for regulated auth.',
      nistCertified: false,
    };
  }

  async deleteProfile(auth: BioAuth, profileId: string) {
    const profile = await this.speakers.purgeBiometric({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      profileId,
      userId: auth.userId,
      ip: auth.ip,
    });
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice_biometrics.deleted',
      route: 'DELETE /v1/voice-biometrics/profiles/:id',
      ip: auth.ip,
      metadata: { profileId },
    });
    return {
      deleted: true,
      profile,
      note: 'Fingerprint template purged. Profile marked deleted.',
    };
  }

  encryptionStatus() {
    const configured = Boolean(
      process.env.VOICE_BIOMETRIC_KEY?.trim() || process.env.ENCRYPTION_KEY?.trim(),
    );
    return {
      algorithm: 'aes-256-gcm',
      keyConfigured: configured,
      keySource: configured
        ? process.env.VOICE_BIOMETRIC_KEY?.trim()
          ? 'VOICE_BIOMETRIC_KEY'
          : 'ENCRYPTION_KEY'
        : 'dev_fallback_hash',
      note: configured
        ? 'Application-level AES-256-GCM for fingerprint JSON at rest.'
        : 'Using hashed dev fallback key — set VOICE_BIOMETRIC_KEY in production.',
    };
  }
}
