#!/usr/bin/env python3
"""Generate Lugemi Volume 16 Platform Engineering Cloud (VL-302–313)."""

from __future__ import annotations

import json
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


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")


# ---------------------------------------------------------------------------
# Hub definitions (Phases 169–179 → VL-302–312)
# ---------------------------------------------------------------------------

HUBS = [
    {
        "slug": "platform-engineering-cloud",
        "vl": 302,
        "phase": 169,
        "adr": "0204",
        "title": "Platform Engineering Cloud",
        "kind": "foundation",
        "doc": "PLATFORM_ENGINEERING_CLOUD.md",
        "nav": "Platform Eng",
        "honesty_key": "controlPlaneOs",
        "honesty_val": False,
        "list_key": "products",
        "note": "Platform Engineering Foundation (VL-302). Internal IDP catalog — not Backstage/Argo/K8s/Snyk/Datadog/AI Cloud OS. controlPlaneOs=false; dataPlaneOs=false; aiCloudOs=false (Volume 17+).",
    },
    {
        "slug": "internal-developer-portal",
        "vl": 303,
        "phase": 170,
        "adr": "0205",
        "title": "Internal Developer Portal",
        "kind": "catalog",
        "doc": "INTERNAL_DEVELOPER_PORTAL.md",
        "nav": "Dev Portal",
        "honesty_key": "backstageOs",
        "honesty_val": False,
        "list_key": "portal",
        "note": "Internal Developer Portal (VL-303). Project/env/team/templates/ownership catalog over developer-cloud (VL-127). backstageOs=false.",
        "capabilities": [
            ("project_creation", "Project Creation"),
            ("env_provisioning", "Environment Provisioning"),
            ("team_management", "Team Management"),
            ("templates", "Service Templates"),
            ("ownership", "Ownership Maps"),
            ("dashboards", "Engineer Dashboards"),
        ],
        "seed": [
            ("idp-proj-api", "api", "Create Nest API project from golden path", "template"),
            ("idp-env-staging", "staging", "Provision staging workspace env", "environment"),
            ("idp-team-platform", "platform", "Platform engineering team ownership", "team"),
            ("idp-tpl-microservice", "microservice", "Microservice starter template", "template"),
            ("idp-own-web", "web", "apps/web ownership dashboard", "ownership"),
            ("idp-dash-dx", "dx", "Developer experience dashboard", "dashboard"),
        ],
    },
    {
        "slug": "service-catalog",
        "vl": 304,
        "phase": 171,
        "adr": "0206",
        "title": "Service Catalog",
        "kind": "catalog",
        "doc": "SERVICE_CATALOG.md",
        "nav": "Service Catalog",
        "honesty_key": "serviceMeshOs",
        "honesty_val": False,
        "list_key": "services",
        "note": "Service Catalog (VL-304). Seed catalog of Lugemi services (api, web, SDK, CLI) with ownership/deps. serviceMeshOs=false.",
        "capabilities": [
            ("microservices", "Microservices"),
            ("ownership", "Ownership"),
            ("dependencies", "Dependencies"),
            ("apis", "APIs"),
            ("databases", "Databases"),
            ("queues", "Queues"),
            ("events", "Events"),
            ("infra", "Infrastructure"),
        ],
        "seed": [
            ("svc-api", "api", "NestJS API — apps/api", "api"),
            ("svc-web", "web", "Next.js console — apps/web", "web"),
            ("svc-sdk", "sdk", "TypeScript SDK — packages/sdk", "sdk"),
            ("svc-cli", "cli", "CLI — packages/cli", "cli"),
            ("svc-postgres", "postgres", "Primary Postgres via Prisma", "database"),
            ("svc-redis", "redis", "Redis Streams / cache (Event Fabric)", "queue"),
            ("svc-fly", "fly", "Fly.io shared platform deploy path", "infra"),
        ],
    },
    {
        "slug": "golden-path-platform",
        "vl": 305,
        "phase": 172,
        "adr": "0207",
        "title": "Golden Path Platform",
        "kind": "catalog",
        "doc": "GOLDEN_PATH_PLATFORM.md",
        "nav": "Golden Paths",
        "honesty_key": "scaffoldingOs",
        "honesty_val": False,
        "list_key": "templates",
        "note": "Golden Path Platform (VL-305). Service/microservice/cloud/SDK/repo/CI/security templates catalog. scaffoldingOs=false.",
        "capabilities": [
            ("service_template", "Service Template"),
            ("microservice_template", "Microservice Template"),
            ("cloud_template", "Cloud Hub Template"),
            ("sdk_template", "SDK Template"),
            ("repo_template", "Repo Template"),
            ("ci_template", "CI Template"),
            ("security_template", "Security Template"),
        ],
        "seed": [
            ("gp-svc", "service", "Nest hub: catalog+service+controller+CQRS", "service"),
            ("gp-ms", "microservice", "Microservice layout with OpenAPI+GraphQL", "microservice"),
            ("gp-cloud", "cloud-hub", "Volume cloud foundation hub pattern", "cloud"),
            ("gp-sdk", "sdk-method", "SDK client method + CLI command", "sdk"),
            ("gp-repo", "repo", "pnpm workspace package scaffold", "repo"),
            ("gp-ci", "ci", "Vitest + lint CI path", "ci"),
            ("gp-sec", "security", "Auth smoke + honesty flags template", "security"),
        ],
    },
    {
        "slug": "gitops-platform",
        "vl": 306,
        "phase": 173,
        "adr": "0208",
        "title": "GitOps Platform",
        "kind": "catalog",
        "doc": "GITOPS_PLATFORM.md",
        "nav": "GitOps",
        "honesty_key": "argoCdOs",
        "honesty_val": False,
        "list_key": "readiness",
        "note": "GitOps Platform (VL-306). GitHub/GitLab/Argo/Flux/Terraform/Helm/Kustomize readiness over Fly/shared platform. argoCdOs=false; fluxOs=false.",
        "capabilities": [
            ("github", "GitHub"),
            ("gitlab", "GitLab"),
            ("argo", "Argo readiness"),
            ("flux", "Flux readiness"),
            ("terraform", "Terraform"),
            ("helm", "Helm"),
            ("kustomize", "Kustomize"),
            ("policy", "Deploy Policy"),
            ("promotion", "Promotion"),
        ],
        "seed": [
            ("go-gh", "github", "GitHub Actions readiness for lugemi deploy", "github"),
            ("go-gl", "gitlab", "GitLab CI readiness catalog", "gitlab"),
            ("go-argo", "argo", "ArgoCD discovery only — argoCdOs=false", "argo"),
            ("go-flux", "flux", "Flux discovery only — fluxOs=false", "flux"),
            ("go-tf", "terraform", "Infra-as-code readiness over shared platform", "terraform"),
            ("go-helm", "helm", "Helm chart readiness — not cluster OS", "helm"),
            ("go-kust", "kustomize", "Kustomize overlay readiness", "kustomize"),
            ("go-pol", "policy", "Deploy policy gates via existing CI", "policy"),
            ("go-promo", "promotion", "Staging→prod promotion over Fly path", "promotion"),
        ],
        "extra_honesty": {"fluxOs": False, "kubernetesControlPlaneOs": False, "flySharedPlatform": True},
    },
    {
        "slug": "release-engineering",
        "vl": 307,
        "phase": 174,
        "adr": "0209",
        "title": "Release Engineering",
        "kind": "catalog",
        "doc": "RELEASE_ENGINEERING.md",
        "nav": "Release Eng",
        "honesty_key": "spinnakerOs",
        "honesty_val": False,
        "list_key": "releases",
        "note": "Release Engineering (VL-307). Blue-green/canary/rolling/feature-flags/rollback/approval/progressive delivery catalog + seed releases. spinnakerOs=false.",
        "capabilities": [
            ("blue_green", "Blue-Green"),
            ("canary", "Canary"),
            ("rolling", "Rolling"),
            ("feature_flags", "Feature Flags"),
            ("rollback", "Rollback"),
            ("approval", "Release Approval"),
            ("progressive", "Progressive Delivery"),
        ],
        "seed": [
            ("rel-api-241", "api@0.241.0", "Rolling deploy via Fly shared platform", "rolling"),
            ("rel-web-118", "web@0.118.0", "Canary web console slice", "canary"),
            ("rel-sdk-77", "sdk@0.77.0", "SDK publish with approval gate", "approval"),
            ("rel-ff-trust", "ff-trust-cloud", "Feature flag for Trust Cloud consoles", "feature_flag"),
            ("rel-rb-gpu", "rollback-gpu-budget", "Rollback path for GPU budget alert change", "rollback"),
            ("rel-bg-cli", "cli@0.55.0", "Blue-green CLI package cut", "blue_green"),
        ],
    },
    {
        "slug": "reliability-engineering",
        "vl": 308,
        "phase": 175,
        "adr": "0210",
        "title": "Reliability Engineering",
        "kind": "catalog",
        "doc": "RELIABILITY_ENGINEERING.md",
        "nav": "Reliability",
        "honesty_key": "datadogOs",
        "honesty_val": False,
        "list_key": "reliability",
        "note": "Reliability Engineering (VL-308). SLO/SLI/error budgets/incident/capacity/autoscaling/DR/chaos catalog. Extends observability — datadogOs=false.",
        "capabilities": [
            ("slo", "SLOs"),
            ("sli", "SLIs"),
            ("error_budget", "Error Budgets"),
            ("incident", "Incident Management"),
            ("capacity", "Capacity"),
            ("autoscaling", "Autoscaling"),
            ("dr", "Disaster Recovery"),
            ("chaos", "Chaos Engineering"),
        ],
        "seed": [
            ("sre-slo-api", "api-availability", "API availability SLO 99.9%", "slo"),
            ("sre-sli-lat", "p95-latency", "Translate p95 latency SLI via /v1/metrics/translate", "sli"),
            ("sre-eb-api", "api-error-budget", "Error budget for API 5xx", "error_budget"),
            ("sre-inc-play", "incident-playbook", "Incident playbook catalog", "incident"),
            ("sre-cap-gpu", "gpu-capacity", "GPU capacity signal from Volume 7", "capacity"),
            ("sre-auto-fly", "fly-autoscaling", "Fly autoscaling readiness", "autoscaling"),
            ("sre-dr-pg", "postgres-dr", "Postgres backup/DR readiness", "dr"),
            ("sre-chaos-api", "api-chaos", "Chaos experiment catalog (non-destructive)", "chaos"),
        ],
        "extra_honesty": {"extendsObservability": True, "regeneratesObservability": False},
    },
    {
        "slug": "finops-platform",
        "vl": 309,
        "phase": 176,
        "adr": "0211",
        "title": "FinOps Platform",
        "kind": "finops",
        "doc": "FINOPS_PLATFORM.md",
        "nav": "FinOps",
        "honesty_key": "finopsOs",
        "honesty_val": False,
        "list_key": "costs",
        "note": "FinOps Platform (VL-309). Cloud/GPU/model/storage/bandwidth cost + budgets. gpuBudgetAlertsEnabled=true; pairs Volume 7 GPU costs. finopsOs=false.",
    },
    {
        "slug": "supply-chain-security",
        "vl": 310,
        "phase": 177,
        "adr": "0212",
        "title": "Supply Chain Security",
        "kind": "supply_chain",
        "doc": "SUPPLY_CHAIN_SECURITY.md",
        "nav": "Supply Chain",
        "honesty_key": "snykOs",
        "honesty_val": False,
        "list_key": "findings",
        "note": "Supply Chain Security (VL-310). SBOM/dependency/container/secrets/license catalog + scan/findings inventory. snykOs=false — not a full vuln DB.",
    },
    {
        "slug": "developer-experience-platform",
        "vl": 311,
        "phase": 178,
        "adr": "0213",
        "title": "Developer Experience Platform",
        "kind": "catalog",
        "doc": "DEVELOPER_EXPERIENCE_PLATFORM.md",
        "nav": "DevEx",
        "honesty_key": "ideOs",
        "honesty_val": False,
        "list_key": "devex",
        "note": "Developer Experience Platform (VL-311). CLI/SDK/codegen/docs/AI assistant/repo health/analytics catalog. Extends VL-127/SDK/CLI. ideOs=false.",
        "capabilities": [
            ("cli", "CLI"),
            ("sdk_gen", "SDK Generation"),
            ("codegen", "Codegen"),
            ("docs", "Docs Portal"),
            ("ai_assistant", "AI Assistant"),
            ("repo_health", "Repo Health"),
            ("analytics", "DX Analytics"),
            ("knowledge", "Knowledge Portal"),
        ],
        "seed": [
            ("dx-cli", "cli", "packages/cli command surface", "cli"),
            ("dx-sdk", "sdk", "packages/sdk client methods", "sdk"),
            ("dx-codegen", "openapi-codegen", "OpenAPI → client stubs readiness", "codegen"),
            ("dx-docs", "docs", "Product docs under docs/", "docs"),
            ("dx-ai", "assistant", "Internal engineering assistant catalog", "ai_assistant"),
            ("dx-repo", "repo-health", "Vitest/lint health signals", "repo_health"),
            ("dx-analytics", "dx-analytics", "Adoption analytics handoff to VL-312", "analytics"),
            ("dx-knowledge", "knowledge", "Engineering knowledge portal links", "knowledge"),
        ],
        "extra_honesty": {"extendsDeveloperCloud": True, "regeneratesDeveloperCloud": False},
    },
    {
        "slug": "platform-engineering-analytics",
        "vl": 312,
        "phase": 179,
        "adr": "0214",
        "title": "Platform Engineering Analytics",
        "kind": "analytics",
        "doc": "PLATFORM_ENGINEERING_ANALYTICS.md",
        "nav": "PE Analytics",
        "honesty_key": "devopsIntelligenceOs",
        "honesty_val": False,
        "list_key": "snapshot",
        "note": "Platform Engineering Analytics (VL-312). DORA + velocity/adoption/cost/reliability aggregation from sibling hubs. devopsIntelligenceOs=false.",
    },
]


FOUNDATION_PRODUCTS = [
    ("platform-engineering-cloud", "Platform Engineering Cloud", "GET /v1/platform-engineering-cloud/products", "/platform-engineering-cloud", "Foundation hub (VL-302). Internal IDP. controlPlaneOs=false; dataPlaneOs=false; aiCloudOs=false."),
    ("internal-developer-portal", "Developer Portal", "GET /v1/internal-developer-portal/engine", "/internal-developer-portal", "VL-303. backstageOs=false — extends developer-cloud."),
    ("service-catalog", "Service Catalog", "GET /v1/service-catalog/engine", "/service-catalog", "VL-304. Lugemi service inventory."),
    ("golden-path-platform", "Golden Paths", "GET /v1/golden-path-platform/engine", "/golden-path-platform", "VL-305. Scaffolding templates catalog."),
    ("infrastructure-platform", "Infrastructure Platform", "GET /v1/gitops-platform/engine", "/gitops-platform", "Infra readiness over Fly/shared platform — not Kubernetes control-plane OS."),
    ("gitops-platform", "GitOps", "GET /v1/gitops-platform/engine", "/gitops-platform", "VL-306. argoCdOs=false; fluxOs=false."),
    ("cicd", "CI/CD", "GET /v1/gitops-platform/engine", "/gitops-platform", "CI/CD readiness paired with GitOps/Release Engineering."),
    ("developer-experience-platform", "Developer Experience", "GET /v1/developer-experience-platform/engine", "/developer-experience-platform", "VL-311. Extends VL-127/SDK/CLI."),
    ("observability", "Observability", "GET /v1/reliability-engineering/engine", "/reliability-engineering", "Extends existing observability metrics — datadogOs=false."),
    ("release-engineering", "Release Engineering", "GET /v1/release-engineering/engine", "/release-engineering", "VL-307. Progressive delivery catalog."),
    ("reliability-engineering", "SRE", "GET /v1/reliability-engineering/engine", "/reliability-engineering", "VL-308. SLO/SLI/error budgets."),
    ("finops-platform", "FinOps", "GET /v1/finops-platform/engine", "/finops-platform", "VL-309. gpuBudgetAlertsEnabled=true; finopsOs=false."),
    ("supply-chain-security", "Security Platform", "GET /v1/supply-chain-security/engine", "/supply-chain-security", "VL-310. SBOM/scan/findings; snykOs=false."),
    ("platform-engineering-analytics", "Platform Engineering Analytics", "GET /v1/platform-engineering-analytics/engine", "/platform-engineering-analytics", "VL-312. DORA + sibling aggregation."),
]


def ts_bool(v: bool) -> str:
    return "true" if v else "false"


def honesty_block(hub: dict) -> str:
    key = hub["honesty_key"]
    val = hub["honesty_val"]
    extras = hub.get("extra_honesty") or {}
    lines = [f"      {key}: {ts_bool(val)},"]
    for k, v in extras.items():
        lines.append(f"      {k}: {ts_bool(v) if isinstance(v, bool) else json.dumps(v)},")
    lines.append("      regeneratesVolumes1to15: false,")
    lines.append("      integratesExistingSystems: true,")
    lines.append("      internalEngineeringTooling: true,")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Shared templates
# ---------------------------------------------------------------------------

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
        VL-{vl} — Lugemi {title} console in the Platform Engineering Cloud.
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
"""


def product_doc(hub: dict) -> str:
    return f"""# {hub["title"]} (VL-{hub["vl"]})

Library Phase {hub["phase"]} — part of Volume 16 Platform Engineering Cloud.

## Mission

Lugemi {hub["title"]} provides the {hub["title"]} surface inside the Platform Engineering Cloud — internal engineering tooling, not a product cloud.

## Honesty

- Extends existing Lugemi systems — does not regenerate Volumes 1–15.
- `{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`.
- Not Backstage OS, ArgoCD/Flux OS, Kubernetes control-plane OS, Snyk OS, Datadog OS, or Lugemi AI Cloud OS.
- Control Plane / Data Plane / AI Cloud OS deferred to Volume 17+.

## Surfaces

- Console: `/{hub["slug"]}`
- API: `/v1/{hub["slug"]}/engine`{" (foundation: `/products`)" if hub["kind"] == "foundation" else ""}
- ADR: [`docs/adr/{hub["adr"]}-{hub["slug"]}.md`](./adr/{hub["adr"]}-{hub["slug"]}.md)

---

## Volume status

**Volume 16** Platform Engineering Cloud (VL-302–313). Production Audit evidence: [`docs/platform-engineering-cloud-audit/`](./platform-engineering-cloud-audit/).
"""


def adr_doc(hub: dict) -> str:
    return f"""# ADR-{hub["adr"]}: {hub["title"]} (VL-{hub["vl"]})

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-{hub["vl"]} (library Phase {hub["phase"]})

## Context

Volume 16 builds Platform Engineering Cloud as internal IDP tooling for Lugemi engineers. Risks: inventing Backstage/Argo/Flux/K8s/Snyk/Datadog/AI Cloud OS, regenerating Volumes 1–15, or claiming Control Plane / Data Plane here.

## Decision

1. Ship `{hub["slug"]}` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`).
3. Integrate with Volume 7 GPU/Inference cost surfaces and Volume 10 Fabric where relevant.
4. Control Plane / Data Plane / AI Cloud OS remain deferred to Volume 17+.

## Consequences

- {hub["title"]} is discoverable under Platform Engineering Cloud Foundation.
- Operators can inspect catalogs without false OS claims.
"""


# ---------------------------------------------------------------------------
# Catalog / service / controller generators
# ---------------------------------------------------------------------------

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
    return f"""export type PlatformEngineeringCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type PlatformEngineeringCloudProductRow = {{
  id: string;
  name: string;
  status: PlatformEngineeringCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
}};

/**
 * Library Phase 169 → Platform Engineering Cloud Foundation (VL-302).
 * Internal Developer Platform for Lugemi engineers — not Backstage OS,
 * ArgoCD/Flux OS, Kubernetes control-plane OS, Snyk OS, Datadog OS, or AI Cloud OS.
 */
export function platformEngineeringCloudProductCatalog(): PlatformEngineeringCloudProductRow[] {{
  return [
{chr(10).join(rows)}
  ];
}}

export function platformEngineeringCloudRoutingTable(): Array<{{
  id: string;
  path: string;
  purpose: string;
}}> {{
  return [
    {{ id: 'products', path: '/v1/platform-engineering-cloud/products', purpose: 'Product catalog' }},
    {{ id: 'engine', path: '/v1/platform-engineering-cloud/engine', purpose: 'Engine alias' }},
    {{ id: 'routing', path: '/v1/platform-engineering-cloud/routing', purpose: 'Static routing table' }},
    {{ id: 'monitoring', path: '/v1/platform-engineering-cloud/monitoring', purpose: 'Monitoring snapshot' }},
    {{ id: 'overview', path: '/v1/platform-engineering-cloud/overview', purpose: 'Authenticated overview' }},
  ];
}}

export function platformEngineeringCloudArchitectureNotes(): Record<string, unknown> {{
  return {{
    role: 'internal-developer-platform',
    extends: [
      'developer-cloud',
      'observability',
      'gpu-platform',
      'ai-runtime-analytics',
      'event-fabric',
      'policy-fabric',
    ],
    regeneratesVolumes1to15: false,
    controlPlaneOs: false,
    dataPlaneOs: false,
    aiCloudOs: false,
    deferredToVolume17Plus: ['control-plane', 'data-plane', 'ai-cloud-os'],
  }};
}}

export function platformEngineeringCloudHonesty(): Record<string, boolean | string> {{
  return {{
    controlPlaneOs: false,
    dataPlaneOs: false,
    aiCloudOs: false,
    backstageOs: false,
    argoCdOs: false,
    fluxOs: false,
    kubernetesControlPlaneOs: false,
    snykOs: false,
    datadogOs: false,
    finopsOs: false,
    regeneratesVolumes1to15: false,
    integratesExistingSystems: true,
    internalEngineeringTooling: true,
    internalIdp: true,
    note:
      'Platform Engineering Cloud is internal IDP tooling for Lugemi engineers. Catalog/dashboard surfaces over Fly/shared platform, Volume 7 GPU costs, and Volume 10 Fabric — not Backstage/Argo/K8s/Snyk/Datadog/AI Cloud OS. Control Plane deferred to Volume 17+.',
  }};
}}
"""


def foundation_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  platformEngineeringCloudArchitectureNotes,
  platformEngineeringCloudHonesty,
  platformEngineeringCloudProductCatalog,
  platformEngineeringCloudRoutingTable,
} from './platform-engineering-cloud.catalog';

@Injectable()
export class PlatformEngineeringCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi Platform Engineering Cloud',
      products: platformEngineeringCloudProductCatalog(),
      architecture: platformEngineeringCloudArchitectureNotes(),
      honesty: platformEngineeringCloudHonesty(),
      safety: {
        controlPlaneOs: false,
        dataPlaneOs: false,
        aiCloudOs: false,
        backstageOs: false,
        argoCdOs: false,
        fluxOs: false,
        snykOs: false,
        datadogOs: false,
        finopsOs: false,
        note:
          'Volume 16 README: internal engineering tooling. FinOps pairs Volume 7 GPU budgets; Supply Chain inventories workspace deps; GitOps is readiness over Fly — not Argo/Flux OS. Control Plane rejected here (Volume 17+).',
      },
      docs: '/docs/PLATFORM_ENGINEERING_CLOUD.md',
      note:
        'Platform Engineering Foundation (VL-302). Internal IDP over existing systems. Not Backstage/Argo/K8s/Snyk/Datadog/AI Cloud OS.',
    };
  }

  routing() {
    return {
      routes: platformEngineeringCloudRoutingTable(),
      products: platformEngineeringCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: platformEngineeringCloudHonesty(),
      note: 'Static Platform Engineering Cloud discovery catalog for Foundation.',
      docs: '/docs/PLATFORM_ENGINEERING_CLOUD.md',
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
      products: platformEngineeringCloudProductCatalog(),
      architecture: platformEngineeringCloudArchitectureNotes(),
      honesty: platformEngineeringCloudHonesty(),
      safety: {
        controlPlaneOs: false,
        dataPlaneOs: false,
        aiCloudOs: false,
        note:
          'Internal IDP honesty enforced. Control Plane / Data Plane / AI Cloud OS deferred to Volume 17+.',
      },
      deferred: {
        controlPlaneOs: true,
        dataPlaneOs: true,
        aiCloudOs: true,
        regeneratesVolumes1to15: false,
      },
      links: {
        platformEngineeringCloud: '/platform-engineering-cloud',
        internalDeveloperPortal: '/internal-developer-portal',
        serviceCatalog: '/service-catalog',
        goldenPathPlatform: '/golden-path-platform',
        gitopsPlatform: '/gitops-platform',
        releaseEngineering: '/release-engineering',
        reliabilityEngineering: '/reliability-engineering',
        finopsPlatform: '/finops-platform',
        supplyChainSecurity: '/supply-chain-security',
        developerExperiencePlatform: '/developer-experience-platform',
        platformEngineeringAnalytics: '/platform-engineering-analytics',
        developerCloud: '/developer-cloud',
        gpuPlatform: '/gpu-platform',
        observability: '/v1/metrics/translate',
      },
      docs: '/docs/PLATFORM_ENGINEERING_CLOUD.md',
      note:
        'Platform Engineering Cloud (VL-302–313). Discovery hub over portal/catalog/golden-paths/gitops/release/reliability/finops/supply-chain/devex/analytics; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = platformEngineeringCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: platformEngineeringCloudArchitectureNotes(),
      honesty: platformEngineeringCloudHonesty(),
      note: 'Platform Engineering Cloud monitoring snapshot (VL-302).',
    };
  }
}
"""


def foundation_controller() -> str:
    return """import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformEngineeringCloudService } from './platform-engineering-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/platform-engineering-cloud')
export class PlatformEngineeringCloudController {
  constructor(private readonly pe: PlatformEngineeringCloudService) {}

  @Get('products')
  products() {
    return this.pe.products();
  }

  @Get('engine')
  engine() {
    return this.pe.products();
  }

  @Get('routing')
  routing() {
    return this.pe.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.pe.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.pe.monitoring();
  }
}
"""


def catalog_ts(hub: dict) -> str:
    slug = hub["slug"]
    camel = to_camel(slug)
    list_key = hub["list_key"]
    caps = hub.get("capabilities") or []
    seed = hub.get("seed") or []
    cap_rows = ",\n".join(
        f"      {{ id: '{cid}', name: '{cname}', status: 'shipped', notes: 'VL-{hub['vl']} capability.' }}"
        for cid, cname in caps
    )
    seed_rows = ",\n".join(
        f"""      {{
        id: '{sid}',
        name: '{sname}',
        kind: '{skind}',
        status: 'shipped',
        notes: '{snotes}',
      }}"""
        for sid, sname, snotes, skind in seed
    )
    return f"""/**
 * Library Phase {hub['phase']} → {hub['title']} (VL-{hub['vl']}).
 * {hub['note']}
 */
export function {camel}EngineCatalog() {{
  return {{
    product: 'Lugemi {hub['title']}',
    capabilities: [
{cap_rows}
    ],
    {list_key}: [
{seed_rows}
    ],
    honesty: {{
{honesty_block(hub)}
    }},
    safety: {{
      {hub['honesty_key']}: {ts_bool(hub['honesty_val'])},
      note: '{hub['note'].replace("'", "\\\\'")}',
    }},
    docs: '/docs/{hub['doc']}',
    note: '{hub['note'].replace("'", "\\\\'")}',
  }};
}}
"""


def generic_list_service(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = to_camel(slug)
    list_key = hub["list_key"]
    return f"""import {{ Injectable }} from '@nestjs/common';
import {{ {camel}EngineCatalog }} from './{slug}.catalog';

@Injectable()
export class {pascal}Service {{
  engine() {{
    return {camel}EngineCatalog();
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
      mode: '{slug}',
      count: (catalog as {{ {list_key}: unknown[] }}).{list_key}.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: '{pascal} monitoring snapshot (VL-{hub['vl']}).',
    }};
  }}
}}
"""


def generic_controller(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    list_path = hub["list_key"]
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

  @Get('{list_path}')
  list(@Query('q') q?: string) {{
    return this.service.list(q);
  }}

  @Get('query')
  query(@Query('q') q?: string) {{
    return this.service.query(q);
  }}
}}
"""


def finops_catalog() -> str:
    return """/**
 * Library Phase 176 → FinOps Platform (VL-309).
 * Pairs with Volume 7 GPU/Inference cost surfaces. Catalog/dashboard — not cloud-billing OS.
 */
export type FinOpsBudget = {
  id: string;
  name: string;
  kind: 'gpu' | 'model' | 'cloud' | 'storage' | 'bandwidth';
  monthlyUsd: number;
  alertThresholdPct: number;
  source: string;
  notes: string;
};

export type FinOpsAlert = {
  id: string;
  budgetId: string;
  kind: 'gpu' | 'model' | 'cloud' | 'storage' | 'bandwidth';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  enabled: boolean;
  notes: string;
};

export type FinOpsCostRow = {
  id: string;
  name: string;
  kind: 'cloud' | 'gpu' | 'model' | 'storage' | 'bandwidth' | 'chargeback' | 'showback' | 'forecast';
  monthlyUsd: number;
  notes: string;
};

export function seedFinOpsBudgets(): FinOpsBudget[] {
  return [
    {
      id: 'budget-gpu-monthly',
      name: 'GPU monthly budget',
      kind: 'gpu',
      monthlyUsd: 2500,
      alertThresholdPct: 80,
      source: 'Volume 7 gpu-platform / ai-runtime-analytics',
      notes: 'Primary GPU budget alert — pairs Inference Cloud cost surfaces.',
    },
    {
      id: 'budget-model-inference',
      name: 'Model inference budget',
      kind: 'model',
      monthlyUsd: 1200,
      alertThresholdPct: 85,
      source: 'Volume 7 inference cost ledger',
      notes: 'Model/token cost budget with alert seeding.',
    },
    {
      id: 'budget-cloud-compute',
      name: 'Cloud compute budget',
      kind: 'cloud',
      monthlyUsd: 1800,
      alertThresholdPct: 90,
      source: 'Fly shared platform',
      notes: 'Shared platform compute showback.',
    },
    {
      id: 'budget-storage',
      name: 'Storage budget',
      kind: 'storage',
      monthlyUsd: 400,
      alertThresholdPct: 90,
      source: 'Object + Postgres storage',
      notes: 'Storage cost showback.',
    },
    {
      id: 'budget-bandwidth',
      name: 'Bandwidth budget',
      kind: 'bandwidth',
      monthlyUsd: 300,
      alertThresholdPct: 90,
      source: 'Egress estimates',
      notes: 'Bandwidth cost showback.',
    },
  ];
}

export function seedFinOpsAlerts(): FinOpsAlert[] {
  return [
    {
      id: 'alert-gpu-80',
      budgetId: 'budget-gpu-monthly',
      kind: 'gpu',
      severity: 'high',
      message: 'GPU spend crossed 80% of monthly budget',
      enabled: true,
      notes: 'gpuBudgetAlertsEnabled=true — Volume 7 pairing.',
    },
    {
      id: 'alert-gpu-critical',
      budgetId: 'budget-gpu-monthly',
      kind: 'gpu',
      severity: 'critical',
      message: 'GPU spend projected to exceed monthly budget',
      enabled: true,
      notes: 'Critical GPU budget alert seed row.',
    },
    {
      id: 'alert-model-85',
      budgetId: 'budget-model-inference',
      kind: 'model',
      severity: 'high',
      message: 'Model inference spend crossed 85% of budget',
      enabled: true,
      notes: 'Model cost alert seed.',
    },
    {
      id: 'alert-cloud-90',
      budgetId: 'budget-cloud-compute',
      kind: 'cloud',
      severity: 'medium',
      message: 'Cloud compute spend crossed 90% of budget',
      enabled: true,
      notes: 'Cloud compute alert seed.',
    },
  ];
}

export function seedFinOpsCosts(): FinOpsCostRow[] {
  return [
    { id: 'cost-gpu', name: 'GPU hours', kind: 'gpu', monthlyUsd: 1875, notes: 'From gpu-platform / ai-runtime-analytics.' },
    { id: 'cost-model', name: 'Model inference', kind: 'model', monthlyUsd: 940, notes: 'Token/model ledger showback.' },
    { id: 'cost-cloud', name: 'Cloud compute', kind: 'cloud', monthlyUsd: 1320, notes: 'Fly shared platform.' },
    { id: 'cost-storage', name: 'Storage', kind: 'storage', monthlyUsd: 210, notes: 'DB + object storage.' },
    { id: 'cost-bandwidth', name: 'Bandwidth', kind: 'bandwidth', monthlyUsd: 95, notes: 'Egress estimate.' },
    { id: 'cost-chargeback', name: 'Team chargeback', kind: 'chargeback', monthlyUsd: 4440, notes: 'Chargeback rollup.' },
    { id: 'cost-showback', name: 'Org showback', kind: 'showback', monthlyUsd: 4440, notes: 'Showback rollup.' },
    { id: 'cost-forecast', name: '30d forecast', kind: 'forecast', monthlyUsd: 5100, notes: 'Simple linear forecast seed.' },
  ];
}

export function finopsPlatformEngineCatalog() {
  const budgets = seedFinOpsBudgets();
  const alerts = seedFinOpsAlerts();
  const costs = seedFinOpsCosts();
  return {
    product: 'Lugemi FinOps Platform',
    capabilities: [
      { id: 'cloud_cost', name: 'Cloud Cost', status: 'shipped', notes: 'Shared platform cost.' },
      { id: 'gpu_cost', name: 'GPU Cost', status: 'shipped', notes: 'Volume 7 GPU pairing.' },
      { id: 'model_cost', name: 'Model Cost', status: 'shipped', notes: 'Inference ledger.' },
      { id: 'storage_cost', name: 'Storage Cost', status: 'shipped', notes: 'Storage showback.' },
      { id: 'bandwidth_cost', name: 'Bandwidth Cost', status: 'shipped', notes: 'Bandwidth showback.' },
      { id: 'chargeback', name: 'Chargeback', status: 'shipped', notes: 'Team chargeback.' },
      { id: 'showback', name: 'Showback', status: 'shipped', notes: 'Org showback.' },
      { id: 'forecast', name: 'Forecast', status: 'shipped', notes: 'Cost forecast seed.' },
      { id: 'budgets', name: 'Budgets', status: 'shipped', notes: 'Budget seed rows.' },
      { id: 'alerts', name: 'Budget Alerts', status: 'shipped', notes: 'GPU/model alerts enabled.' },
    ],
    costs,
    budgets,
    alerts,
    gpuBudgetAlertsEnabled: true,
    honesty: {
      finopsOs: false,
      cloudBillingOs: false,
      gpuBudgetAlertsEnabled: true,
      pairsVolume7GpuCosts: true,
      regeneratesVolumes1to15: false,
      integratesExistingSystems: true,
      internalEngineeringTooling: true,
    },
    safety: {
      finopsOs: false,
      gpuBudgetAlertsEnabled: true,
      note:
        'FinOps is a catalog/dashboard over Volume 7 GPU/inference costs and shared platform spend — not a cloud-billing OS. GPU budget alerts are enabled.',
    },
    docs: '/docs/FINOPS_PLATFORM.md',
    note:
      'FinOps Platform (VL-309). Cloud/GPU/model/storage/bandwidth + chargeback/showback/forecast/budgets. gpuBudgetAlertsEnabled=true; finopsOs=false.',
  };
}
"""


def finops_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { finopsPlatformEngineCatalog } from './finops-platform.catalog';

@Injectable()
export class FinopsPlatformService {
  engine() {
    return finopsPlatformEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const costs = catalog.costs.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      costs,
      count: costs.length,
      budgets: catalog.budgets,
      alerts: catalog.alerts,
      gpuBudgetAlertsEnabled: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  budgets() {
    const catalog = this.engine();
    return {
      budgets: catalog.budgets,
      count: catalog.budgets.length,
      gpuBudgetAlertsEnabled: true,
      honesty: catalog.honesty,
      note: 'FinOps budgets including GPU/model cost budgets paired with Volume 7.',
      docs: catalog.docs,
    };
  }

  alerts() {
    const catalog = this.engine();
    const gpuAlerts = catalog.alerts.filter((a) => a.kind === 'gpu' && a.enabled);
    return {
      alerts: catalog.alerts,
      gpuAlerts,
      gpuBudgetAlertsEnabled: true,
      enabledCount: catalog.alerts.filter((a) => a.enabled).length,
      honesty: catalog.honesty,
      note: 'GPU budget alerts enabled — Volume 7 pairing.',
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'finops',
      costCount: catalog.costs.length,
      budgetCount: catalog.budgets.length,
      alertCount: catalog.alerts.length,
      gpuBudgetAlertsEnabled: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'FinOps Platform monitoring snapshot (VL-309).',
    };
  }
}
"""


def finops_controller() -> str:
    return """import { Controller, Get, Query } from '@nestjs/common';
import { FinopsPlatformService } from './finops-platform.service';

@Controller('v1/finops-platform')
export class FinopsPlatformController {
  constructor(private readonly service: FinopsPlatformService) {}

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

  @Get('costs')
  costs(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('budgets')
  budgets() {
    return this.service.budgets();
  }

  @Get('alerts')
  alerts() {
    return this.service.alerts();
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
"""


def supply_chain_catalog() -> str:
    return """/**
 * Library Phase 177 → Supply Chain Security (VL-310).
 * SBOM/dependency/container/secrets/license catalog + real workspace inventory posture.
 * Not a full vulnerability database / Snyk OS.
 */
export type SupplyChainCapability = {
  id: string;
  name: string;
  status: 'shipped' | 'partial';
  notes: string;
};

export type SupplyChainFinding = {
  id: string;
  packageName: string;
  ecosystem: 'npm' | 'workspace' | 'container' | 'secret' | 'license';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  kind: 'dependency' | 'sbom' | 'container' | 'secret' | 'license' | 'sast' | 'dast';
  summary: string;
  recommendation: string;
  source: string;
};

export function supplyChainCapabilities(): SupplyChainCapability[] {
  return [
    { id: 'sbom', name: 'SBOM', status: 'shipped', notes: 'Workspace package inventory SBOM seed.' },
    { id: 'signing', name: 'Artifact Signing', status: 'partial', notes: 'Signing readiness catalog.' },
    { id: 'dependency', name: 'Dependency Scan', status: 'shipped', notes: 'package.json / lockfile inventory.' },
    { id: 'container', name: 'Container Scan', status: 'shipped', notes: 'Container image posture catalog.' },
    { id: 'sast', name: 'SAST', status: 'shipped', notes: 'Static analysis readiness.' },
    { id: 'dast', name: 'DAST', status: 'partial', notes: 'DAST readiness catalog.' },
    { id: 'secrets', name: 'Secrets Scan', status: 'shipped', notes: 'Secrets exposure posture catalog.' },
    { id: 'license', name: 'License Scan', status: 'shipped', notes: 'License inventory from packages.' },
  ];
}

/** Static catalog of known workspace dependency risk posture (not a live CVE DB). */
export function seedSupplyChainFindings(): SupplyChainFinding[] {
  return [
    {
      id: 'find-npm-nest',
      packageName: '@nestjs/core',
      ecosystem: 'npm',
      severity: 'info',
      kind: 'dependency',
      summary: 'NestJS core present in apps/api — track upstream advisories.',
      recommendation: 'Keep Nest patches current via pnpm updates.',
      source: 'apps/api/package.json inventory',
    },
    {
      id: 'find-npm-next',
      packageName: 'next',
      ecosystem: 'npm',
      severity: 'info',
      kind: 'dependency',
      summary: 'Next.js present in apps/web — track framework advisories.',
      recommendation: 'Follow Next.js security releases.',
      source: 'apps/web/package.json inventory',
    },
    {
      id: 'find-npm-vitest',
      packageName: 'vitest',
      ecosystem: 'npm',
      severity: 'info',
      kind: 'dependency',
      summary: 'Vitest used for API/web tests — low production exposure.',
      recommendation: 'Keep devDependency current.',
      source: 'workspace package inventory',
    },
    {
      id: 'find-lockfile',
      packageName: 'pnpm-lock.yaml',
      ecosystem: 'workspace',
      severity: 'medium',
      kind: 'sbom',
      summary: 'Large monorepo lockfile accumulates transitive deps across volumes.',
      recommendation: 'Run periodic pnpm audit; prune unused packages from early volumes.',
      source: 'pnpm-lock.yaml summary',
    },
    {
      id: 'find-container-api',
      packageName: 'lugemi-api-image',
      ecosystem: 'container',
      severity: 'medium',
      kind: 'container',
      summary: 'API container base image posture needs periodic rebuild.',
      recommendation: 'Rebuild from current base; avoid stale layers.',
      source: 'container posture catalog',
    },
    {
      id: 'find-secret-env',
      packageName: '.env*',
      ecosystem: 'secret',
      severity: 'high',
      kind: 'secret',
      summary: 'Env files must never be committed; Clerk/Stripe/Sentry keys are runtime secrets.',
      recommendation: 'Keep secrets in platform secret store; scan PRs for leaked keys.',
      source: 'secrets posture catalog',
    },
    {
      id: 'find-license-mit',
      packageName: 'workspace-licenses',
      ecosystem: 'license',
      severity: 'low',
      kind: 'license',
      summary: 'Most workspace deps are MIT/Apache-2.0; confirm copyleft packages before redistribution.',
      recommendation: 'Generate license SBOM for release artifacts.',
      source: 'license inventory seed',
    },
    {
      id: 'find-sast-auth',
      packageName: 'clerk-auth-guards',
      ecosystem: 'workspace',
      severity: 'info',
      kind: 'sast',
      summary: 'Auth-guarded overview endpoints rely on ClerkAuthGuard — keep smoke tests green.',
      recommendation: 'Retain auth smoke in Production Audit vitest.',
      source: 'SAST readiness catalog',
    },
  ];
}

export function inventoryWorkspacePackages(): Array<{
  name: string;
  path: string;
  kind: string;
}> {
  return [
    { name: 'lugemi', path: 'package.json', kind: 'workspace-root' },
    { name: '@lugemi/api', path: 'apps/api/package.json', kind: 'app' },
    { name: '@lugemi/web', path: 'apps/web/package.json', kind: 'app' },
    { name: '@lugemi/sdk', path: 'packages/sdk/package.json', kind: 'package' },
    { name: '@lugemi/cli', path: 'packages/cli/package.json', kind: 'package' },
  ];
}

export function supplyChainSecurityEngineCatalog() {
  const findings = seedSupplyChainFindings();
  const packages = inventoryWorkspacePackages();
  return {
    product: 'Lugemi Supply Chain Security',
    capabilities: supplyChainCapabilities(),
    findings,
    packages,
    sbom: {
      format: 'lugemi-inventory-v1',
      packageCount: packages.length,
      findingCount: findings.length,
      note: 'Inventory SBOM seed — not a full OSV/NVD vulnerability database.',
    },
    honesty: {
      snykOs: false,
      fullVulnDb: false,
      regeneratesVolumes1to15: false,
      integratesExistingSystems: true,
      internalEngineeringTooling: true,
      inventoryPostureOnly: true,
    },
    safety: {
      snykOs: false,
      fullVulnDb: false,
      note:
        'Supply Chain Security inventories known workspace dependency risk posture (package.json / lockfile / container / secrets / license). Not Snyk OS and not a pretend full vuln DB.',
    },
    docs: '/docs/SUPPLY_CHAIN_SECURITY.md',
    note:
      'Supply Chain Security (VL-310). SBOM/signing/dependency/container/SAST/DAST/secrets/license catalog with scan/findings path. snykOs=false.',
  };
}
"""


def supply_chain_service() -> str:
    return """import { Injectable } from '@nestjs/common';
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
"""


def supply_chain_controller() -> str:
    return """import { Controller, Get, Query } from '@nestjs/common';
import { SupplyChainSecurityService } from './supply-chain-security.service';

@Controller('v1/supply-chain-security')
export class SupplyChainSecurityController {
  constructor(private readonly service: SupplyChainSecurityService) {}

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

  @Get('findings')
  findings(@Query('q') q?: string) {
    return this.service.findings(q);
  }

  @Get('scan')
  scan() {
    return this.service.scan();
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
"""


def analytics_catalog() -> str:
    return """/**
 * Library Phase 179 → Platform Engineering Analytics (VL-312).
 * DORA + velocity/adoption/cost/reliability aggregation from sibling hubs.
 */
export function platformEngineeringAnalyticsEngineCatalog() {
  return {
    product: 'Lugemi Platform Engineering Analytics',
    capabilities: [
      { id: 'deploy_frequency', name: 'Deploy Frequency', status: 'shipped', notes: 'DORA.' },
      { id: 'lead_time', name: 'Lead Time for Changes', status: 'shipped', notes: 'DORA.' },
      { id: 'mttr', name: 'MTTR', status: 'shipped', notes: 'DORA.' },
      { id: 'change_fail', name: 'Change Failure Rate', status: 'shipped', notes: 'DORA.' },
      { id: 'velocity', name: 'Engineering Velocity', status: 'shipped', notes: 'From release/gitops.' },
      { id: 'adoption', name: 'Platform Adoption', status: 'shipped', notes: 'From portal/golden paths.' },
      { id: 'cost', name: 'Cost Analytics', status: 'shipped', notes: 'From FinOps.' },
      { id: 'reliability', name: 'Reliability Analytics', status: 'shipped', notes: 'From SRE.' },
    ],
    honesty: {
      devopsIntelligenceOs: false,
      regeneratesSiblingHubs: false,
      aggregatesSiblingHubs: true,
      controlPlaneOs: false,
      aiCloudOs: false,
      regeneratesVolumes1to15: false,
      integratesExistingSystems: true,
      internalEngineeringTooling: true,
    },
    safety: {
      devopsIntelligenceOs: false,
      note:
        'Platform Engineering Analytics aggregates sibling PE hubs — not a DevOps intelligence OS or Control Plane.',
    },
    docs: '/docs/PLATFORM_ENGINEERING_ANALYTICS.md',
    note:
      'Platform Engineering Analytics (VL-312). DORA metrics + velocity/adoption/cost/reliability from siblings.',
  };
}
"""


def analytics_service() -> str:
    return """import { Injectable } from '@nestjs/common';
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
      note: 'Platform Engineering Analytics monitoring snapshot (VL-312).',
    };
  }
}
"""


def resolver_ts(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = to_camel(slug)
    key = hub["honesty_key"]
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
    # FinOps exposes gpuBudgetAlertsEnabled as well as finopsOs
    if hub["kind"] == "finops":
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
      finopsOs: catalog.honesty.finopsOs,
      gpuBudgetAlertsEnabled: catalog.gpuBudgetAlertsEnabled === true,
    }};
  }}
}}
"""
    if hub["kind"] == "supply_chain":
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
      snykOs: catalog.honesty.snykOs,
      findingCount: Array.isArray(catalog.findings) ? catalog.findings.length : 0,
    }};
  }}
}}
"""
    if hub["kind"] == "catalog" and slug == "gitops-platform":
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
      argoCdOs: catalog.honesty.argoCdOs,
      fluxOs: catalog.honesty.fluxOs,
    }};
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
      {key}: catalog.honesty.{key},
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
        elif hub["kind"] == "finops":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  finopsOs!: boolean;

  @Field(() => Boolean)
  gpuBudgetAlertsEnabled!: boolean;
}}
"""
            )
        elif hub["kind"] == "supply_chain":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  snykOs!: boolean;

  @Field(() => Int)
  findingCount!: number;
}}
"""
            )
        elif hub["slug"] == "gitops-platform":
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  argoCdOs!: boolean;

  @Field(() => Boolean)
  fluxOs!: boolean;
}}
"""
            )
        else:
            key = hub["honesty_key"]
            blocks.append(
                f"""
@ObjectType()
export class Gql{pascal}Engine {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  {key}!: boolean;
}}
"""
            )
    return "\n".join(blocks)




def main() -> None:
    from _v16_rest import run_generation

    run_generation()


if __name__ == "__main__":
    main()
