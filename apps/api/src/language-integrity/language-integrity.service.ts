import { Injectable } from '@nestjs/common';
import { VoiceClonesService } from '../voice-clones/voice-clones.service';
import {
  languageIntegrityEngineCatalog,
  languageIntegrityProtocol,
} from './language-integrity.catalog';

export type IntegrityVerifyInput = {
  claimType?: string;
  cloneId?: string;
  watermarkHeader?: string;
  consentAttested?: boolean;
  ownershipAttested?: boolean;
  audioClaimText?: string;
  attestationNotes?: string;
  organizationId?: string;
  workspaceId?: string;
};

@Injectable()
export class LanguageIntegrityService {
  constructor(private readonly clones: VoiceClonesService) {}

  engine() {
    return languageIntegrityEngineCatalog();
  }

  protocol() {
    return languageIntegrityProtocol();
  }

  async verify(input: IntegrityVerifyInput) {
    const claimType = (input.claimType ?? 'provenance').trim().toLowerCase();
    const watermark = (input.watermarkHeader ?? '').trim().toLowerCase();
    const cloneId = input.cloneId?.trim();
    const findings: Array<{ code: string; severity: 'pass' | 'warn' | 'fail' | 'info'; detail: string }> =
      [];

    findings.push({
      code: 'honesty',
      severity: 'info',
      detail:
        'This check validates Lugemi provenance metadata (watermark headers, clone consent/attestation). It is not a universal deepfake detector and does not certify courtroom admissibility by itself.',
    });

    const watermarkOk = watermark === 'required' || watermark === 'present' || watermark === 'true';
    if (watermark) {
      findings.push({
        code: 'watermark',
        severity: watermarkOk ? 'pass' : 'fail',
        detail: watermarkOk
          ? `Watermark disclosure header recognized: ${input.watermarkHeader}`
          : `Unrecognized watermark claim "${input.watermarkHeader}". Expected X-Lugemi-Watermark: required on Lugemi clone speech.`,
      });
    } else {
      findings.push({
        code: 'watermark',
        severity: 'warn',
        detail:
          'No watermark header supplied. Absence of a Lugemi watermark does not prove the audio is human — only that this claim lacks Lugemi disclosure metadata.',
      });
    }

    let cloneRecord: Awaited<ReturnType<VoiceClonesService['get']>> | null = null;
    if (cloneId && input.organizationId && input.workspaceId) {
      try {
        cloneRecord = await this.clones.get(input.organizationId, input.workspaceId, cloneId);
        findings.push({
          code: 'clone_found',
          severity: 'pass',
          detail: `Clone ${cloneRecord.id} status=${cloneRecord.status}; consent=${cloneRecord.consentAttested}; ownership=${cloneRecord.ownershipAttested}; watermarkRequired=${cloneRecord.watermarkRequired}.`,
        });
        if (!cloneRecord.consentAttested) {
          findings.push({
            code: 'consent',
            severity: 'fail',
            detail: 'Clone lacks consent attestation — do not treat as authorized synthetic media.',
          });
        } else {
          findings.push({
            code: 'consent',
            severity: 'pass',
            detail: 'Consent attestation present on clone profile.',
          });
        }
        if (cloneRecord.status !== 'approved') {
          findings.push({
            code: 'review',
            severity: 'fail',
            detail: `Clone status is ${cloneRecord.status}, not approved. Abuse review gate not cleared.`,
          });
        } else {
          findings.push({
            code: 'review',
            severity: 'pass',
            detail: 'Clone passed workspace abuse review (approved).',
          });
        }
        if (!cloneRecord.watermarkRequired) {
          findings.push({
            code: 'clone_watermark_policy',
            severity: 'fail',
            detail: 'Clone misconfigured: watermarkRequired should be true.',
          });
        }
      } catch {
        findings.push({
          code: 'clone_found',
          severity: 'fail',
          detail: `Clone id ${cloneId} not found in this workspace.`,
        });
      }
    } else if (cloneId) {
      findings.push({
        code: 'clone_found',
        severity: 'warn',
        detail:
          'Clone id provided without workspace session — structural check only. Sign in to verify against your library.',
      });
    }

    if (typeof input.consentAttested === 'boolean') {
      findings.push({
        code: 'claim_consent',
        severity: input.consentAttested ? 'pass' : 'fail',
        detail: input.consentAttested
          ? 'Claim asserts consent attestation.'
          : 'Claim asserts consent was not attested.',
      });
    }

    const notes = input.attestationNotes?.trim() ?? '';
    if (notes.length > 0 && notes.length < 8) {
      findings.push({
        code: 'attestation_notes',
        severity: 'fail',
        detail: 'Attestation notes too short (min 8 chars) — same bar as clone enrollment.',
      });
    } else if (notes.length >= 8) {
      findings.push({
        code: 'attestation_notes',
        severity: 'pass',
        detail: 'Attestation notes meet minimum descriptive length.',
      });
    }

    const claimText = (input.audioClaimText ?? '').trim();
    if (claimText) {
      const syntheticHints =
        /deepfake|cloned voice|synthetic|generated speech|ai voice|tts/i.test(claimText);
      findings.push({
        code: 'claim_text',
        severity: 'info',
        detail: syntheticHints
          ? 'Claim text references synthetic/AI speech — pair with watermark + consent evidence before any official use.'
          : 'Claim text recorded for audit accompaniment. Pair with watermark/consent metadata.',
      });
    }

    const fails = findings.filter((f) => f.severity === 'fail').length;
    const passes = findings.filter((f) => f.severity === 'pass').length;

    let verdict: 'attested' | 'partial' | 'unattested' | 'rejected';
    if (fails > 0) verdict = 'rejected';
    else if (watermarkOk && (cloneRecord?.consentAttested || input.consentAttested === true)) {
      verdict = 'attested';
    } else if (passes > 0 || watermarkOk) {
      verdict = 'partial';
    } else {
      verdict = 'unattested';
    }

    return {
      product: 'Lugemi Language Integrity',
      claimType,
      verdict,
      summary:
        verdict === 'attested'
          ? 'Claim carries Lugemi watermark disclosure and consent attestation signals.'
          : verdict === 'partial'
            ? 'Some Lugemi provenance signals present — complete watermark + consent + review before official use.'
            : verdict === 'rejected'
              ? 'One or more integrity gates failed — do not treat as Lugemi-attested synthetic media.'
              : 'No Lugemi attestation found — courts/ministries should not treat this as Lugemi-provenanced speech.',
      findings,
      clone: cloneRecord
        ? {
            id: cloneRecord.id,
            name: cloneRecord.name,
            status: cloneRecord.status,
            consentAttested: cloneRecord.consentAttested,
            ownershipAttested: cloneRecord.ownershipAttested,
            watermarkRequired: cloneRecord.watermarkRequired,
          }
        : null,
      protocolHint:
        'Governments can require verdict=attested (or equivalent package: watermark + approved consented clone + audit ids) before admitting synthetic media.',
      honesty: this.engine().honesty,
      docs: '/docs/LANGUAGE_INTEGRITY.md',
    };
  }
}
