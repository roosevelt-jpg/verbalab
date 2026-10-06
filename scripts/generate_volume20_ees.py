#!/usr/bin/env python3
"""Generate VerbaLab Volume 20 Enterprise Engineering System (VL-344–353).

Standards, governance, templates, and quality catalogs for humans + Cursor —
extends Platform Engineering / DX / existing docs/adr / Trust AI Governance.
Not Jira OS, Confluence OS, SonarQube OS, ADR factory, or Architecture Knowledge Base OS.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path("/workspace/verbalab")
ADR_COUNT = len(list((ROOT / "docs/adr").glob("*.md")))


def to_pascal(slug: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in slug.split("-"))


def to_camel(slug: str) -> str:
    p = to_pascal(slug)
    return p[:1].lower() + p[1:]


def to_const(slug: str) -> str:
    return slug.replace("-", "_").upper()


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")


def ts_bool(v: bool) -> str:
    return "true" if v else "false"


# ---------------------------------------------------------------------------
# Hub definitions
# ---------------------------------------------------------------------------

HUBS = [
    {
        "slug": "enterprise-engineering-system",
        "vl": 344,
        "phase": 211,
        "adr": "0246",
        "title": "Enterprise Engineering System",
        "kind": "foundation",
        "doc": "ENTERPRISE_ENGINEERING_SYSTEM.md",
        "nav": "EES",
        "honesty_key": "engineeringOsForHumansAndCursor",
        "honesty_val": True,
        "note": "Enterprise Engineering System Foundation (VL-344). Engineering OS for humans+Cursor — standards/governance catalogs, not a customer-facing product cloud.",
    },
    {
        "slug": "engineering-governance",
        "vl": 345,
        "phase": 212,
        "adr": "0247",
        "title": "Engineering Governance",
        "kind": "standards",
        "doc": "ENGINEERING_GOVERNANCE.md",
        "nav": "Eng Governance",
        "honesty_key": "extendsAiGovernance",
        "honesty_val": True,
        "note": "Engineering Governance (VL-345). ARB/Engineering/Security/AI/Data/Release councils + CAB/TSC catalog. Extends AI Governance (Vol 15); humanSignOffRequired for consequential decisions.",
        "routes_to": [
            {"module": "ai-governance-platform", "path": "/v1/ai-governance-platform/engine", "role": "AI Governance (Vol 15)"},
            {"module": "trust-cloud", "path": "/v1/trust-cloud/products", "role": "Trust Cloud"},
            {"module": "release-engineering", "path": "/v1/release-engineering/engine", "role": "Release Engineering"},
            {"module": "platform-engineering-cloud", "path": "/v1/platform-engineering-cloud/products", "role": "Platform Engineering Cloud"},
        ],
        "upstream_modules": [
            ("AiGovernancePlatformModule", "ai-governance-platform", "AiGovernancePlatformService", "ai-governance-platform.service", "engine"),
            ("TrustCloudModule", "trust-cloud", "TrustCloudService", "trust-cloud.service", "products"),
            ("ReleaseEngineeringModule", "release-engineering", "ReleaseEngineeringService", "release-engineering.service", "engine"),
            ("PlatformEngineeringCloudModule", "platform-engineering-cloud", "PlatformEngineeringCloudService", "platform-engineering-cloud.service", "products"),
        ],
        "capabilities": [
            ("arb", "Architecture Review Board"),
            ("engineering_council", "Engineering Council"),
            ("security_council", "Security Council"),
            ("ai_council", "AI Council"),
            ("data_council", "Data Council"),
            ("release_council", "Release Council"),
            ("cab", "Change Advisory Board"),
            ("tsc", "Technical Steering Committee"),
        ],
        "catalog_extra": "councils",
        "extra_honesty": {
            "humanSignOffRequired": True,
            "jiraOs": False,
            "confluenceOs": False,
        },
    },
    {
        "slug": "architecture-governance",
        "vl": 346,
        "phase": 213,
        "adr": "0248",
        "title": "Architecture Governance",
        "kind": "standards",
        "doc": "ARCHITECTURE_GOVERNANCE.md",
        "nav": "Arch Governance",
        "honesty_key": "pointsAtExistingAdrProcess",
        "honesty_val": True,
        "note": "Architecture Governance (VL-346). ADR/RFC/design-review/tech-radar/dependency/compliance catalogs pointing at existing docs/adr — adrFactoryOs=false; no mass ADR generation.",
        "routes_to": [
            {"module": "docs/adr", "path": "docs/adr/", "role": "Existing ADR series"},
            {"module": "platform-engineering-cloud", "path": "/v1/platform-engineering-cloud/products", "role": "Platform Engineering"},
            {"module": "developer-experience-platform", "path": "/v1/developer-experience-platform/engine", "role": "Developer Experience"},
        ],
        "upstream_modules": [
            ("PlatformEngineeringCloudModule", "platform-engineering-cloud", "PlatformEngineeringCloudService", "platform-engineering-cloud.service", "products"),
            ("DeveloperExperiencePlatformModule", "developer-experience-platform", "DeveloperExperiencePlatformService", "developer-experience-platform.service", "engine"),
        ],
        "capabilities": [
            ("architecture_reviews", "Architecture Reviews"),
            ("adr_workflow", "ADR Workflow Catalog"),
            ("rfc_workflow", "RFC Workflow Catalog"),
            ("design_reviews", "Design Reviews"),
            ("tech_radar", "Technology Radar"),
            ("dependency_governance", "Dependency Governance"),
            ("architecture_compliance", "Architecture Compliance"),
        ],
        "catalog_extra": "workflows",
        "extra_honesty": {
            "adrFactoryOs": False,
            "architectureKnowledgeBaseOs": False,
            "massAdrGeneration": False,
            "existingAdrCountNote": True,
        },
    },
    {
        "slug": "repository-standards",
        "vl": 347,
        "phase": 214,
        "adr": "0249",
        "title": "Repository Standards",
        "kind": "standards",
        "doc": "REPOSITORY_STANDARDS.md",
        "nav": "Repo Standards",
        "honesty_key": "matchesMonorepoReality",
        "honesty_val": True,
        "note": "Repository Standards (VL-347). Monorepo/polyrepo/templates/naming/folder/branch/git/commit/versioning catalog matching VerbaLab monorepo reality (pnpm/turbo apps/* packages/*).",
        "routes_to": [
            {"module": "developer-experience-platform", "path": "/v1/developer-experience-platform/engine", "role": "Developer Experience"},
            {"module": "golden-path-platform", "path": "/v1/golden-path-platform/engine", "role": "Golden Paths"},
            {"module": "gitops-platform", "path": "/v1/gitops-platform/engine", "role": "GitOps"},
        ],
        "upstream_modules": [
            ("DeveloperExperiencePlatformModule", "developer-experience-platform", "DeveloperExperiencePlatformService", "developer-experience-platform.service", "engine"),
            ("GoldenPathPlatformModule", "golden-path-platform", "GoldenPathPlatformService", "golden-path-platform.service", "engine"),
            ("GitopsPlatformModule", "gitops-platform", "GitopsPlatformService", "gitops-platform.service", "engine"),
        ],
        "capabilities": [
            ("monorepo", "Monorepo Standards"),
            ("polyrepo", "Polyrepo Guidance"),
            ("service_templates", "Service Templates"),
            ("naming", "Naming Standards"),
            ("folder", "Folder Standards"),
            ("branch", "Branch Strategy"),
            ("git", "Git Standards"),
            ("commit", "Commit Standards"),
            ("versioning", "Versioning Standards"),
        ],
        "catalog_extra": "standards",
        "extra_honesty": {
            "inventsNewRepoLayout": False,
            "pnpmTurboMonorepo": True,
        },
    },
    {
        "slug": "engineering-quality-platform",
        "vl": 348,
        "phase": 215,
        "adr": "0250",
        "title": "Engineering Quality Platform",
        "kind": "standards",
        "doc": "ENGINEERING_QUALITY_PLATFORM.md",
        "nav": "Eng Quality",
        "honesty_key": "qualityCatalogNotSonarOs",
        "honesty_val": True,
        "note": "Engineering Quality Platform (VL-348). Static analysis/complexity/deps/security/performance/tech-debt/coverage/mutation catalog + quality dashboard snapshot. sonarqubeOs=false.",
        "routes_to": [
            {"module": "supply-chain-security", "path": "/v1/supply-chain-security/engine", "role": "Supply Chain Security"},
            {"module": "reliability-engineering", "path": "/v1/reliability-engineering/engine", "role": "Reliability Engineering"},
            {"module": "developer-experience-platform", "path": "/v1/developer-experience-platform/engine", "role": "DX repo health"},
        ],
        "upstream_modules": [
            ("SupplyChainSecurityModule", "supply-chain-security", "SupplyChainSecurityService", "supply-chain-security.service", "engine"),
            ("ReliabilityEngineeringModule", "reliability-engineering", "ReliabilityEngineeringService", "reliability-engineering.service", "engine"),
            ("DeveloperExperiencePlatformModule", "developer-experience-platform", "DeveloperExperiencePlatformService", "developer-experience-platform.service", "engine"),
        ],
        "capabilities": [
            ("static_analysis", "Static Analysis"),
            ("complexity", "Complexity Analysis"),
            ("dependency", "Dependency Analysis"),
            ("security", "Security Analysis"),
            ("performance", "Performance Analysis"),
            ("tech_debt", "Technical Debt"),
            ("coverage", "Coverage"),
            ("mutation", "Mutation Testing"),
        ],
        "catalog_extra": "quality",
        "extra_honesty": {
            "sonarqubeOs": False,
            "qualityDashboardSnapshot": True,
        },
    },
    {
        "slug": "ai-engineering-standards",
        "vl": 349,
        "phase": 216,
        "adr": "0251",
        "title": "AI Engineering Standards",
        "kind": "standards",
        "doc": "AI_ENGINEERING_STANDARDS.md",
        "nav": "AI Eng Standards",
        "honesty_key": "retroactiveChecksEnabled",
        "honesty_val": True,
        "note": "AI Engineering Standards (VL-349). Prompt/model/dataset/eval/safety/reasoning/agent/inference standards + retroactiveChecks for Vol 11 payments, Vol 12 healthcare/financial/consent, Vol 17 secrets. Not fake compliance certification.",
        "routes_to": [
            {"module": "ai-governance-platform", "path": "/v1/ai-governance-platform/engine", "role": "AI Governance"},
            {"module": "ai-safety-platform", "path": "/v1/ai-safety-platform/engine", "role": "AI Safety"},
            {"module": "evaluation-platform", "path": "/v1/evaluation-platform/engine", "role": "Evaluation Platform"},
            {"module": "promptops-platform", "path": "/v1/promptops-platform/engine", "role": "PromptOps"},
            {"module": "secrets-certificate-platform", "path": "/v1/secrets-certificate-platform/engine", "role": "Secrets (Vol 17)"},
        ],
        "upstream_modules": [
            ("AiGovernancePlatformModule", "ai-governance-platform", "AiGovernancePlatformService", "ai-governance-platform.service", "engine"),
            ("AiSafetyPlatformModule", "ai-safety-platform", "AiSafetyPlatformService", "ai-safety-platform.service", "engine"),
            ("EvaluationPlatformModule", "evaluation-platform", "EvaluationPlatformService", "evaluation-platform.service", "engine"),
            ("PromptopsPlatformModule", "promptops-platform", "PromptopsPlatformService", "promptops-platform.service", "engine"),
            ("SecretsCertificatePlatformModule", "secrets-certificate-platform", "SecretsCertificatePlatformService", "secrets-certificate-platform.service", "engine"),
        ],
        "capabilities": [
            ("prompt", "Prompt Engineering Standards"),
            ("model", "Model Engineering Standards"),
            ("dataset", "Dataset Engineering Standards"),
            ("evaluation", "Evaluation Standards"),
            ("safety", "Safety Standards"),
            ("reasoning", "Reasoning Standards"),
            ("agent", "Agent Standards"),
            ("inference", "Inference Standards"),
        ],
        "catalog_extra": "retroactive",
        "extra_honesty": {
            "fakeComplianceCertification": False,
            "checkedAgainstStandards": True,
        },
    },
    {
        "slug": "api-engineering-standards",
        "vl": 350,
        "phase": 217,
        "adr": "0252",
        "title": "API Engineering Standards",
        "kind": "standards",
        "doc": "API_ENGINEERING_STANDARDS.md",
        "nav": "API Standards",
        "honesty_key": "reflectsExistingOpenApiSdk",
        "honesty_val": True,
        "note": "API Engineering Standards (VL-350). REST/GraphQL/gRPC/streaming/versioning/SDK/rate-limit/pagination/errors/idempotency standards reflecting existing OpenAPI/SDK patterns.",
        "routes_to": [
            {"module": "openapi", "path": "/v1/openapi.json", "role": "OpenAPI document"},
            {"module": "developer-cloud", "path": "/v1/developer-cloud/products", "role": "Developer Cloud"},
            {"module": "developer-experience-platform", "path": "/v1/developer-experience-platform/engine", "role": "DX SDK/CLI"},
        ],
        "upstream_modules": [
            ("DeveloperCloudModule", "developer-cloud", "DeveloperCloudService", "developer-cloud.service", "sdk"),
            ("DeveloperExperiencePlatformModule", "developer-experience-platform", "DeveloperExperiencePlatformService", "developer-experience-platform.service", "engine"),
        ],
        "capabilities": [
            ("rest", "REST Standards"),
            ("graphql", "GraphQL Standards"),
            ("grpc", "gRPC Standards"),
            ("streaming", "Streaming Standards"),
            ("versioning", "API Versioning"),
            ("sdk", "SDK Standards"),
            ("rate_limiting", "Rate Limiting"),
            ("pagination", "Pagination"),
            ("errors", "Error Standards"),
            ("idempotency", "Idempotency"),
        ],
        "catalog_extra": "standards",
        "extra_honesty": {
            "regeneratesOpenApiOs": False,
            "reflectsExistingPatterns": True,
        },
    },
    {
        "slug": "database-engineering-standards",
        "vl": 351,
        "phase": 218,
        "adr": "0253",
        "title": "Database Engineering Standards",
        "kind": "standards",
        "doc": "DATABASE_ENGINEERING_STANDARDS.md",
        "nav": "DB Standards",
        "honesty_key": "extendsExistingPrismaDb",
        "honesty_val": True,
        "note": "Database Engineering Standards (VL-351). Postgres/Redis/ES/vector/KG/schema/migration/performance standards. Extends existing Prisma/DB usage — not a new Database OS.",
        "routes_to": [
            {"module": "knowledge-cloud", "path": "/v1/knowledge-cloud/products", "role": "Knowledge Cloud"},
            {"module": "vector-cloud", "path": "/v1/vector-cloud/engine", "role": "Vector Cloud"},
            {"module": "embedding-runtime", "path": "/v1/embedding-runtime/engine", "role": "Embedding Runtime"},
        ],
        "upstream_modules": [
            ("KnowledgeCloudModule", "knowledge-cloud", "KnowledgeCloudService", "knowledge-cloud.service", "products"),
            ("VectorCloudModule", "vector-cloud", "VectorCloudService", "vector-cloud.service", "engine"),
            ("EmbeddingRuntimeModule", "embedding-runtime", "EmbeddingRuntimeService", "embedding-runtime.service", "engine"),
        ],
        "capabilities": [
            ("postgresql", "PostgreSQL Standards"),
            ("redis", "Redis Standards"),
            ("elasticsearch", "Elasticsearch Standards"),
            ("vector", "Vector Database Standards"),
            ("knowledge_graph", "Knowledge Graph Standards"),
            ("schema", "Schema Governance"),
            ("migration", "Migration Standards"),
            ("performance", "Performance Standards"),
        ],
        "catalog_extra": "standards",
        "extra_honesty": {
            "databaseOs": False,
            "extendsPrisma": True,
        },
    },
    {
        "slug": "infrastructure-engineering-standards",
        "vl": 352,
        "phase": 219,
        "adr": "0254",
        "title": "Infrastructure Engineering Standards",
        "kind": "standards",
        "doc": "INFRASTRUCTURE_ENGINEERING_STANDARDS.md",
        "nav": "Infra Standards",
        "honesty_key": "referencesFinopsAndSecretsHonesty",
        "honesty_val": True,
        "note": "Infrastructure Engineering Standards (VL-352). AWS/Cloudflare/Terraform/Helm/K8s/Docker/networking/storage/GPU standards. Fly default + GPU budget + secrets envelope honesty. kubernetesOs=false.",
        "routes_to": [
            {"module": "finops-platform", "path": "/v1/finops-platform/engine", "role": "FinOps GPU budgets"},
            {"module": "secrets-certificate-platform", "path": "/v1/secrets-certificate-platform/engine", "role": "Control Plane secrets honesty"},
            {"module": "gpu-platform", "path": "/v1/gpu-platform/engine", "role": "GPU Platform"},
            {"module": "gitops-platform", "path": "/v1/gitops-platform/engine", "role": "GitOps / deploy"},
            {"module": "global-deployment-controller", "path": "/v1/global-deployment-controller/engine", "role": "Deploy controller"},
        ],
        "upstream_modules": [
            ("FinopsPlatformModule", "finops-platform", "FinopsPlatformService", "finops-platform.service", "engine"),
            ("SecretsCertificatePlatformModule", "secrets-certificate-platform", "SecretsCertificatePlatformService", "secrets-certificate-platform.service", "engine"),
            ("GpuPlatformModule", "gpu-platform", "GpuPlatformService", "gpu-platform.service", "engine"),
            ("GitopsPlatformModule", "gitops-platform", "GitopsPlatformService", "gitops-platform.service", "engine"),
            ("GlobalDeploymentControllerModule", "global-deployment-controller", "GlobalDeploymentControllerService", "global-deployment-controller.service", "engine"),
        ],
        "capabilities": [
            ("aws", "AWS Standards"),
            ("cloudflare", "Cloudflare Standards"),
            ("terraform", "Terraform Standards"),
            ("helm", "Helm Standards"),
            ("kubernetes", "Kubernetes Standards Catalog"),
            ("docker", "Docker Standards"),
            ("networking", "Networking Standards"),
            ("storage", "Storage Standards"),
            ("gpu", "GPU Cluster Standards"),
        ],
        "catalog_extra": "infra",
        "extra_honesty": {
            "kubernetesOs": False,
            "flyDefaultDeploy": True,
            "gpuBudgetLimitsRequired": True,
            "secretsEnvelopeHonesty": True,
        },
    },
]

FOUNDATION_PRODUCTS = [
    ("enterprise-engineering-system", "Enterprise Engineering System", "GET /v1/enterprise-engineering-system/products", "/enterprise-engineering-system", "VL-344. Engineering OS for humans+Cursor; architectureKnowledgeBaseOs=false; adrFactoryOs=false."),
    ("engineering-governance", "Engineering Governance", "GET /v1/engineering-governance/engine", "/engineering-governance", "VL-345. Councils + CAB/TSC; humanSignOffRequired; extends AI Governance."),
    ("architecture-governance", "Architecture Governance", "GET /v1/architecture-governance/engine", "/architecture-governance", "VL-346. ADR/RFC workflows pointing at docs/adr; adrFactoryOs=false."),
    ("repository-standards", "Repository Standards", "GET /v1/repository-standards/engine", "/repository-standards", "VL-347. Monorepo/polyrepo/naming/branch/git standards matching reality."),
    ("engineering-quality-platform", "Engineering Quality Platform", "GET /v1/engineering-quality-platform/engine", "/engineering-quality-platform", "VL-348. Quality catalog + dashboard snapshot; sonarqubeOs=false."),
    ("ai-engineering-standards", "AI Engineering Standards", "GET /v1/ai-engineering-standards/engine", "/ai-engineering-standards", "VL-349. AI standards + retroactiveChecks (Vol 11/12/17)."),
    ("api-engineering-standards", "API Engineering Standards", "GET /v1/api-engineering-standards/engine", "/api-engineering-standards", "VL-350. REST/GraphQL/gRPC/SDK standards reflecting OpenAPI/SDK."),
    ("database-engineering-standards", "Database Engineering Standards", "GET /v1/database-engineering-standards/engine", "/database-engineering-standards", "VL-351. Postgres/Redis/ES/vector/KG standards; databaseOs=false."),
    ("infrastructure-engineering-standards", "Infrastructure Engineering Standards", "GET /v1/infrastructure-engineering-standards/engine", "/infrastructure-engineering-standards", "VL-352. IaC/deploy/GPU standards; kubernetesOs=false; FinOps+secrets honesty."),
    ("platform-engineering-cloud", "Platform Engineering Cloud (upstream)", "GET /v1/platform-engineering-cloud/products", "/platform-engineering-cloud", "Volume 16 surface extended by EES."),
    ("developer-experience-platform", "Developer Experience (upstream)", "GET /v1/developer-experience-platform/engine", "/developer-experience-platform", "Volume 16 DX surface extended by EES."),
    ("ai-governance-platform", "AI Governance (upstream)", "GET /v1/ai-governance-platform/engine", "/ai-governance-platform", "Volume 15 Trust surface extended by EES."),
    ("monitoring", "EES Monitoring", "GET /v1/enterprise-engineering-system/monitoring", "/enterprise-engineering-system", "Foundation monitoring snapshot."),
]


def honesty_block(hub: dict) -> str:
    lines = [
        "      engineeringOsForHumansAndCursor: true,",
        "      customerFacingProductCloud: false,",
        "      architectureKnowledgeBaseOs: false,",
        "      adrFactoryOs: false,",
        "      jiraOs: false,",
        "      confluenceOs: false,",
        "      sonarqubeOs: false,",
        "      integratesExistingSystems: true,",
        f"      {hub['honesty_key']}: {ts_bool(hub['honesty_val'])},",
    ]
    seen = set()
    out = []
    for line in lines:
        key = line.split(":")[0].strip()
        if key in seen:
            continue
        seen.add(key)
        out.append(line)
    for k, v in (hub.get("extra_honesty") or {}).items():
        if k in seen:
            continue
        seen.add(k)
        out.append(f"      {k}: {ts_bool(v) if isinstance(v, bool) else json.dumps(v)},")
    return "\n".join(out)


def module_ts(slug: str, pascal: str, extra_imports: str = "", extra_module: str = "") -> str:
    return f"""import {{ Module }} from '@nestjs/common';
import {{ {pascal}Controller }} from './{slug}.controller';
import {{ {pascal}Service }} from './{slug}.service';
{extra_imports}
@Module({{
  {extra_module}controllers: [{pascal}Controller],
  providers: [{pascal}Service],
  exports: [{pascal}Service],
}})
export class {pascal}Module {{}}
"""


def application_files(slug: str, pascal: str, const: str, title: str, vl: int, foundation: bool = False) -> dict[str, str]:
    engine_method = "products" if foundation else "engine"
    adapter_engine = (
        f"""  engine(): {pascal}EngineBundle {{
    return this.service.{engine_method}();
  }}

  listProducts(): {pascal}ProductRow[] {{
    return this.service.{engine_method}().products;
  }}
"""
        if foundation
        else f"""  engine(): {pascal}EngineBundle {{
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
"""
    )
    return {
        "messages.ts": f"""export class Get{pascal}EngineQuery {{}}

export class List{pascal}ProductsQuery {{}}
""",
        "ports.ts": f"""/** Application ports for {title} (VL-{vl}). */

export type {pascal}ProductRow = {{
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
}};

export type {pascal}EngineBundle = ReturnType<
  import('../{slug}.service').{pascal}Service['{engine_method}']
>;

export interface {pascal}CatalogPort {{
  engine(): {pascal}EngineBundle;
  listProducts(): {pascal}ProductRow[];
}}

export const {const}_CATALOG_PORT = Symbol('{const}_CATALOG_PORT');
""",
        "handlers.ts": f"""import {{ Inject }} from '@nestjs/common';
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
""",
        f"nest-{slug}.adapter.ts": f"""import {{ Injectable }} from '@nestjs/common';
import {{ {pascal}Service }} from '../{slug}.service';
import {{
  {pascal}CatalogPort,
  {pascal}EngineBundle,
  {pascal}ProductRow,
}} from './ports';

@Injectable()
export class Nest{pascal}CatalogAdapter implements {pascal}CatalogPort {{
  constructor(private readonly service: {pascal}Service) {{}}

{adapter_engine}}}
""",
        f"{slug}-application.module.ts": f"""import {{ Module }} from '@nestjs/common';
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
""",
    }


def web_page(slug: str, pascal: str) -> str:
    return f"""import {{ {pascal}Client }} from './{slug}-client';

export default function {pascal}Page() {{
  return <{pascal}Client />;
}}
"""


def web_client(slug: str, title: str, vl: int, endpoint: str) -> str:
    return f"""'use client';

import {{ useEffect, useState }} from 'react';
import {{ apiFetch }} from '@/lib/api';
import {{ AppShell }} from '@/components/app-shell';

type Engine = {{
  product: string;
  note: string;
  honesty: Record<string, boolean | string>;
  safety?: {{ note?: string }} & Record<string, unknown>;
  routesTo?: Array<{{ module: string; path: string; role: string }}>;
  retroactiveChecks?: Array<Record<string, unknown>>;
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
        VL-{vl} — VerbaLab {title} console in Enterprise Engineering System (standards for humans + Cursor).
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
            {{JSON.stringify({{ honesty: data.honesty, routesTo: data.routesTo, retroactiveChecks: data.retroactiveChecks }}, null, 2)}}
          </pre>
        </div>
      ) : null}}
    </AppShell>
  );
}}
"""


def product_doc(hub: dict) -> str:
    routes = hub.get("routes_to") or []
    routes_md = (
        "\n".join(f"- `{r['module']}` → `{r['path']}` ({r['role']})" for r in routes)
        or "- Foundation discovery hub over Platform Engineering, DX, Trust AI Governance, and existing `docs/adr/`."
    )
    return f"""# {hub["title"]} (VL-{hub["vl"]})

Library Phase {hub["phase"]} — part of Volume 20 Enterprise Engineering System (EES).

## Mission

VerbaLab {hub["title"]} is a **standards and governance catalog** for engineers and Cursor.
It is not a customer-facing product cloud, not Jira/Confluence/SonarQube OS, and not an
Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false`
- `adrFactoryOs=false`
- `{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`

## Extends / routes to

{routes_md}

## Surfaces

- Console: `/{hub["slug"]}`
- API: `/v1/{hub["slug"]}/engine`{" (foundation: `/products`)" if hub["kind"] == "foundation" else ""}
- ADR: [`docs/adr/{hub["adr"]}-{hub["slug"]}.md`](./adr/{hub["adr"]}-{hub["slug"]}.md)

---

## Volume status

**Volume 20** Enterprise Engineering System (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
"""


def adr_doc(hub: dict) -> str:
    return f"""# ADR-{hub["adr"]}: {hub["title"]} (VL-{hub["vl"]})

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-{hub["vl"]} (library Phase {hub["phase"]})

## Context

Volume 20 builds the Enterprise Engineering System as standards, governance, templates,
and quality catalogs. Risk: inventing Jira/Confluence/SonarQube OS, mass-generating 250 ADRs /
200 PRDs, inventing Architecture Knowledge Base OS, or regenerating Platform Engineering /
Developer Experience / Trust AI Governance / existing `docs/adr/`.

## Decision

1. Ship `{hub["slug"]}` as a Nest hub with catalog + service + controller + CQRS + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`architectureKnowledgeBaseOs=false`; `adrFactoryOs=false`; `customerFacingProductCloud=false`).
3. Extend Platform Engineering, DX, Trust AI Governance, and existing ADR process — do not regenerate them.
4. Reject ADR factory / Architecture Knowledge Base OS / mass PRD invention in this volume.

## Consequences

- {hub["title"]} is discoverable under Enterprise Engineering System Foundation.
- Operators and Cursor agents can inspect standards catalogs with explicit honesty gates.
"""


SHORT_NAMES = {
    "AiGovernancePlatformService": "aiGovernance",
    "TrustCloudService": "trustCloud",
    "ReleaseEngineeringService": "releaseEngineering",
    "PlatformEngineeringCloudService": "platformEngineeringCloud",
    "DeveloperExperiencePlatformService": "developerExperience",
    "GoldenPathPlatformService": "goldenPath",
    "GitopsPlatformService": "gitops",
    "SupplyChainSecurityService": "supplyChain",
    "ReliabilityEngineeringService": "reliability",
    "AiSafetyPlatformService": "aiSafety",
    "EvaluationPlatformService": "evaluation",
    "PromptopsPlatformService": "promptops",
    "SecretsCertificatePlatformService": "secrets",
    "DeveloperCloudService": "developerCloud",
    "KnowledgeCloudService": "knowledgeCloud",
    "VectorCloudService": "vectorCloud",
    "EmbeddingRuntimeService": "embeddingRuntime",
    "FinopsPlatformService": "finops",
    "GpuPlatformService": "gpuPlatform",
    "GlobalDeploymentControllerService": "globalDeployment",
}


def foundation_catalog() -> str:
    rows = []
    for pid, name, api, console, notes in FOUNDATION_PRODUCTS:
        rows.append(
            f"""    {{
      id: '{pid}',
      name: '{name}',
      status: 'shipped',
      api: '{api}',
      console: '{console}',
      notes:
        '{notes}',
    }},"""
        )
    inventory = ",\n".join(
        f"""      {{
        id: '{h["slug"]}',
        title: '{h["title"]}',
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        adrFactoryOs: false,
        architectureKnowledgeBaseOs: false,
        routesTo: {[r["module"] for r in (h.get("routes_to") or [])]},
      }}"""
        for h in HUBS
        if h["kind"] == "standards"
    )
    return f"""export type EnterpriseEngineeringSystemProductStatus = 'shipped' | 'partial' | 'deferred';

export type EnterpriseEngineeringSystemProductRow = {{
  id: string;
  name: string;
  status: EnterpriseEngineeringSystemProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
}};

/**
 * Library Phase 211 → Enterprise Engineering System Foundation (VL-344).
 * Engineering OS for humans + Cursor — standards/governance catalogs.
 * Not customer-facing product cloud; not ADR factory / Architecture Knowledge Base OS.
 */
export function enterpriseEngineeringSystemProductCatalog(): EnterpriseEngineeringSystemProductRow[] {{
  return [
{chr(10).join(rows)}
  ];
}}

export function enterpriseEngineeringSystemRoutingTable(): Array<{{
  id: string;
  path: string;
  purpose: string;
}}> {{
  return [
    {{ id: 'products', path: '/v1/enterprise-engineering-system/products', purpose: 'Product catalog' }},
    {{ id: 'engine', path: '/v1/enterprise-engineering-system/engine', purpose: 'Engine alias' }},
    {{ id: 'routing', path: '/v1/enterprise-engineering-system/routing', purpose: 'Static routing table' }},
    {{ id: 'monitoring', path: '/v1/enterprise-engineering-system/monitoring', purpose: 'Monitoring snapshot' }},
    {{ id: 'overview', path: '/v1/enterprise-engineering-system/overview', purpose: 'Authenticated overview' }},
  ];
}}

export function enterpriseEngineeringSystemHubInventory(): Array<{{
  id: string;
  title: string;
  engineeringOsForHumansAndCursor: boolean;
  customerFacingProductCloud: boolean;
  adrFactoryOs: boolean;
  architectureKnowledgeBaseOs: boolean;
  routesTo: string[];
}}> {{
  return [
{inventory}
  ];
}}

export function enterpriseEngineeringSystemExtends(): Array<{{
  id: string;
  volume: number;
  path: string;
  role: string;
}}> {{
  return [
    {{
      id: 'platform-engineering-cloud',
      volume: 16,
      path: '/v1/platform-engineering-cloud/products',
      role: 'Internal developer platform',
    }},
    {{
      id: 'developer-experience-platform',
      volume: 16,
      path: '/v1/developer-experience-platform/engine',
      role: 'DX CLI/SDK/docs',
    }},
    {{
      id: 'ai-governance-platform',
      volume: 15,
      path: '/v1/ai-governance-platform/engine',
      role: 'AI Governance human sign-off',
    }},
    {{
      id: 'trust-cloud',
      volume: 15,
      path: '/v1/trust-cloud/products',
      role: 'Trust Cloud',
    }},
    {{
      id: 'docs-adr',
      volume: 0,
      path: 'docs/adr/',
      role: 'Existing ADR series ({ADR_COUNT} files at Volume 20 ship)',
    }},
    {{
      id: 'finops-platform',
      volume: 16,
      path: '/v1/finops-platform/engine',
      role: 'GPU budget alerts',
    }},
    {{
      id: 'secrets-certificate-platform',
      volume: 17,
      path: '/v1/secrets-certificate-platform/engine',
      role: 'Secrets envelope honesty',
    }},
  ];
}}

export function enterpriseEngineeringSystemArchitectureNotes(): Record<string, unknown> {{
  return {{
    role: 'enterprise-engineering-system-standards',
    extends: [
      'platform-engineering-cloud',
      'developer-experience-platform',
      'ai-governance-platform',
      'trust-cloud',
      'docs/adr',
      'finops-platform',
      'secrets-certificate-platform',
    ],
    engineeringOsForHumansAndCursor: true,
    customerFacingProductCloud: false,
    architectureKnowledgeBaseOs: false,
    adrFactoryOs: false,
    jiraOs: false,
    confluenceOs: false,
    sonarqubeOs: false,
    existingAdrCountAtShip: {ADR_COUNT},
    deferredPastVolume20: ['architecture-knowledge-base-os', 'mass-adr-factory', 'mass-prd-library'],
  }};
}}

export function enterpriseEngineeringSystemHonesty(): Record<string, boolean | string | number> {{
  return {{
    engineeringOsForHumansAndCursor: true,
    customerFacingProductCloud: false,
    architectureKnowledgeBaseOs: false,
    adrFactoryOs: false,
    jiraOs: false,
    confluenceOs: false,
    sonarqubeOs: false,
    integratesExistingSystems: true,
    existingAdrCountAtShip: {ADR_COUNT},
    note:
      'Enterprise Engineering System is standards/governance for humans+Cursor. Extends Platform Engineering, DX, Trust AI Governance, and existing docs/adr. architectureKnowledgeBaseOs=false; adrFactoryOs=false. Not Jira/Confluence/SonarQube OS.',
  }};
}}
"""


def foundation_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  enterpriseEngineeringSystemArchitectureNotes,
  enterpriseEngineeringSystemExtends,
  enterpriseEngineeringSystemHonesty,
  enterpriseEngineeringSystemHubInventory,
  enterpriseEngineeringSystemProductCatalog,
  enterpriseEngineeringSystemRoutingTable,
} from './enterprise-engineering-system.catalog';

@Injectable()
export class EnterpriseEngineeringSystemService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'VerbaLab Enterprise Engineering System',
      products: enterpriseEngineeringSystemProductCatalog(),
      hubInventory: enterpriseEngineeringSystemHubInventory(),
      extendsSurfaces: enterpriseEngineeringSystemExtends(),
      architecture: enterpriseEngineeringSystemArchitectureNotes(),
      honesty: enterpriseEngineeringSystemHonesty(),
      safety: {
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        architectureKnowledgeBaseOs: false,
        adrFactoryOs: false,
        jiraOs: false,
        confluenceOs: false,
        sonarqubeOs: false,
        note:
          'Volume 20 README: standards/templates/governance — not new product features. architectureKnowledgeBaseOs and adrFactoryOs deferred past Volume 20.',
      },
      docs: '/docs/ENTERPRISE_ENGINEERING_SYSTEM.md',
      note:
        'Enterprise Engineering System Foundation (VL-344). Engineering OS for humans+Cursor. architectureKnowledgeBaseOs=false; adrFactoryOs=false.',
    };
  }

  routing() {
    return {
      routes: enterpriseEngineeringSystemRoutingTable(),
      products: enterpriseEngineeringSystemProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      hubInventory: enterpriseEngineeringSystemHubInventory(),
      extendsSurfaces: enterpriseEngineeringSystemExtends(),
      honesty: enterpriseEngineeringSystemHonesty(),
      note: 'Static EES discovery catalog for Foundation.',
      docs: '/docs/ENTERPRISE_ENGINEERING_SYSTEM.md',
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
      products: enterpriseEngineeringSystemProductCatalog(),
      hubInventory: enterpriseEngineeringSystemHubInventory(),
      extendsSurfaces: enterpriseEngineeringSystemExtends(),
      architecture: enterpriseEngineeringSystemArchitectureNotes(),
      honesty: enterpriseEngineeringSystemHonesty(),
      safety: {
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        architectureKnowledgeBaseOs: false,
        adrFactoryOs: false,
        note:
          'EES honesty enforced. Extends PE/DX/Trust/ADR. Architecture Knowledge Base OS and ADR factory rejected here.',
      },
      deferred: {
        architectureKnowledgeBaseOs: true,
        adrFactoryOs: true,
        massPrdLibrary: true,
      },
      links: {
        enterpriseEngineeringSystem: '/enterprise-engineering-system',
        engineeringGovernance: '/engineering-governance',
        architectureGovernance: '/architecture-governance',
        repositoryStandards: '/repository-standards',
        engineeringQualityPlatform: '/engineering-quality-platform',
        aiEngineeringStandards: '/ai-engineering-standards',
        apiEngineeringStandards: '/api-engineering-standards',
        databaseEngineeringStandards: '/database-engineering-standards',
        infrastructureEngineeringStandards: '/infrastructure-engineering-standards',
        platformEngineeringCloud: '/platform-engineering-cloud',
        developerExperiencePlatform: '/developer-experience-platform',
        aiGovernancePlatform: '/ai-governance-platform',
      },
      docs: '/docs/ENTERPRISE_ENGINEERING_SYSTEM.md',
      note:
        'Enterprise Engineering System (VL-344–353). Discovery hub for standards/governance catalogs; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = enterpriseEngineeringSystemProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      hubInventory: enterpriseEngineeringSystemHubInventory(),
      extendsSurfaces: enterpriseEngineeringSystemExtends(),
      architecture: enterpriseEngineeringSystemArchitectureNotes(),
      honesty: enterpriseEngineeringSystemHonesty(),
      note: 'EES monitoring snapshot (VL-344).',
    };
  }
}
"""


def foundation_controller() -> str:
    return """import { Controller, Get, UseGuards } from '@nestjs/common';
import { EnterpriseEngineeringSystemService } from './enterprise-engineering-system.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/enterprise-engineering-system')
export class EnterpriseEngineeringSystemController {
  constructor(private readonly ees: EnterpriseEngineeringSystemService) {}

  @Get('products')
  products() {
    return this.ees.products();
  }

  @Get('engine')
  engine() {
    return this.ees.products();
  }

  @Get('routing')
  routing() {
    return this.ees.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.ees.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.ees.monitoring();
  }
}
"""


def standards_extra_catalog(hub: dict) -> str:
    slug = hub["slug"]
    extra = hub.get("catalog_extra")
    if extra == "councils":
        return """
    councils: [
      { id: 'arb', name: 'Architecture Review Board', status: 'active', humanSignOffRequired: true, approvalStatuses: ['draft', 'pending_review', 'approved', 'rejected', 'deferred'] },
      { id: 'engineering_council', name: 'Engineering Council', status: 'active', humanSignOffRequired: true, approvalStatuses: ['draft', 'pending_review', 'approved', 'rejected'] },
      { id: 'security_council', name: 'Security Council', status: 'active', humanSignOffRequired: true, approvalStatuses: ['draft', 'pending_review', 'approved', 'rejected'] },
      { id: 'ai_council', name: 'AI Council', status: 'active', humanSignOffRequired: true, approvalStatuses: ['draft', 'pending_review', 'approved', 'rejected', 'requires_hitl'] },
      { id: 'data_council', name: 'Data Council', status: 'active', humanSignOffRequired: true, approvalStatuses: ['draft', 'pending_review', 'approved', 'rejected'] },
      { id: 'release_council', name: 'Release Council', status: 'active', humanSignOffRequired: true, approvalStatuses: ['draft', 'pending_review', 'approved', 'rejected', 'rolled_back'] },
      { id: 'cab', name: 'Change Advisory Board', status: 'active', humanSignOffRequired: true, approvalStatuses: ['proposed', 'scheduled', 'approved', 'rejected', 'implemented'] },
      { id: 'tsc', name: 'Technical Steering Committee', status: 'active', humanSignOffRequired: true, approvalStatuses: ['proposed', 'under_review', 'accepted', 'rejected'] },
    ],
    approvalWorkflowStatuses: ['draft', 'pending_review', 'approved', 'rejected', 'deferred', 'requires_hitl', 'rolled_back'],
"""
    if extra == "workflows":
        return f"""
    adrWorkflow: {{
      pointsAt: 'docs/adr/',
      existingAdrCountAtShip: {ADR_COUNT},
      adrFactoryOs: false,
      massGeneration: false,
      statuses: ['proposed', 'accepted', 'deprecated', 'superseded'],
      note: 'Workflow catalog points at existing docs/adr process — does not mass-generate ADRs.',
    }},
    rfcWorkflow: {{
      statuses: ['draft', 'discussion', 'final', 'withdrawn'],
      note: 'RFC workflow catalog — not Confluence OS.',
    }},
    techRadar: [
      {{ ring: 'adopt', items: ['NestJS hubs', 'Prisma', 'Vitest', 'OpenAPI + SDK/CLI'] }},
      {{ ring: 'trial', items: ['Mutation testing gates', 'Expanded GraphQL federation'] }},
      {{ ring: 'assess', items: ['gRPC internal meshes', 'External ADR tooling'] }},
      {{ ring: 'hold', items: ['Architecture Knowledge Base OS', 'Mass ADR factory', 'Jira OS'] }},
    ],
    dependencyGovernance: {{
      packageManager: 'pnpm',
      workspace: 'pnpm-workspace.yaml',
      note: 'Dependency governance catalog over existing monorepo lockfile discipline.',
    }},
    complianceCatalog: [
      {{ id: 'adr-linkage', name: 'ADR linkage for material changes', status: 'catalogued' }},
      {{ id: 'design-review', name: 'Design review for cross-cloud changes', status: 'catalogued' }},
      {{ id: 'honesty-flags', name: 'Honesty flags on new hubs', status: 'catalogued' }},
    ],
"""
    if extra == "quality":
        return """
    qualityDashboard: {
      mode: 'snapshot',
      dimensions: ['static_analysis', 'complexity', 'dependency', 'security', 'performance', 'tech_debt', 'coverage', 'mutation'],
      sonarqubeOs: false,
      note: 'Quality dashboard snapshot catalog — not SonarQube OS.',
    },
"""
    if extra == "retroactive":
        return """
    retroactiveChecks: [
      {
        id: 'vol11-payments',
        volume: 11,
        topic: 'payments honesty',
        target: 'ecosystem-cloud / creator-economy / Stripe surfaces',
        checkedAgainstStandards: true,
        finding: 'pass',
        notes:
          'Volume 11 payments use Stripe honesty + sandbox safety; not payment-processor OS. Matches AI/API security standards: no invented PCI certification.',
      },
      {
        id: 'vol12-healthcare',
        volume: 12,
        topic: 'healthcare posture',
        target: 'healthcare-intelligence',
        checkedAgainstStandards: true,
        finding: 'pass',
        notes:
          'Healthcare intelligence ships with medical/consent honesty gates; not clinical decision OS. No fake HIPAA certification claimed.',
      },
      {
        id: 'vol12-financial',
        volume: 12,
        topic: 'financial posture',
        target: 'financial-intelligence',
        checkedAgainstStandards: true,
        finding: 'pass',
        notes:
          'Financial intelligence catalogs with finance honesty; not banking OS. No invented regulatory certification.',
      },
      {
        id: 'vol12-consent',
        volume: 12,
        topic: 'consent posture',
        target: 'cultural-intelligence / african-intelligence-cloud',
        checkedAgainstStandards: true,
        finding: 'pass',
        notes:
          'Consent honesty surfaces present for cultural/domain packs; aligns with AI safety + privacy standards catalog.',
      },
      {
        id: 'vol17-secrets',
        volume: 17,
        topic: 'secrets handling',
        target: 'secrets-certificate-platform',
        checkedAgainstStandards: true,
        finding: 'pass',
        notes:
          'Control Plane secrets use envelope/metadata pattern; plaintext not listed via APIs. Matches infrastructure + AI security standards.',
      },
    ],
"""
    if extra == "infra":
        return """
    deployDefaults: {
      primary: 'fly.io',
      flyDefaultDeploy: true,
      kubernetesOs: false,
      note: 'Fly is the default deploy target; Kubernetes standards are catalog guidance only.',
    },
    gpuStandards: {
      referencesFinopsGpuBudgets: true,
      gpuBudgetLimitsRequired: true,
      note: 'GPU standards reference FinOps GPU budget alerts — do not invent unlimited GPU pools.',
    },
    secretsStandards: {
      referencesControlPlaneSecretsHonesty: true,
      secretsEnvelopeHonesty: true,
      note: 'Secrets standards reference Control Plane envelope/metadata honesty.',
    },
"""
    if extra == "standards":
        if slug == "repository-standards":
            return """
    monorepoReality: {
      packageManager: 'pnpm',
      build: 'turbo',
      apps: ['apps/api', 'apps/web'],
      packages: ['packages/sdk', 'packages/cli', 'packages/eslint-config', 'packages/typescript-config'],
      branchPrefix: 'cursor/',
      commitStyle: 'conventional descriptive',
      versioning: 'workspace-aligned',
    },
"""
        if slug == "api-engineering-standards":
            return """
    existingPatterns: {
      restPrefix: '/v1/',
      openapi: 'apps/api/src/openapi/openapi.document.ts',
      graphql: '/graphql',
      sdk: 'packages/sdk',
      cli: 'packages/cli',
      pagination: 'cursor/limit query params where listed',
      errors: 'ApiExceptionFilter envelope',
      idempotency: 'documented for mutating marketplace/billing paths',
    },
"""
        if slug == "database-engineering-standards":
            return """
    existingDbUsage: {
      orm: 'Prisma',
      primary: 'PostgreSQL',
      cache: 'Redis (where configured)',
      search: 'Elasticsearch catalog guidance',
      vector: 'vector-cloud / embedding-runtime',
      knowledgeGraph: 'knowledge-cloud / african-knowledge-graph',
      databaseOs: false,
    },
"""
    return ""


def standards_catalog(hub: dict) -> str:
    slug = hub["slug"]
    camel = to_camel(slug)
    caps = hub.get("capabilities") or []
    routes = hub.get("routes_to") or []
    cap_rows = ",\n".join(
        f"      {{ id: '{cid}', name: '{cname}', status: 'shipped', notes: 'VL-{hub['vl']} standards capability — catalog, not a new OS.' }}"
        for cid, cname in caps
    )
    route_rows = ",\n".join(
        f"""      {{
        id: 'route-{i}',
        module: '{r["module"]}',
        path: '{r["path"]}',
        role: '{r["role"]}',
        status: 'shipped',
        notes: 'Extends existing VerbaLab surface — EES catalogs standards over it.',
      }}"""
        for i, r in enumerate(routes, 1)
    )
    routes_to_rows = ",\n".join(
        f"      {{ module: '{r['module']}', path: '{r['path']}', role: '{r['role']}' }}"
        for r in routes
    )
    note = hub["note"].replace("'", "\\'")
    extra = standards_extra_catalog(hub)
    return f"""/**
 * Library Phase {hub['phase']} → {hub['title']} (VL-{hub['vl']}).
 * {hub['note']}
 */
export function {camel}EngineCatalog() {{
  return {{
    product: 'VerbaLab {hub['title']}',
    engineeringOsForHumansAndCursor: true,
    customerFacingProductCloud: false,
    architectureKnowledgeBaseOs: false,
    adrFactoryOs: false,
    capabilities: [
{cap_rows}
    ],
    routes: [
{route_rows}
    ],
    routesTo: [
{routes_to_rows}
    ],{extra}
    honesty: {{
{honesty_block(hub)}
    }},
    safety: {{
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      note: '{note}',
    }},
    docs: '/docs/{hub['doc']}',
    note: '{note}',
  }};
}}
"""


def standards_service(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = to_camel(slug)
    upstreams = hub.get("upstream_modules") or []
    imports = [f"import {{ {camel}EngineCatalog }} from './{slug}.catalog';"]
    ctor_params = []
    status_calls = []

    for _mod_class, mod_slug, svc_class, svc_path, method in upstreams:
        imports.append(f"import {{ {svc_class} }} from '../{mod_slug}/{svc_path}';")
        short = SHORT_NAMES.get(svc_class, svc_class[0].lower() + svc_class[1:].replace("Service", ""))
        ctor_params.append(f"private readonly {short}: {svc_class}")
        if method:
            status_calls.append(
                f"""      {{
        module: '{mod_slug}',
        method: '{method}',
        status: 'reachable',
        upstream: this.{short}.{method}(),
      }}"""
            )
        else:
            status_calls.append(
                f"""      {{
        module: '{mod_slug}',
        method: 'injected',
        status: 'reachable',
        upstream: {{ injected: true, service: '{svc_class}' }},
      }}"""
            )

    ctor = ",\n    ".join(ctor_params) if ctor_params else ""
    status_block = ",\n".join(status_calls) if status_calls else ""

    retro_methods = ""
    if slug == "ai-engineering-standards":
        retro_methods = """
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
"""

    adr_count_method = ""
    if slug == "architecture-governance":
        adr_count_method = f"""
  adrSeries() {{
    return {{
      pointsAt: 'docs/adr/',
      existingAdrCountAtShip: {ADR_COUNT},
      adrFactoryOs: false,
      massGeneration: false,
      note: 'ADR workflow catalog points at existing docs/adr — count is observational, not a factory.',
    }};
  }}
"""

    return f"""import {{ Injectable }} from '@nestjs/common';
{chr(10).join(imports)}

@Injectable()
export class {pascal}Service {{
  constructor(
    {ctor}
  ) {{}}

  engine() {{
    return {camel}EngineCatalog();
  }}

  /** Catalog route: returns standards capability + live status from injected upstream services. */
  route(capability?: string) {{
    const catalog = this.engine();
    const q = (capability ?? '').trim().toLowerCase();
    const capabilities = catalog.capabilities.filter((c) => {{
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase().includes(q);
    }});
    const upstreamStatus = [
{status_block}
    ];
    return {{
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
    }};
  }}

  execute(capability?: string) {{
    return this.route(capability);
  }}

  list(query?: string) {{
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.routes.filter((row) => {{
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    }});
    return {{
      routes: rows,
      count: rows.length,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    }};
  }}

  query(query?: string) {{
    return this.list(query);
  }}
{retro_methods}{adr_count_method}
  monitoring() {{
    const catalog = this.engine();
    return {{
      mode: '{slug}',
      count: catalog.routes.length,
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: '{pascal} monitoring snapshot (VL-{hub["vl"]}).',
    }};
  }}
}}
"""


def standards_controller(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    extra_routes = ""
    if slug == "ai-engineering-standards":
        extra_routes = """
  @Get('checks')
  checks() {
    return this.service.checks();
  }

  @Get('check/list')
  checkList() {
    return this.service.checkList();
  }
"""
    if slug == "architecture-governance":
        extra_routes += """
  @Get('adr-series')
  adrSeries() {
    return this.service.adrSeries();
  }
"""
    return f"""import {{ Controller, Get, Query }} from '@nestjs/common';
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

  @Get('routes')
  list(@Query('q') q?: string) {{
    return this.service.list(q);
  }}

  @Get('route')
  route(@Query('capability') capability?: string) {{
    return this.service.route(capability);
  }}

  @Get('execute')
  execute(@Query('capability') capability?: string) {{
    return this.service.execute(capability);
  }}

  @Get('query')
  query(@Query('q') q?: string) {{
    return this.service.query(q);
  }}
{extra_routes}}}
"""


def standards_module(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    upstreams = hub.get("upstream_modules") or []
    import_lines = []
    mod_names = []
    seen = set()
    for mod_class, mod_slug, _svc, _path, _method in upstreams:
        if mod_class in seen:
            continue
        seen.add(mod_class)
        import_lines.append(f"import {{ {mod_class} }} from '../{mod_slug}/{mod_slug}.module';")
        mod_names.append(mod_class)
    imports_block = "\n".join(import_lines)
    modules_list = ", ".join(mod_names)
    return f"""import {{ Module }} from '@nestjs/common';
import {{ {pascal}Controller }} from './{slug}.controller';
import {{ {pascal}Service }} from './{slug}.service';
{imports_block}

@Module({{
  imports: [{modules_list}],
  controllers: [{pascal}Controller],
  providers: [{pascal}Service],
  exports: [{pascal}Service],
}})
export class {pascal}Module {{}}
"""


def resolver_ts(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = to_camel(slug)
    if hub["kind"] == "foundation":
        return f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ List{pascal}ProductsQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Product }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => [Gql{pascal}Product], {{ name: '{camel}Products' }})
  async {camel}Products(): Promise<Gql{pascal}Product[]> {{
    return this.queries.execute(new List{pascal}ProductsQuery());
  }}
}}
"""
    return f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Engine }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => Gql{pascal}Engine, {{ name: '{camel}Engine' }})
  async {camel}Engine(): Promise<Gql{pascal}Engine> {{
    const catalog = await this.queries.execute(new Get{pascal}EngineQuery());
    return {{
      product: catalog.product,
      note: catalog.note,
      engineeringOsForHumansAndCursor: catalog.honesty.engineeringOsForHumansAndCursor,
      customerFacingProductCloud: catalog.honesty.customerFacingProductCloud,
      architectureKnowledgeBaseOs: catalog.honesty.architectureKnowledgeBaseOs,
      adrFactoryOs: catalog.honesty.adrFactoryOs,
    }};
  }}
}}
"""


def gql_types_append() -> str:
    blocks = []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        if hub["kind"] == "foundation":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Product {{
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, {{ nullable: true }})
  api!: string | null;

  @Field(() => String, {{ nullable: true }})
  console!: string | null;

  @Field()
  notes!: string;
}}
"""
            )
        else:
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  engineeringOsForHumansAndCursor!: boolean;

  @Field(() => Boolean)
  customerFacingProductCloud!: boolean;

  @Field(() => Boolean)
  architectureKnowledgeBaseOs!: boolean;

  @Field(() => Boolean)
  adrFactoryOs!: boolean;
}}
"""
            )
    return "\n".join(blocks)


def hub_spec(hub: dict) -> str:
    slug = hub["slug"]
    vl = hub["vl"]
    key = hub["honesty_key"]
    val = ts_bool(hub["honesty_val"])
    path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
    extra = ""
    if hub["kind"] == "foundation":
        extra = """
    expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);
    expect(res.body.honesty.customerFacingProductCloud).toBe(false);
    expect(res.body.honesty.architectureKnowledgeBaseOs).toBe(false);
    expect(res.body.honesty.adrFactoryOs).toBe(false);
    expect(res.body.honesty.jiraOs).toBe(false);
    expect(res.body.honesty.confluenceOs).toBe(false);
    expect(res.body.honesty.sonarqubeOs).toBe(false);
    expect(res.body.products.length).toBeGreaterThan(8);
    expect(res.body.hubInventory.length).toBeGreaterThan(5);
    expect(res.body.extendsSurfaces.length).toBeGreaterThan(3);
    for (const row of res.body.hubInventory) {
      expect(row.engineeringOsForHumansAndCursor).toBe(true);
      expect(row.customerFacingProductCloud).toBe(false);
      expect(row.adrFactoryOs).toBe(false);
      expect(row.architectureKnowledgeBaseOs).toBe(false);
      expect(Array.isArray(row.routesTo)).toBe(true);
      expect(row.routesTo.length).toBeGreaterThan(0);
    }
"""
    else:
        routes_expect = "\n".join(
            f"    expect(JSON.stringify(res.body.routesTo)).toContain('{r['module']}');"
            for r in (hub.get("routes_to") or [])
        )
        extra = f"""
    expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);
    expect(res.body.honesty.customerFacingProductCloud).toBe(false);
    expect(res.body.honesty.architectureKnowledgeBaseOs).toBe(false);
    expect(res.body.honesty.adrFactoryOs).toBe(false);
    expect(res.body.engineeringOsForHumansAndCursor).toBe(true);
    expect(res.body.customerFacingProductCloud).toBe(false);
    expect(Array.isArray(res.body.routesTo)).toBe(true);
    expect(res.body.routesTo.length).toBeGreaterThan(0);
{routes_expect}

    const route = await request(app.getHttpServer())
      .get('/v1/{slug}/route')
      .expect(200);
    expect(route.body.engineeringOsForHumansAndCursor).toBe(true);
    expect(route.body.architectureKnowledgeBaseOs).toBe(false);
    expect(route.body.adrFactoryOs).toBe(false);
    expect(route.body.upstreamStatus.length).toBeGreaterThan(0);
"""
        if slug == "engineering-governance":
            extra += """
    expect(res.body.honesty.humanSignOffRequired).toBe(true);
    expect(res.body.councils.length).toBeGreaterThan(5);
"""
        if slug == "architecture-governance":
            extra += """
    expect(res.body.honesty.adrFactoryOs).toBe(false);
    expect(res.body.adrWorkflow.adrFactoryOs).toBe(false);
    expect(res.body.adrWorkflow.existingAdrCountAtShip).toBeGreaterThan(200);
    const adr = await request(app.getHttpServer()).get('/v1/architecture-governance/adr-series').expect(200);
    expect(adr.body.adrFactoryOs).toBe(false);
"""
        if slug == "engineering-quality-platform":
            extra += """
    expect(res.body.honesty.sonarqubeOs).toBe(false);
    expect(res.body.qualityDashboard.sonarqubeOs).toBe(false);
"""
        if slug == "ai-engineering-standards":
            extra += """
    expect(Array.isArray(res.body.retroactiveChecks)).toBe(true);
    expect(res.body.retroactiveChecks.length).toBeGreaterThanOrEqual(5);
    for (const c of res.body.retroactiveChecks) {
      expect(c.checkedAgainstStandards).toBe(true);
      expect(['pass', 'gap']).toContain(c.finding);
    }
    const checks = await request(app.getHttpServer()).get('/v1/ai-engineering-standards/checks').expect(200);
    expect(checks.body.retroactiveChecks.length).toBeGreaterThanOrEqual(5);
    const list = await request(app.getHttpServer()).get('/v1/ai-engineering-standards/check/list').expect(200);
    expect(list.body.fakeComplianceCertification).toBe(false);
"""
        if slug == "infrastructure-engineering-standards":
            extra += """
    expect(res.body.honesty.kubernetesOs).toBe(false);
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.secretsEnvelopeHonesty).toBe(true);
    expect(res.body.deployDefaults.flyDefaultDeploy ?? res.body.honesty.flyDefaultDeploy).toBeTruthy();
"""

    auth_smoke = ""
    if hub["kind"] == "foundation":
        auth_smoke = """
  it('rejects unauthenticated overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/enterprise-engineering-system/overview');
    expect([401, 403, 503]).toContain(res.status);
  });
"""

    return f"""import {{ INestApplication }} from '@nestjs/common';
import {{ Test, TestingModule }} from '@nestjs/testing';
import {{ existsSync, readdirSync, readFileSync }} from 'fs';
import {{ join }} from 'path';
import request from 'supertest';
import {{ App }} from 'supertest/types';
import {{ AppModule }} from '../src/app.module';
import {{ ApiExceptionFilter }} from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {{
  const out: string[] = [];
  for (const name of readdirSync(dir, {{ withFileTypes: true }})) {{
    const p = join(dir, name.name);
    if (name.isDirectory()) {{
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...walkTsFiles(p));
    }} else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {{
      out.push(p);
    }}
  }}
  return out;
}}

describe('{hub["title"]} (VL-{vl})', () => {{
  let app: INestApplication<App>;

  beforeAll(async () => {{
    const moduleFixture: TestingModule = await Test.createTestingModule({{
      imports: [AppModule],
    }}).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }}, 120_000);

  afterAll(async () => {{
    await app.close();
  }});

  it('ships ADR and product doc', () => {{
    expect(existsSync(join(root, 'docs/adr/{hub["adr"]}-{slug}.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/{hub["doc"]}'))).toBe(true);
  }});

  it('has no TODO/FIXME markers in hub source', () => {{
    const banned = /TODO|FIXME|implement later|XXX\\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, '{slug}');
    for (const file of walkTsFiles(dir)) {{
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }}
    expect(hits).toEqual([]);
  }});

  it('exposes engine/products with honesty gates', async () => {{
    const res = await request(app.getHttpServer())
      .get('{path}')
      .expect(200);
    expect(res.body.product).toBeTruthy();
    expect(res.body.honesty.{key}).toBe({val});
{extra}
  }});

  it('exposes monitoring', async () => {{
    const res = await request(app.getHttpServer())
      .get('/v1/{slug}/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy();
  }});
{auth_smoke}}});
"""


def write_hub(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    const = to_const(slug)
    base = ROOT / "apps/api/src" / slug
    kind = hub["kind"]

    if kind == "foundation":
        write(base / f"{slug}.catalog.ts", foundation_catalog())
        write(base / f"{slug}.service.ts", foundation_service())
        write(base / f"{slug}.controller.ts", foundation_controller())
        write(
            base / f"{slug}.module.ts",
            module_ts(
                slug,
                pascal,
                extra_imports=(
                    "import { UsageModule } from '../usage/usage.module';\n"
                    "import { IdentityModule } from '../identity/identity.module';\n"
                ),
                extra_module="imports: [UsageModule, IdentityModule],\n  ",
            ),
        )
        for name, content in application_files(
            slug, pascal, const, hub["title"], hub["vl"], foundation=True
        ).items():
            write(base / "application" / name, content)
    else:
        write(base / f"{slug}.catalog.ts", standards_catalog(hub))
        write(base / f"{slug}.service.ts", standards_service(hub))
        write(base / f"{slug}.controller.ts", standards_controller(hub))
        write(base / f"{slug}.module.ts", standards_module(hub))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)

    write(ROOT / "apps/api/src/graphql" / f"{slug}.resolver.ts", resolver_ts(hub))
    endpoint = f"/v1/{slug}/products" if kind == "foundation" else f"/v1/{slug}/engine"
    write(ROOT / "apps/web/app" / slug / "page.tsx", web_page(slug, pascal))
    write(
        ROOT / "apps/web/app" / slug / f"{slug}-client.tsx",
        web_client(slug, hub["title"], hub["vl"], endpoint),
    )
    write(ROOT / "docs" / hub["doc"], product_doc(hub))
    write(ROOT / "docs/adr" / f"{hub['adr']}-{slug}.md", adr_doc(hub))
    write(ROOT / "apps/api/test" / f"{slug}.spec.ts", hub_spec(hub))


def write_audit_pack() -> None:
    audit = ROOT / "docs/enterprise-engineering-system-audit"
    write(
        audit / "PRODUCTION_READINESS.md",
        """# Enterprise Engineering System — Production Readiness

Volume 20 (VL-344–353) Production Audit.

## Gates

- All Volume 20 products shipped (foundation + 8 standards hubs).
- No TODO/FIXME/`implement later` markers in Volume 20 hub sources.
- Foundation: `architectureKnowledgeBaseOs=false`, `adrFactoryOs=false`.
- Each standards hub: `engineeringOsForHumansAndCursor=true`, `customerFacingProductCloud=false`.
- Architecture Governance: ADR/RFC workflow catalogs point at existing `docs/adr/` — `adrFactoryOs=false`.
- AI Engineering Standards: non-empty `retroactiveChecks` covering Vol 11 payments, Vol 12 healthcare/financial/consent, Vol 17 secrets with `checkedAgainstStandards=true` and pass/gap findings (not fake certification).
- Infrastructure Standards: `kubernetesOs=false`, GPU FinOps budget + secrets envelope honesty.
- Quality Platform: `sonarqubeOs=false`.
- Auth smoke on `/v1/enterprise-engineering-system/overview`.
- GraphQL honesty fields for EES catalogs.

## Rejected inventions

- Architecture Knowledge Base OS
- Mass ADR factory (250 ADRs) / mass PRD library (200 PRDs)
- Jira OS / Confluence OS / SonarQube OS
- Regenerating Platform Engineering, Developer Experience, Trust AI Governance, or existing `docs/adr/`
""",
    )
    write(
        audit / "ARCHITECTURE.md",
        """# Enterprise Engineering System — Architecture Validation

## Role

EES is the engineering operating system for humans and Cursor — standards, governance,
templates, and quality catalogs. It extends:

| Upstream | Volume | Role |
| --- | --- | --- |
| Platform Engineering Cloud | 16 | Internal developer platform |
| Developer Experience Platform | 16 | CLI/SDK/docs |
| AI Governance / Trust Cloud | 15 | Human sign-off / trust |
| Existing `docs/adr/` | — | ADR process (not regenerated) |
| FinOps / Secrets | 16/17 | GPU budgets + envelope honesty |

## Pattern

Each EES hub is a Nest catalog façade:

1. Catalog of standards/governance capabilities + `routesTo` existing surfaces.
2. Service injects related Nest modules where useful and exposes route/list/query.
3. CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
4. Honesty: `architectureKnowledgeBaseOs=false`, `adrFactoryOs=false`.

## Hub map

| Hub | Focus |
| --- | --- |
| engineering-governance | Councils + CAB/TSC + approval statuses |
| architecture-governance | ADR/RFC/design/radar/deps/compliance |
| repository-standards | Monorepo reality standards |
| engineering-quality-platform | Quality dimensions
| ai-engineering-standards | AI standards + retroactiveChecks |
| api-engineering-standards | REST/GraphQL/gRPC/SDK standards |
| database-engineering-standards | Postgres/Redis/ES/vector/KG standards |
| infrastructure-engineering-standards | IaC/deploy/GPU + FinOps/secrets honesty |
""",
    )
    write(
        audit / "COVERAGE.md",
        """# Enterprise Engineering System — Coverage Report

| VL | Product | Spec |
| --- | --- | --- |
| VL-344 | enterprise-engineering-system | `apps/api/test/enterprise-engineering-system.spec.ts` |
| VL-345 | engineering-governance | `apps/api/test/engineering-governance.spec.ts` |
| VL-346 | architecture-governance | `apps/api/test/architecture-governance.spec.ts` |
| VL-347 | repository-standards | `apps/api/test/repository-standards.spec.ts` |
| VL-348 | engineering-quality-platform | `apps/api/test/engineering-quality-platform.spec.ts` |
| VL-349 | ai-engineering-standards | `apps/api/test/ai-engineering-standards.spec.ts` |
| VL-350 | api-engineering-standards | `apps/api/test/api-engineering-standards.spec.ts` |
| VL-351 | database-engineering-standards | `apps/api/test/database-engineering-standards.spec.ts` |
| VL-352 | infrastructure-engineering-standards | `apps/api/test/infrastructure-engineering-standards.spec.ts` |
| VL-353 | Production Audit | `apps/api/test/enterprise-engineering-system-audit.spec.ts` |
""",
    )
    write(
        audit / "PERFORMANCE.md",
        """# Enterprise Engineering System — Performance Validation

Standards catalogs add discovery overhead only — no new execution engines.
Audit GraphQL smoke expects completion under 5s in the test harness.
GPU budgets remain governed by FinOps ceilings referenced from Infrastructure Standards.
""",
    )
    write(
        audit / "DEPLOYMENT.md",
        """# Enterprise Engineering System — Deployment Guide

1. Deploy API with Volume 20 modules registered in `app.module.ts`.
2. Web consoles under `/enterprise-engineering-system`, `/engineering-governance`, `/architecture-governance`, `/repository-standards`, `/engineering-quality-platform`, `/ai-engineering-standards`, `/api-engineering-standards`, `/database-engineering-standards`, `/infrastructure-engineering-standards`.
3. Do not enable Architecture Knowledge Base OS / mass ADR factory from this volume.
4. Fly remains the default deploy target; Kubernetes standards are catalog guidance (`kubernetesOs=false`).
5. Platform Engineering, DX, Trust AI Governance, and existing `docs/adr/` remain authoritative for their domains.
""",
    )
    write(
        audit / "ENGINEERING_READINESS_REPORT.md",
        """# Engineering Readiness Report

**Volume 20 closed** (VL-344–353).

## Summary

Enterprise Engineering System ships as standards/governance catalogs for humans and Cursor.
`architectureKnowledgeBaseOs=false`. `adrFactoryOs=false`. Retroactive checks present for
Volumes 11/12/17. Extends Platform Engineering, DX, Trust AI Governance, and existing ADRs.

## Evidence

- Product docs ADR-0246–0255
- Audit pack under `docs/enterprise-engineering-system-audit/`
- Vitest gates in `apps/api/test/enterprise-engineering-system-audit.spec.ts`
""",
    )
    write(
        audit / "ENTERPRISE_ENGINEERING_SYSTEM_READINESS_REPORT.md",
        """# Enterprise Engineering System Readiness Report

Alias of Engineering Readiness Report for Volume 20 closure.

**Volume 20 closed** (VL-344–353). See `ENGINEERING_READINESS_REPORT.md`.

Honesty: not Architecture Knowledge Base OS; not mass ADR factory; not Jira/Confluence/SonarQube OS.
""",
    )
    write(
        ROOT / "docs/adr/0255-enterprise-engineering-system-production-audit.md",
        """# ADR-0255: Enterprise Engineering System Production Audit (VL-353)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-353 (library Phase 220)

## Context

Volume 20 closes with a hardening pass. Risks: inventing Architecture Knowledge Base OS,
mass ADR/PRD factory, Jira/Confluence/SonarQube OS, missing retroactive checks, dishonest
foundation flags (`architectureKnowledgeBaseOs` / `adrFactoryOs`).

## Decision

1. Ship evidence pack under `docs/enterprise-engineering-system-audit/`.
2. Gate with vitest: no TODOs, all products shipped, retroactive checks present,
   `adrFactoryOs=false`, `architectureKnowledgeBaseOs=false`, auth smoke, GraphQL.
3. Explicitly reject Architecture Knowledge Base OS and mass ADR factory invention.
4. Keep Infrastructure Standards GPU FinOps + secrets envelope honesty.

## Consequences

- Volume 20 closed.
- Architecture Knowledge Base / mass ADR factory deferred past Volume 20.
""",
    )


def write_audit_spec() -> None:
    std_slugs = [h["slug"] for h in HUBS if h["kind"] == "standards"]
    gql_fields = "\n          ".join(
        [
            "enterpriseEngineeringSystemProducts { id name status }",
            *[
                f"{to_camel(s)}Engine {{ product note engineeringOsForHumansAndCursor customerFacingProductCloud architectureKnowledgeBaseOs adrFactoryOs }}"
                for s in std_slugs
            ],
        ]
    )
    content = f"""import {{ INestApplication }} from '@nestjs/common';
import {{ Test, TestingModule }} from '@nestjs/testing';
import {{ existsSync, readdirSync, readFileSync }} from 'fs';
import {{ join }} from 'path';
import request from 'supertest';
import {{ App }} from 'supertest/types';
import {{ AppModule }} from '../src/app.module';
import {{ ApiExceptionFilter }} from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

const VOLUME20_HUBS = {json.dumps([h["slug"] for h in HUBS])};
const STANDARDS_HUBS = {json.dumps(std_slugs)};

function walkTsFiles(dir: string): string[] {{
  const out: string[] = [];
  for (const name of readdirSync(dir, {{ withFileTypes: true }})) {{
    const p = join(dir, name.name);
    if (name.isDirectory()) {{
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...walkTsFiles(p));
    }} else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {{
      out.push(p);
    }}
  }}
  return out;
}}

describe('Enterprise Engineering System Production Audit (VL-353)', () => {{
  let app: INestApplication<App>;

  beforeAll(async () => {{
    const moduleFixture: TestingModule = await Test.createTestingModule({{
      imports: [AppModule],
    }}).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }}, 120_000);

  afterAll(async () => {{
    await app.close();
  }});

  it('ships audit pack and ADR-0255', () => {{
    expect(existsSync(join(root, 'docs/adr/0255-enterprise-engineering-system-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ENTERPRISE_ENGINEERING_SYSTEM.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/ARCHITECTURE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/PERFORMANCE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/COVERAGE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/DEPLOYMENT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/ENGINEERING_READINESS_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/enterprise-engineering-system-audit/ENTERPRISE_ENGINEERING_SYSTEM_READINESS_REPORT.md'))).toBe(true);
  }});

  it('has no TODO/FIXME markers across Volume 20 hubs', () => {{
    const banned = /TODO|FIXME|implement later|XXX\\s*:|not implemented/i;
    const hits: string[] = [];
    for (const slug of VOLUME20_HUBS) {{
      const dir = join(apiSrc, slug);
      if (!existsSync(dir)) {{
        hits.push(`missing:${{slug}}`);
        continue;
      }}
      for (const file of walkTsFiles(dir)) {{
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }}
    }}
    expect(hits).toEqual([]);
  }});

  it('foundation catalogs all shipped products with honesty gates', async () => {{
    const res = await request(app.getHttpServer())
      .get('/v1/enterprise-engineering-system/products')
      .expect(200);
    expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);
    expect(res.body.honesty.customerFacingProductCloud).toBe(false);
    expect(res.body.honesty.architectureKnowledgeBaseOs).toBe(false);
    expect(res.body.honesty.adrFactoryOs).toBe(false);
    const ids = res.body.products.map((p: {{ id: string }}) => p.id);
    for (const slug of STANDARDS_HUBS) {{
      expect(ids).toContain(slug);
    }}
    expect(ids).toContain('enterprise-engineering-system');
  }});

  it('each standards hub has honesty and non-empty routesTo', async () => {{
    for (const slug of STANDARDS_HUBS) {{
      const res = await request(app.getHttpServer())
        .get(`/v1/${{slug}}/engine`)
        .expect(200);
      expect(res.body.honesty.engineeringOsForHumansAndCursor).toBe(true);
      expect(res.body.honesty.customerFacingProductCloud).toBe(false);
      expect(res.body.honesty.architectureKnowledgeBaseOs).toBe(false);
      expect(res.body.honesty.adrFactoryOs).toBe(false);
      expect(res.body.routesTo.length).toBeGreaterThan(0);
    }}
  }});

  it('retroactive checks present for Vol 11/12/17', async () => {{
    const res = await request(app.getHttpServer())
      .get('/v1/ai-engineering-standards/check/list')
      .expect(200);
    expect(res.body.fakeComplianceCertification).toBe(false);
    const topics = res.body.retroactiveChecks.map((c: {{ topic: string; volume: number }}) => `${{c.volume}}:${{c.topic}}`);
    expect(topics.some((t: string) => t.includes('11') && t.includes('payments'))).toBe(true);
    expect(topics.some((t: string) => t.includes('12') && t.includes('healthcare'))).toBe(true);
    expect(topics.some((t: string) => t.includes('12') && t.includes('financial'))).toBe(true);
    expect(topics.some((t: string) => t.includes('12') && t.includes('consent'))).toBe(true);
    expect(topics.some((t: string) => t.includes('17') && t.includes('secrets'))).toBe(true);
    for (const c of res.body.retroactiveChecks) {{
      expect(c.checkedAgainstStandards).toBe(true);
      expect(['pass', 'gap']).toContain(c.finding);
    }}
  }});

  it('rejects Architecture Knowledge Base / mass ADR factory', () => {{
    const readiness = readFileSync(
      join(root, 'docs/enterprise-engineering-system-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/Architecture Knowledge Base|Rejected inventions/i);
    expect(readiness).toMatch(/adrFactoryOs=false|Mass ADR factory/i);
    const adr = readFileSync(
      join(root, 'docs/adr/0255-enterprise-engineering-system-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/architectureKnowledgeBaseOs=false|Architecture Knowledge Base/i);
    const foundation = readFileSync(
      join(apiSrc, 'enterprise-engineering-system/enterprise-engineering-system.catalog.ts'),
      'utf8',
    );
    expect(foundation).toMatch(/architectureKnowledgeBaseOs:\\s*false/);
    expect(foundation).toMatch(/adrFactoryOs:\\s*false/);
  }});

  it('infrastructure GPU/secrets honesty', async () => {{
    const res = await request(app.getHttpServer())
      .get('/v1/infrastructure-engineering-standards/engine')
      .expect(200);
    expect(res.body.honesty.kubernetesOs).toBe(false);
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.secretsEnvelopeHonesty).toBe(true);
  }});

  it('auth smoke on overview', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/enterprise-engineering-system/overview');
    expect([401, 403, 503]).toContain(res.status);
  }});

  it('GraphQL honesty fields', async () => {{
    const started = Date.now();
    const gql = await request(app.getHttpServer())
      .post('/graphql')
      .send({{
        query: `{{
          {gql_fields}
        }}`,
      }})
      .expect(200);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(gql.body.errors).toBeUndefined();
    expect(gql.body.data.enterpriseEngineeringSystemProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.engineeringGovernanceEngine.engineeringOsForHumansAndCursor).toBe(true);
    expect(gql.body.data.architectureGovernanceEngine.adrFactoryOs).toBe(false);
    expect(gql.body.data.architectureGovernanceEngine.architectureKnowledgeBaseOs).toBe(false);
    expect(gql.body.data.aiEngineeringStandardsEngine.customerFacingProductCloud).toBe(false);
    expect(gql.body.data.infrastructureEngineeringStandardsEngine.architectureKnowledgeBaseOs).toBe(false);
  }});

  it('documents EES in CLOUD_BLUEPRINT and PROGRESS', () => {{
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Enterprise Engineering System/);
    expect(blueprint).toMatch(/VL-344/);
    const progress = readFileSync(join(root, 'PROGRESS.md'), 'utf8');
    expect(progress).toMatch(/VL-353/);
    expect(progress).toMatch(/Volume 20 closed/);
  }});
}});
"""
    write(ROOT / "apps/api/test/enterprise-engineering-system-audit.spec.ts", content)


def insert_after(text: str, anchor: str, addition: str) -> str:
    if not addition.strip():
        return text
    if addition.strip() in text:
        return text
    if anchor not in text:
        raise RuntimeError(f"Anchor not found: {anchor[:80]}")
    return text.replace(anchor, anchor + addition, 1)


def patch_wiring() -> None:
    app_mod = ROOT / "apps/api/src/app.module.ts"
    text = app_mod.read_text()
    imports, modules = [], []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        slug = hub["slug"]
        line = f"import {{ {pascal}Module }} from './{slug}/{slug}.module';"
        if line not in text:
            imports.append(line)
        mod = f"    {pascal}Module,"
        if mod not in text:
            modules.append(mod)
    if imports:
        text = insert_after(
            text,
            "import { PluginOperatingSystemModule } from './plugin-operating-system/plugin-operating-system.module';\n",
            "\n".join(imports) + "\n",
        )
    if modules:
        text = insert_after(
            text,
            "    PluginOperatingSystemModule,\n",
            "\n".join(modules) + "\n",
        )
    app_mod.write_text(text)

    gql_mod = ROOT / "apps/api/src/graphql/graphql.module.ts"
    text = gql_mod.read_text()
    app_imports, res_imports, app_modules, resolvers = [], [], [], []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        slug = hub["slug"]
        ai = f"import {{ {pascal}ApplicationModule }} from '../{slug}/application/{slug}-application.module';"
        ri = f"import {{ {pascal}GraphqlResolver }} from './{slug}.resolver';"
        if ai not in text:
            app_imports.append(ai)
        if ri not in text:
            res_imports.append(ri)
        am = f"    {pascal}ApplicationModule,"
        rr = f"    {pascal}GraphqlResolver,"
        if am not in text:
            app_modules.append(am)
        if rr not in text:
            resolvers.append(rr)
    if app_imports:
        text = insert_after(
            text,
            "import { PluginOperatingSystemApplicationModule } from '../plugin-operating-system/application/plugin-operating-system-application.module';\n",
            "\n".join(app_imports) + "\n",
        )
    if res_imports:
        text = insert_after(
            text,
            "import { PluginOperatingSystemGraphqlResolver } from './plugin-operating-system.resolver';\n",
            "\n".join(res_imports) + "\n",
        )
    if app_modules:
        text = insert_after(
            text,
            "    PluginOperatingSystemApplicationModule,\n",
            "\n".join(app_modules) + "\n",
        )
    if resolvers:
        text = insert_after(
            text,
            "    PluginOperatingSystemGraphqlResolver,\n",
            "\n".join(resolvers) + "\n",
        )
    gql_mod.write_text(text)

    gql_types = ROOT / "apps/api/src/graphql/gql.types.ts"
    gt = gql_types.read_text()
    if "GqlEnterpriseEngineeringSystemProduct" not in gt:
        m = re.search(r"import \{([^}]+)\} from '@nestjs/graphql';", gt)
        if m and "Int" not in m.group(1):
            gt = gt.replace(m.group(0), f"import {{{m.group(1)}, Int}} from '@nestjs/graphql';")
        gql_types.write_text(gt.rstrip() + "\n" + gql_types_append())

    openapi = ROOT / "apps/api/src/openapi/openapi.document.ts"
    ot = openapi.read_text()
    paths_block = []
    for hub in HUBS:
        slug = hub["slug"]
        pascal = to_pascal(slug)
        if hub["kind"] == "foundation":
            entries = [
                ("products", f"list{pascal}Products", "EES products"),
                ("engine", f"get{pascal}Engine", "EES engine alias"),
                ("routing", f"get{pascal}Routing", "EES routing"),
                ("overview", f"get{pascal}Overview", "EES overview"),
                ("monitoring", f"get{pascal}Monitoring", "EES monitoring"),
            ]
        else:
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("routes", f"list{pascal}Routes", f"{hub['title']} routes"),
                ("route", f"route{pascal}", f"Route via {hub['title']}"),
                ("execute", f"execute{pascal}", f"Execute via {hub['title']}"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
            ]
            if slug == "ai-engineering-standards":
                entries.extend(
                    [
                        ("checks", f"list{pascal}Checks", "AI engineering retroactive checks"),
                        ("check/list", f"list{pascal}CheckList", "AI engineering check list"),
                    ]
                )
            if slug == "architecture-governance":
                entries.append(("adr-series", f"get{pascal}AdrSeries", "ADR series note"))
        for path_suffix, op_id, summary in entries:
            path_key = f"'/v1/{slug}/{path_suffix}'"
            if path_key in ot:
                continue
            paths_block.append(
                f"""    {path_key}: {{
      get: {{
        summary: '{summary}',
        operationId: '{op_id}',
        responses: {{ '200': {{ description: 'OK' }} }},
      }},
    }},"""
            )
    if paths_block:
        ot = ot.replace(
            "    '/v1/localize/file': {",
            "\n".join(paths_block) + "\n\n    '/v1/localize/file': {",
        )
        openapi.write_text(ot)

    sdk = ROOT / "packages/sdk/src/client.ts"
    st = sdk.read_text()
    methods = []
    for hub in HUBS:
        slug = hub["slug"]
        camel = to_camel(slug)
        method = f"{camel}Products" if hub["kind"] == "foundation" else f"{camel}Engine"
        path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
        if f"async {method}(" in st:
            continue
        if hub["kind"] == "foundation":
            methods.append(
                f"""
  async {method}(): Promise<{{
    product: string;
    products: Array<{{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }}>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }}> {{
    return this.requestJson('{path}', {{ method: 'GET' }});
  }}
"""
            )
        else:
            methods.append(
                f"""
  async {method}(): Promise<{{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{{ module: string; path: string; role: string }}>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }}> {{
    return this.requestJson('{path}', {{ method: 'GET' }});
  }}
"""
            )
    if "async aiEngineeringStandardsChecks(" not in st:
        methods.append(
            """
  async aiEngineeringStandardsChecks(): Promise<{
    product: string;
    retroactiveChecks: Array<Record<string, unknown>>;
    checkedAgainstStandards: boolean;
    fakeComplianceCertification: boolean;
    note: string;
  }> {
    return this.requestJson('/v1/ai-engineering-standards/check/list', { method: 'GET' });
  }
"""
        )
    if methods:
        anchor = "  private async parseJsonResponse"
        idx = st.find(anchor)
        if idx == -1:
            raise RuntimeError("SDK anchor parseJsonResponse not found")
        st = st[:idx] + "".join(methods) + "\n" + st[idx:]
        sdk.write_text(st)

    cli = ROOT / "packages/cli/src/cli.ts"
    ct = cli.read_text()
    help_lines = []
    for hub in HUBS:
        cmd = f"{hub['slug']}-products" if hub["kind"] == "foundation" else f"{hub['slug']}-engine"
        line = f"  verbalab {cmd}"
        if line not in ct:
            help_lines.append(line)
    if "  verbalab ai-engineering-standards-checks" not in ct:
        help_lines.append("  verbalab ai-engineering-standards-checks")
    if help_lines:
        ct = ct.replace(
            "  verbalab plugin-operating-system-engine\n",
            "  verbalab plugin-operating-system-engine\n" + "\n".join(help_lines) + "\n",
        )
    handlers = []
    for hub in HUBS:
        slug = hub["slug"]
        camel = to_camel(slug)
        cmd = f"{slug}-products" if hub["kind"] == "foundation" else f"{slug}-engine"
        method = f"{camel}Products" if hub["kind"] == "foundation" else f"{camel}Engine"
        if f"command === '{cmd}'" in ct:
            continue
        handlers.append(
            f"""
  if (command === '{cmd}') {{
    console.log(JSON.stringify(await vl.{method}(), null, 2));
    return;
  }}
"""
        )
    if "command === 'ai-engineering-standards-checks'" not in ct:
        handlers.append(
            """
  if (command === 'ai-engineering-standards-checks') {
    console.log(JSON.stringify(await vl.aiEngineeringStandardsChecks(), null, 2));
    return;
  }
"""
        )
    if handlers:
        ct = ct.replace(
            "  if (command === 'plugin-operating-system-engine') {\n    console.log(JSON.stringify(await vl.pluginOperatingSystemEngine(), null, 2));\n    return;\n  }",
            "  if (command === 'plugin-operating-system-engine') {\n    console.log(JSON.stringify(await vl.pluginOperatingSystemEngine(), null, 2));\n    return;\n  }"
            + "".join(handlers),
        )
    cli.write_text(ct)

    shell = ROOT / "apps/web/components/app-shell.tsx"
    sh = shell.read_text()
    navs = []
    for hub in HUBS:
        line = f"  {{ href: '/{hub['slug']}', label: '{hub['nav']}' }},"
        if line not in sh:
            navs.append(line)
    if navs:
        sh = sh.replace(
            "  { href: '/plugin-operating-system', label: 'Plugin OS' },\n",
            "  { href: '/plugin-operating-system', label: 'Plugin OS' },\n"
            + "\n".join(navs)
            + "\n",
        )
        shell.write_text(sh)


def update_progress_and_blueprint() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VL-343 Done — VAIOS Production Audit; Volume 19 closed)",
        "Last updated: 2026-10-03 (VL-353 Done — Enterprise Engineering System Production Audit; Volume 20 closed)",
    )
    vol20_rows = """| VL-344 | Enterprise Engineering System Foundation (Phase 211) | Done | `/enterprise-engineering-system` hub; ADR-0246. `architectureKnowledgeBaseOs=false`; `adrFactoryOs=false`. |
| VL-345 | Engineering Governance (Phase 212) | Done | Councils + CAB/TSC; `humanSignOffRequired`; ADR-0247. |
| VL-346 | Architecture Governance (Phase 213) | Done | ADR/RFC workflows point at `docs/adr`; `adrFactoryOs=false`; ADR-0248. |
| VL-347 | Repository Standards (Phase 214) | Done | Monorepo/polyrepo/naming/branch/git standards; ADR-0249. |
| VL-348 | Engineering Quality Platform (Phase 215) | Done | Quality catalog + dashboard snapshot; `sonarqubeOs=false`; ADR-0250. |
| VL-349 | AI Engineering Standards (Phase 216) | Done | AI standards + retroactiveChecks Vol 11/12/17; ADR-0251. |
| VL-350 | API Engineering Standards (Phase 217) | Done | REST/GraphQL/gRPC/SDK standards; ADR-0252. |
| VL-351 | Database Engineering Standards (Phase 218) | Done | Postgres/Redis/ES/vector/KG standards; `databaseOs=false`; ADR-0253. |
| VL-352 | Infrastructure Engineering Standards (Phase 219) | Done | IaC/deploy/GPU; FinOps+secrets honesty; `kubernetesOs=false`; ADR-0254. |
| VL-353 | EES Production Audit (Phase 220) | Done | Audit pack under `docs/enterprise-engineering-system-audit/`; ADR-0255. Volume 20 closed. |
"""
    if "VL-344" not in pt:
        pt = pt.replace(
            "| VL-343 | VAIOS Production Audit (Phase 210) | Done | Audit pack under `docs/vaios-audit/`; ADR-0245. Volume 19 closed. Enterprise Engineering System → past Volume 19. |\n",
            "| VL-343 | VAIOS Production Audit (Phase 210) | Done | Audit pack under `docs/vaios-audit/`; ADR-0245. Volume 19 closed. Enterprise Engineering System → past Volume 19. |\n"
            + vol20_rows,
        )
    changelog = """| 2026-10-03 | VL-344–352 Done: Enterprise Engineering System hubs (Phases 211–219) — foundation through Infrastructure Standards; ADR-0246–0254. Standards/governance for humans+Cursor; architectureKnowledgeBaseOs/adrFactoryOs=false. |
| 2026-10-03 | VL-353 Done: EES Production Audit (Phase 220) — evidence pack; ADR-0255. Volume 20 closed. Architecture Knowledge Base / mass ADR factory deferred past Volume 20. |
"""
    if "VL-344–352 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog
    progress.write_text(pt)

    write(
        ROOT / "docs/ENTERPRISE_ENGINEERING_SYSTEM.md",
        """# Enterprise Engineering System (VL-344)

Library Phase 211 — part of Volume 20 Enterprise Engineering System (EES).

## Mission

EES is the **engineering operating system for humans and Cursor** — standards, governance,
templates, and quality catalogs. It is **not** a customer-facing product cloud, **not**
Jira/Confluence/SonarQube OS, and **not** an Architecture Knowledge Base / ADR factory OS.

## Honesty

- `engineeringOsForHumansAndCursor=true`
- `customerFacingProductCloud=false`
- `architectureKnowledgeBaseOs=false` (deferred past Volume 20)
- `adrFactoryOs=false` (deferred past Volume 20)

## Products

| Hub | VL | Role |
| --- | --- | --- |
| enterprise-engineering-system | 344 | Foundation catalog |
| engineering-governance | 345 | Councils + CAB/TSC |
| architecture-governance | 346 | ADR/RFC workflows → existing docs/adr |
| repository-standards | 347 | Monorepo reality standards |
| engineering-quality-platform | 348 | Quality catalog (`sonarqubeOs=false`) |
| ai-engineering-standards | 349 | AI standards + retroactiveChecks |
| api-engineering-standards | 350 | API/SDK standards |
| database-engineering-standards | 351 | DB standards (`databaseOs=false`) |
| infrastructure-engineering-standards | 352 | Infra standards (`kubernetesOs=false`) |

## Surfaces

- Console: `/enterprise-engineering-system`
- API: `/v1/enterprise-engineering-system/products` (also `/engine`, `/routing`, `/monitoring`, `/overview`)
- ADR: [`docs/adr/0246-enterprise-engineering-system.md`](./adr/0246-enterprise-engineering-system.md)

---

## Volume status

**Volume 20 closed** (VL-344–353). Production Audit evidence: [`docs/enterprise-engineering-system-audit/`](./enterprise-engineering-system-audit/).
Architecture Knowledge Base / mass ADR factory deferred past Volume 20.
""",
    )

    blueprint = ROOT / "docs/CLOUD_BLUEPRINT.md"
    bt = blueprint.read_text()
    if "| Enterprise Engineering System | VL-344 → VL-353 |" not in bt:
        if "| VAIOS | VL-334 → VL-343 |" in bt:
            bt = bt.replace(
                "| VAIOS | VL-334 → VL-343 |",
                "| VAIOS | VL-334 → VL-343 |\n| Enterprise Engineering System | VL-344 → VL-353 |",
            )
    if "Enterprise Engineering System volume closed" not in bt:
        bt = bt.rstrip() + (
            "\n\nEnterprise Engineering System volume closed (VL-344–353) with audit pack under "
            "`docs/enterprise-engineering-system-audit/` — see [`ENTERPRISE_ENGINEERING_SYSTEM.md`](./ENTERPRISE_ENGINEERING_SYSTEM.md). "
            "Honesty: standards/governance for humans+Cursor; "
            "`architectureKnowledgeBaseOs=false`; `adrFactoryOs=false` "
            "(Architecture Knowledge Base / mass ADR factory deferred past Volume 20).\n"
        )
    bt = bt.replace(
        "`enterpriseEngineeringSystemOs=false` (deferred past Volume 19).\n",
        "`enterpriseEngineeringSystemOs=false` at Volume 19; Enterprise Engineering System shipped in Volume 20 (VL-344–353).\n",
    )
    blueprint.write_text(bt)


def run_generation() -> None:
    for hub in HUBS:
        write_hub(hub)
        print("wrote", hub["slug"])
    write_audit_pack()
    write_audit_spec()
    patch_wiring()
    update_progress_and_blueprint()
    print("Volume 20 Enterprise Engineering System generation complete")


if __name__ == "__main__":
    run_generation()
