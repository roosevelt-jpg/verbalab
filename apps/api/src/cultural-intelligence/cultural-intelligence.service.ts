import { Injectable } from '@nestjs/common';
import {
  ConsentStatus,
  culturalIntelligenceEngineCatalog,
  culturalIntelligenceSeed,
} from './cultural-intelligence.catalog';

@Injectable()
export class CulturalIntelligenceService {
  engine() {
    return culturalIntelligenceEngineCatalog();
  }

  entries(opts?: { consentStatus?: string; kind?: string; q?: string }) {
    const consent = opts?.consentStatus as ConsentStatus | undefined;
    const kind = opts?.kind;
    const q = (opts?.q ?? '').trim().toLowerCase();
    const entries = culturalIntelligenceSeed().filter((e) => {
      if (consent && e.consentStatus !== consent) return false;
      if (kind && e.kind !== kind) return false;
      if (q) {
        const hay = `${e.title} ${e.summary} ${e.sourceCommunity}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // Restricted entries: expose metadata, redact deep summary body claim
      return true;
    }).map((e) => {
      if (e.consentStatus === 'restricted') {
        return {
          ...e,
          summary:
            'Restricted traditional-knowledge slot — content withheld until source-community consent/attestation.',
        };
      }
      return e;
    });
    return {
      entries,
      count: entries.length,
      honesty: this.engine().honesty,
      safety: this.engine().safety,
      docs: '/docs/CULTURAL_INTELLIGENCE.md',
    };
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'cultural',
      entryCount: catalog.entries.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Cultural Intelligence monitoring snapshot.',
    };
  }
}
