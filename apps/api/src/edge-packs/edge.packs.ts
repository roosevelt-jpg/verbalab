import { createHash } from 'crypto';
import {
  PORTFOLIO_CORRIDORS,
  type PortfolioCorridor,
} from '../portfolio/portfolio.corridors';

export type EdgeDeviceClass = 'android-4gb' | 'android-6gb' | 'ios-4gb';

export type EdgePack = {
  pack_id: string;
  version: string;
  corridor: string;
  variety: string;
  language_code: string;
  name_en: string;
  directions: string[];
  hashes: { weights: string; lexicon: string; manifest: string };
  license_ref: string;
  min_runtime: string;
  device_class: EdgeDeviceClass;
  disk_mb: number;
  peak_ram_mb: number;
  measured_rtf: number | null;
  calibration_scope: string;
  rollback_compatible_with: string[];
  signature: string;
  revoked: boolean;
  /** Honest local/demo signed manifest — not on-device production weights. */
  pack_kind: 'local_demo_manifest';
};

const STRATEGIC_DEVICE: Record<string, { device: EdgeDeviceClass; disk: number; ram: number }> = {
  ak: { device: 'android-4gb', disk: 420, ram: 1800 },
  yo: { device: 'android-4gb', disk: 440, ram: 1850 },
  sw: { device: 'android-4gb', disk: 430, ram: 1820 },
  ha: { device: 'android-4gb', disk: 425, ram: 1810 },
  ig: { device: 'android-4gb', disk: 415, ram: 1780 },
  am: { device: 'android-6gb', disk: 480, ram: 2100 },
  ar: { device: 'android-6gb', disk: 500, ram: 2200 },
  zh: { device: 'android-6gb', disk: 520, ram: 2300 },
  ja: { device: 'android-6gb', disk: 510, ram: 2250 },
  ko: { device: 'android-6gb', disk: 505, ram: 2220 },
  fr: { device: 'ios-4gb', disk: 400, ram: 1700 },
  pt: { device: 'ios-4gb', disk: 405, ram: 1710 },
  es: { device: 'ios-4gb', disk: 400, ram: 1700 },
  zu: { device: 'android-4gb', disk: 410, ram: 1760 },
  ee: { device: 'android-4gb', disk: 400, ram: 1750 },
};

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function packIdFor(corridor: PortfolioCorridor): string {
  return `lugemi-edge-${corridor.languageCode}-en-${corridor.countryCode.toLowerCase()}`;
}

function deviceMeta(code: string, tier: string) {
  if (STRATEGIC_DEVICE[code]) return STRATEGIC_DEVICE[code];
  if (tier === 'vendor') {
    return { device: 'android-6gb' as const, disk: 450, ram: 2000 };
  }
  const n = hash(code).charCodeAt(0) % 3;
  if (n === 0)
    return {
      device: 'android-4gb' as const,
      disk: 380 + (hash(code).charCodeAt(1) % 40),
      ram: 1700 + (hash(code).charCodeAt(2) % 100),
    };
  if (n === 1)
    return {
      device: 'android-6gb' as const,
      disk: 420 + (hash(code).charCodeAt(1) % 50),
      ram: 1950 + (hash(code).charCodeAt(2) % 120),
    };
  return {
    device: 'ios-4gb' as const,
    disk: 360 + (hash(code).charCodeAt(1) % 40),
    ram: 1650 + (hash(code).charCodeAt(2) % 80),
  };
}

export function buildEdgePack(corridor: PortfolioCorridor): EdgePack {
  const packId = packIdFor(corridor);
  const version = '1.0.0-local-demo';
  const weights = hash(`${packId}-weights-${version}`);
  const lexicon = hash(`${packId}-lexicon-${version}`);
  const manifest = hash(JSON.stringify({ pack: packId, version, weights, lexicon }));
  const meta = deviceMeta(corridor.languageCode, corridor.tier);
  const code = corridor.languageCode;
  return {
    pack_id: packId,
    version,
    corridor: corridor.id,
    variety: corridor.varietyId,
    language_code: code,
    name_en: corridor.nameEn,
    directions: [`${code}->en`, `en->${code}`],
    hashes: { weights, lexicon, manifest },
    license_ref: `license_${packId}_local_demo`,
    min_runtime: 'lugemi-edge-runtime/0.1',
    device_class: meta.device,
    disk_mb: meta.disk,
    peak_ram_mb: meta.ram,
    measured_rtf: null,
    calibration_scope: `${corridor.id}-local-demo`,
    rollback_compatible_with: [],
    signature: hash(`sig:${manifest}`),
    revoked: false,
    pack_kind: 'local_demo_manifest',
  };
}

/** Full edge pack catalog: one signed local/demo manifest per country-pack corridor. */
export function buildEdgePackCatalog(): EdgePack[] {
  return PORTFOLIO_CORRIDORS.map(buildEdgePack);
}

export const EDGE_PACK_CATALOG: EdgePack[] = buildEdgePackCatalog();
export const EDGE_PACK_COUNT = EDGE_PACK_CATALOG.length;
