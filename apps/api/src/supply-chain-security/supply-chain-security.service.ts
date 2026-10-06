import { Injectable } from '@nestjs/common';
import {
  seedSupplyChainFindings,
  supplyChainSecurityEngineCatalog,
} from './supply-chain-security.catalog';

@Injectable()
export class SupplyChainSecurityService {
  engine() {
    return supplyChainSecurityEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const findings = catalog.findings.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      findings,
      count: findings.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /** Real inventory scan path — returns workspace package posture + seeded findings. */
  scan() {
    const catalog = this.engine();
    return {
      scannedAt: new Date().toISOString(),
      packages: catalog.packages,
      sbom: catalog.sbom,
      findings: catalog.findings,
      findingCount: catalog.findings.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Workspace dependency risk posture inventory (package.json / lockfile summary). Not a live CVE database.',
      docs: catalog.docs,
    };
  }

  findings(query?: string) {
    const all = seedSupplyChainFindings();
    const q = (query ?? '').trim().toLowerCase();
    const findings = all.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      findings,
      count: findings.length,
      bySeverity: {
        critical: findings.filter((f) => f.severity === 'critical').length,
        high: findings.filter((f) => f.severity === 'high').length,
        medium: findings.filter((f) => f.severity === 'medium').length,
        low: findings.filter((f) => f.severity === 'low').length,
        info: findings.filter((f) => f.severity === 'info').length,
      },
      honesty: this.engine().honesty,
      note: 'Findings from workspace inventory posture — snykOs=false.',
      docs: '/docs/SUPPLY_CHAIN_SECURITY.md',
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'supply-chain',
      findingCount: catalog.findings.length,
      packageCount: catalog.packages.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Supply Chain Security monitoring snapshot (VL-310).',
    };
  }
}
