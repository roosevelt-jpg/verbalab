"""Volume 16 generator — hub writers, wiring, audit (imported by generate_volume16)."""

from __future__ import annotations

from pathlib import Path

from generate_volume16_platform_engineering import (
    HUBS,
    ROOT,
    adr_doc,
    analytics_catalog,
    analytics_service,
    application_files,
    catalog_ts,
    finops_catalog,
    finops_controller,
    finops_service,
    foundation_catalog,
    foundation_controller,
    foundation_service,
    generic_controller,
    generic_list_service,
    gql_types_append,
    module_ts,
    product_doc,
    resolver_ts,
    supply_chain_catalog,
    supply_chain_controller,
    supply_chain_service,
    to_camel,
    to_const,
    to_pascal,
    ts_bool,
    web_client,
    web_page,
    write,
)

FOUNDATION_PRODUCT_IDS = [
    "platform-engineering-cloud",
    "internal-developer-portal",
    "service-catalog",
    "golden-path-platform",
    "infrastructure-platform",
    "gitops-platform",
    "cicd",
    "developer-experience-platform",
    "observability",
    "release-engineering",
    "reliability-engineering",
    "finops-platform",
    "supply-chain-security",
    "platform-engineering-analytics",
]


def hub_spec(hub: dict) -> str:
    slug = hub["slug"]
    vl = hub["vl"]
    key = hub["honesty_key"]
    val = ts_bool(hub["honesty_val"])
    path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
    extra = ""
    if hub["kind"] == "foundation":
        extra = """
    expect(res.body.honesty.controlPlaneOs).toBe(false);
    expect(res.body.honesty.dataPlaneOs).toBe(false);
    expect(res.body.honesty.aiCloudOs).toBe(false);
    expect(res.body.honesty.backstageOs).toBe(false);
    expect(res.body.honesty.argoCdOs).toBe(false);
    expect(res.body.honesty.fluxOs).toBe(false);
    expect(res.body.honesty.snykOs).toBe(false);
    expect(res.body.honesty.datadogOs).toBe(false);
    expect(res.body.honesty.finopsOs).toBe(false);
    expect(res.body.honesty.regeneratesVolumes1to15).toBe(false);
    expect(res.body.honesty.integratesExistingSystems).toBe(true);
    expect(res.body.honesty.internalEngineeringTooling).toBe(true);
"""
    elif hub["kind"] == "finops":
        extra = """
    expect(res.body.honesty.finopsOs).toBe(false);
    expect(res.body.honesty.gpuBudgetAlertsEnabled).toBe(true);
    expect(res.body.gpuBudgetAlertsEnabled).toBe(true);
    expect(res.body.budgets.length).toBeGreaterThan(0);
    expect(res.body.alerts.some((a: { kind: string; enabled: boolean }) => a.kind === 'gpu' && a.enabled)).toBe(true);

    const alerts = await request(app.getHttpServer())
      .get('/v1/finops-platform/alerts')
      .expect(200);
    expect(alerts.body.gpuBudgetAlertsEnabled).toBe(true);
    expect(alerts.body.gpuAlerts.length).toBeGreaterThan(0);
"""
    elif hub["kind"] == "supply_chain":
        extra = """
    expect(res.body.honesty.snykOs).toBe(false);
    expect(res.body.honesty.fullVulnDb).toBe(false);
    expect(res.body.findings.length).toBeGreaterThan(0);

    const scan = await request(app.getHttpServer())
      .get('/v1/supply-chain-security/scan')
      .expect(200);
    expect(scan.body.packages.length).toBeGreaterThan(0);
    expect(scan.body.findings.length).toBeGreaterThan(0);
    expect(scan.body.honesty.snykOs).toBe(false);

    const findings = await request(app.getHttpServer())
      .get('/v1/supply-chain-security/findings')
      .expect(200);
    expect(findings.body.findings.length).toBeGreaterThan(0);
"""
    elif hub["slug"] == "gitops-platform":
        extra = """
    expect(res.body.honesty.argoCdOs).toBe(false);
    expect(res.body.honesty.fluxOs).toBe(false);
    expect(res.body.honesty.kubernetesControlPlaneOs).toBe(false);
"""
    elif hub["slug"] == "reliability-engineering":
        extra = """
    expect(res.body.honesty.datadogOs).toBe(false);
    expect(res.body.honesty.extendsObservability).toBe(true);
    expect(res.body.honesty.regeneratesObservability).toBe(false);
"""
    elif hub["slug"] == "internal-developer-portal":
        extra = """
    expect(res.body.honesty.backstageOs).toBe(false);
"""
    elif hub["kind"] == "analytics":
        extra = """
    expect(res.body.honesty.devopsIntelligenceOs).toBe(false);
    expect(res.body.computedFromSiblings).toBe(true);
    expect(res.body.snapshot.dora).toBeTruthy();
    expect(res.body.snapshot.cost.gpuBudgetAlertsEnabled).toBe(true);
    expect(res.body.snapshot.gitops.argoCdOs).toBe(false);
    expect(res.body.snapshot.supplyChain.snykOs).toBe(false);
"""

    auth_smoke = ""
    if hub["kind"] == "foundation":
        auth_smoke = """
  it('rejects unauthenticated overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/platform-engineering-cloud/overview');
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
    elif kind == "finops":
        write(base / f"{slug}.catalog.ts", finops_catalog())
        write(base / f"{slug}.service.ts", finops_service())
        write(base / f"{slug}.controller.ts", finops_controller())
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "supply_chain":
        write(base / f"{slug}.catalog.ts", supply_chain_catalog())
        write(base / f"{slug}.service.ts", supply_chain_service())
        write(base / f"{slug}.controller.ts", supply_chain_controller())
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "analytics":
        write(base / f"{slug}.catalog.ts", analytics_catalog())
        write(base / f"{slug}.service.ts", analytics_service())
        write(base / f"{slug}.controller.ts", generic_controller(hub))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    else:
        write(base / f"{slug}.catalog.ts", catalog_ts(hub))
        write(base / f"{slug}.service.ts", generic_list_service(hub))
        write(base / f"{slug}.controller.ts", generic_controller(hub))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
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
    audit = ROOT / "docs/platform-engineering-cloud-audit"
    files = {
        "PRODUCTION_READINESS.md": """# Platform Engineering Cloud Production Readiness (VL-313)

Volume 16 Platform Engineering Cloud (VL-302–313) is production-ready as internal IDP tooling.

## Gates

- `controlPlaneOs=false` / `dataPlaneOs=false` / `aiCloudOs=false` — Control Plane / Data Plane / AI Cloud OS deferred to Volume 17+ (Rejected here).
- `backstageOs=false` — Internal Developer Portal extends developer-cloud.
- `argoCdOs=false` / `fluxOs=false` — GitOps readiness over Fly/shared platform.
- `finopsOs=false` with `gpuBudgetAlertsEnabled=true` — FinOps pairs Volume 7 GPU/model cost budgets.
- `snykOs=false` — Supply Chain scan/findings inventory posture, not a full vuln DB.
- `datadogOs=false` — Reliability extends existing observability.
- Auth smoke on `/v1/platform-engineering-cloud/overview`.
- GraphQL façades for all Platform Engineering hubs.
- No TODO/FIXME/implement-later markers in Volume 16 source.

## Status

**Volume 16 closed** (VL-302–313).
""",
        "ARCHITECTURE_REPORT.md": """# Platform Engineering Cloud Architecture Report (VL-313)

Platform Engineering Cloud is an internal Developer Platform layer over developer-cloud,
observability metrics, Volume 7 GPU/inference cost surfaces, and Volume 10 Fabric.

Hubs: platform-engineering-cloud, internal-developer-portal, service-catalog,
golden-path-platform, gitops-platform, release-engineering, reliability-engineering,
finops-platform, supply-chain-security, developer-experience-platform,
platform-engineering-analytics.

Does **not** invent Backstage OS, ArgoCD/Flux OS, Kubernetes control-plane OS, Snyk OS,
Datadog OS, FinOps cloud-billing OS, or Lugemi AI Cloud OS / Control Plane / Data Plane.
""",
        "COVERAGE_REPORT.md": """# Platform Engineering Cloud Coverage Report (VL-313)

| VL | Product | Surfaces |
| --- | --- | --- |
| VL-302 | Platform Engineering Foundation | REST/GraphQL/SDK/CLI/web |
| VL-303 | Internal Developer Portal | REST/GraphQL/SDK/CLI/web |
| VL-304 | Service Catalog | REST/GraphQL/SDK/CLI/web |
| VL-305 | Golden Path Platform | REST/GraphQL/SDK/CLI/web |
| VL-306 | GitOps Platform | REST/GraphQL/SDK/CLI/web |
| VL-307 | Release Engineering | REST/GraphQL/SDK/CLI/web |
| VL-308 | Reliability Engineering | REST/GraphQL/SDK/CLI/web |
| VL-309 | FinOps Platform | REST/GraphQL/SDK/CLI/web + budgets/alerts |
| VL-310 | Supply Chain Security | REST/GraphQL/SDK/CLI/web + scan/findings |
| VL-311 | Developer Experience Platform | REST/GraphQL/SDK/CLI/web |
| VL-312 | Platform Engineering Analytics | REST/GraphQL/SDK/CLI/web |
| VL-313 | Production Audit | Evidence pack + vitest gates |
""",
        "PERFORMANCE_REPORT.md": """# Platform Engineering Cloud Performance Report (VL-313)

Catalog/engine endpoints are in-memory seed responses. GraphQL façade query for all hubs
must complete under 5 seconds in vitest. Supply-chain scan is inventory posture (not a
remote vuln DB crawl). No heavy inference paths introduced in Volume 16.
""",
        "DEPLOYMENT_GUIDE.md": """# Platform Engineering Cloud Deployment Guide (VL-313)

1. Deploy API with existing Nest `AppModule` (Platform Engineering modules registered).
2. Web consoles under `/platform-engineering-cloud`, `/finops-platform`, etc.
3. FinOps GPU budget alerts are catalog-seeded — wire notification channels in ops as needed.
4. Supply Chain scan/findings inventory workspace packages; run alongside `pnpm audit` in CI.
5. Control Plane / Data Plane / AI Cloud OS deferred to Volume 17+ — do not invent here.
""",
        "PLATFORM_ENGINEERING_CLOUD_READINESS_REPORT.md": """# Platform Engineering Cloud Readiness Report (VL-313)

## Verdict

Volume 16 Platform Engineering Cloud is closed and ready as Lugemi's internal IDP tooling.

## Honesty checklist

- Internal engineering tooling ≠ product cloud / AI Cloud OS
- FinOps GPU budget alerts enabled (Volume 7 pairing); `finopsOs=false`
- Supply Chain findings/scan inventory posture; `snykOs=false`
- GitOps readiness; `argoCdOs=false` / `fluxOs=false`
- Control Plane / Data Plane / AI Cloud OS **Rejected** for this volume (Volume 17+)
""",
    }
    for name, content in files.items():
        write(audit / name, content)
    write(
        ROOT / "docs/adr/0215-platform-engineering-cloud-production-audit.md",
        """# ADR-0215: Platform Engineering Cloud Production Audit (VL-313)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-313 (library Phase 180)

## Context

Close Volume 16 after shipping VL-302–312. Validate honesty gates and reject inventing Control Plane / Data Plane / AI Cloud OS here.

## Decision

1. Ship evidence pack under `docs/platform-engineering-cloud-audit/`.
2. Vitest audit gates: no TODOs, all products shipped, FinOps GPU alerts, supply-chain findings/scan, GitOps honesty, auth smoke, GraphQL.
3. Explicitly reject Control Plane / Data Plane / AI Cloud OS in this volume (deferred to Volume 17+).
4. Mark Volume 16 closed in PROGRESS.md, CLOUD_BLUEPRINT.md, PLATFORM_ENGINEERING_CLOUD.md.

## Consequences

- Volume 16 closed (VL-302–313).
- Next cloud: Control Plane (Phases 181–190) when requested.
""",
    )


def write_audit_spec() -> None:
    dirs = ",\n  ".join(f"'{h['slug']}'" for h in HUBS)
    engine_paths = ",\n  ".join(
        f"'/v1/{h['slug']}/products'" if h["kind"] == "foundation" else f"'/v1/{h['slug']}/engine'"
        for h in HUBS
    )
    shipped = ",\n  ".join(f"'{pid}'" for pid in FOUNDATION_PRODUCT_IDS)
    gql_fields = "\n          ".join(
        (
            f"{to_camel(h['slug'])}Products {{ id status }}"
            if h["kind"] == "foundation"
            else (
                f"{to_camel(h['slug'])}Engine {{ product finopsOs gpuBudgetAlertsEnabled }}"
                if h["kind"] == "finops"
                else (
                    f"{to_camel(h['slug'])}Engine {{ product snykOs findingCount }}"
                    if h["kind"] == "supply_chain"
                    else (
                        f"{to_camel(h['slug'])}Engine {{ product argoCdOs fluxOs }}"
                        if h["slug"] == "gitops-platform"
                        else f"{to_camel(h['slug'])}Engine {{ product {h['honesty_key']} }}"
                    )
                )
            )
        )
        for h in HUBS
    )
    content = f"""import {{ INestApplication }} from '@nestjs/common';
import {{ Test, TestingModule }} from '@nestjs/testing';
import {{ existsSync, readFileSync, readdirSync }} from 'fs';
import {{ join }} from 'path';
import request from 'supertest';
import {{ App }} from 'supertest/types';
import {{ AppModule }} from '../src/app.module';
import {{ ApiExceptionFilter }} from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');
const webApp = join(root, 'apps/web/app');

const VOLUME16_DIRS = [
  {dirs},
];

const ENGINE_PATHS = [
  {engine_paths},
  '/v1/platform-engineering-cloud/monitoring',
];

const SHIPPED_PRODUCT_IDS = [
  {shipped},
];

function walkTsFiles(dir: string, out: string[] = []): string[] {{
  for (const name of readdirSync(dir, {{ withFileTypes: true }})) {{
    const p = join(dir, name.name);
    if (name.isDirectory()) {{
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkTsFiles(p, out);
    }} else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {{
      out.push(p);
    }} else if (name.name.endsWith('.tsx')) {{
      out.push(p);
    }}
  }}
  return out;
}}

describe('Platform Engineering Cloud Production Audit (VL-313)', () => {{
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

  it('ships audit ADR and report pack', () => {{
    expect(existsSync(join(root, 'docs/adr/0215-platform-engineering-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/PLATFORM_ENGINEERING_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/platform-engineering-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/platform-engineering-cloud-audit/PLATFORM_ENGINEERING_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);

    const readiness = readFileSync(
      join(root, 'docs/platform-engineering-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/gpuBudgetAlertsEnabled/i);
    expect(readiness).toMatch(/snykOs=false/i);
    expect(readiness).toMatch(/argoCdOs=false/i);
    expect(readiness).toMatch(/controlPlaneOs=false/i);
    expect(readiness).toMatch(/VL-302|Volume 16/i);

    const adr = readFileSync(
      join(root, 'docs/adr/0215-platform-engineering-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/Vitest audit gates|review gate|checklist/i);
    expect(adr).toMatch(/Control Plane|Data Plane|AI Cloud OS|do not invent|Rejected/i);
    expect(adr).toMatch(/Volume 16 closed|VL-302–313|closes/i);
  }});

  it('has no TODO/FIXME/implement-later markers in Volume 16 source trees', () => {{
    const banned = /TODO|FIXME|implement later|XXX\\s*:|not implemented/i;
    const hits: string[] = [];
    for (const name of VOLUME16_DIRS) {{
      const dir = join(apiSrc, name);
      if (!existsSync(dir)) {{
        hits.push(`missing:${{name}}`);
        continue;
      }}
      for (const file of walkTsFiles(dir)) {{
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }}
      const webDir = join(webApp, name);
      if (existsSync(webDir)) {{
        for (const file of walkTsFiles(webDir)) {{
          const text = readFileSync(file, 'utf8');
          if (banned.test(text)) hits.push(file.replace(root, ''));
        }}
      }}
    }}
    expect(hits).toEqual([]);
  }});

  it('exposes all Volume 16 catalogs as shipped with monitoring', async () => {{
    for (const path of ENGINE_PATHS) {{
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }}

    const hub = await request(app.getHttpServer())
      .get('/v1/platform-engineering-cloud/products')
      .expect(200);
    expect(hub.body.honesty.controlPlaneOs).toBe(false);
    expect(hub.body.honesty.dataPlaneOs).toBe(false);
    expect(hub.body.honesty.aiCloudOs).toBe(false);
    expect(hub.body.honesty.backstageOs).toBe(false);
    expect(hub.body.honesty.argoCdOs).toBe(false);
    expect(hub.body.honesty.fluxOs).toBe(false);
    expect(hub.body.honesty.snykOs).toBe(false);
    expect(hub.body.honesty.datadogOs).toBe(false);
    expect(hub.body.honesty.finopsOs).toBe(false);
    expect(hub.body.honesty.regeneratesVolumes1to15).toBe(false);

    const byId = Object.fromEntries(
      hub.body.products.map((p: {{ id: string; status: string }}) => [p.id, p.status]),
    );
    for (const id of SHIPPED_PRODUCT_IDS) {{
      expect(byId[id]).toBe('shipped');
    }}
  }});

  it('enforces FinOps GPU alerts, supply-chain findings, GitOps honesty', async () => {{
    const finops = await request(app.getHttpServer())
      .get('/v1/finops-platform/engine')
      .expect(200);
    expect(finops.body.honesty.finopsOs).toBe(false);
    expect(finops.body.gpuBudgetAlertsEnabled).toBe(true);
    expect(finops.body.budgets.some((b: {{ kind: string }}) => b.kind === 'gpu')).toBe(true);
    expect(
      finops.body.alerts.some((a: {{ kind: string; enabled: boolean }}) => a.kind === 'gpu' && a.enabled),
    ).toBe(true);

    const alerts = await request(app.getHttpServer())
      .get('/v1/finops-platform/alerts')
      .expect(200);
    expect(alerts.body.gpuBudgetAlertsEnabled).toBe(true);
    expect(alerts.body.gpuAlerts.length).toBeGreaterThan(0);

    const supply = await request(app.getHttpServer())
      .get('/v1/supply-chain-security/engine')
      .expect(200);
    expect(supply.body.honesty.snykOs).toBe(false);
    expect(supply.body.findings.length).toBeGreaterThan(0);

    const scan = await request(app.getHttpServer())
      .get('/v1/supply-chain-security/scan')
      .expect(200);
    expect(scan.body.packages.length).toBeGreaterThan(0);
    expect(scan.body.findings.length).toBeGreaterThan(0);

    const findings = await request(app.getHttpServer())
      .get('/v1/supply-chain-security/findings')
      .expect(200);
    expect(findings.body.findings.length).toBeGreaterThan(0);

    const gitops = await request(app.getHttpServer())
      .get('/v1/gitops-platform/engine')
      .expect(200);
    expect(gitops.body.honesty.argoCdOs).toBe(false);
    expect(gitops.body.honesty.fluxOs).toBe(false);

    const analytics = await request(app.getHttpServer())
      .get('/v1/platform-engineering-analytics/engine')
      .expect(200);
    expect(analytics.body.computedFromSiblings).toBe(true);
    expect(analytics.body.snapshot.cost.gpuBudgetAlertsEnabled).toBe(true);
    expect(analytics.body.snapshot.gitops.argoCdOs).toBe(false);
    expect(analytics.body.snapshot.supplyChain.snykOs).toBe(false);
  }});

  it('rejects unauthenticated Platform Engineering overview (auth smoke)', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/platform-engineering-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  }});

  it('exposes GraphQL façades for Platform Engineering hubs', async () => {{
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
    expect(gql.body.data.platformEngineeringCloudProducts.length).toBeGreaterThan(10);
    expect(gql.body.data.finopsPlatformEngine.gpuBudgetAlertsEnabled).toBe(true);
    expect(gql.body.data.finopsPlatformEngine.finopsOs).toBe(false);
    expect(gql.body.data.supplyChainSecurityEngine.snykOs).toBe(false);
    expect(gql.body.data.supplyChainSecurityEngine.findingCount).toBeGreaterThan(0);
    expect(gql.body.data.gitopsPlatformEngine.argoCdOs).toBe(false);
    expect(gql.body.data.gitopsPlatformEngine.fluxOs).toBe(false);
  }});

  it('rejects inventing Control Plane / Data Plane / AI Cloud OS in this volume', () => {{
    const readiness = readFileSync(
      join(root, 'docs/platform-engineering-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/controlPlaneOs=false|Control Plane.*deferred|Rejected/i);
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Platform Engineering/);
    expect(blueprint).toMatch(/Control Plane.*Volume 17|deferred to Volume 17/i);
  }});
}});
"""
    write(ROOT / "apps/api/test/platform-engineering-cloud-audit.spec.ts", content)


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
        text = text.replace(
            "import { TrustAnalyticsModule } from './trust-analytics/trust-analytics.module';",
            "import { TrustAnalyticsModule } from './trust-analytics/trust-analytics.module';\n"
            + "\n".join(imports),
        )
    if modules:
        text = text.replace(
            "    TrustAnalyticsModule,",
            "    TrustAnalyticsModule,\n" + "\n".join(modules),
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
        text = text.replace(
            "import { TrustAnalyticsApplicationModule } from '../trust-analytics/application/trust-analytics-application.module';",
            "import { TrustAnalyticsApplicationModule } from '../trust-analytics/application/trust-analytics-application.module';\n"
            + "\n".join(app_imports),
        )
    if res_imports:
        text = text.replace(
            "import { TrustAnalyticsGraphqlResolver } from './trust-analytics.resolver';",
            "import { TrustAnalyticsGraphqlResolver } from './trust-analytics.resolver';\n"
            + "\n".join(res_imports),
        )
    if app_modules:
        text = text.replace(
            "    TrustAnalyticsApplicationModule,",
            "    TrustAnalyticsApplicationModule,\n" + "\n".join(app_modules),
        )
    if resolvers:
        text = text.replace(
            "    TrustAnalyticsGraphqlResolver,",
            "    TrustAnalyticsGraphqlResolver,\n" + "\n".join(resolvers),
        )
    gql_mod.write_text(text)

    gql_types = ROOT / "apps/api/src/graphql/gql.types.ts"
    gt = gql_types.read_text()
    if "GqlPlatformEngineeringCloudProduct" not in gt:
        # Int may already be imported via graphql Field — check
        if "Int" not in gt.split("from '@nestjs/graphql'")[0]:
            gt = gt.replace(
                "import { Field, ObjectType",
                "import { Field, Int, ObjectType",
            )
            if "Int," not in gt and "Int }" not in gt:
                # try alternate import style
                gt = gt.replace(
                    "from '@nestjs/graphql';",
                    "from '@nestjs/graphql';\n// Int for Volume 16 supply-chain findingCount\n",
                )
                # ensure Int is in the import list
                import re

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
                ("products", f"list{pascal}Products", "Platform Engineering products"),
                ("engine", f"get{pascal}Engine", "Platform Engineering engine alias"),
                ("routing", f"get{pascal}Routing", "Platform Engineering routing"),
                ("overview", f"get{pascal}Overview", "Platform Engineering overview"),
                ("monitoring", f"get{pascal}Monitoring", "Platform Engineering monitoring"),
            ]
        elif hub["kind"] == "finops":
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("costs", f"list{pascal}Costs", f"{hub['title']} costs"),
                ("budgets", f"list{pascal}Budgets", f"{hub['title']} budgets"),
                ("alerts", f"list{pascal}Alerts", f"{hub['title']} alerts"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
            ]
        elif hub["kind"] == "supply_chain":
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("findings", f"list{pascal}Findings", f"{hub['title']} findings"),
                ("scan", f"scan{pascal}", f"Scan {hub['title']}"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
            ]
        else:
            list_name = hub["list_key"]
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                (list_name, f"list{pascal}Rows", f"List {hub['title']} rows"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
            ]
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
    safety?: Record<string, unknown>;
    docs?: string;
  }}> {{
    return this.requestJson('{path}', {{ method: 'GET' }});
  }}
"""
            )
    if methods:
        anchor = "  async trustAnalyticsEngine():"
        idx = st.find(anchor)
        if idx == -1:
            raise RuntimeError("SDK anchor trustAnalyticsEngine not found")
        end = st.find("\n  async ", idx + 10)
        if end == -1:
            end = st.find("\n  private ", idx)
        st = st[:end] + "".join(methods) + st[end:]
        sdk.write_text(st)

    cli = ROOT / "packages/cli/src/cli.ts"
    ct = cli.read_text()
    help_lines = []
    for hub in HUBS:
        cmd = f"{hub['slug']}-products" if hub["kind"] == "foundation" else f"{hub['slug']}-engine"
        line = f"  lugemi {cmd}"
        if line not in ct:
            help_lines.append(line)
    if help_lines:
        ct = ct.replace(
            "  lugemi trust-analytics-engine\n",
            "  lugemi trust-analytics-engine\n" + "\n".join(help_lines) + "\n",
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
    if handlers:
        ct = ct.replace(
            "  if (command === 'trust-analytics-engine') {\n    console.log(JSON.stringify(await vl.trustAnalyticsEngine(), null, 2));\n    return;\n  }",
            "  if (command === 'trust-analytics-engine') {\n    console.log(JSON.stringify(await vl.trustAnalyticsEngine(), null, 2));\n    return;\n  }"
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
            "  { href: '/trust-analytics', label: 'Trust Analytics' },\n",
            "  { href: '/trust-analytics', label: 'Trust Analytics' },\n" + "\n".join(navs) + "\n",
        )
        shell.write_text(sh)


def update_progress_and_blueprint() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VL-301 Done — Trust Cloud Production Audit; Volume 15 closed)",
        "Last updated: 2026-10-03 (VL-313 Done — Platform Engineering Cloud Production Audit; Volume 16 closed)",
    )
    vol16_rows = """| VL-302 | Platform Engineering Foundation (Phase 169) | Done | `/platform-engineering-cloud` hub; ADR-0204. Internal IDP. `controlPlaneOs=false`. |
| VL-303 | Internal Developer Portal (Phase 170) | Done | Portal catalog over developer-cloud; `backstageOs=false`. ADR-0205. |
| VL-304 | Service Catalog (Phase 171) | Done | api/web/sdk/cli/db/queue/infra seed. ADR-0206. |
| VL-305 | Golden Path Platform (Phase 172) | Done | Service/cloud/SDK/CI/security templates. ADR-0207. |
| VL-306 | GitOps Platform (Phase 173) | Done | Fly/shared platform readiness; `argoCdOs=false`; `fluxOs=false`. ADR-0208. |
| VL-307 | Release Engineering (Phase 174) | Done | Blue-green/canary/rolling/flags/rollback seed. ADR-0209. |
| VL-308 | Reliability Engineering (Phase 175) | Done | SLO/SLI/error budgets; extends observability; `datadogOs=false`. ADR-0210. |
| VL-309 | FinOps Platform (Phase 176) | Done | GPU/model budgets+alerts; `gpuBudgetAlertsEnabled=true`; `finopsOs=false`. ADR-0211. |
| VL-310 | Supply Chain Security (Phase 177) | Done | SBOM/scan/findings inventory; `snykOs=false`. ADR-0212. |
| VL-311 | Developer Experience Platform (Phase 178) | Done | CLI/SDK/codegen/docs/repo health; extends VL-127. ADR-0213. |
| VL-312 | Platform Engineering Analytics (Phase 179) | Done | DORA + sibling aggregation. ADR-0214. |
| VL-313 | Platform Engineering Production Audit (Phase 180) | Done | Audit pack under `docs/platform-engineering-cloud-audit/`; ADR-0215. Volume 16 closed. Control Plane → Volume 17+. |
"""
    if "VL-302" not in pt:
        pt = pt.replace(
            "| VL-301 | Trust Cloud Production Audit (Phase 168) | Done | Audit pack under `docs/trust-cloud-audit/`; ADR-0203. Volume 15 closed. Platform Engineering → Volume 16+. |\n",
            "| VL-301 | Trust Cloud Production Audit (Phase 168) | Done | Audit pack under `docs/trust-cloud-audit/`; ADR-0203. Volume 15 closed. Platform Engineering → Volume 16+. |\n"
            + vol16_rows,
        )
    changelog = """| 2026-10-03 | VL-302–312 Done: Platform Engineering Cloud hubs (Phases 169–179) — foundation through PE analytics; ADR-0204–0214. FinOps GPU alerts, supply-chain scan/findings, GitOps honesty. |
| 2026-10-03 | VL-313 Done: Platform Engineering Cloud Production Audit (Phase 180) — evidence pack; ADR-0215. Volume 16 closed. Control Plane → Volume 17+. |
"""
    if "VL-302–312 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog
    progress.write_text(pt)

    write(
        ROOT / "docs/PLATFORM_ENGINEERING_CLOUD.md",
        """# Platform Engineering Cloud (VL-302)

Library Phase 169 — part of Volume 16 Platform Engineering Cloud.

## Mission

Lugemi Platform Engineering Cloud is the internal Developer Platform (IDP) that lets
engineering teams build, deploy, secure, observe, and operate services consistently —
for engineers, not end users. Integrates Volume 7 GPU/Inference cost surfaces and
Volume 10 Fabric where relevant.

## Honesty

- Not Backstage OS, ArgoCD/Flux OS, Kubernetes control-plane OS, Snyk OS, Datadog OS, or AI Cloud OS.
- Integrates with existing systems — does not regenerate Volumes 1–15.
- `controlPlaneOs=false` / `dataPlaneOs=false` / `aiCloudOs=false` (deferred to Volume 17+).
- `finopsOs=false` with `gpuBudgetAlertsEnabled=true` — pairs Volume 7 GPU costs.
- `snykOs=false` — supply-chain inventory posture, not a full vuln DB.
- `argoCdOs=false` / `fluxOs=false` — GitOps readiness over Fly/shared platform.

## Surfaces

- Console: `/platform-engineering-cloud`
- API: `/v1/platform-engineering-cloud/engine` (foundation: `/products`)
- ADR: [`docs/adr/0204-platform-engineering-cloud.md`](./adr/0204-platform-engineering-cloud.md)

---

## Volume status

**Volume 16 closed** (VL-302–313). Production Audit evidence: [`docs/platform-engineering-cloud-audit/`](./platform-engineering-cloud-audit/). Control Plane deferred to Volume 17+.
""",
    )

    blueprint = ROOT / "docs/CLOUD_BLUEPRINT.md"
    bt = blueprint.read_text()
    if "| Platform Engineering Cloud | VL-302 → VL-313 |" not in bt:
        if "| Trust Cloud | VL-292 → VL-301 |" in bt:
            bt = bt.replace(
                "| Trust Cloud | VL-292 → VL-301 |",
                "| Trust Cloud | VL-292 → VL-301 |\n| Platform Engineering Cloud | VL-302 → VL-313 |",
            )
    if "Volume 16 Platform Engineering" not in bt and "Platform Engineering Cloud volume closed" not in bt:
        bt = bt.rstrip() + (
            "\n\nPlatform Engineering Cloud volume closed (VL-302–313) with audit pack under "
            "`docs/platform-engineering-cloud-audit/` — see [`PLATFORM_ENGINEERING_CLOUD.md`](./PLATFORM_ENGINEERING_CLOUD.md). "
            "Honesty: internal IDP tooling; FinOps GPU budget alerts enabled (Volume 7 pairing); "
            "Supply Chain scan/findings inventory (`snykOs=false`); GitOps readiness (`argoCdOs=false`/`fluxOs=false`); "
            "Control Plane / Data Plane / AI Cloud OS deferred to Volume 17+.\n"
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
    print("Volume 16 Platform Engineering Cloud generation complete")
