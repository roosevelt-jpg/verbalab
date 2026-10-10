/** Access-controlled native-speaker review records for Echo demos. */

export type SpeechReviewRating = {
  intelligibility: number; // 1-5
  naturalness: number;
  accentAuthenticity: number;
  audioQuality: number;
};

export type SpeechReviewRecord = {
  id: string;
  sourceScript: string;
  targetTranslation?: string;
  locale: string;
  voiceId: string;
  modelVersion: string;
  synthEngine: string;
  audioSha256: string;
  ratings: SpeechReviewRating;
  pronunciationNotes?: string;
  meaningNotes?: string;
  reviewerId: string;
  reviewerQualifications: string[];
  decision: 'approved' | 'rejected' | 'needs_adjudication';
  createdAt: string;
  /** Reviews never auto-enter training datasets. */
  trainingEligible: false;
};
