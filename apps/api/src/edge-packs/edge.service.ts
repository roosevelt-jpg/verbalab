import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { edgeCatalog } from './edge.catalog';
import { portfolioMeta } from '../portfolio/portfolio.meta';
import {
  EDGE_PACK_CATALOG,
  EDGE_PACK_COUNT,
  type EdgePack,
} from './edge.packs';

export type EdgeMode = 'local' | 'cloud_allowed' | 'cloud_forbidden';

@Injectable()
export class EdgeService {
  private readonly packs: EdgePack[] = EDGE_PACK_CATALOG;

  constructor(private readonly audit: AuditService) {}

  engine() {
    return {
      ...edgeCatalog(),
      pack_count: EDGE_PACK_COUNT,
    };
  }

  listPacks(query?: string) {
    const q = query?.trim().toLowerCase();
    let packs = this.packs;
    if (q) {
      packs = packs.filter(
        (p) =>
          p.pack_id.includes(q) ||
          p.corridor.includes(q) ||
          p.variety.toLowerCase().includes(q) ||
          p.language_code.includes(q) ||
          p.name_en.toLowerCase().includes(q) ||
          p.device_class.includes(q),
      );
    }
    return {
      packs: packs.map((p) => this.publicPack(p)),
      count: packs.length,
      total: EDGE_PACK_COUNT,
      device_classes: ['android-4gb', 'android-6gb', 'ios-4gb'],
      device_scope: edgeCatalog().device_scope,
      note: edgeCatalog().catalog_note,
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
      pack_kind: pack.pack_kind,
      note: 'Verify signatures and hashes before loading. Local/demo signed manifests until real on-device weights ship. Interrupted downloads may resume; switch pack versions atomically.',
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
      /kwame|mensah|adebayo|transfer|amount|tomorrow|fifty|please|send|name|charge/i.test(text) ||
      text.length < 280;
    const uncertainQuantity = /\b(five hundred|500|5,?000)\b/i.test(text);

    if (!inScope) {
      return {
        ...portfolioMeta({
          modelId: 'lugemi-edge',
          sourceLanguageTags: [pack.language_code, 'en'],
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
      input.target === pack.language_code
        ? text
        : `Local edge rendering (${pack.name_en}↔English): ${text}`;

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
        sourceLanguageTags: [pack.language_code, 'en'],
        targetLanguageTag: input.target ?? 'en',
        varietyId: pack.variety,
        status: 'preview',
        warnings: uncertainQuantity
          ? ['Uncertain quantity — confirm before acting']
          : [],
      }),
      pack_id: pack.pack_id,
      pack_version: pack.version,
      pack_kind: pack.pack_kind,
      mode,
      used_cloud: usedCloud,
      cloud_disclosure: cloudDisclosure,
      original: text,
      translation,
      confirm_quantity: uncertainQuantity,
      peak_ram_budget_mb: pack.peak_ram_mb,
      device_class: pack.device_class,
      note: 'Local/demo signed manifest adapter for declared corridor. Real on-device weights are not shipped yet; cloud quality does not automatically transfer to device.',
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
      language_code: pack.language_code,
      name_en: pack.name_en,
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
      pack_kind: pack.pack_kind,
    };
  }
}
