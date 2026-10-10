import { createHash, randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { SpeechReviewRecord, SpeechReviewRating } from './speech-review.types';

/**
 * In-memory native-speaker review store for local/dev.
 * Production should persist to Postgres with access control — reviews never
 * auto-enter training datasets.
 */
@Injectable()
export class SpeechReviewService {
  private readonly records: SpeechReviewRecord[] = [];

  list(locale?: string) {
    const rows = locale
      ? this.records.filter((r) => r.locale.toLowerCase().startsWith(locale.toLowerCase()))
      : this.records;
    return {
      product: 'speech-native-review',
      note:
        'AI checks may assist reviewers but cannot be presented as native-speaker validation. trainingEligible is always false until a separate permissioned release.',
      count: rows.length,
      data: rows,
    };
  }

  submit(input: {
    sourceScript: string;
    targetTranslation?: string;
    locale: string;
    voiceId: string;
    modelVersion: string;
    synthEngine: string;
    audioBase64?: string;
    ratings: SpeechReviewRating;
    pronunciationNotes?: string;
    meaningNotes?: string;
    reviewerId: string;
    reviewerQualifications: string[];
    decision: 'approved' | 'rejected' | 'needs_adjudication';
  }): SpeechReviewRecord {
    const audioSha256 = input.audioBase64
      ? createHash('sha256').update(Buffer.from(input.audioBase64, 'base64')).digest('hex')
      : 'no-audio';
    const record: SpeechReviewRecord = {
      id: `rev_${randomUUID()}`,
      sourceScript: input.sourceScript,
      targetTranslation: input.targetTranslation,
      locale: input.locale,
      voiceId: input.voiceId,
      modelVersion: input.modelVersion,
      synthEngine: input.synthEngine,
      audioSha256,
      ratings: input.ratings,
      pronunciationNotes: input.pronunciationNotes,
      meaningNotes: input.meaningNotes,
      reviewerId: input.reviewerId,
      reviewerQualifications: input.reviewerQualifications,
      decision: input.decision,
      createdAt: new Date().toISOString(),
      trainingEligible: false,
    };
    this.records.unshift(record);
    return record;
  }

  approvedCatalogue() {
    const approved = this.records.filter((r) => r.decision === 'approved');
    return {
      product: 'approved-demo-catalogue',
      note: 'Only native-reviewed approvals appear here. Unreviewed voices remain marked outside the customer-facing approved set.',
      count: approved.length,
      data: approved,
    };
  }
}
