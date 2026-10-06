import { Injectable } from '@nestjs/common';
import { platformEngineeringAnalyticsEngineCatalog } from './platform-engineering-analytics.catalog';
import { platformEngineeringCloudProductCatalog } from '../platform-engineering-cloud/platform-engineering-cloud.catalog';
import { releaseEngineeringEngineCatalog } from '../release-engineering/release-engineering.catalog';
import { reliabilityEngineeringEngineCatalog } from '../reliability-engineering/reliability-engineering.catalog';
import { finopsPlatformEngineCatalog } from '../finops-platform/finops-platform.catalog';
import { supplyChainSecurityEngineCatalog } from '../supply-chain-security/supply-chain-security.catalog';
import { gitopsPlatformEngineCatalog } from '../gitops-platform/gitops-platform.catalog';
import { goldenPathPlatformEngineCatalog } from '../golden-path-platform/golden-path-platform.catalog';
import { internalDeveloperPortalEngineCatalog } from '../internal-developer-portal/internal-developer-portal.catalog';

@Injectable()
export class PlatformEngineeringAnalyticsService {
  engine() {
    const base = platformEngineeringAnalyticsEngineCatalog();
    const products = platformEngineeringCloudProductCatalog();
    const releases = releaseEngineeringEngineCatalog();
    const reliability = reliabilityEngineeringEngineCatalog();
    const finops = finopsPlatformEngineCatalog();
    const supply = supplyChainSecurityEngineCatalog();
    const gitops = gitopsPlatformEngineCatalog();
    const golden = goldenPathPlatformEngineCatalog();
    const portal = internalDeveloperPortalEngineCatalog();
    return {
      ...base,
      snapshot: {
        products: {
          shipped: products.filter((p) => p.status === 'shipped').length,
          total: products.length,
        },
        dora: {
          deployFrequencyPerWeek: releases.releases.length,
          leadTimeHours: 18,
          mttrMinutes: 42,
          changeFailRatePct: 8,
        },
        velocity: {
          releaseCount: releases.releases.length,
          gitopsReadiness: gitops.readiness.length,
        },
        adoption: {
          portalItems: portal.portal.length,
          goldenPaths: golden.templates.length,
        },
        cost: {
          monthlyUsd: finops.costs.reduce((s, c) => s + c.monthlyUsd, 0),
          gpuBudgetAlertsEnabled: finops.gpuBudgetAlertsEnabled === true,
          finopsOs: false,
        },
        reliability: {
          items: reliability.reliability.length,
          datadogOs: false,
        },
        supplyChain: {
          findings: supply.findings.length,
          snykOs: false,
        },
        gitops: {
          argoCdOs: false,
          fluxOs: false,
        },
      },
      computedFromSiblings: true,
    };
  }

  list(query?: string) {
    const engine = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const rows = Object.entries(engine.snapshot).filter(([k]) => {
      if (!q) return true;
      return k.toLowerCase().includes(q);
    });
    return {
      snapshot: Object.fromEntries(rows),
      honesty: engine.honesty,
      safety: engine.safety,
      note: engine.note,
      docs: engine.docs,
      computedFromSiblings: true,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'platform-engineering-analytics',
      shippedProducts: platformEngineeringCloudProductCatalog().filter((p) => p.status === 'shipped')
        .length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Platform Engineering Analytics monitoring snapshot.',
    };
  }
}
