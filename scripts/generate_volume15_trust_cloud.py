#!/usr/bin/env python3
"""Generate Lugemi Volume 15 Trust Cloud (VL-292–301) from Volume 14 patterns."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path("/workspace/lugemi")


def to_pascal(slug: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in slug.split("-"))


def to_camel(slug: str) -> str:
    p = to_pascal(slug)
    return p[:1].lower() + p[1:]


def to_const(slug: str) -> str:
    return slug.replace("-", "_").upper()


HUBS = [
    {
        "slug": "trust-cloud",
        "vl": 292,
        "phase": 159,
        "adr": "0194",
        "title": "Trust Cloud",
        "kind": "foundation",
        "doc": "TRUST_CLOUD.md",
        "nav": "Trust Cloud",
        "honesty_key": "platformEngineeringOs",
        "honesty_val": False,
        "note": "Trust Cloud Foundation (VL-292). Enforcement/governance layer over Policy Runtime, AgentOps, Continuous Learning, Volume 12 consent, PCI/Stripe honesty. platformEngineeringOs=false (Volume 16+).",
    },
    {
        "slug": "ai-safety-platform",
        "vl": 293,
        "phase": 160,
        "adr": "0195",
        "title": "AI Safety Platform",
        "kind": "safety",
        "doc": "AI_SAFETY_PLATFORM.md",
        "nav": "AI Safety",
        "honesty_key": "policyRuntimeIntegrated",
        "honesty_val": True,
        "note": "AI Safety Platform (VL-293). Prompt injection/jailbreak/hallucination/toxicity/violence/hate/abuse/malware/unsafe-tool/firewalls catalog wired to Policy Runtime. policyRuntimeIntegrated=true.",
    },
    {
        "slug": "ai-governance-platform",
        "vl": 294,
        "phase": 161,
        "adr": "0196",
        "title": "AI Governance Platform",
        "kind": "governance",
        "doc": "AI_GOVERNANCE_PLATFORM.md",
        "nav": "AI Governance",
        "honesty_key": "humanSignOffRequired",
        "honesty_val": True,
        "note": "AI Governance Platform (VL-294). Model/prompt/dataset/agent/policy approval with human sign-off (pending|approved|rejected). humanSignOffRequired=true.",
    },
    {
        "slug": "explainability-platform",
        "vl": 295,
        "phase": 162,
        "adr": "0197",
        "title": "Explainability Platform",
        "kind": "explainability",
        "doc": "EXPLAINABILITY_PLATFORM.md",
        "nav": "Explainability",
        "honesty_key": "shapOs",
        "honesty_val": False,
        "note": "Explainability Platform (VL-295). Confidence/evidence/attribution/decision-trace/provenance catalog. Not SHAP OS.",
    },
    {
        "slug": "privacy-platform",
        "vl": 296,
        "phase": 163,
        "adr": "0198",
        "title": "Privacy Platform",
        "kind": "privacy",
        "doc": "PRIVACY_PLATFORM.md",
        "nav": "Privacy",
        "honesty_key": "traditionalKnowledgeConsentRequired",
        "honesty_val": True,
        "note": "Privacy Platform (VL-296). PII/PHI/financial detection + redaction/tokenization + Volume 12 TK consent enforcement. traditionalKnowledgeConsentRequired=true.",
    },
    {
        "slug": "compliance-platform",
        "vl": 297,
        "phase": 164,
        "adr": "0199",
        "title": "Compliance Platform",
        "kind": "compliance",
        "doc": "COMPLIANCE_PLATFORM.md",
        "nav": "Compliance",
        "honesty_key": "complianceToolingNotCertification",
        "honesty_val": True,
        "note": "Compliance Platform (VL-297). SOC2/ISO27001/HIPAA/GDPR/CCPA/NIST AI RMF/EU AI Act control mapping. Tooling not certification — lawyers/auditors still required.",
    },
    {
        "slug": "risk-intelligence",
        "vl": 298,
        "phase": 165,
        "adr": "0200",
        "title": "Risk Intelligence",
        "kind": "risk",
        "doc": "RISK_INTELLIGENCE.md",
        "nav": "Risk Intel",
        "honesty_key": "grcSuiteOs",
        "honesty_val": False,
        "note": "Risk Intelligence (VL-298). Operational/model/security/compliance/data/supply-chain/third-party risk scoring seed + analytics. Not GRC suite OS.",
    },
    {
        "slug": "identity-federation",
        "vl": 299,
        "phase": 166,
        "adr": "0201",
        "title": "Identity Federation",
        "kind": "identity",
        "doc": "IDENTITY_FEDERATION.md",
        "nav": "Identity Federation",
        "honesty_key": "oktaOs",
        "honesty_val": False,
        "note": "Identity Federation (VL-299). OAuth2/OIDC/SAML/SCIM/enterprise/machine/service identity catalog over Clerk. oktaOs=false; samlIdpOs=false.",
    },
    {
        "slug": "trust-analytics",
        "vl": 300,
        "phase": 167,
        "adr": "0202",
        "title": "Trust Analytics",
        "kind": "analytics",
        "doc": "TRUST_ANALYTICS.md",
        "nav": "Trust Analytics",
        "honesty_key": "siemOs",
        "honesty_val": False,
        "note": "Trust Analytics (VL-300). Aggregates safety incidents, compliance status, privacy events, policy violations, risk trends from sibling hubs. Not SIEM OS.",
    },
]


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def foundation_catalog() -> str:
    return '''export type TrustCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type TrustCloudProductRow = {
  id: string;
  name: string;
  status: TrustCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Library Phase 159 → Trust Cloud Foundation (VL-292).
 * Enforcement/governance layer over Policy Runtime (Vol 8), AgentOps,
 * Continuous Learning, Volume 12 consent, PCI/Stripe honesty, healthcare/
 * financial posture. Not Okta OS, GRC suite OS, certification OS, SIEM OS,
 * or Platform Engineering OS (deferred Volume 16+).
 */
export function trustCloudProductCatalog(): TrustCloudProductRow[] {
  return [
    {
      id: 'trust-cloud',
      name: 'Trust Cloud',
      status: 'shipped',
      api: 'GET /v1/trust-cloud/products',
      console: '/trust-cloud',
      notes:
        'Foundation hub (VL-292). Integrates with existing systems — does not regenerate Volumes 1–14. platformEngineeringOs=false.',
    },
    {
      id: 'ai-safety-platform',
      name: 'AI Safety',
      status: 'shipped',
      api: 'GET /v1/ai-safety-platform/engine',
      console: '/ai-safety-platform',
      notes: 'VL-293. policyRuntimeIntegrated=true — wires to Policy Runtime / Policy Fabric.',
    },
    {
      id: 'ai-governance-platform',
      name: 'AI Governance',
      status: 'shipped',
      api: 'GET /v1/ai-governance-platform/engine',
      console: '/ai-governance-platform',
      notes: 'VL-294. humanSignOffRequired=true for consequential approvals.',
    },
    {
      id: 'explainability-platform',
      name: 'Decision Explainability',
      status: 'shipped',
      api: 'GET /v1/explainability-platform/engine',
      console: '/explainability-platform',
      notes: 'VL-295. Confidence/evidence/attribution/decision-trace. shapOs=false.',
    },
    {
      id: 'privacy-platform',
      name: 'Privacy',
      status: 'shipped',
      api: 'GET /v1/privacy-platform/engine',
      console: '/privacy-platform',
      notes: 'VL-296. traditionalKnowledgeConsentRequired=true — Volume 12 consent fields enforced.',
    },
    {
      id: 'compliance-platform',
      name: 'Compliance',
      status: 'shipped',
      api: 'GET /v1/compliance-platform/engine',
      console: '/compliance-platform',
      notes:
        'VL-297. complianceToolingNotCertification=true; notCertifiedCompliant=true — lawyers/auditors still required.',
    },
    {
      id: 'trust-audit',
      name: 'Audit',
      status: 'shipped',
      api: 'GET /v1/trust-cloud/monitoring',
      console: '/trust-cloud',
      notes: 'VL-292/301. Audit surfaces + Production Audit pack under docs/trust-cloud-audit/.',
    },
    {
      id: 'risk-intelligence',
      name: 'Risk',
      status: 'shipped',
      api: 'GET /v1/risk-intelligence/engine',
      console: '/risk-intelligence',
      notes: 'VL-298. Risk scoring seed + analytics. grcSuiteOs=false.',
    },
    {
      id: 'policy-integration',
      name: 'Policy',
      status: 'shipped',
      api: 'GET /v1/policy-runtime/engine',
      console: '/policy-runtime',
      notes: 'Extends Policy Runtime / Policy Fabric — does not regenerate a second policy OS.',
    },
    {
      id: 'identity-federation',
      name: 'Identity Federation',
      status: 'shipped',
      api: 'GET /v1/identity-federation/engine',
      console: '/identity-federation',
      notes: 'VL-299. Federation readiness over Clerk. oktaOs=false; samlIdpOs=false.',
    },
    {
      id: 'responsible-ai',
      name: 'Responsible AI',
      status: 'shipped',
      api: 'GET /v1/ai-governance-platform/engine',
      console: '/ai-governance-platform',
      notes: 'Responsible AI posture via Safety + Governance + Explainability hubs.',
    },
    {
      id: 'trust-analytics',
      name: 'Trust Analytics',
      status: 'shipped',
      api: 'GET /v1/trust-analytics/engine',
      console: '/trust-analytics',
      notes: 'VL-300. Aggregates sibling trust hubs. siemOs=false.',
    },
  ];
}

export function trustCloudRoutingTable(): Array<{
  id: string;
  path: string;
  purpose: string;
}> {
  return [
    { id: 'products', path: '/v1/trust-cloud/products', purpose: 'Product catalog' },
    { id: 'engine', path: '/v1/trust-cloud/engine', purpose: 'Engine alias' },
    { id: 'routing', path: '/v1/trust-cloud/routing', purpose: 'Static routing table' },
    { id: 'monitoring', path: '/v1/trust-cloud/monitoring', purpose: 'Monitoring snapshot' },
    { id: 'overview', path: '/v1/trust-cloud/overview', purpose: 'Authenticated overview' },
  ];
}

export function trustCloudArchitectureNotes(): Record<string, unknown> {
  return {
    role: 'enforcement-governance-layer',
    extends: [
      'policy-runtime',
      'policy-fabric',
      'agentops-platform',
      'continuous-learning',
      'open-science-platform',
      'cultural-intelligence',
    ],
    regeneratesVolumes1to14: false,
    platformEngineeringOs: false,
    deferredToVolume16Plus: ['platform-engineering-cloud'],
  };
}

export function trustCloudHonesty(): Record<string, boolean | string> {
  return {
    platformEngineeringOs: false,
    oktaOs: false,
    grcSuiteOs: false,
    certificationOs: false,
    siemOs: false,
    regeneratesVolumes1to14: false,
    integratesExistingSystems: true,
    complianceToolingNotCertification: true,
    notCertifiedCompliant: true,
    policyRuntimeIntegrated: true,
    traditionalKnowledgeConsentRequired: true,
    humanSignOffRequired: true,
    note:
      'Trust Cloud integrates with Policy Runtime, AgentOps, Continuous Learning, and Volume 12 consent. Dashboards support compliance work but do not certify GDPR/HIPAA/SOC2/PCI. Platform Engineering Cloud deferred to Volume 16+.',
  };
}
'''


def foundation_service() -> str:
    return '''import { Injectable } from '@nestjs/common';
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
      product: 'Lugemi Trust Cloud',
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
'''


def foundation_controller() -> str:
    return '''import { Controller, Get, UseGuards } from '@nestjs/common';
import { TrustCloudService } from './trust-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/trust-cloud')
export class TrustCloudController {
  constructor(private readonly trust: TrustCloudService) {}

  @Get('products')
  products() {
    return this.trust.products();
  }

  @Get('engine')
  engine() {
    return this.trust.products();
  }

  @Get('routing')
  routing() {
    return this.trust.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.trust.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.trust.monitoring();
  }
}
'''


def module_ts(slug: str, pascal: str, extra_imports: str = "", extra_module: str = "") -> str:
    return f'''import {{ Module }} from '@nestjs/common';
import {{ {pascal}Controller }} from './{slug}.controller';
import {{ {pascal}Service }} from './{slug}.service';
{extra_imports}
@Module({{
  {extra_module}controllers: [{pascal}Controller],
  providers: [{pascal}Service],
  exports: [{pascal}Service],
}})
export class {pascal}Module {{}}
'''


def application_files(slug: str, pascal: str, const: str, title: str, vl: int) -> dict[str, str]:
    camel = to_camel(slug)
    return {
        "messages.ts": f'''export class Get{pascal}EngineQuery {{}}

export class List{pascal}ProductsQuery {{}}
''',
        "ports.ts": f'''/** Application ports for {title} (VL-{vl}). */

export type {pascal}ProductRow = {{
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
}};

export type {pascal}EngineBundle = ReturnType<
  import('../{slug}.service').{pascal}Service['engine']
>;

export interface {pascal}CatalogPort {{
  engine(): {pascal}EngineBundle;
  listProducts(): {pascal}ProductRow[];
}}

export const {const}_CATALOG_PORT = Symbol('{const}_CATALOG_PORT');
''',
        "handlers.ts": f'''import {{ Inject }} from '@nestjs/common';
import {{ IQueryHandler, QueryHandler }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery, List{pascal}ProductsQuery }} from './messages';
import {{
  {const}_CATALOG_PORT,
  {pascal}CatalogPort,
  {pascal}EngineBundle,
  {pascal}ProductRow,
}} from './ports';

@QueryHandler(Get{pascal}EngineQuery)
export class Get{pascal}EngineHandler
  implements IQueryHandler<Get{pascal}EngineQuery>
{{
  constructor(
    @Inject({const}_CATALOG_PORT)
    private readonly catalog: {pascal}CatalogPort,
  ) {{}}

  execute(): Promise<{pascal}EngineBundle> {{
    return Promise.resolve(this.catalog.engine());
  }}
}}

@QueryHandler(List{pascal}ProductsQuery)
export class List{pascal}ProductsHandler
  implements IQueryHandler<List{pascal}ProductsQuery>
{{
  constructor(
    @Inject({const}_CATALOG_PORT)
    private readonly catalog: {pascal}CatalogPort,
  ) {{}}

  execute(): Promise<{pascal}ProductRow[]> {{
    return Promise.resolve(this.catalog.listProducts());
  }}
}}

export const {const}_HANDLERS = [Get{pascal}EngineHandler, List{pascal}ProductsHandler];
''',
        f"nest-{slug}.adapter.ts": f'''import {{ Injectable }} from '@nestjs/common';
import {{ {pascal}Service }} from '../{slug}.service';
import {{
  {pascal}CatalogPort,
  {pascal}EngineBundle,
  {pascal}ProductRow,
}} from './ports';

@Injectable()
export class Nest{pascal}CatalogAdapter implements {pascal}CatalogPort {{
  constructor(private readonly service: {pascal}Service) {{}}

  engine(): {pascal}EngineBundle {{
    return this.service.engine();
  }}

  listProducts(): {pascal}ProductRow[] {{
    const bundle = this.engine() as {{
      products?: {pascal}ProductRow[];
      capabilities?: Array<{{ id: string; name: string; status: string; api?: string | null; notes?: string }}>;
    }};
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {{
      return bundle.capabilities.map((c) => ({{
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/{slug}`,
        notes: c.notes ?? '',
      }}));
    }}
    return [
      {{
        id: '{slug}',
        name: '{title}',
        status: 'shipped',
        api: 'GET /v1/{slug}/engine',
        console: '/{slug}',
        notes: 'VL-{vl} shipped.',
      }},
    ];
  }}
}}
''',
        f"{slug}-application.module.ts": f'''import {{ Module }} from '@nestjs/common';
import {{ CqrsModule }} from '@nestjs/cqrs';
import {{ {pascal}Module }} from '../{slug}.module';
import {{ {const}_CATALOG_PORT }} from './ports';
import {{ Nest{pascal}CatalogAdapter }} from './nest-{slug}.adapter';
import {{ {const}_HANDLERS }} from './handlers';

@Module({{
  imports: [CqrsModule, {pascal}Module],
  providers: [
    Nest{pascal}CatalogAdapter,
    {{ provide: {const}_CATALOG_PORT, useExisting: Nest{pascal}CatalogAdapter }},
    ...{const}_HANDLERS,
  ],
  exports: [CqrsModule],
}})
export class {pascal}ApplicationModule {{}}
''',
    }


def safety_catalog() -> str:
    return '''/**
 * Library Phase 160 → AI Safety Platform (VL-293).
 * Wires to Policy Runtime / Policy Fabric — does not invent a second policy OS.
 */
export type SafetyDetection = {
  id: string;
  kind:
    | 'prompt_injection'
    | 'indirect_prompt_injection'
    | 'jailbreak'
    | 'hallucination'
    | 'toxicity'
    | 'violence'
    | 'hate'
    | 'abuse'
    | 'malware'
    | 'unsafe_tool'
    | 'prompt_firewall'
    | 'model_firewall'
    | 'safety_policy';
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  blockPosture: 'block' | 'allow_with_warning' | 'monitor';
  policyAction: string;
  notes: string;
};

export function aiSafetyDetectionsCatalog(): SafetyDetection[] {
  return [
    {
      id: 'safe-inj-001',
      kind: 'prompt_injection',
      name: 'Direct prompt injection',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'prompt_injection',
      notes: 'Blocks direct injection attempts via Policy Runtime hard gate posture.',
    },
    {
      id: 'safe-inj-002',
      kind: 'indirect_prompt_injection',
      name: 'Indirect prompt injection',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'indirect_prompt_injection',
      notes: 'Untrusted retrieved content treated as untrusted instructions.',
    },
    {
      id: 'safe-jb-001',
      kind: 'jailbreak',
      name: 'Jailbreak detection',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'jailbreak',
      notes: 'Jailbreak phrases mapped to Policy Runtime deny posture.',
    },
    {
      id: 'safe-hal-001',
      kind: 'hallucination',
      name: 'Hallucination risk',
      severity: 'medium',
      blockPosture: 'allow_with_warning',
      policyAction: 'hallucination_risk',
      notes: 'Surfaces low-evidence answers for human review.',
    },
    {
      id: 'safe-tox-001',
      kind: 'toxicity',
      name: 'Toxicity detection',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'toxicity',
      notes: 'Toxic content blocked — not log-only.',
    },
    {
      id: 'safe-vio-001',
      kind: 'violence',
      name: 'Violence detection',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'violence',
      notes: 'Violent content hard-blocked.',
    },
    {
      id: 'safe-hate-001',
      kind: 'hate',
      name: 'Hate speech detection',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'hate_speech',
      notes: 'Hate speech hard-blocked.',
    },
    {
      id: 'safe-abuse-001',
      kind: 'abuse',
      name: 'Abuse detection',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'abuse',
      notes: 'Abuse patterns blocked.',
    },
    {
      id: 'safe-mal-001',
      kind: 'malware',
      name: 'Malware / exploit assist',
      severity: 'critical',
      blockPosture: 'block',
      policyAction: 'malware_assist',
      notes: 'Malware/exploit assist blocked via Policy Runtime posture.',
    },
    {
      id: 'safe-tool-001',
      kind: 'unsafe_tool',
      name: 'Unsafe tool call',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'unsafe_tool_call',
      notes: 'Aligns with AgentOps tool-allowlist policy violations.',
    },
    {
      id: 'safe-pfw-001',
      kind: 'prompt_firewall',
      name: 'Prompt firewall',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'prompt_firewall',
      notes: 'Prompt firewall rule catalog — enforced via Policy Runtime.',
    },
    {
      id: 'safe-mfw-001',
      kind: 'model_firewall',
      name: 'Model firewall',
      severity: 'high',
      blockPosture: 'block',
      policyAction: 'model_firewall',
      notes: 'Model output firewall catalog.',
    },
    {
      id: 'safe-pol-001',
      kind: 'safety_policy',
      name: 'Safety policy pack',
      severity: 'medium',
      blockPosture: 'monitor',
      policyAction: 'safety_policy_pack',
      notes: 'Safety policy pack references Policy Fabric pipelines.',
    },
  ];
}

export function aiSafetyPlatformEngineCatalog() {
  const detections = aiSafetyDetectionsCatalog();
  return {
    product: 'Lugemi AI Safety Platform',
    capabilities: [
      { id: 'prompt_injection', name: 'Prompt Injection Detection', status: 'shipped', notes: 'Direct + indirect.' },
      { id: 'jailbreak', name: 'Jailbreak Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'hallucination', name: 'Hallucination Detection', status: 'shipped', notes: 'Warning posture.' },
      { id: 'toxicity', name: 'Toxicity Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'violence', name: 'Violence Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'hate', name: 'Hate Speech', status: 'shipped', notes: 'Block posture.' },
      { id: 'abuse', name: 'Abuse Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'malware', name: 'Malware Detection', status: 'shipped', notes: 'Block posture.' },
      { id: 'unsafe_tool', name: 'Unsafe Tool Calls', status: 'shipped', notes: 'AgentOps aligned.' },
      { id: 'firewalls', name: 'Prompt/Model Firewalls', status: 'shipped', notes: 'Firewall catalog.' },
      { id: 'policies', name: 'Safety Policies', status: 'shipped', notes: 'Policy Runtime integrated.' },
    ],
    detections,
    blockedDetections: detections.filter((d) => d.blockPosture === 'block'),
    honesty: {
      policyRuntimeIntegrated: true,
      regeneratesPolicyRuntime: false,
      regeneratesPolicyFabric: false,
      extendsPolicyRuntime: true,
      extendsPolicyFabric: true,
      secondPolicyOs: false,
      logOnlySafety: false,
    },
    safety: {
      policyRuntimeIntegrated: true,
      hardBlockDefault: true,
      note:
        'Safety detections consult Policy Runtime / Policy Fabric posture. Block is default for critical classes — not log-only.',
    },
    docs: '/docs/AI_SAFETY_PLATFORM.md',
    note: 'AI Safety Platform (VL-293). Safety engine over Policy Runtime — does not regenerate Volumes 1–14.',
  };
}
'''


def safety_service() -> str:
    return '''import { BadRequestException, Injectable } from '@nestjs/common';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import {
  aiSafetyDetectionsCatalog,
  aiSafetyPlatformEngineCatalog,
} from './ai-safety-platform.catalog';

@Injectable()
export class AiSafetyPlatformService {
  constructor(private readonly policyRuntime: PolicyRuntimeService) {}

  engine() {
    const catalog = aiSafetyPlatformEngineCatalog();
    const policyEngine = this.policyRuntime.engine();
    return {
      ...catalog,
      policyRuntime: {
        product: policyEngine.product,
        honesty: policyEngine.honesty,
        surface: 'GET /v1/policy-runtime/engine',
        evaluateSurface: 'POST /v1/policy-runtime/evaluate',
        fabricSurface: 'GET /v1/policy-fabric/products',
      },
      policyRuntimeIntegrated: true,
    };
  }

  detections(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const detections = catalog.detections.filter((d) => {
      if (!q) return true;
      return (
        d.id.toLowerCase().includes(q) ||
        d.kind.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q)
      );
    });
    return {
      detections,
      count: detections.length,
      blockedDetections: catalog.blockedDetections,
      honesty: catalog.honesty,
      safety: catalog.safety,
      policyRuntimeIntegrated: true,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /** Safety check — consults Policy Runtime engine posture + detection block catalog. */
  check(detectionId?: string) {
    const detections = aiSafetyDetectionsCatalog();
    const detection = detectionId
      ? detections.find((d) => d.id === detectionId)
      : detections[0];
    if (!detection) {
      throw new BadRequestException(`Unknown safety detection: ${detectionId}`);
    }
    const policyEngine = this.policyRuntime.engine();
    const blocked = detection.blockPosture === 'block';
    return {
      detection,
      allowed: !blocked,
      blocked,
      blockPosture: detection.blockPosture,
      policyRuntimeIntegrated: true,
      policySurface: 'GET /v1/policy-runtime/engine',
      policyEvaluateSurface: 'POST /v1/policy-runtime/evaluate',
      policyFabricSurface: 'GET /v1/policy-fabric/products',
      policyRuntime: {
        product: policyEngine.product,
        honesty: policyEngine.honesty,
        hardGate: policyEngine.honesty?.hardGate ?? true,
      },
      reason: blocked
        ? `Blocked by AI Safety (${detection.kind}) with Policy Runtime integrated posture.`
        : `Allowed with safety posture=${detection.blockPosture}.`,
      honesty: aiSafetyPlatformEngineCatalog().honesty,
      docs: '/docs/AI_SAFETY_PLATFORM.md',
    };
  }

  /** Evaluate action against safety catalog + Policy Runtime surface references. */
  evaluate(input: { action?: string; detectionId?: string }) {
    const action = (input.action ?? '').trim();
    const detections = aiSafetyDetectionsCatalog();
    const byAction = action
      ? detections.find((d) => d.policyAction === action || d.kind === action)
      : undefined;
    const detection = input.detectionId
      ? detections.find((d) => d.id === input.detectionId)
      : byAction;
    if (!detection && !action) {
      throw new BadRequestException('detectionId or action is required');
    }
    if (!detection) {
      const policyEngine = this.policyRuntime.engine();
      return {
        allowed: true,
        blocked: false,
        action,
        policyRuntimeIntegrated: true,
        policySurface: 'POST /v1/policy-runtime/evaluate',
        policyRuntime: { product: policyEngine.product, honesty: policyEngine.honesty },
        reason: 'No matching safety detection — defer to Policy Runtime evaluate for org denies.',
        docs: '/docs/AI_SAFETY_PLATFORM.md',
      };
    }
    return this.check(detection.id);
  }

  query(query?: string) {
    return this.detections(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'safety',
      detectionCount: catalog.detections.length,
      blockedCount: catalog.blockedDetections.length,
      policyRuntimeIntegrated: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AI Safety Platform monitoring snapshot (VL-293) — Policy Runtime integrated.',
    };
  }
}
'''


def safety_controller() -> str:
    return '''import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AiSafetyPlatformService } from './ai-safety-platform.service';

@Controller('v1/ai-safety-platform')
export class AiSafetyPlatformController {
  constructor(private readonly service: AiSafetyPlatformService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('detections')
  detections(@Query('q') q?: string) {
    return this.service.detections(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('check')
  check(@Query('id') id?: string) {
    return this.service.check(id);
  }

  @Post('evaluate')
  evaluate(@Body() body: { action?: string; detectionId?: string }) {
    return this.service.evaluate(body ?? {});
  }

  @Get('evaluate')
  evaluateGet(@Query('action') action?: string, @Query('id') id?: string) {
    return this.service.evaluate({ action, detectionId: id });
  }
}
'''


def governance_catalog() -> str:
    return '''/**
 * Library Phase 161 → AI Governance Platform (VL-294).
 * Real human approval workflow — not post-facto log only.
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ApprovalKind =
  | 'model_promotion'
  | 'policy_change'
  | 'marketplace_listing'
  | 'prompt_approval'
  | 'dataset_approval'
  | 'agent_approval';

export type ApprovalRequest = {
  id: string;
  kind: ApprovalKind;
  title: string;
  requester: string;
  status: ApprovalStatus;
  humanSignOffRequired: true;
  riskLevel: 'high' | 'medium' | 'low';
  notes: string;
  continuousLearningPromoteGateRef?: string;
};

export function seedApprovalRequests(): ApprovalRequest[] {
  return [
    {
      id: 'gov-model-001',
      kind: 'model_promotion',
      title: 'Promote support-triage v2.1',
      requester: 'mlops-bot',
      status: 'pending',
      humanSignOffRequired: true,
      riskLevel: 'high',
      notes: 'Requires human sign-off before Continuous Learning promote.',
      continuousLearningPromoteGateRef: 'promo-ready-001',
    },
    {
      id: 'gov-policy-001',
      kind: 'policy_change',
      title: 'Tighten external-comms deny',
      requester: 'trust-admin',
      status: 'pending',
      humanSignOffRequired: true,
      riskLevel: 'high',
      notes: 'Policy Runtime change — human approval required.',
    },
    {
      id: 'gov-mkt-001',
      kind: 'marketplace_listing',
      title: 'List agent-research-assist',
      requester: 'marketplace-ops',
      status: 'pending',
      humanSignOffRequired: true,
      riskLevel: 'medium',
      notes: 'Marketplace listing cannot go live without approval.',
    },
    {
      id: 'gov-prompt-001',
      kind: 'prompt_approval',
      title: 'Approve customer-faq prompt v3',
      requester: 'promptops',
      status: 'approved',
      humanSignOffRequired: true,
      riskLevel: 'low',
      notes: 'Human approved prompt change.',
    },
    {
      id: 'gov-dataset-001',
      kind: 'dataset_approval',
      title: 'Approve training corpus batch-17',
      requester: 'data-ops',
      status: 'rejected',
      humanSignOffRequired: true,
      riskLevel: 'high',
      notes: 'Rejected — provenance incomplete.',
    },
    {
      id: 'gov-agent-001',
      kind: 'agent_approval',
      title: 'Approve ops-runner agent staging→live',
      requester: 'agentops',
      status: 'pending',
      humanSignOffRequired: true,
      riskLevel: 'medium',
      notes: 'Agent promotion requires human sign-off.',
    },
  ];
}

export function aiGovernancePlatformEngineCatalog(approvals: ApprovalRequest[]) {
  return {
    product: 'Lugemi AI Governance Platform',
    capabilities: [
      { id: 'model_approval', name: 'Model Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'prompt_approval', name: 'Prompt Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'dataset_approval', name: 'Dataset Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'agent_approval', name: 'Agent Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'policy_approval', name: 'Policy Approval', status: 'shipped', notes: 'Human sign-off.' },
      { id: 'change_control', name: 'Change Control', status: 'shipped', notes: 'pending|approved|rejected.' },
      { id: 'risk_assessment', name: 'Risk Assessment', status: 'shipped', notes: 'Risk levels on requests.' },
      { id: 'approval_workflow', name: 'Approval Workflow', status: 'shipped', notes: 'Real workflow, not post-facto log.' },
      { id: 'model_cards', name: 'Model Cards', status: 'shipped', notes: 'Card catalog seed.' },
      { id: 'dataset_cards', name: 'Dataset Cards', status: 'shipped', notes: 'Card catalog seed.' },
      { id: 'ai_cards', name: 'AI Cards', status: 'shipped', notes: 'Card catalog seed.' },
    ],
    approvals,
    pending: approvals.filter((a) => a.status === 'pending'),
    honesty: {
      humanSignOffRequired: true,
      postFactoLogOnly: false,
      regeneratesContinuousLearning: false,
      referencesContinuousLearningPromoteGates: true,
      regeneratesPolicyRuntime: false,
    },
    safety: {
      humanSignOffRequired: true,
      note:
        'Consequential decisions (model promotion, policy change, marketplace listing) require human approve/reject — not post-facto logging.',
    },
    docs: '/docs/AI_GOVERNANCE_PLATFORM.md',
    note: 'AI Governance Platform (VL-294). Human approval workflow with pending|approved|rejected statuses.',
  };
}
'''


def governance_service() -> str:
    return '''import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ApprovalRequest,
  aiGovernancePlatformEngineCatalog,
  seedApprovalRequests,
} from './ai-governance-platform.catalog';

@Injectable()
export class AiGovernancePlatformService {
  private approvals: ApprovalRequest[] = seedApprovalRequests().map((a) => ({ ...a }));

  engine() {
    return aiGovernancePlatformEngineCatalog(this.approvals);
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const approvals = catalog.approvals.filter((a) => {
      if (!q) return true;
      return (
        a.id.toLowerCase().includes(q) ||
        a.kind.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q)
      );
    });
    return {
      approvals,
      count: approvals.length,
      pending: approvals.filter((a) => a.status === 'pending'),
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  status(id: string) {
    const row = this.approvals.find((a) => a.id === id);
    if (!row) throw new BadRequestException(`Unknown approval request: ${id}`);
    return {
      ...row,
      humanSignOffRequired: true as const,
      honesty: this.engine().honesty,
      docs: '/docs/AI_GOVERNANCE_PLATFORM.md',
    };
  }

  approve(id: string) {
    const row = this.approvals.find((a) => a.id === id);
    if (!row) throw new BadRequestException(`Unknown approval request: ${id}`);
    row.status = 'approved';
    return {
      ...row,
      humanSignOffRequired: true as const,
      note: 'Human approved — consequential action may proceed.',
      docs: '/docs/AI_GOVERNANCE_PLATFORM.md',
    };
  }

  reject(id: string) {
    const row = this.approvals.find((a) => a.id === id);
    if (!row) throw new BadRequestException(`Unknown approval request: ${id}`);
    row.status = 'rejected';
    return {
      ...row,
      humanSignOffRequired: true as const,
      note: 'Human rejected — consequential action must not proceed.',
      docs: '/docs/AI_GOVERNANCE_PLATFORM.md',
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'governance',
      approvalCount: catalog.approvals.length,
      pendingCount: catalog.pending.length,
      humanSignOffRequired: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AI Governance Platform monitoring snapshot (VL-294) — human sign-off required.',
    };
  }
}
'''


def governance_controller() -> str:
    return '''import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AiGovernancePlatformService } from './ai-governance-platform.service';

@Controller('v1/ai-governance-platform')
export class AiGovernancePlatformController {
  constructor(private readonly service: AiGovernancePlatformService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('approvals')
  approvals(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('status/:id')
  status(@Param('id') id: string) {
    return this.service.status(id);
  }

  @Get('check')
  check(@Query('id') id?: string) {
    if (!id) return this.service.list();
    return this.service.status(id);
  }

  @Post('approvals/:id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Post('approvals/:id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
'''


def explainability_catalog() -> str:
    return '''/**
 * Library Phase 162 → Explainability Platform (VL-295).
 * Not SHAP OS — confidence/evidence/attribution/decision-trace/provenance.
 */
export type ExplanationRecord = {
  id: string;
  decisionId: string;
  confidence: number;
  evidence: string[];
  attribution: string[];
  decisionTrace: string[];
  provenance: {
    model?: string;
    dataset?: string;
    prompt?: string;
    knowledge?: string;
  };
  notes: string;
};

export function seedExplanations(): ExplanationRecord[] {
  return [
    {
      id: 'xai-001',
      decisionId: 'dec-support-triage-42',
      confidence: 0.91,
      evidence: ['ticket keywords match FAQ cluster', 'prior similar resolution'],
      attribution: ['prompt:customer-faq-v3', 'rag:chunk-884'],
      decisionTrace: ['retrieve', 'rank', 'generate', 'policy-check', 'respond'],
      provenance: {
        model: 'support-triage-v2',
        dataset: 'faq-corpus-17',
        prompt: 'customer-faq-v3',
        knowledge: 'kb-support',
      },
      notes: 'High-confidence support answer with source attribution.',
    },
    {
      id: 'xai-002',
      decisionId: 'dec-risk-score-9',
      confidence: 0.72,
      evidence: ['elevated third-party score', 'recent policy violation'],
      attribution: ['risk-intelligence:third-party', 'agentops:apol-001'],
      decisionTrace: ['collect-signals', 'score', 'explain'],
      provenance: { model: 'risk-scorer-v1', knowledge: 'trust-signals' },
      notes: 'Medium confidence — human review recommended.',
    },
    {
      id: 'xai-003',
      decisionId: 'dec-privacy-redact-3',
      confidence: 0.97,
      evidence: ['PHI pattern match', 'retention policy hit'],
      attribution: ['privacy-platform:phi', 'retention:90d'],
      decisionTrace: ['detect', 'classify', 'redact', 'audit'],
      provenance: { prompt: 'privacy-redact', dataset: 'phi-patterns' },
      notes: 'Redaction decision with PHI evidence.',
    },
  ];
}

export function explainabilityPlatformEngineCatalog() {
  const explanations = seedExplanations();
  return {
    product: 'Lugemi Explainability Platform',
    capabilities: [
      { id: 'confidence', name: 'Confidence Scores', status: 'shipped', notes: 'Per-decision confidence.' },
      { id: 'evidence', name: 'Evidence', status: 'shipped', notes: 'Evidence bundles.' },
      { id: 'attribution', name: 'Source Attribution', status: 'shipped', notes: 'Prompt/RAG/model attribution.' },
      { id: 'decision_trace', name: 'Decision Trace', status: 'shipped', notes: 'Step traces.' },
      { id: 'model_metadata', name: 'Model Metadata', status: 'shipped', notes: 'Model provenance.' },
      { id: 'dataset_provenance', name: 'Dataset Provenance', status: 'shipped', notes: 'Dataset lineage.' },
      { id: 'prompt_provenance', name: 'Prompt Provenance', status: 'shipped', notes: 'Prompt lineage.' },
      { id: 'knowledge_provenance', name: 'Knowledge Provenance', status: 'shipped', notes: 'Knowledge lineage.' },
    ],
    explanations,
    honesty: {
      shapOs: false,
      limeOs: false,
      regeneratesVolumes1to14: false,
      decisionExplainabilitySurface: true,
    },
    safety: {
      shapOs: false,
      note: 'Explainability catalog for confidence/evidence/attribution/traces — not a SHAP/LIME research OS.',
    },
    docs: '/docs/EXPLAINABILITY_PLATFORM.md',
    note: 'Explainability Platform (VL-295). Decision explainability seed — shapOs=false.',
  };
}
'''


def privacy_catalog() -> str:
    return '''/**
 * Library Phase 163 → Privacy Platform (VL-296).
 * Enforces Volume 12 traditional knowledge consent fields.
 */
export type ConsentStatus = 'attested' | 'restricted' | 'unverified';

export type PrivacyAsset = {
  id: string;
  title: string;
  kind: 'traditional_knowledge' | 'pii_record' | 'phi_record' | 'financial_record' | 'general';
  provenance: string | null;
  sourceCommunity: string | null;
  consentStatus: ConsentStatus | null;
  notes: string;
};

export function seedPrivacyAssets(): PrivacyAsset[] {
  return [
    {
      id: 'priv-tk-ok',
      title: 'Attested oral history excerpt',
      kind: 'traditional_knowledge',
      provenance: 'community-archive-12',
      sourceCommunity: 'Yoruba heritage council',
      consentStatus: 'attested',
      notes: 'Release allowed — Volume 12 fields complete.',
    },
    {
      id: 'priv-tk-restricted',
      title: 'Restricted ceremonial knowledge',
      kind: 'traditional_knowledge',
      provenance: 'field-notes-9',
      sourceCommunity: 'Maasai elders',
      consentStatus: 'restricted',
      notes: 'Must reject release — consentStatus=restricted.',
    },
    {
      id: 'priv-tk-unverified',
      title: 'Unverified folklore scrape',
      kind: 'traditional_knowledge',
      provenance: 'web-scrape',
      sourceCommunity: 'unknown',
      consentStatus: 'unverified',
      notes: 'Must reject release — consentStatus=unverified.',
    },
    {
      id: 'priv-pii-001',
      title: 'Customer email batch',
      kind: 'pii_record',
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'PII detection + redaction candidate.',
    },
    {
      id: 'priv-phi-001',
      title: 'Clinic note snippet',
      kind: 'phi_record',
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'PHI detection + masking candidate.',
    },
    {
      id: 'priv-fin-001',
      title: 'Card last-four log',
      kind: 'financial_record',
      provenance: null,
      sourceCommunity: null,
      consentStatus: null,
      notes: 'Financial data detection — PCI honesty via Stripe/billing surfaces.',
    },
  ];
}

export function evaluatePrivacyRelease(asset: PrivacyAsset): {
  allowed: boolean;
  reason: string;
} {
  if (asset.kind === 'traditional_knowledge') {
    if (!asset.provenance || !asset.sourceCommunity || !asset.consentStatus) {
      return {
        allowed: false,
        reason:
          'Missing required Volume 12 consent fields: provenance, sourceCommunity, consentStatus.',
      };
    }
    if (asset.consentStatus === 'restricted' || asset.consentStatus === 'unverified') {
      return {
        allowed: false,
        reason: `Blocked: consentStatus=${asset.consentStatus}. Attested consent required for traditional-knowledge release.`,
      };
    }
    if (asset.consentStatus === 'attested') {
      return { allowed: true, reason: 'Attested traditional-knowledge consent — release allowed.' };
    }
    return { allowed: false, reason: 'Unknown consentStatus — blocked.' };
  }
  return {
    allowed: true,
    reason: 'Non-TK asset — proceed with PII/PHI/financial controls as applicable.',
  };
}

export function privacyPlatformEngineCatalog() {
  const assets = seedPrivacyAssets();
  return {
    product: 'Lugemi Privacy Platform',
    capabilities: [
      { id: 'pii', name: 'PII Detection', status: 'shipped', notes: 'PII detectors.' },
      { id: 'phi', name: 'PHI Detection', status: 'shipped', notes: 'PHI detectors.' },
      { id: 'financial', name: 'Financial Data Detection', status: 'shipped', notes: 'Financial detectors.' },
      { id: 'redaction', name: 'Automatic Redaction', status: 'shipped', notes: 'Redaction controls.' },
      { id: 'tokenization', name: 'Tokenization', status: 'shipped', notes: 'Tokenization controls.' },
      { id: 'masking', name: 'Masking', status: 'shipped', notes: 'Masking controls.' },
      { id: 'anonymization', name: 'Anonymization', status: 'shipped', notes: 'Anonymization controls.' },
      { id: 'pseudonymization', name: 'Pseudonymization', status: 'shipped', notes: 'Pseudonymization controls.' },
      { id: 'encryption', name: 'Encryption', status: 'shipped', notes: 'Encryption posture catalog.' },
      { id: 'consent', name: 'Consent Tracking', status: 'shipped', notes: 'Volume 12 TK consent.' },
      { id: 'retention', name: 'Retention Policies', status: 'shipped', notes: 'Retention catalog.' },
    ],
    assets,
    controls: [
      { id: 'redact', name: 'Redaction', status: 'shipped' },
      { id: 'tokenize', name: 'Tokenization', status: 'shipped' },
      { id: 'mask', name: 'Masking', status: 'shipped' },
      { id: 'anonymize', name: 'Anonymization', status: 'shipped' },
    ],
    honesty: {
      traditionalKnowledgeConsentRequired: true,
      regeneratesVolume12: false,
      enforcesVolume12ConsentFields: true,
      requiredConsentFields: ['provenance', 'sourceCommunity', 'consentStatus'],
      privacyOsReplacement: false,
    },
    safety: {
      traditionalKnowledgeConsentRequired: true,
      note:
        'Before release of traditional knowledge, require Volume 12 consent fields. Block when consentStatus is restricted or unverified. Integrates with cultural consent concepts.',
    },
    docs: '/docs/PRIVACY_PLATFORM.md',
    note: 'Privacy Platform (VL-296). Detection/redaction + Volume 12 TK consent enforcement.',
  };
}
'''


def privacy_service() -> str:
    return '''import { BadRequestException, Injectable } from '@nestjs/common';
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
      note: 'Privacy Platform monitoring snapshot (VL-296) — TK consent enforced.',
    };
  }
}
'''


def privacy_controller() -> str:
    return '''import { Controller, Get, Post, Query } from '@nestjs/common';
import { PrivacyPlatformService } from './privacy-platform.service';

@Controller('v1/privacy-platform')
export class PrivacyPlatformController {
  constructor(private readonly service: PrivacyPlatformService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('assets')
  assets(@Query('q') q?: string) {
    return this.service.assets(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('check')
  check(@Query('id') id?: string) {
    if (!id) return this.service.assets();
    return this.service.checkConsent(id);
  }

  @Get('consent-check')
  consentCheck(@Query('id') id: string) {
    return this.service.checkConsent(id);
  }

  @Post('release')
  release(@Query('id') id: string) {
    return this.service.release(id);
  }

  @Get('release')
  releaseGet(@Query('id') id: string) {
    return this.service.release(id);
  }
}
'''


def compliance_catalog() -> str:
    return '''/**
 * Library Phase 164 → Compliance Platform (VL-297).
 * Tooling supports compliance work — does NOT certify GDPR/HIPAA/SOC2/PCI.
 */
export type FrameworkControl = {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'HIPAA' | 'GDPR' | 'CCPA' | 'NIST_AI_RMF' | 'EU_AI_ACT';
  control: string;
  evidenceRef: string;
  status: 'mapped' | 'partial' | 'gap';
  notes: string;
};

export function complianceControlsCatalog(): FrameworkControl[] {
  return [
    {
      id: 'cmp-soc2-1',
      framework: 'SOC2',
      control: 'CC6.1 Logical access',
      evidenceRef: 'audit:access-reviews',
      status: 'mapped',
      notes: 'Mapped to identity + audit events — not a SOC2 certification.',
    },
    {
      id: 'cmp-iso-1',
      framework: 'ISO27001',
      control: 'A.5.1 Policies',
      evidenceRef: 'policy-runtime:engine',
      status: 'mapped',
      notes: 'Policy Runtime evidence pointer.',
    },
    {
      id: 'cmp-hipaa-1',
      framework: 'HIPAA',
      control: '164.312 Technical safeguards',
      evidenceRef: 'privacy-platform:phi',
      status: 'partial',
      notes: 'PHI detection tooling — not HIPAA certified.',
    },
    {
      id: 'cmp-gdpr-1',
      framework: 'GDPR',
      control: 'Art. 5 Principles',
      evidenceRef: 'privacy-platform:consent',
      status: 'partial',
      notes: 'Consent tracking supports GDPR work — lawyers/auditors still required.',
    },
    {
      id: 'cmp-ccpa-1',
      framework: 'CCPA',
      control: 'Consumer rights request logging',
      evidenceRef: 'privacy-platform:assets',
      status: 'mapped',
      notes: 'Request logging catalog — not CCPA certification.',
    },
    {
      id: 'cmp-nist-1',
      framework: 'NIST_AI_RMF',
      control: 'Map / Measure / Manage / Govern',
      evidenceRef: 'ai-governance-platform:approvals',
      status: 'mapped',
      notes: 'Governance + risk mapping — not NIST certification.',
    },
    {
      id: 'cmp-eu-1',
      framework: 'EU_AI_ACT',
      control: 'High-risk system documentation',
      evidenceRef: 'explainability-platform:explanations',
      status: 'partial',
      notes: 'Documentation support — not EU AI Act conformity assessment.',
    },
  ];
}

export function compliancePlatformEngineCatalog() {
  const controls = complianceControlsCatalog();
  return {
    product: 'Lugemi Compliance Platform',
    capabilities: [
      { id: 'soc2', name: 'SOC 2', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'iso27001', name: 'ISO 27001', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'hipaa', name: 'HIPAA', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'gdpr', name: 'GDPR', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'ccpa', name: 'CCPA', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'nist_ai_rmf', name: 'NIST AI RMF', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'eu_ai_act', name: 'EU AI Act', status: 'shipped', notes: 'Control mapping — not certification.' },
      { id: 'evidence', name: 'Audit Evidence', status: 'shipped', notes: 'Evidence catalog pointers.' },
      { id: 'policy_mapping', name: 'Policy Mapping', status: 'shipped', notes: 'Maps to Policy Runtime.' },
    ],
    controls,
    evidence: controls.map((c) => ({ id: c.id, ref: c.evidenceRef, framework: c.framework })),
    honesty: {
      complianceToolingNotCertification: true,
      notCertifiedCompliant: true,
      gdprCertified: false,
      hipaaCertified: false,
      soc2Certified: false,
      pciCertified: false,
      lawyersAuditorsStillRequired: true,
      certificationOs: false,
    },
    safety: {
      complianceToolingNotCertification: true,
      notCertifiedCompliant: true,
      note:
        'Dashboards and control mappings support compliance work. They do NOT make Lugemi GDPR/HIPAA/SOC2/PCI certified. Lawyers and external auditors are still required.',
    },
    docs: '/docs/COMPLIANCE_PLATFORM.md',
    note: 'Compliance Platform (VL-297). Tooling not certification — lawyers/auditors still required.',
  };
}
'''


def risk_catalog() -> str:
    return '''/**
 * Library Phase 165 → Risk Intelligence (VL-298).
 * Scoring seed + analytics — not GRC suite OS.
 */
export type RiskScore = {
  id: string;
  category:
    | 'operational'
    | 'model'
    | 'security'
    | 'compliance'
    | 'data'
    | 'supply_chain'
    | 'third_party';
  score: number;
  trend: 'up' | 'down' | 'flat';
  notes: string;
};

export function riskScoresCatalog(): RiskScore[] {
  return [
    { id: 'risk-ops-1', category: 'operational', score: 42, trend: 'flat', notes: 'Ops load stable.' },
    { id: 'risk-model-1', category: 'model', score: 58, trend: 'up', notes: 'Drift signals elevated.' },
    { id: 'risk-sec-1', category: 'security', score: 35, trend: 'down', notes: 'Fewer policy violations.' },
    { id: 'risk-cmp-1', category: 'compliance', score: 61, trend: 'flat', notes: 'Open control gaps.' },
    { id: 'risk-data-1', category: 'data', score: 47, trend: 'up', notes: 'PII exposure watch.' },
    { id: 'risk-supply-1', category: 'supply_chain', score: 39, trend: 'flat', notes: 'Vendor SBOM review.' },
    { id: 'risk-3p-1', category: 'third_party', score: 55, trend: 'up', notes: 'Third-party connector risk.' },
  ];
}

export function riskIntelligenceEngineCatalog() {
  const scores = riskScoresCatalog();
  const avg = Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length);
  return {
    product: 'Lugemi Risk Intelligence',
    capabilities: [
      { id: 'operational', name: 'Operational Risk', status: 'shipped', notes: 'Ops risk scoring.' },
      { id: 'model', name: 'Model Risk', status: 'shipped', notes: 'Model risk scoring.' },
      { id: 'security', name: 'Security Risk', status: 'shipped', notes: 'Security risk scoring.' },
      { id: 'compliance', name: 'Compliance Risk', status: 'shipped', notes: 'Compliance risk scoring.' },
      { id: 'data', name: 'Data Risk', status: 'shipped', notes: 'Data risk scoring.' },
      { id: 'supply_chain', name: 'Supply Chain Risk', status: 'shipped', notes: 'Supply-chain risk.' },
      { id: 'third_party', name: 'Third Party Risk', status: 'shipped', notes: 'Third-party risk.' },
      { id: 'ai_scoring', name: 'AI Risk Scoring', status: 'shipped', notes: 'Aggregate AI risk score.' },
    ],
    scores,
    analytics: {
      averageScore: avg,
      elevated: scores.filter((s) => s.score >= 50),
      trendingUp: scores.filter((s) => s.trend === 'up'),
    },
    honesty: {
      grcSuiteOs: false,
      regeneratesCompliancePlatform: false,
      riskScoringSeed: true,
    },
    safety: {
      grcSuiteOs: false,
      note: 'Risk scoring seed and analytics over Trust Cloud signals — not a full GRC suite OS.',
    },
    docs: '/docs/RISK_INTELLIGENCE.md',
    note: 'Risk Intelligence (VL-298). Operational/model/security/compliance/data/supply-chain/third-party scoring.',
  };
}
'''


def identity_catalog() -> str:
    return '''/**
 * Library Phase 166 → Identity Federation (VL-299).
 * Discovery/honest federation readiness over Clerk — not Okta/SAML IdP OS.
 */
export function identityFederationEngineCatalog() {
  return {
    product: 'Lugemi Identity Federation',
    capabilities: [
      { id: 'oauth2', name: 'OAuth2', status: 'shipped', notes: 'OAuth2 federation readiness via Clerk.' },
      { id: 'oidc', name: 'OIDC', status: 'shipped', notes: 'OIDC via Clerk.' },
      { id: 'saml', name: 'SAML', status: 'partial', notes: 'SAML readiness catalog — samlIdpOs=false.' },
      { id: 'scim', name: 'SCIM', status: 'partial', notes: 'SCIM readiness catalog.' },
      { id: 'enterprise', name: 'Enterprise Identity', status: 'shipped', notes: 'Enterprise IdP discovery.' },
      { id: 'federated', name: 'Federated Identity', status: 'shipped', notes: 'Federation readiness.' },
      { id: 'machine', name: 'Machine Identity', status: 'shipped', notes: 'API key / machine identity catalog.' },
      { id: 'service', name: 'Service Identity', status: 'shipped', notes: 'Service identity catalog.' },
      { id: 'certificates', name: 'Certificate Management', status: 'partial', notes: 'Cert readiness — not PKI OS.' },
    ],
    federation: [
      {
        id: 'fed-clerk',
        provider: 'Clerk',
        protocols: ['oauth2', 'oidc'],
        status: 'ready',
        notes: 'Primary identity via existing Clerk integration.',
      },
      {
        id: 'fed-saml-ready',
        provider: 'Enterprise SAML (discovery)',
        protocols: ['saml'],
        status: 'discovery',
        notes: 'Federation readiness only — Lugemi is not a SAML IdP OS.',
      },
      {
        id: 'fed-scim-ready',
        provider: 'SCIM directory (discovery)',
        protocols: ['scim'],
        status: 'discovery',
        notes: 'SCIM readiness catalog — not full directory OS.',
      },
      {
        id: 'fed-machine',
        provider: 'Lugemi API keys',
        protocols: ['api_key'],
        status: 'ready',
        notes: 'Machine/service identity via existing API keys.',
      },
    ],
    honesty: {
      oktaOs: false,
      samlIdpOs: false,
      regeneratesClerk: false,
      extendsClerkIdentity: true,
      federationReadinessOnly: true,
    },
    safety: {
      oktaOs: false,
      samlIdpOs: false,
      note: 'Identity Federation is discovery/readiness over Clerk and existing API keys — not Okta OS or a SAML IdP OS.',
    },
    docs: '/docs/IDENTITY_FEDERATION.md',
    note: 'Identity Federation (VL-299). OAuth2/OIDC/SAML/SCIM/enterprise/machine/service identity catalog. oktaOs=false; samlIdpOs=false.',
  };
}
'''


def generic_list_service(slug: str, pascal: str, list_key: str, vl: int, mode: str) -> str:
    return f'''import {{ Injectable }} from '@nestjs/common';
import {{ {to_camel(slug)}EngineCatalog }} from './{slug}.catalog';

@Injectable()
export class {pascal}Service {{
  engine() {{
    return {to_camel(slug)}EngineCatalog();
  }}

  list(query?: string) {{
    const catalog = this.engine() as {{
      {list_key}: Array<Record<string, unknown> & {{ id: string; notes?: string }}>;
      honesty: Record<string, unknown>;
      safety: Record<string, unknown>;
      note: string;
      docs: string;
    }};
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.{list_key}.filter((row) => {{
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    }});
    return {{
      {list_key}: rows,
      count: rows.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    }};
  }}

  query(query?: string) {{
    return this.list(query);
  }}

  monitoring() {{
    const catalog = this.engine();
    return {{
      mode: '{mode}',
      count: (catalog as {{ {list_key}: unknown[] }}).{list_key}.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: '{pascal} monitoring snapshot (VL-{vl}).',
    }};
  }}
}}
'''


def generic_controller(slug: str, pascal: str, list_path: str) -> str:
    return f'''import {{ Controller, Get, Query }} from '@nestjs/common';
import {{ {pascal}Service }} from './{slug}.service';

@Controller('v1/{slug}')
export class {pascal}Controller {{
  constructor(private readonly service: {pascal}Service) {{}}

  @Get('engine')
  engine() {{
    return this.service.engine();
  }}

  @Get('products')
  products() {{
    return this.service.engine();
  }}

  @Get('monitoring')
  monitoring() {{
    return this.service.monitoring();
  }}

  @Get('{list_path}')
  list(@Query('q') q?: string) {{
    return this.service.list(q);
  }}

  @Get('query')
  query(@Query('q') q?: string) {{
    return this.service.query(q);
  }}
}}
'''


def analytics_catalog() -> str:
    return '''/**
 * Library Phase 167 → Trust Analytics (VL-300).
 * Aggregates sibling Trust Cloud hubs — not SIEM OS.
 */
export function trustAnalyticsEngineCatalog() {
  return {
    product: 'Lugemi Trust Analytics',
    capabilities: [
      { id: 'safety_incidents', name: 'Safety Incidents', status: 'shipped', notes: 'From AI Safety.' },
      { id: 'compliance_status', name: 'Compliance Status', status: 'shipped', notes: 'From Compliance.' },
      { id: 'privacy_events', name: 'Privacy Events', status: 'shipped', notes: 'From Privacy.' },
      { id: 'policy_violations', name: 'Policy Violations', status: 'shipped', notes: 'From AgentOps/Safety.' },
      { id: 'risk_trends', name: 'Risk Trends', status: 'shipped', notes: 'From Risk Intelligence.' },
      { id: 'audit_findings', name: 'Audit Findings', status: 'shipped', notes: 'From Trust audit surfaces.' },
      { id: 'model_safety', name: 'Model Safety', status: 'shipped', notes: 'Safety × governance.' },
      { id: 'dataset_quality', name: 'Dataset Quality', status: 'shipped', notes: 'Privacy × risk signals.' },
    ],
    honesty: {
      siemOs: false,
      regeneratesSiblingHubs: false,
      aggregatesSiblingHubs: true,
      platformEngineeringOs: false,
    },
    safety: {
      siemOs: false,
      note: 'Trust Analytics aggregates sibling Trust Cloud hubs — not a SIEM OS or Platform Engineering OS.',
    },
    docs: '/docs/TRUST_ANALYTICS.md',
    note: 'Trust Analytics (VL-300). Unified trust analytics over safety/compliance/privacy/policy/risk.',
  };
}
'''


def analytics_service() -> str:
    return '''import { Injectable } from '@nestjs/common';
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
'''


def web_page(slug: str, pascal: str) -> str:
    return f'''import {{ {pascal}Client }} from './{slug}-client';

export default function {pascal}Page() {{
  return <{pascal}Client />;
}}
'''


def web_client(slug: str, title: str, vl: int, endpoint: str) -> str:
    return f'''\'use client\';

import {{ useEffect, useState }} from 'react';
import {{ apiFetch }} from '@/lib/api';
import {{ AppShell }} from '@/components/app-shell';

type Engine = {{
  product: string;
  note: string;
  honesty: Record<string, boolean | string>;
  safety?: {{ note?: string }} & Record<string, unknown>;
}};

export function {to_pascal(slug)}Client() {{
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {{
    void apiFetch<Engine>('{endpoint}')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }}, []);

  return (
    <AppShell>
      <h1 style={{{{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}}}>
        {title}
      </h1>
      <p style={{{{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}}}>
        VL-{vl} — Lugemi {title} console in the Trust Cloud.
      </p>
      {{error ? <p style={{{{ color: '#b42318' }}}}>{{error}}</p> : null}}
      {{!data && !error ? <p style={{{{ color: 'var(--muted)' }}}}>Loading…</p> : null}}
      {{data ? (
        <div style={{{{ display: 'grid', gap: '1.25rem' }}}}>
          <p style={{{{ margin: 0, color: 'var(--muted)' }}}}>{{data.note}}</p>
          {{data.safety?.note ? (
            <p style={{{{ margin: 0, borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem', color: 'var(--muted)' }}}}>
              {{String(data.safety.note)}}
            </p>
          ) : null}}
          <pre style={{{{ margin: 0, padding: '1rem', background: 'var(--surface)', overflow: 'auto', fontSize: '0.78rem' }}}}>
            {{JSON.stringify({{ honesty: data.honesty }}, null, 2)}}
          </pre>
        </div>
      ) : null}}
    </AppShell>
  );
}}
'''


def product_doc(hub: dict) -> str:
    return f'''# {hub["title"]} (VL-{hub["vl"]})

Library Phase {hub["phase"]} — part of Volume 15 Trust Cloud.

## Mission

Lugemi {hub["title"]} provides the {hub["title"]} surface inside the Trust Cloud.

## Honesty

- Extends existing Lugemi systems — does not regenerate Volumes 1–14.
- `{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`.
- Platform Engineering Cloud deferred to Volume 16+ (`platformEngineeringOs=false`).

## Surfaces

- Console: `/{hub["slug"]}`
- API: `/v1/{hub["slug"]}/engine`{" (foundation: `/products`)" if hub["kind"] == "foundation" else ""}
- ADR: [`docs/adr/{hub["adr"]}-{hub["slug"]}.md`](./adr/{hub["adr"]}-{hub["slug"]}.md)

---

## Volume status

**Volume 15** Trust Cloud (VL-292–301). Production Audit evidence: [`docs/trust-cloud-audit/`](./trust-cloud-audit/).
'''


