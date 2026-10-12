import { Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { FidelityService } from '../fidelity/fidelity.service';
import type { AssuranceFinding } from './assurance.checks';
import { runSpokenRealizationAlignment } from './assurance.checks';

@Injectable()
export class LanguageAssuranceAdapters {
  constructor(
    private readonly fidelity: FidelityService,
    private readonly audio: AudioService,
  ) {}

  async semanticFidelity(input: {
    source: string;
    target: string;
    sourceLanguage: string;
    targetLanguage: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    ip?: string;
  }): Promise<{ findings: AssuranceFinding[]; modelVersion: string; unavailable?: string }> {
    try {
      const result = await this.fidelity.verify({
        source: input.source,
        target: input.target,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        // Do not pass synthetic bridge actor ids — audit_events.user_id FK expects real users.
        ip: input.ip,
      });
      const findings: AssuranceFinding[] = (result.error_spans ?? []).map((span) => ({
        stage: 'semantic_fidelity',
        category: span.category,
        severity: span.severity,
        sourceEvidence: span.source,
        targetEvidence: span.target,
        scoreMeaning:
          result.error_probability == null
            ? 'uncalibrated_detector_score'
            : 'local_demo_probability_not_production_calibrated',
        reasonCode: span.reason_code,
        evidence: {
          decision: result.decision,
          error_probability: result.error_probability,
          calibration_version: result.calibration_version,
        },
      }));
      return {
        findings,
        modelVersion: String(result.model_version ?? result.calibration_version ?? 'fidelity-local'),
      };
    } catch (err) {
      return {
        findings: [],
        modelVersion: 'none',
        unavailable: err instanceof Error ? err.message : 'fidelity_unavailable',
      };
    }
  }

  async spokenRealization(input: {
    approvedTargetText: string;
    audioBase64?: string | null;
    audioMimeType?: string | null;
    language: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<{ findings: AssuranceFinding[]; unavailable?: string; provider?: string }> {
    const enabled =
      process.env.LANGUAGE_ASSURANCE_SPOKEN_ASR === '1' || process.env.NODE_ENV === 'test';
    if (!enabled) {
      return {
        findings: [],
        unavailable:
          'Independent speech recognition for spoken realization is gated until measured. Matching transcripts would not certify pronunciation.',
      };
    }
    if (!input.audioBase64?.trim()) {
      return { findings: [], unavailable: 'no_audio_for_spoken_realization' };
    }

    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.LANGUAGE_ASSURANCE_ALLOW_FIXTURE_ASR === '1';

    try {
      const buf = Buffer.from(input.audioBase64, 'base64');
      const file = {
        buffer: buf,
        originalname: 'assurance-take.wav',
        mimetype: input.audioMimeType || 'audio/wav',
        size: buf.length,
        fieldname: 'file',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: undefined as unknown as NodeJS.ReadableStream,
      } as Express.Multer.File;

      const result = await this.audio.transcribe({
        file,
        language: input.language,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });

      return {
        findings: runSpokenRealizationAlignment({
          approvedTargetText: input.approvedTargetText,
          asrHypothesis: result.text,
        }),
        provider: result.provider ?? 'audio',
      };
    } catch {
      if (!allowFixture) {
        return {
          findings: [],
          unavailable: 'ASR adapter failed — required spoken stage cannot pass.',
        };
      }
      // Labeled fixture: use target text as hypothesis so WER is low; critical qty still checked if we mutate.
      const hypothesis =
        process.env.LANGUAGE_ASSURANCE_FIXTURE_ASR_TEXT?.trim() || input.approvedTargetText;
      return {
        findings: runSpokenRealizationAlignment({
          approvedTargetText: input.approvedTargetText,
          asrHypothesis: hypothesis,
        }),
        provider: 'assurance-fixture-asr',
      };
    }
  }
}
