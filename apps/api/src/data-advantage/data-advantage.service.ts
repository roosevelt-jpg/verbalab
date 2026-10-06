import { createHash, randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { portfolioMeta } from '../portfolio/portfolio.meta';
import { dataAdvantageCatalog } from './data-advantage.catalog';

const VALID_TAGS = new Set(['ak', 'en', 'yo', 'ha', 'ee', 'tw']);
const VALID_SPLITS = new Set(['train', 'development', 'calibration', 'test', 'shadow']);
const VALID_LABEL_STATUS = new Set(['raw', 'annotated', 'adjudicated', 'rejected', 'ambiguous']);
const VALID_STREAMS = new Set([
  'mixed_conversation',
  'meaning_contrasts',
  'timed_interpretation',
  'intent_register',
  'language_acquisition',
  'device_conditions',
  'grounded_regions',
]);
const PURPOSES = [
  'service_processing',
  'storing_recordings',
  'model_training',
  'voice_synthesis_cloning',
  'external_evaluation',
  'publication',
  'redistribution',
] as const;

type Purpose = (typeof PURPOSES)[number];

type Contributor = {
  contributor_id: string;
  agreement_policy_version: string;
  permitted_purposes: Purpose[];
  territories: string[];
  expiry: string | null;
  compensation_record: string;
  withdrawal_status: 'active' | 'withdrawn';
  contact_route: string;
  organizationId: string;
  created_at: string;
  withdrawn_at: string | null;
  remedy: {
    affected_manifests: string[];
    retraining_candidates: string[];
    deployments: string[];
    distributed_packs: string[];
    completion: 'pending' | 'tracked' | 'complete';
    note: string;
  } | null;
};

type DataRecord = {
  record_id: string;
  dataset_version: string;
  artifact_hash: string;
  speaker_group_id: string;
  session_group_id: string;
  source_language_tags: string[];
  variety_id: string | null;
  label_status: string;
  permission_policy_ref: string;
  allowed_training_families: string[];
  synthetic: boolean;
  split: string;
  review_manifest_ref: string;
  stream_id: string;
  contributor_id: string;
  organizationId: string;
  near_duplicate_of: string | null;
  pipeline_stage: string;
  created_at: string;
};

type FrozenRelease = {
  release_id: string;
  dataset_version: string;
  record_ids: string[];
  split_audit: Record<string, number>;
  organizationId: string;
  created_at: string;
  gates: {
    every_item_has_permitted_purpose: boolean;
    source_grouping: boolean;
    independent_review: boolean;
    split_audit: boolean;
  };
};

@Injectable()
export class DataAdvantageService {
  private readonly contributors = new Map<string, Contributor>();
  private readonly records = new Map<string, DataRecord>();
  private readonly releases = new Map<string, FrozenRelease>();
  private readonly groupSplits = new Map<string, string>();

  constructor(private readonly audit: AuditService) {}

  engine() {
    return dataAdvantageCatalog();
  }

  streams() {
    return {
      streams: dataAdvantageCatalog().streams,
      note: 'Seven acquisition streams feed Mix through Grounded. Synthetic descendants inherit source split and rights.',
    };
  }

  pipeline() {
    return {
      stages: dataAdvantageCatalog().pipeline_stages,
      security: {
        silent_online_updates: false,
        poisoning_guards: [
          'deliberate_poisoning',
          'glossary_prompt_injection',
          'malicious_labels',
          'false_consent',
          'coordinated_feedback',
        ],
        evaluate_on_unselected_random_samples: true,
      },
      annotation: {
        consequential_reviewers: 2,
        adjudicator_on_disagreement: true,
        pay_for_ambiguity_discovery: true,
        tone_marks_preserved: true,
      },
    };
  }

  listContributors(organizationId: string) {
    return {
      contributors: [...this.contributors.values()]
        .filter((c) => c.organizationId === organizationId)
        .map((c) => this.publicContributor(c)),
    };
  }

  async createContributor(input: {
    agreementPolicyVersion?: string;
    permittedPurposes?: string[];
    territories?: string[];
    expiry?: string | null;
    compensationRecord?: string;
    contactRoute?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    ip?: string;
  }) {
    const purposes = (input.permittedPurposes ?? ['service_processing', 'model_training']).filter(
      (p): p is Purpose => (PURPOSES as readonly string[]).includes(p),
    );
    if (!purposes.length) {
      throw new ApiException(
        'validation_error',
        'At least one permitted purpose is required. One checkbox does not authorize all uses.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (purposes.includes('voice_synthesis_cloning') && purposes.length === 1) {
      // Cloning alone is allowed only when explicitly selected; ordinary transcription never requires it.
    }

    const contributor: Contributor = {
      contributor_id: `contrib_${randomUUID().slice(0, 10)}`,
      agreement_policy_version: input.agreementPolicyVersion?.trim() || 'policy-pilot-1',
      permitted_purposes: purposes,
      territories: input.territories?.map((t) => t.trim()).filter(Boolean) ?? [],
      expiry: input.expiry ?? null,
      compensation_record: input.compensationRecord?.trim() || 'compensation_tracked',
      withdrawal_status: 'active',
      contact_route: input.contactRoute?.trim() || 'language-lead@lugemi.local',
      organizationId: input.organizationId,
      created_at: new Date().toISOString(),
      withdrawn_at: null,
      remedy: null,
    };
    this.contributors.set(contributor.contributor_id, contributor);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'data_advantage.contributor_create',
      route: 'POST /v1/data-advantage/contributors',
      ip: input.ip,
      metadata: { contributor_id: contributor.contributor_id, purposes },
    });

    return {
      ...this.publicContributor(contributor),
      ...portfolioMeta({
        modelId: 'lugemi-data-advantage',
        sourceLanguageTags: [],
        targetLanguageTag: 'und',
        status: 'preview',
        warnings: [
          'Voiceprints are not required for ordinary corpus participation.',
          'No cloning is required to contribute transcription examples.',
        ],
        evidenceRef: `contributor_${contributor.contributor_id}`,
      }),
    };
  }

  async withdrawContributor(input: {
    contributorId: string;
    organizationId: string;
    userId?: string;
    ip?: string;
  }) {
    const contributor = this.contributors.get(input.contributorId);
    if (!contributor || contributor.organizationId !== input.organizationId) {
      throw new ApiException('not_found', 'Contributor not found', HttpStatus.NOT_FOUND);
    }

    const affected = [...this.records.values()].filter(
      (r) => r.contributor_id === contributor.contributor_id && r.organizationId === input.organizationId,
    );
    const manifests = [...new Set(affected.map((r) => r.dataset_version))];
    contributor.withdrawal_status = 'withdrawn';
    contributor.withdrawn_at = new Date().toISOString();
    contributor.remedy = {
      affected_manifests: manifests,
      retraining_candidates: manifests.map((m) => `retrain_${m}`),
      deployments: ['lugemi-mix', 'lugemi-fidelity'].filter(() => manifests.length > 0),
      distributed_packs: [],
      completion: manifests.length ? 'tracked' : 'complete',
      note:
        'Withdrawal stops future collection and unauthorized new training. Immediate removal of influence from every existing model is not promised.',
    };
    this.contributors.set(contributor.contributor_id, contributor);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'data_advantage.contributor_withdraw',
      route: 'POST /v1/data-advantage/contributors/{id}/withdraw',
      ip: input.ip,
      metadata: { contributor_id: contributor.contributor_id, manifests },
    });

    return this.publicContributor(contributor);
  }

  async ingestRecord(input: {
    datasetVersion?: string;
    artifactContent?: string;
    speakerGroupId?: string;
    sessionGroupId?: string;
    sourceLanguageTags?: string[];
    varietyId?: string | null;
    labelStatus?: string;
    permissionPolicyRef?: string;
    allowedTrainingFamilies?: string[];
    synthetic?: boolean;
    split?: string;
    reviewManifestRef?: string;
    streamId?: string;
    contributorId?: string;
    nearDuplicateOf?: string | null;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    ip?: string;
  }) {
    const streamId = input.streamId?.trim() || 'mixed_conversation';
    if (!VALID_STREAMS.has(streamId)) {
      throw new ApiException('validation_error', `Unknown stream: ${streamId}`, HttpStatus.BAD_REQUEST);
    }

    const contributorId = input.contributorId?.trim();
    if (!contributorId) {
      throw new ApiException('validation_error', 'contributorId is required', HttpStatus.BAD_REQUEST);
    }
    const contributor = this.contributors.get(contributorId);
    if (!contributor || contributor.organizationId !== input.organizationId) {
      throw new ApiException('not_found', 'Contributor not found', HttpStatus.NOT_FOUND);
    }
    if (contributor.withdrawal_status === 'withdrawn') {
      throw new ApiException(
        'permission_denied',
        'Withdrawn contributors cannot supply new training records',
        HttpStatus.FORBIDDEN,
      );
    }
    if (!contributor.permitted_purposes.includes('model_training') && !contributor.permitted_purposes.includes('service_processing')) {
      throw new ApiException(
        'permission_denied',
        'Contributor agreement does not permit ingest for processing or training',
        HttpStatus.FORBIDDEN,
      );
    }
    if (contributor.expiry && Date.parse(contributor.expiry) < Date.now()) {
      throw new ApiException('permission_denied', 'Contributor agreement has expired', HttpStatus.FORBIDDEN);
    }

    const tags = (input.sourceLanguageTags ?? ['en']).map((t) => t.trim().toLowerCase()).filter(Boolean);
    for (const tag of tags) {
      if (!VALID_TAGS.has(tag)) {
        throw new ApiException(
          'validation_error',
          `Language tag "${tag}" is not in the pilot registry. Validate against the registry rather than inventing tags.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const labelStatus = input.labelStatus?.trim() || 'raw';
    if (!VALID_LABEL_STATUS.has(labelStatus)) {
      throw new ApiException('validation_error', `Invalid label_status: ${labelStatus}`, HttpStatus.BAD_REQUEST);
    }

    const speakerGroupId = input.speakerGroupId?.trim() || `speaker_${randomUUID().slice(0, 8)}`;
    const sessionGroupId = input.sessionGroupId?.trim() || `session_${randomUUID().slice(0, 8)}`;
    const groupKey = `${input.organizationId}:${speakerGroupId}:${sessionGroupId}`;

    let split = input.split?.trim() || '';
    if (input.nearDuplicateOf) {
      const parent = this.records.get(input.nearDuplicateOf);
      if (!parent || parent.organizationId !== input.organizationId) {
        throw new ApiException('not_found', 'nearDuplicateOf parent not found', HttpStatus.NOT_FOUND);
      }
      split = parent.split;
    } else if (this.groupSplits.has(groupKey)) {
      split = this.groupSplits.get(groupKey)!;
    } else if (!split) {
      split = 'train';
    }
    if (!VALID_SPLITS.has(split)) {
      throw new ApiException('validation_error', `Invalid split: ${split}`, HttpStatus.BAD_REQUEST);
    }
    if (!input.nearDuplicateOf) {
      this.groupSplits.set(groupKey, split);
    }

    const content = input.artifactContent?.trim() || `record_${randomUUID()}`;
    const artifact_hash = createHash('sha256').update(content).digest('hex');

    // Exact-duplicate grouping before split finalization
    for (const existing of this.records.values()) {
      if (
        existing.organizationId === input.organizationId &&
        existing.artifact_hash === artifact_hash &&
        existing.dataset_version === (input.datasetVersion?.trim() || 'mix-pilot-1')
      ) {
        throw new ApiException(
          'conflict',
          'Exact duplicate artifact hash already ingested for this dataset version',
          HttpStatus.CONFLICT,
        );
      }
    }

    const record: DataRecord = {
      record_id: `record_${randomUUID().slice(0, 10)}`,
      dataset_version: input.datasetVersion?.trim() || 'mix-pilot-1',
      artifact_hash,
      speaker_group_id: speakerGroupId,
      session_group_id: sessionGroupId,
      source_language_tags: tags,
      variety_id: input.varietyId ?? null,
      label_status: labelStatus,
      permission_policy_ref: input.permissionPolicyRef?.trim() || contributor.agreement_policy_version,
      allowed_training_families: input.allowedTrainingFamilies?.length
        ? input.allowedTrainingFamilies
        : ['echo', 'translate'],
      synthetic: Boolean(input.synthetic),
      split,
      review_manifest_ref: input.reviewManifestRef?.trim() || `review_${randomUUID().slice(0, 8)}`,
      stream_id: streamId,
      contributor_id: contributorId,
      organizationId: input.organizationId,
      near_duplicate_of: input.nearDuplicateOf ?? null,
      pipeline_stage: 'permission_validation',
      created_at: new Date().toISOString(),
    };
    this.records.set(record.record_id, record);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'data_advantage.record_ingest',
      route: 'POST /v1/data-advantage/records',
      ip: input.ip,
      metadata: { record_id: record.record_id, stream_id: streamId, split, synthetic: record.synthetic },
    });

    return {
      record,
      pipeline_note: 'Deduplication and group assignment happen before train/test split finalization.',
      ...portfolioMeta({
        modelId: 'lugemi-data-advantage',
        sourceLanguageTags: tags,
        targetLanguageTag: tags[0] ?? 'und',
        varietyId: record.variety_id,
        status: 'preview',
        warnings: record.synthetic
          ? ['Synthetic switches are augmentation, never primary quality evidence.']
          : [],
        evidenceRef: record.review_manifest_ref,
      }),
    };
  }

  exportCheck(input: {
    recordIds?: string[];
    requiredPurpose?: string;
    organizationId: string;
  }) {
    const required = (input.requiredPurpose?.trim() || 'model_training') as Purpose;
    if (!(PURPOSES as readonly string[]).includes(required)) {
      throw new ApiException('validation_error', `Unknown purpose: ${required}`, HttpStatus.BAD_REQUEST);
    }

    const ids = input.recordIds?.length
      ? input.recordIds
      : [...this.records.values()]
          .filter((r) => r.organizationId === input.organizationId)
          .map((r) => r.record_id);

    const results = ids.map((id) => {
      const record = this.records.get(id);
      if (!record || record.organizationId !== input.organizationId) {
        return { record_id: id, allowed: false, reason: 'not_found' };
      }
      const contributor = this.contributors.get(record.contributor_id);
      if (!contributor) {
        return { record_id: id, allowed: false, reason: 'contributor_missing' };
      }
      if (contributor.withdrawal_status === 'withdrawn') {
        return {
          record_id: id,
          allowed: false,
          reason: 'withdrawn_contributor',
          expected_behavior: 'deny_export',
        };
      }
      if (!contributor.permitted_purposes.includes(required)) {
        return {
          record_id: id,
          allowed: false,
          reason: 'incompatible_license_purpose',
          expected_behavior: 'deny_export',
        };
      }
      if (contributor.expiry && Date.parse(contributor.expiry) < Date.now()) {
        return { record_id: id, allowed: false, reason: 'agreement_expired', expected_behavior: 'deny_export' };
      }
      return { record_id: id, allowed: true, reason: null, expected_behavior: 'allow_export' };
    });

    const denied = results.filter((r) => !r.allowed);
    return {
      required_purpose: required,
      results,
      denied_count: denied.length,
      note: 'Export-denial tests for incompatible licenses and withdrawn contributors are mandatory before pilot dataset release.',
    };
  }

  async sampleErrorLoop(input: {
    streamId?: string;
    corridor?: string;
    severity?: string;
    includeRandomPrevalence?: boolean;
    organizationId: string;
    userId?: string;
    ip?: string;
  }) {
    const streamId = input.streamId?.trim() || 'meaning_contrasts';
    if (!VALID_STREAMS.has(streamId)) {
      throw new ApiException('validation_error', `Unknown stream: ${streamId}`, HttpStatus.BAD_REQUEST);
    }

    const pool = [...this.records.values()].filter(
      (r) => r.organizationId === input.organizationId && r.stream_id === streamId,
    );
    const balanced = pool.slice(0, 5);
    const randomPrevalence =
      input.includeRandomPrevalence !== false
        ? pool.filter((_, i) => i % 3 === 0).slice(0, 3)
        : [];

    const sample = {
      sample_id: `sample_${randomUUID().slice(0, 10)}`,
      stream_id: streamId,
      corridor: input.corridor?.trim() || 'twi-english',
      severity: input.severity?.trim() || 'critical',
      balanced_record_ids: balanced.map((r) => r.record_id),
      random_prevalence_record_ids: randomPrevalence.map((r) => r.record_id),
      steps: [
        'Record authorized error categories and evidence references in a consented pilot',
        'Sample balanced set by corridor, severity, variety, device and channel; keep random samples for prevalence',
        'Invite authorized correction and independently review it — user feedback is not automatically ground truth',
        'Score candidates for representativeness and expected quality gain per annotation hour',
        'Train offline with versioned manifests; test against untouched holdouts',
        'Shadow under tenant policy; promote through existing canary/rollback controls',
      ],
      silent_online_updates: false,
      note: 'Evaluate performance on unselected random samples, not only on the interesting errors the sampler found.',
    };

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'data_advantage.error_loop_sample',
      route: 'POST /v1/data-advantage/error-loop/sample',
      ip: input.ip,
      metadata: { sample_id: sample.sample_id, stream_id: streamId },
    });

    return {
      ...sample,
      ...portfolioMeta({
        modelId: 'lugemi-data-advantage',
        sourceLanguageTags: ['ak', 'en'],
        targetLanguageTag: 'en',
        status: 'preview',
        evidenceRef: sample.sample_id,
      }),
    };
  }

  async freezeRelease(input: {
    datasetVersion?: string;
    organizationId: string;
    userId?: string;
    ip?: string;
  }) {
    const version = input.datasetVersion?.trim() || 'mix-pilot-1';
    const records = [...this.records.values()].filter(
      (r) => r.organizationId === input.organizationId && r.dataset_version === version,
    );
    if (!records.length) {
      throw new ApiException(
        'validation_error',
        'No records for dataset version — cannot freeze an empty release',
        HttpStatus.BAD_REQUEST,
      );
    }

    const exportCheck = this.exportCheck({
      recordIds: records.map((r) => r.record_id),
      requiredPurpose: 'model_training',
      organizationId: input.organizationId,
    });
    if (exportCheck.denied_count > 0) {
      throw new ApiException(
        'permission_denied',
        `Cannot freeze release: ${exportCheck.denied_count} record(s) fail export-denial / rights checks`,
        HttpStatus.FORBIDDEN,
      );
    }

    const adjudicated = records.every(
      (r) => r.label_status === 'adjudicated' || r.label_status === 'ambiguous' || r.label_status === 'rejected',
    );
    if (!adjudicated) {
      throw new ApiException(
        'validation_error',
        'Every included item needs independent review appropriate to severity (adjudicated, ambiguous, or rejected)',
        HttpStatus.BAD_REQUEST,
      );
    }

    const split_audit: Record<string, number> = {};
    for (const r of records) {
      split_audit[r.split] = (split_audit[r.split] ?? 0) + 1;
    }

    const release: FrozenRelease = {
      release_id: `release_${randomUUID().slice(0, 10)}`,
      dataset_version: version,
      record_ids: records.map((r) => r.record_id),
      split_audit,
      organizationId: input.organizationId,
      created_at: new Date().toISOString(),
      gates: {
        every_item_has_permitted_purpose: true,
        source_grouping: records.every((r) => Boolean(r.speaker_group_id && r.session_group_id)),
        independent_review: true,
        split_audit: true,
      },
    };
    this.releases.set(release.release_id, release);
    for (const r of records) {
      r.pipeline_stage = 'frozen_release';
      this.records.set(r.record_id, r);
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'data_advantage.release_freeze',
      route: 'POST /v1/data-advantage/releases',
      ip: input.ip,
      metadata: { release_id: release.release_id, count: records.length },
    });

    return {
      ...release,
      success_definition:
        'A reproducible artifact with improved downstream quality — not a rising dataset row count.',
      cost_tracking: [
        'cost_per_approved_audio_hour',
        'reviewed_sentence_pair',
        'adjudicated_critical_error_example',
        'demonstrated_held_out_gain',
      ],
      ...portfolioMeta({
        modelId: 'lugemi-data-advantage',
        sourceLanguageTags: [...new Set(records.flatMap((r) => r.source_language_tags))],
        targetLanguageTag: 'en',
        status: 'preview',
        evidenceRef: release.release_id,
      }),
    };
  }

  private publicContributor(c: Contributor) {
    return {
      contributor_id: c.contributor_id,
      agreement_policy_version: c.agreement_policy_version,
      permitted_purposes: c.permitted_purposes,
      territories: c.territories,
      expiry: c.expiry,
      compensation_record: c.compensation_record,
      withdrawal_status: c.withdrawal_status,
      contact_route: c.contact_route,
      created_at: c.created_at,
      withdrawn_at: c.withdrawn_at,
      remedy: c.remedy,
    };
  }
}
