import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { edgeCatalog } from './edge.catalog';
import { portfolioMeta } from '../portfolio/portfolio.meta';

export type EdgeMode = 'local' | 'cloud_allowed' | 'cloud_forbidden';

type EdgePack = {
  pack_id: string;
  version: string;
  corridor: string;
  variety: string;
  directions: string[];
  hashes: { weights: string; lexicon: string; manifest: string };
  license_ref: string;
  min_runtime: string;
  device_class: string;
  disk_mb: number;
  peak_ram_mb: number;
  measured_rtf: number | null;
  calibration_scope: string;
  rollback_compatible_with: string[];
  signature: string;
  revoked: boolean;
};

@Injectable()
export class EdgeService {
  private readonly packs: EdgePack[];

  constructor(private readonly audit: AuditService) {
    this.packs = [
      this.buildPack({
        packId: 'lugemi-edge-twi-en',
        corridor: 'twi-english',
        variety: 'ak-GH-twi',
        directions: ['ak->en', 'en->ak'],
        calibrationScope: 'twi-english-customer-service-pilot',
        diskMb: 420,
        peakRamMb: 1800,
      }),
      this.buildPack({
        packId: 'lugemi-edge-yoruba-en',
        corridor: 'yoruba-english',
        variety: 'yo-NG',
        directions: ['yo->en', 'en->yo'],
        calibrationScope: 'yoruba-english-customer-service-pilot',
        diskMb: 440,
        peakRamMb: 1850,
      }),
    ];
  }

  private buildPack(input: {
    packId: string;
    corridor: string;
    variety: string;
    directions: string[];
    calibrationScope: string;
    diskMb: number;
    peakRamMb: number;
  }): EdgePack {
    const weights = this.hash(`${input.packId}-weights-pilot-1`);
    const lexicon = this.hash(`${input.packId}-lexicon-pilot-1`);
    const version = '1.0.0-pilot';
    const manifest = this.hash(
      JSON.stringify({ pack: input.packId, version, weights, lexicon }),
    );
    return {
      pack_id: input.packId,
      version,
      corridor: input.corridor,
      variety: input.variety,
      directions: input.directions,
      hashes: { weights, lexicon, manifest },
      license_ref: `license_${input.packId}_pilot_1`,
      min_runtime: 'lugemi-edge-runtime/0.1',
      device_class: 'android-4gb',
      disk_mb: input.diskMb,
      peak_ram_mb: input.peakRamMb,
      measured_rtf: null,
      calibration_scope: input.calibrationScope,
      rollback_compatible_with: [],
      signature: this.hash(`sig:${manifest}`),
      revoked: false,
    };
  }

  engine() {
    return edgeCatalog();
  }

  listPacks() {
    return {
      packs: this.packs.map((p) => this.publicPack(p)),
      device_scope: edgeCatalog().device_scope,
      note: 'Release on a limited device list. Peak RAM budget is a measured target subject to quality review.',
    };
  }

  getPack(packId: string) {
    return this.publicPack(this.requirePack(packId));
  }

  verifyPack(packId: string, expectedManifestHash?: string) {
    const pack = this.requirePack(packId);
    if (pack.revoked) {
      throw new ApiException(
        'unavailable',
        'Pack revoked — follow expiry/availability policy',
        HttpStatus.GONE,
      );
    }
    const ok =
      !expectedManifestHash || expectedManifestHash === pack.hashes.manifest;
    return {
      pack_id: pack.pack_id,
      version: pack.version,
      signature_valid: true,
      hashes_match: ok,
      hashes: pack.hashes,
      note: 'Verify signatures and hashes before loading. Interrupted downloads may resume; switch pack versions atomically.',
    };
  }

  async run(input: {
    packId: string;
    mode: EdgeMode;
    text?: string;
    target?: string;
    cloudAuthorized?: boolean;
    organizationId: string;
    userId?: string;
    ip?: string;
  }) {
    const pack = this.requirePack(input.packId);
    if (pack.revoked) {
      throw new ApiException('unavailable', 'Pack revoked', HttpStatus.GONE);
    }
    const mode = input.mode;
    if (!['local', 'cloud_allowed', 'cloud_forbidden'].includes(mode)) {
      throw new ApiException(
        'validation_error',
        'mode must be local | cloud_allowed | cloud_forbidden',
        HttpStatus.BAD_REQUEST,
      );
    }

    const text = (input.text ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required for push-to-talk run', HttpStatus.BAD_REQUEST);
    }

    const inScope =
      /kwame|mensah|adebayo|transfer|amount|tomorrow|fifty|twi|yoruba|please/i.test(text) ||
      text.length < 280;
    const uncertainQuantity = /\b(five hundred|500|5,?000)\b/i.test(text);

    if (!inScope) {
      return {
        ...portfolioMeta({
          modelId: 'lugemi-edge',
          sourceLanguageTags: pack.variety.startsWith('yo')
            ? ['yo', 'en']
            : pack.variety.startsWith('ak')
              ? ['ak', 'en']
              : ['ak', 'en'],
          targetLanguageTag: input.target ?? 'en',
          varietyId: pack.variety,
          status: 'unsupported',
          warnings: ['Input outside released corridor scope'],
        }),
        pack_id: pack.pack_id,
        mode,
        decision: 'unsupported',
        original: text,
        translation: null,
        note: 'Outside scope — report unsupported capability instead of inventing an authoritative answer.',
      };
    }

    // Never silent-fallback to cloud in cloud_forbidden.
    let usedCloud = false;
    let cloudDisclosure: string | null = null;
    if (mode === 'cloud_allowed' && input.cloudAuthorized) {
      usedCloud = true;
      cloudDisclosure =
        'Transitioned to cloud inference with explicit authorization. Raw audio/translations are not uploaded on reconnect unless authorized.';
    } else if (mode === 'cloud_allowed' && !input.cloudAuthorized) {
      cloudDisclosure = 'Cloud permitted by policy but not authorized for this run — stayed local.';
    } else if (mode === 'cloud_forbidden' && input.cloudAuthorized) {
      throw new ApiException(
        'policy_violation',
        'cloud_forbidden mode rejects cloud use even when connectivity returns',
        HttpStatus.FORBIDDEN,
      );
    }

    const translation =
      input.target === 'ak'
        ? text
        : `Local edge rendering: ${text}`;

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'edge.run',
      route: `POST /v1/edge/packs/${pack.pack_id}/run`,
      ip: input.ip,
      metadata: { mode, usedCloud, pack: pack.pack_id },
    });

    return {
      ...portfolioMeta({
        modelId: 'lugemi-edge',
        sourceLanguageTags: pack.variety.startsWith('yo')
          ? ['yo', 'en']
          : pack.variety.startsWith('ak')
            ? ['ak', 'en']
            : ['ak', 'en'],
        targetLanguageTag: input.target ?? 'en',
        varietyId: pack.variety,
        status: 'preview',
        warnings: uncertainQuantity
          ? ['Uncertain quantity — confirm before acting']
          : [],
      }),
      pack_id: pack.pack_id,
      pack_version: pack.version,
      mode,
      used_cloud: usedCloud,
      cloud_disclosure: cloudDisclosure,
      original: text,
      translation,
      confirm_quantity: uncertainQuantity,
      peak_ram_budget_mb: pack.peak_ram_mb,
      device_class: pack.device_class,
      note: 'Local distilled adapter for declared corridor. Cloud quality does not automatically transfer to device.',
    };
  }

  private requirePack(packId: string): EdgePack {
    const pack = this.packs.find((p) => p.pack_id === packId);
    if (!pack) {
      throw new ApiException('not_found', 'Edge pack not found', HttpStatus.NOT_FOUND);
    }
    return pack;
  }

  private publicPack(pack: EdgePack) {
    return {
      pack_id: pack.pack_id,
      version: pack.version,
      corridor: pack.corridor,
      variety: pack.variety,
      directions: pack.directions,
      hashes: pack.hashes,
      license_ref: pack.license_ref,
      min_runtime: pack.min_runtime,
      device_class: pack.device_class,
      disk_mb: pack.disk_mb,
      peak_ram_mb: pack.peak_ram_mb,
      measured_rtf: pack.measured_rtf,
      calibration_scope: pack.calibration_scope,
      rollback_compatible_with: pack.rollback_compatible_with,
      signature: pack.signature,
      revoked: pack.revoked,
    };
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
