import { BadRequestException, Injectable } from '@nestjs/common';
import {
  evaluatePrivacyRelease,
  privacyPlatformEngineCatalog,
  PrivacyAsset,
} from './privacy-platform.catalog';

@Injectable()
export class PrivacyPlatformService {
  engine() {
    return privacyPlatformEngineCatalog();
  }

  assets(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const assets = catalog.assets.filter((a) => {
      if (!q) return true;
      return (
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.kind.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q)
      );
    });
    const withGate = assets.map((a) => ({ ...a, releaseCheck: evaluatePrivacyRelease(a) }));
    return {
      assets: withGate,
      count: withGate.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  checkConsent(id: string) {
    const catalog = this.engine();
    const asset = catalog.assets.find((a) => a.id === id);
    if (!asset) throw new BadRequestException(`Unknown privacy asset: ${id}`);
    const result = evaluatePrivacyRelease(asset);
    return {
      asset,
      ...result,
      traditionalKnowledgeConsentRequired: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      docs: catalog.docs,
    };
  }

  /** Release path — rejects restricted/unverified traditional knowledge. */
  release(id: string) {
    const check = this.checkConsent(id);
    if (!check.allowed) {
      throw new BadRequestException(check.reason);
    }
    return {
      released: true,
      asset: check.asset,
      reason: check.reason,
      traditionalKnowledgeConsentRequired: true,
      docs: check.docs,
    };
  }

  query(query?: string) {
    return this.assets(query);
  }

  monitoring() {
    const catalog = this.engine();
    const gated = catalog.assets.map((a: PrivacyAsset) => evaluatePrivacyRelease(a));
    return {
      mode: 'privacy',
      assetCount: catalog.assets.length,
      allowedCount: gated.filter((g) => g.allowed).length,
      blockedCount: gated.filter((g) => !g.allowed).length,
      traditionalKnowledgeConsentRequired: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Privacy Platform monitoring snapshot — TK consent enforced.',
    };
  }
}
