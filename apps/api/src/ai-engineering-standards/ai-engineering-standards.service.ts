import { Injectable } from '@nestjs/common';
import { aiEngineeringStandardsEngineCatalog } from './ai-engineering-standards.catalog';
import { AiGovernancePlatformService } from '../ai-governance-platform/ai-governance-platform.service';
import { AiSafetyPlatformService } from '../ai-safety-platform/ai-safety-platform.service';
import { EvaluationPlatformService } from '../evaluation-platform/evaluation-platform.service';
import { PromptopsPlatformService } from '../promptops-platform/promptops-platform.service';
import { SecretsCertificatePlatformService } from '../secrets-certificate-platform/secrets-certificate-platform.service';

@Injectable()
export class AiEngineeringStandardsService {
  constructor(
    private readonly aiGovernance: AiGovernancePlatformService,
    private readonly aiSafety: AiSafetyPlatformService,
    private readonly evaluation: EvaluationPlatformService,
    private readonly promptops: PromptopsPlatformService,
    private readonly secrets: SecretsCertificatePlatformService
  ) {}

  engine() {
    return aiEngineeringStandardsEngineCatalog();
  }

  /** Catalog route: returns standards capability + live status from injected upstream services. */
  route(capability?: string) {
    const catalog = this.engine();
    const q = (capability ?? '').trim().toLowerCase();
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase().includes(q);
    });
    const upstreamStatus = [
      {
        module: 'ai-governance-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.aiGovernance.engine(),
      },
      {
        module: 'ai-safety-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.aiSafety.engine(),
      },
      {
        module: 'evaluation-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.evaluation.engine(),
      },
      {
        module: 'promptops-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.promptops.engine(),
      },
      {
        module: 'secrets-certificate-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.secrets.engine(),
      }
    ];
    return {
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      capability: capability ?? null,
      capabilities,
      routesTo: catalog.routesTo,
      upstreamStatus,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  execute(capability?: string) {
    return this.route(capability);
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.routes.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      routes: rows,
      count: rows.length,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  checks() {
    const catalog = this.engine();
    return {
      product: catalog.product,
      retroactiveChecks: catalog.retroactiveChecks,
      checkedAgainstStandards: true,
      fakeComplianceCertification: false,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Retroactive standards checks for Volumes 11/12/17 — pass/gap findings, not certification.',
      docs: catalog.docs,
    };
  }

  checkList() {
    return this.checks();
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'ai-engineering-standards',
      count: catalog.routes.length,
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AiEngineeringStandards monitoring snapshot (VL-349).',
    };
  }
}
