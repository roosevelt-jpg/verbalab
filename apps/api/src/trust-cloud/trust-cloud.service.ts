import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  trustCloudArchitectureNotes,
  trustCloudHonesty,
  trustCloudProductCatalog,
  trustCloudRoutingTable,
} from './trust-cloud.catalog';

@Injectable()
export class TrustCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'VerbaLab Trust Cloud',
      products: trustCloudProductCatalog(),
      architecture: trustCloudArchitectureNotes(),
      honesty: trustCloudHonesty(),
      safety: {
        policyRuntimeIntegrated: true,
        traditionalKnowledgeConsentRequired: true,
        humanSignOffRequired: true,
        complianceToolingNotCertification: true,
        notCertifiedCompliant: true,
        platformEngineeringOs: false,
        note:
          'Volume 15 README: Compliance tooling is not certification; AI Safety wires to Policy Runtime; Privacy enforces Volume 12 TK consent; Governance requires human sign-off. Platform Engineering deferred.',
      },
      docs: '/docs/TRUST_CLOUD.md',
      note:
        'Trust Cloud Foundation (VL-292). Enforcement/governance layer over existing systems. Not Okta/GRC/certification/SIEM/Platform Engineering OS.',
    };
  }

  routing() {
    return {
      routes: trustCloudRoutingTable(),
      products: trustCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: trustCloudHonesty(),
      note: 'Static Trust Cloud discovery catalog for Foundation.',
      docs: '/docs/TRUST_CLOUD.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        chat: usageSummary.chat,
        embeddings: usageSummary.embeddings,
      },
      products: trustCloudProductCatalog(),
      architecture: trustCloudArchitectureNotes(),
      honesty: trustCloudHonesty(),
      safety: {
        policyRuntimeIntegrated: true,
        traditionalKnowledgeConsentRequired: true,
        humanSignOffRequired: true,
        complianceToolingNotCertification: true,
        notCertifiedCompliant: true,
        platformEngineeringOs: false,
        note:
          'Safety↔Policy, Privacy consent, Governance human sign-off, and Compliance honesty enforced. Platform Engineering rejected in this volume.',
      },
      deferred: {
        platformEngineeringOs: true,
        oktaOs: true,
        grcSuiteOs: true,
        certificationOs: true,
        siemOs: true,
        regeneratesVolumes1to14: false,
      },
      links: {
        trustCloud: '/trust-cloud',
        aiSafetyPlatform: '/ai-safety-platform',
        aiGovernancePlatform: '/ai-governance-platform',
        explainabilityPlatform: '/explainability-platform',
        privacyPlatform: '/privacy-platform',
        compliancePlatform: '/compliance-platform',
        riskIntelligence: '/risk-intelligence',
        identityFederation: '/identity-federation',
        trustAnalytics: '/trust-analytics',
        policyRuntime: '/policy-runtime',
        policyFabric: '/policy-fabric',
        agentopsPlatform: '/agentops-platform',
        continuousLearning: '/continuous-learning',
        openSciencePlatform: '/open-science-platform',
      },
      docs: '/docs/TRUST_CLOUD.md',
      note:
        'Trust Cloud (VL-292–301). Discovery hub over safety/governance/explainability/privacy/compliance/risk/identity/analytics; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = trustCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: trustCloudArchitectureNotes(),
      honesty: trustCloudHonesty(),
      note: 'Trust Cloud monitoring snapshot (VL-292).',
    };
  }
}
