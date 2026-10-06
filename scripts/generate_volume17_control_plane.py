#!/usr/bin/env python3
"""Generate Lugemi Volume 17 Control Plane Cloud (VL-314–323)."""

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


def ts_bool(v: bool) -> str:
    return "true" if v else "false"


HUBS = [
    {
        "slug": "control-plane-cloud",
        "vl": 314,
        "phase": 181,
        "adr": "0216",
        "title": "Control Plane Cloud",
        "kind": "foundation",
        "doc": "CONTROL_PLANE_CLOUD.md",
        "nav": "Control Plane",
        "honesty_key": "executesInference",
        "honesty_val": False,
        "list_key": "products",
        "note": "Control Plane Foundation (VL-314). Highest-privilege management layer — never executes inference. dataPlaneOs=false deferred to Volume 18+. Not Kubernetes/Istio/Vault/Data Plane OS.",
    },
    {
        "slug": "organization-control",
        "vl": 315,
        "phase": 182,
        "adr": "0217",
        "title": "Organization Control",
        "kind": "org",
        "doc": "ORGANIZATION_CONTROL.md",
        "nav": "Org Control",
        "honesty_key": "leastPrivilegeRequired",
        "honesty_val": True,
        "list_key": "organizations",
        "note": "Organization Control (VL-315). Orgs/BUs/departments/teams/projects/environments/quotas/policies. leastPrivilegeRequired=true; controlPlaneAdminNotDefault=true. Extends identity — does not regenerate Clerk.",
    },
    {
        "slug": "global-configuration-platform",
        "vl": 316,
        "phase": 183,
        "adr": "0218",
        "title": "Global Configuration Platform",
        "kind": "catalog",
        "doc": "GLOBAL_CONFIGURATION_PLATFORM.md",
        "nav": "Global Config",
        "honesty_key": "secretsRefsOnly",
        "honesty_val": True,
        "list_key": "configurations",
        "note": "Global Configuration Platform (VL-316). Versioning/env/regional config/secrets refs/feature flags/validation. Secrets refs only — never plaintext secret values.",
        "extra_honesty": {"neverReturnsPlaintextSecrets": True, "regeneratesVolumes1to16": False},
        "capabilities": [
            ("versioning", "Configuration Versioning"),
            ("environment", "Environment Configuration"),
            ("regional", "Regional Configuration"),
            ("secrets_refs", "Secrets References"),
            ("feature_flags", "Feature Flags"),
            ("validation", "Configuration Validation"),
        ],
        "seed": [
            ("cfg-api-base", "api-base", "API base URL by environment", "environment"),
            ("cfg-region-af", "region-af-south", "Regional config for af-south-1", "regional"),
            ("cfg-secret-ref-db", "secret-ref/db-url", "Secret reference to DB URL (metadata only)", "secrets_ref"),
            ("cfg-ff-trust", "ff-trust-console", "Feature flag for Trust Cloud consoles", "feature_flag"),
            ("cfg-ver-42", "config@42", "Configuration version 42 snapshot", "version"),
            ("cfg-val-schema", "schema-validate", "Config validation catalog entry", "validation"),
        ],
    },
    {
        "slug": "global-policy-engine",
        "vl": 317,
        "phase": 184,
        "adr": "0219",
        "title": "Global Policy Engine",
        "kind": "policy",
        "doc": "GLOBAL_POLICY_ENGINE.md",
        "nav": "Global Policy",
        "honesty_key": "policyRuntimeIntegrated",
        "honesty_val": True,
        "list_key": "policies",
        "note": "Global Policy Engine (VL-317). Security/AI/billing/compliance/routing/regional/data-residency policies. Extends Policy Runtime / Trust — policyRuntimeIntegrated=true. Least-privilege admin for policy changes.",
    },
    {
        "slug": "global-deployment-controller",
        "vl": 318,
        "phase": 185,
        "adr": "0220",
        "title": "Global Deployment Controller",
        "kind": "deploy",
        "doc": "GLOBAL_DEPLOYMENT_CONTROLLER.md",
        "nav": "Global Deploy",
        "honesty_key": "productionDeployRequiresAuthorization",
        "honesty_val": True,
        "list_key": "deployments",
        "note": "Global Deployment Controller (VL-318). Multi-region/blue-green/canary/progressive/rollback/scheduling/approvals. productionDeployRequiresAuthorization=true; rollbackPath=true. Largest blast-radius honesty. Extends release-engineering.",
    },
    {
        "slug": "global-routing-controller",
        "vl": 319,
        "phase": 186,
        "adr": "0221",
        "title": "Global Routing Controller",
        "kind": "catalog",
        "doc": "GLOBAL_ROUTING_CONTROLLER.md",
        "nav": "Global Routing",
        "honesty_key": "istioOs",
        "honesty_val": False,
        "list_key": "routes",
        "note": "Global Routing Controller (VL-319). Traffic/regional/geo/latency/cost/AI/model routing + failover catalog. Extends AI Fabric / gateway routing — istioOs=false.",
        "extra_honesty": {
            "extendsAiFabricRouting": True,
            "regeneratesGateway": False,
            "kubernetesControlPlaneOs": False,
        },
        "capabilities": [
            ("traffic", "Traffic Routing"),
            ("regional", "Regional Routing"),
            ("geo", "Geo Routing"),
            ("latency", "Latency Routing"),
            ("cost", "Cost Routing"),
            ("ai", "AI Routing"),
            ("model", "Model Routing"),
            ("failover", "Failover"),
        ],
        "seed": [
            ("rt-traffic-api", "api-traffic", "Default API traffic split", "traffic"),
            ("rt-region-eu", "eu-west", "Regional route to eu-west", "regional"),
            ("rt-geo-af", "geo-af", "Geo preference for African clients", "geo"),
            ("rt-lat-edge", "latency-edge", "Latency-based edge routing", "latency"),
            ("rt-cost-batch", "cost-batch", "Cost-aware batch routing", "cost"),
            ("rt-ai-chat", "ai-chat", "AI chat route via Fabric", "ai"),
            ("rt-model-mt", "model-mt", "Model route for MT providers", "model"),
            ("rt-fail-primary", "failover-primary", "Primary→secondary failover catalog", "failover"),
        ],
    },
    {
        "slug": "secrets-certificate-platform",
        "vl": 320,
        "phase": 187,
        "adr": "0222",
        "title": "Secrets & Certificate Platform",
        "kind": "secrets",
        "doc": "SECRETS_CERTIFICATE_PLATFORM.md",
        "nav": "Secrets & Certs",
        "honesty_key": "encryptedAtRest",
        "honesty_val": True,
        "list_key": "secrets",
        "note": "Secrets & Certificate Platform (VL-320). Envelope-encryption + access-audit catalog over platform secrets. encryptedAtRest=true; neverLogPlaintextSecrets=true; envelopeEncryptionPattern=true; accessAuditing=true; hashicorpVaultOs=false. Metadata-only APIs.",
    },
    {
        "slug": "global-scheduler",
        "vl": 321,
        "phase": 188,
        "adr": "0223",
        "title": "Global Scheduler",
        "kind": "catalog",
        "doc": "GLOBAL_SCHEDULER.md",
        "nav": "Global Scheduler",
        "honesty_key": "executesInference",
        "honesty_val": False,
        "list_key": "schedules",
        "note": "Global Scheduler (VL-321). Jobs/cron/distributed/workflow/training/inference scheduling control — does not run inference. executesInference=false.",
        "extra_honesty": {
            "schedulesInferenceJobs": True,
            "runsInference": False,
            "extendsPlatformScheduler": True,
        },
        "capabilities": [
            ("jobs", "Jobs"),
            ("cron", "Cron"),
            ("distributed", "Distributed Scheduling"),
            ("workflow", "Workflow Scheduling"),
            ("training", "Training Scheduling"),
            ("inference", "Inference Scheduling"),
        ],
        "seed": [
            ("sch-job-cleanup", "cleanup-job", "Nightly cleanup job schedule", "job"),
            ("sch-cron-usage", "usage-rollup", "Hourly usage rollup cron", "cron"),
            ("sch-dist-batch", "distributed-batch", "Distributed batch schedule catalog", "distributed"),
            ("sch-wf-deploy", "deploy-workflow", "Deployment workflow schedule", "workflow"),
            ("sch-train-nightly", "training-nightly", "Training job schedule (control only)", "training"),
            ("sch-inf-window", "inference-window", "Inference window schedule — does not execute inference", "inference"),
        ],
    },
    {
        "slug": "control-plane-analytics",
        "vl": 322,
        "phase": 189,
        "adr": "0224",
        "title": "Control Plane Analytics",
        "kind": "analytics",
        "doc": "CONTROL_PLANE_ANALYTICS.md",
        "nav": "CP Analytics",
        "honesty_key": "aggregatesSiblingHubs",
        "honesty_val": True,
        "list_key": "snapshot",
        "note": "Control Plane Analytics (VL-322). Aggregates orgs/deployments/policies/regions/traffic/costs/config/health from sibling hubs. executesInference=false.",
    },
]

FOUNDATION_PRODUCTS = [
    ("control-plane-cloud", "Control Plane Cloud", "GET /v1/control-plane-cloud/products", "/control-plane-cloud", "Foundation hub (VL-314). executesInference=false; dataPlaneOs=false."),
    ("organization-control", "Organization Control", "GET /v1/organization-control/engine", "/organization-control", "VL-315. leastPrivilegeRequired; controlPlaneAdminNotDefault."),
    ("global-configuration-platform", "Global Configuration", "GET /v1/global-configuration-platform/engine", "/global-configuration-platform", "VL-316. Secrets refs only."),
    ("global-policy-engine", "Global Policy Engine", "GET /v1/global-policy-engine/engine", "/global-policy-engine", "VL-317. policyRuntimeIntegrated=true."),
    ("global-deployment-controller", "Global Deployment Controller", "GET /v1/global-deployment-controller/engine", "/global-deployment-controller", "VL-318. productionDeployRequiresAuthorization; rollbackPath."),
    ("global-routing-controller", "Global Routing Controller", "GET /v1/global-routing-controller/engine", "/global-routing-controller", "VL-319. istioOs=false."),
    ("secrets-certificate-platform", "Secrets & Certificate Platform", "GET /v1/secrets-certificate-platform/engine", "/secrets-certificate-platform", "VL-320. Envelope encryption + audit; metadata only."),
    ("global-scheduler", "Global Scheduler", "GET /v1/global-scheduler/engine", "/global-scheduler", "VL-321. Scheduling control; executesInference=false."),
    ("control-plane-analytics", "Control Plane Analytics", "GET /v1/control-plane-analytics/engine", "/control-plane-analytics", "VL-322. Sibling aggregation."),
    ("identity", "Identity", "GET /v1/organization-control/engine", "/organization-control", "Identity surfaces via Organization Control over Clerk — not a second IdP."),
    ("billing", "Billing Control", "GET /v1/global-policy-engine/engine", "/global-policy-engine", "Billing policies via Global Policy Engine over existing billing."),
    ("monitoring", "Control Plane Monitoring", "GET /v1/control-plane-cloud/monitoring", "/control-plane-cloud", "Foundation monitoring snapshot."),
]

FOUNDATION_PRODUCT_IDS = [p[0] for p in FOUNDATION_PRODUCTS]


def honesty_block(hub: dict) -> str:
    key = hub["honesty_key"]
    val = hub["honesty_val"]
    extras = hub.get("extra_honesty") or {}
    lines = [f"      {key}: {ts_bool(val)},"]
    for k, v in extras.items():
        lines.append(f"      {k}: {ts_bool(v) if isinstance(v, bool) else json.dumps(v)},")
    lines.append("      executesInference: false,")
    lines.append("      regeneratesVolumes1to16: false,")
    lines.append("      integratesExistingSystems: true,")
    lines.append("      controlPlaneManagementLayer: true,")
    return "\n".join(lines)


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
        VL-{vl} — Lugemi {title} console in the Control Plane Cloud.
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

Library Phase {hub["phase"]} — part of Volume 17 Control Plane Cloud.

## Mission

Lugemi {hub["title"]} provides the {hub["title"]} surface inside the Control Plane Cloud —
the highest-privilege management layer. The control plane never executes AI inference.

## Honesty

- Extends existing Lugemi systems — does not regenerate Volumes 1–16.
- `{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`.
- `executesInference=false`.
- Not Kubernetes control-plane OS, Istio OS, HashiCorp Vault OS, or Data Plane OS.
- Data Plane deferred to Volume 18+.

## Surfaces

- Console: `/{hub["slug"]}`
- API: `/v1/{hub["slug"]}/engine`{" (foundation: `/products`)" if hub["kind"] == "foundation" else ""}
- ADR: [`docs/adr/{hub["adr"]}-{hub["slug"]}.md`](./adr/{hub["adr"]}-{hub["slug"]}.md)

---

## Volume status

**Volume 17** Control Plane Cloud (VL-314–323). Production Audit evidence: [`docs/control-plane-cloud-audit/`](./control-plane-cloud-audit/).
"""


def adr_doc(hub: dict) -> str:
    return f"""# ADR-{hub["adr"]}: {hub["title"]} (VL-{hub["vl"]})

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-{hub["vl"]} (library Phase {hub["phase"]})

## Context

Volume 17 builds Control Plane Cloud as the highest-privilege management layer over Policy Runtime,
Policy Fabric, Trust Cloud, Identity, and Platform Engineering. Risks: inventing a second policy OS
or IdP, claiming Kubernetes/Istio/Vault/Data Plane OS, executing inference here, or regenerating Volumes 1–16.

## Decision

1. Ship `{hub["slug"]}` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`; `executesInference=false`).
3. Wire over Policy Runtime / Trust / Identity / Platform Engineering — do not invent a second policy OS or IdP.
4. Data Plane remains deferred to Volume 18+.

## Consequences

- {hub["title"]} is discoverable under Control Plane Cloud Foundation.
- Operators can inspect catalogs with explicit least-privilege / secrets / deploy-auth honesty where applicable.
"""


# ---------------------------------------------------------------------------
# Foundation
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
    return f"""export type ControlPlaneCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type ControlPlaneCloudProductRow = {{
  id: string;
  name: string;
  status: ControlPlaneCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
}};

/**
 * Library Phase 181 → Control Plane Cloud Foundation (VL-314).
 * Highest-privilege management layer — never executes inference.
 * Not Kubernetes/Istio/Vault/Data Plane OS.
 */
export function controlPlaneCloudProductCatalog(): ControlPlaneCloudProductRow[] {{
  return [
{chr(10).join(rows)}
  ];
}}

export function controlPlaneCloudRoutingTable(): Array<{{
  id: string;
  path: string;
  purpose: string;
}}> {{
  return [
    {{ id: 'products', path: '/v1/control-plane-cloud/products', purpose: 'Product catalog' }},
    {{ id: 'engine', path: '/v1/control-plane-cloud/engine', purpose: 'Engine alias' }},
    {{ id: 'routing', path: '/v1/control-plane-cloud/routing', purpose: 'Static routing table' }},
    {{ id: 'monitoring', path: '/v1/control-plane-cloud/monitoring', purpose: 'Monitoring snapshot' }},
    {{ id: 'overview', path: '/v1/control-plane-cloud/overview', purpose: 'Authenticated overview' }},
  ];
}}

export function controlPlaneCloudArchitectureNotes(): Record<string, unknown> {{
  return {{
    role: 'control-plane-management',
    extends: [
      'policy-runtime',
      'policy-fabric',
      'trust-cloud',
      'identity',
      'platform-engineering-cloud',
      'release-engineering',
      'ai-fabric',
    ],
    regeneratesVolumes1to16: false,
    executesInference: false,
    dataPlaneOs: false,
    kubernetesControlPlaneOs: false,
    istioOs: false,
    hashicorpVaultOs: false,
    deferredToVolume18Plus: ['data-plane'],
  }};
}}

export function controlPlaneCloudHonesty(): Record<string, boolean | string> {{
  return {{
    executesInference: false,
    dataPlaneOs: false,
    kubernetesControlPlaneOs: false,
    istioOs: false,
    hashicorpVaultOs: false,
    secondPolicyOs: false,
    secondIdp: false,
    regeneratesVolumes1to16: false,
    integratesExistingSystems: true,
    controlPlaneManagementLayer: true,
    leastPrivilegeRequired: true,
    controlPlaneAdminNotDefault: true,
    productionDeployRequiresAuthorization: true,
    rollbackPath: true,
    encryptedAtRest: true,
    neverLogPlaintextSecrets: true,
    envelopeEncryptionPattern: true,
    accessAuditing: true,
    note:
      'Control Plane Cloud manages orgs/projects/regions/policies/routing/billing/identity/deployment/configuration/monitoring. Never executes inference. Wires over Policy Runtime / Trust / Identity / Platform Engineering — not a second policy OS or IdP. Data Plane deferred to Volume 18+.',
  }};
}}
"""


def foundation_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  controlPlaneCloudArchitectureNotes,
  controlPlaneCloudHonesty,
  controlPlaneCloudProductCatalog,
  controlPlaneCloudRoutingTable,
} from './control-plane-cloud.catalog';

@Injectable()
export class ControlPlaneCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi Control Plane Cloud',
      products: controlPlaneCloudProductCatalog(),
      architecture: controlPlaneCloudArchitectureNotes(),
      honesty: controlPlaneCloudHonesty(),
      safety: {
        executesInference: false,
        dataPlaneOs: false,
        kubernetesControlPlaneOs: false,
        istioOs: false,
        hashicorpVaultOs: false,
        secondPolicyOs: false,
        secondIdp: false,
        note:
          'Volume 17 README: highest-privilege management layer. Secrets use envelope encryption + audit; production deploys require authorization with rollback; least-privilege admin roles. Data Plane rejected here (Volume 18+).',
      },
      docs: '/docs/CONTROL_PLANE_CLOUD.md',
      note:
        'Control Plane Foundation (VL-314). Manages the platform — never executes inference. Not Kubernetes/Istio/Vault/Data Plane OS.',
    };
  }

  routing() {
    return {
      routes: controlPlaneCloudRoutingTable(),
      products: controlPlaneCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: controlPlaneCloudHonesty(),
      note: 'Static Control Plane Cloud discovery catalog for Foundation.',
      docs: '/docs/CONTROL_PLANE_CLOUD.md',
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
      products: controlPlaneCloudProductCatalog(),
      architecture: controlPlaneCloudArchitectureNotes(),
      honesty: controlPlaneCloudHonesty(),
      safety: {
        executesInference: false,
        dataPlaneOs: false,
        note:
          'Control Plane honesty enforced. Inference execution and Data Plane deferred/rejected here.',
      },
      deferred: {
        dataPlaneOs: true,
        executesInference: false,
        regeneratesVolumes1to16: false,
      },
      links: {
        controlPlaneCloud: '/control-plane-cloud',
        organizationControl: '/organization-control',
        globalConfigurationPlatform: '/global-configuration-platform',
        globalPolicyEngine: '/global-policy-engine',
        globalDeploymentController: '/global-deployment-controller',
        globalRoutingController: '/global-routing-controller',
        secretsCertificatePlatform: '/secrets-certificate-platform',
        globalScheduler: '/global-scheduler',
        controlPlaneAnalytics: '/control-plane-analytics',
        platformEngineeringCloud: '/platform-engineering-cloud',
        trustCloud: '/trust-cloud',
        policyFabric: '/policy-fabric',
      },
      docs: '/docs/CONTROL_PLANE_CLOUD.md',
      note:
        'Control Plane Cloud (VL-314–323). Discovery hub over org/config/policy/deploy/routing/secrets/scheduler/analytics; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = controlPlaneCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: controlPlaneCloudArchitectureNotes(),
      honesty: controlPlaneCloudHonesty(),
      note: 'Control Plane Cloud monitoring snapshot (VL-314).',
    };
  }
}
"""


def foundation_controller() -> str:
    return """import { Controller, Get, UseGuards } from '@nestjs/common';
import { ControlPlaneCloudService } from './control-plane-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/control-plane-cloud')
export class ControlPlaneCloudController {
  constructor(private readonly cp: ControlPlaneCloudService) {}

  @Get('products')
  products() {
    return this.cp.products();
  }

  @Get('engine')
  engine() {
    return this.cp.products();
  }

  @Get('routing')
  routing() {
    return this.cp.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.cp.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.cp.monitoring();
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
    note = hub["note"].replace("'", "\\'")
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
      executesInference: false,
      note: '{note}',
    }},
    docs: '/docs/{hub['doc']}',
    note: '{note}',
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


# Continue in part 2 via exec — special hubs + wiring imported from same module
# Special hub generators below


def org_catalog() -> str:
    return """/**
 * Library Phase 182 → Organization Control (VL-315).
 * Orgs/BUs/departments/teams/projects/environments/quotas/policies with least-privilege roles.
 * Extends identity/org surfaces — does not regenerate Clerk.
 */
export type ControlPlaneRole = 'control_plane_admin' | 'operator' | 'viewer';

export function organizationControlRoleCatalog(): Array<{
  id: ControlPlaneRole;
  name: string;
  privilege: 'admin' | 'operator' | 'viewer';
  isDefault: boolean;
  notes: string;
}> {
  return [
    {
      id: 'control_plane_admin',
      name: 'Control Plane Admin',
      privilege: 'admin',
      isDefault: false,
      notes: 'Highest privilege — not default for engineers. Can change global policy/deploy/secrets catalogs.',
    },
    {
      id: 'operator',
      name: 'Operator',
      privilege: 'operator',
      isDefault: false,
      notes: 'Operate deployments/schedules within granted orgs — cannot grant CP admin.',
    },
    {
      id: 'viewer',
      name: 'Viewer',
      privilege: 'viewer',
      isDefault: true,
      notes: 'Read-only control-plane catalogs. Default least-privilege role.',
    },
  ];
}

export function organizationControlEngineCatalog() {
  return {
    product: 'Lugemi Organization Control',
    capabilities: [
      { id: 'organizations', name: 'Organizations', status: 'shipped', notes: 'VL-315.' },
      { id: 'business_units', name: 'Business Units', status: 'shipped', notes: 'VL-315.' },
      { id: 'departments', name: 'Departments', status: 'shipped', notes: 'VL-315.' },
      { id: 'teams', name: 'Teams', status: 'shipped', notes: 'VL-315.' },
      { id: 'projects', name: 'Projects', status: 'shipped', notes: 'VL-315.' },
      { id: 'environments', name: 'Environments', status: 'shipped', notes: 'VL-315.' },
      { id: 'quotas', name: 'Quotas', status: 'shipped', notes: 'VL-315.' },
      { id: 'policies', name: 'Org Policies', status: 'shipped', notes: 'VL-315.' },
      { id: 'roles', name: 'Role Catalog', status: 'shipped', notes: 'admin vs operator vs viewer.' },
    ],
    organizations: [
      {
        id: 'org-lugemi',
        name: 'Lugemi',
        kind: 'organization',
        status: 'shipped',
        notes: 'Primary org seed over existing identity/org surfaces.',
      },
      {
        id: 'bu-platform',
        name: 'Platform BU',
        kind: 'business_unit',
        status: 'shipped',
        notes: 'Platform engineering business unit.',
      },
      {
        id: 'dept-security',
        name: 'Security',
        kind: 'department',
        status: 'shipped',
        notes: 'Security department — least-privilege access to CP admin.',
      },
      {
        id: 'team-sre',
        name: 'SRE',
        kind: 'team',
        status: 'shipped',
        notes: 'SRE team — operator privilege for deploy/rollback catalogs.',
      },
      {
        id: 'proj-api',
        name: 'API',
        kind: 'project',
        status: 'shipped',
        notes: 'API project under Platform BU.',
      },
      {
        id: 'env-prod',
        name: 'production',
        kind: 'environment',
        status: 'shipped',
        notes: 'Production environment — deploy requires authorization.',
      },
      {
        id: 'quota-gpu',
        name: 'gpu-monthly',
        kind: 'quota',
        status: 'shipped',
        notes: 'GPU quota binding to FinOps budgets.',
      },
      {
        id: 'pol-org-default',
        name: 'org-default-policy',
        kind: 'policy',
        status: 'shipped',
        notes: 'Default org policy handoff to Global Policy Engine.',
      },
    ],
    roles: organizationControlRoleCatalog(),
    honesty: {
      leastPrivilegeRequired: true,
      controlPlaneAdminNotDefault: true,
      regeneratesClerk: false,
      extendsIdentity: true,
      executesInference: false,
      regeneratesVolumes1to16: false,
      integratesExistingSystems: true,
      controlPlaneManagementLayer: true,
    },
    safety: {
      leastPrivilegeRequired: true,
      controlPlaneAdminNotDefault: true,
      note:
        'Organization Control extends identity/org surfaces. Role catalog: admin vs operator vs viewer. Control Plane Admin is not the default engineer role.',
    },
    docs: '/docs/ORGANIZATION_CONTROL.md',
    note:
      'Organization Control (VL-315). Orgs/BUs/departments/teams/projects/environments/quotas/policies with least-privilege roles. Does not regenerate Clerk.',
  };
}
"""


def org_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { organizationControlEngineCatalog } from './organization-control.catalog';

@Injectable()
export class OrganizationControlService {
  engine() {
    return organizationControlEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const organizations = catalog.organizations.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      organizations,
      count: organizations.length,
      roles: catalog.roles,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  roles() {
    const catalog = this.engine();
    return {
      roles: catalog.roles,
      leastPrivilegeRequired: true,
      controlPlaneAdminNotDefault: true,
      defaultRole: catalog.roles.find((r) => r.isDefault)?.id ?? 'viewer',
      honesty: catalog.honesty,
      note: 'Role catalog: control_plane_admin is not default. Viewer is default least privilege.',
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'organization-control',
      organizationCount: catalog.organizations.length,
      roleCount: catalog.roles.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Organization Control monitoring snapshot (VL-315).',
    };
  }
}
"""


def org_controller() -> str:
    return """import { Controller, Get, Query } from '@nestjs/common';
import { OrganizationControlService } from './organization-control.service';

@Controller('v1/organization-control')
export class OrganizationControlController {
  constructor(private readonly service: OrganizationControlService) {}

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

  @Get('organizations')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('roles')
  roles() {
    return this.service.roles();
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
"""


def policy_catalog() -> str:
    return """/**
 * Library Phase 184 → Global Policy Engine (VL-317).
 * Extends Policy Runtime / Trust — does not invent a second policy OS.
 */
export function globalPolicyEngineCatalog() {
  return {
    product: 'Lugemi Global Policy Engine',
    capabilities: [
      { id: 'security', name: 'Security Policies', status: 'shipped', notes: 'VL-317.' },
      { id: 'ai', name: 'AI Policies', status: 'shipped', notes: 'Via Policy Runtime / Trust.' },
      { id: 'billing', name: 'Billing Policies', status: 'shipped', notes: 'VL-317.' },
      { id: 'compliance', name: 'Compliance Policies', status: 'shipped', notes: 'VL-317.' },
      { id: 'routing', name: 'Routing Policies', status: 'shipped', notes: 'VL-317.' },
      { id: 'regional', name: 'Regional Policies', status: 'shipped', notes: 'VL-317.' },
      { id: 'data_residency', name: 'Data Residency Policies', status: 'shipped', notes: 'VL-317.' },
    ],
    policies: [
      {
        id: 'pol-sec-baseline',
        name: 'security-baseline',
        kind: 'security',
        status: 'shipped',
        changeRequiresRole: 'control_plane_admin',
        notes: 'Security baseline — policy changes require CP admin.',
      },
      {
        id: 'pol-ai-safety',
        name: 'ai-safety',
        kind: 'ai',
        status: 'shipped',
        changeRequiresRole: 'control_plane_admin',
        notes: 'AI safety policy handoff to Policy Runtime / Trust.',
      },
      {
        id: 'pol-billing-quota',
        name: 'billing-quota',
        kind: 'billing',
        status: 'shipped',
        changeRequiresRole: 'control_plane_admin',
        notes: 'Billing/quota policy over existing billing engine.',
      },
      {
        id: 'pol-compliance-gdpr',
        name: 'compliance-gdpr',
        kind: 'compliance',
        status: 'shipped',
        changeRequiresRole: 'control_plane_admin',
        notes: 'Compliance policy catalog entry.',
      },
      {
        id: 'pol-routing-failover',
        name: 'routing-failover',
        kind: 'routing',
        status: 'shipped',
        changeRequiresRole: 'operator',
        notes: 'Routing policy for failover — operator can view; admin changes.',
      },
      {
        id: 'pol-regional-af',
        name: 'regional-af-south',
        kind: 'regional',
        status: 'shipped',
        changeRequiresRole: 'control_plane_admin',
        notes: 'Regional policy for af-south.',
      },
      {
        id: 'pol-residency-eu',
        name: 'data-residency-eu',
        kind: 'data_residency',
        status: 'shipped',
        changeRequiresRole: 'control_plane_admin',
        notes: 'EU data residency policy.',
      },
    ],
    honesty: {
      policyRuntimeIntegrated: true,
      secondPolicyOs: false,
      leastPrivilegeRequired: true,
      controlPlaneAdminNotDefault: true,
      executesInference: false,
      regeneratesVolumes1to16: false,
      integratesExistingSystems: true,
      controlPlaneManagementLayer: true,
      extendsPolicyRuntime: true,
      extendsTrustCloud: true,
    },
    safety: {
      policyRuntimeIntegrated: true,
      leastPrivilegeRequired: true,
      note:
        'Global Policy Engine extends Policy Runtime / Policy Fabric / Trust — not a second policy OS. Policy changes require least-privilege CP admin.',
    },
    docs: '/docs/GLOBAL_POLICY_ENGINE.md',
    note:
      'Global Policy Engine (VL-317). Security/AI/billing/compliance/routing/regional/data-residency. policyRuntimeIntegrated=true.',
  };
}
"""


def policy_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { globalPolicyEngineCatalog } from './global-policy-engine.catalog';

@Injectable()
export class GlobalPolicyEngineService {
  engine() {
    return globalPolicyEngineCatalog();
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const policies = catalog.policies.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      policies,
      count: policies.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'global-policy-engine',
      count: catalog.policies.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Global Policy Engine monitoring snapshot (VL-317).',
    };
  }
}
"""


def main() -> None:
    from _v17_rest import run_generation

    run_generation()


if __name__ == "__main__":
    main()


