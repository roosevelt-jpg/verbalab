import { Injectable } from '@nestjs/common';
import { trustAnalyticsEngineCatalog } from './trust-analytics.catalog';
import { trustCloudProductCatalog } from '../trust-cloud/trust-cloud.catalog';
import { aiSafetyPlatformEngineCatalog } from '../ai-safety-platform/ai-safety-platform.catalog';
import { aiGovernancePlatformEngineCatalog, seedApprovalRequests } from '../ai-governance-platform/ai-governance-platform.catalog';
import { privacyPlatformEngineCatalog, evaluatePrivacyRelease } from '../privacy-platform/privacy-platform.catalog';
import { compliancePlatformEngineCatalog } from '../compliance-platform/compliance-platform.catalog';
import { riskIntelligenceEngineCatalog } from '../risk-intelligence/risk-intelligence.catalog';
import { agentopsPlatformEngineCatalog } from '../agentops-platform/agentops-platform.catalog';

@Injectable()
export class TrustAnalyticsService {
  engine() {
    const base = trustAnalyticsEngineCatalog();
    const products = trustCloudProductCatalog();
    const safety = aiSafetyPlatformEngineCatalog();
    const governance = aiGovernancePlatformEngineCatalog(seedApprovalRequests());
    const privacy = privacyPlatformEngineCatalog();
    const compliance = compliancePlatformEngineCatalog();
    const risk = riskIntelligenceEngineCatalog();
    const agents = agentopsPlatformEngineCatalog();
    const privacyGates = privacy.assets.map((a) => evaluatePrivacyRelease(a));
    return {
      ...base,
      snapshot: {
        products: {
          shipped: products.filter((p) => p.status === 'shipped').length,
          total: products.length,
        },
        safetyIncidents: {
          detections: safety.detections.length,
          blocked: safety.blockedDetections.length,
          policyRuntimeIntegrated: true,
        },
        complianceStatus: {
          controls: compliance.controls.length,
          complianceToolingNotCertification: true,
          notCertifiedCompliant: true,
        },
        privacyEvents: {
          assets: privacy.assets.length,
          blockedReleases: privacyGates.filter((g) => !g.allowed).length,
          traditionalKnowledgeConsentRequired: true,
        },
        policyViolations: {
          agentops: agents.policyViolations.length,
          visibleToHumans: true,
        },
        riskTrends: {
          averageScore: risk.analytics.averageScore,
          trendingUp: risk.analytics.trendingUp.length,
        },
        governance: {
          pendingApprovals: governance.pending.length,
          humanSignOffRequired: true,
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
      mode: 'trust-analytics',
      shippedProducts: trustCloudProductCatalog().filter((p) => p.status === 'shipped').length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Trust Analytics monitoring snapshot (VL-300).',
    };
  }
}
