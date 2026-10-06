import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { languageKitsCatalog } from './language-kits.catalog';
import { portfolioMeta, type CoverageStatus } from '../portfolio/portfolio.meta';

export type KitStage =
  | 'draft'
  | 'data_ready'
  | 'trained'
  | 'evaluated'
  | 'preview'
  | 'released'
  | 'withdrawn';

type LanguageKit = {
  id: string;
  organizationId: string;
  languageTag: string;
  varietyId: string;
  displayName: string;
  script: string;
  stage: KitStage;
  version: number;
  datasetManifestRef: string | null;
  licensePolicyRef: string | null;
  orthographyNotes: string | null;
  createdAt: string;
  updatedAt: string;
  coverage: {
    asr: CoverageStatus;
    translation: Array<{ direction: string; status: CoverageStatus; domains: string[] }>;
    synthesis: CoverageStatus;
    evaluated_domains: string[];
    device_limitations: string[];
  };
};

const STAGE_ORDER: KitStage[] = [
  'draft',
  'data_ready',
  'trained',
  'evaluated',
  'preview',
  'released',
];

@Injectable()
export class LanguageKitsService {
  private readonly kits = new Map<string, LanguageKit>();

  constructor(private readonly audit: AuditService) {}

  engine() {
    return languageKitsCatalog();
  }

  async create(input: {
    languageTag: string;
    varietyId: string;
    displayName: string;
    script?: string;
    orthographyNotes?: string;
    organizationId: string;
    userId?: string;
    ip?: string;
  }) {
    const languageTag = input.languageTag.trim().toLowerCase();
    const varietyId = input.varietyId.trim();
    const displayName = input.displayName.trim();
    if (!languageTag || !varietyId || !displayName) {
      throw new ApiException(
        'validation_error',
        'languageTag, varietyId, and displayName are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const id = `kit_${randomUUID().slice(0, 10)}`;
    const now = new Date().toISOString();
    const kit: LanguageKit = {
      id,
      organizationId: input.organizationId,
      languageTag,
      varietyId,
      displayName,
      script: input.script?.trim() || 'Latn',
      stage: 'draft',
      version: 1,
      datasetManifestRef: null,
      licensePolicyRef: null,
      orthographyNotes: input.orthographyNotes ?? null,
      createdAt: now,
      updatedAt: now,
      coverage: {
        asr: 'unsupported',
        translation: [],
        synthesis: 'unsupported',
        evaluated_domains: [],
        device_limitations: ['No device pack released for this draft kit'],
      },
    };
    this.kits.set(id, kit);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'language_kits.created',
      route: 'POST /v1/language-kits',
      ip: input.ip,
      metadata: { kit_id: id, languageTag, varietyId },
    });

    return {
      ...this.serialize(kit),
      note: 'Draft task/variety profile created. Registry entry is not a model release.',
    };
  }

  list(organizationId: string) {
    const kits = [...this.kits.values()]
      .filter((k) => k.organizationId === organizationId)
      .map((k) => this.serialize(k));
    return { kits, count: kits.length };
  }

  get(id: string, organizationId: string) {
    return this.serialize(this.require(id, organizationId));
  }

  coverage(id: string, organizationId: string) {
    const kit = this.require(id, organizationId);
    return {
      kit_id: kit.id,
      stage: kit.stage,
      version: kit.version,
      coverage: kit.coverage,
      note: 'ASR, translation directions, and synthesis are reported separately with evaluated domains and device limitations.',
    };
  }

  async advance(input: {
    id: string;
    organizationId: string;
    toStage?: KitStage;
    datasetManifestRef?: string;
    licensePolicyRef?: string;
    translationDirection?: string;
    userId?: string;
    ip?: string;
  }) {
    const kit = this.require(input.id, input.organizationId);
    if (kit.stage === 'withdrawn') {
      throw new ApiException(
        'validation_error',
        'Withdrawn kits cannot advance; create a new version instead',
        HttpStatus.BAD_REQUEST,
      );
    }

    const target = input.toStage ?? this.nextStage(kit.stage);
    if (target === 'withdrawn') {
      kit.stage = 'withdrawn';
      kit.updatedAt = new Date().toISOString();
      kit.coverage.asr = 'unavailable';
      kit.coverage.synthesis = 'unavailable';
      kit.coverage.translation = kit.coverage.translation.map((t) => ({
        ...t,
        status: 'unavailable' as CoverageStatus,
      }));
    } else {
      const fromIdx = STAGE_ORDER.indexOf(kit.stage);
      const toIdx = STAGE_ORDER.indexOf(target);
      if (toIdx < 0 || toIdx > fromIdx + 1) {
        throw new ApiException(
          'validation_error',
          `Cannot jump from ${kit.stage} to ${target}; advance one stage at a time`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (target === 'data_ready') {
        if (!input.datasetManifestRef?.trim() || !input.licensePolicyRef?.trim()) {
          throw new ApiException(
            'validation_error',
            'data_ready requires immutable datasetManifestRef and approved licensePolicyRef',
            HttpStatus.BAD_REQUEST,
          );
        }
        kit.datasetManifestRef = input.datasetManifestRef.trim();
        kit.licensePolicyRef = input.licensePolicyRef.trim();
      }
      if (target === 'trained' && !kit.datasetManifestRef) {
        throw new ApiException(
          'validation_error',
          'Training requires an immutable dataset manifest',
          HttpStatus.BAD_REQUEST,
        );
      }
      kit.stage = target;
      kit.updatedAt = new Date().toISOString();
      this.refreshCoverage(kit, input.translationDirection);
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'language_kits.advanced',
      route: `POST /v1/language-kits/${kit.id}/advance`,
      ip: input.ip,
      metadata: { kit_id: kit.id, stage: kit.stage },
    });

    return {
      ...this.serialize(kit),
      meta: portfolioMeta({
        modelId: 'lugemi-language-kit',
        sourceLanguageTags: [kit.languageTag],
        targetLanguageTag: kit.languageTag,
        varietyId: kit.varietyId,
        status: kit.coverage.asr,
      }),
    };
  }

  private refreshCoverage(kit: LanguageKit, translationDirection?: string) {
    if (kit.stage === 'draft') return;
    if (kit.stage === 'data_ready') {
      kit.coverage.asr = 'unsupported';
      kit.coverage.synthesis = 'unsupported';
    }
    if (kit.stage === 'trained' || kit.stage === 'evaluated') {
      kit.coverage.asr = 'preview';
      const dir = translationDirection ?? `${kit.languageTag}->en`;
      kit.coverage.translation = [
        { direction: dir, status: 'preview', domains: ['customer_service'] },
      ];
      kit.coverage.synthesis = 'unsupported';
      kit.coverage.evaluated_domains = kit.stage === 'evaluated' ? ['customer_service'] : [];
      kit.coverage.device_limitations = ['Cloud batch only — no edge pack'];
    }
    if (kit.stage === 'preview' || kit.stage === 'released') {
      kit.coverage.asr = kit.stage === 'released' ? 'supported' : 'preview';
      kit.coverage.translation = kit.coverage.translation.map((t) => ({
        ...t,
        status: kit.stage === 'released' ? 'supported' : 'preview',
      }));
      // TTS only with separate voice data — remain unsupported unless later advanced with voice permission.
      kit.coverage.synthesis = 'unsupported';
      kit.coverage.evaluated_domains = ['customer_service'];
      kit.coverage.device_limitations =
        kit.stage === 'released'
          ? ['Synthesis not included without separate voice permission']
          : ['Preview — limited domains; synthesis unsupported'];
    }
  }

  private nextStage(stage: KitStage): KitStage {
    const idx = STAGE_ORDER.indexOf(stage);
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) {
      throw new ApiException(
        'validation_error',
        `No automatic next stage from ${stage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return STAGE_ORDER[idx + 1]!;
  }

  private require(id: string, organizationId: string): LanguageKit {
    const kit = this.kits.get(id);
    if (!kit || kit.organizationId !== organizationId) {
      throw new ApiException('not_found', 'Language kit not found', HttpStatus.NOT_FOUND);
    }
    return kit;
  }

  private serialize(kit: LanguageKit) {
    return {
      id: kit.id,
      language_tag: kit.languageTag,
      variety_id: kit.varietyId,
      display_name: kit.displayName,
      script: kit.script,
      stage: kit.stage,
      version: kit.version,
      dataset_manifest_ref: kit.datasetManifestRef,
      license_policy_ref: kit.licensePolicyRef,
      orthography_notes: kit.orthographyNotes,
      created_at: kit.createdAt,
      updated_at: kit.updatedAt,
      coverage: kit.coverage,
    };
  }
}
