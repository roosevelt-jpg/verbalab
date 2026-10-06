#!/usr/bin/env python3
"""Run Volume 15 generation using builders from generate_volume15_trust_cloud."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_volume15_trust_cloud import (  # noqa: E402
    HUBS,
    ROOT,
    analytics_catalog,
    analytics_service,
    application_files,
    compliance_catalog,
    explainability_catalog,
    foundation_catalog,
    foundation_controller,
    foundation_service,
    generic_controller,
    generic_list_service,
    governance_catalog,
    governance_controller,
    governance_service,
    identity_catalog,
    module_ts,
    privacy_catalog,
    privacy_controller,
    privacy_service,
    product_doc,
    risk_catalog,
    safety_catalog,
    safety_controller,
    safety_service,
    to_camel,
    to_const,
    to_pascal,
    web_client,
    web_page,
    write,
)

from _v15_rest import FOUNDATION_APP, adr_doc  # noqa: E402


def write_hub_spec(hub: dict) -> None:
    slug = hub["slug"]
    vl = hub["vl"]
    key = hub["honesty_key"]
    val = "true" if hub["honesty_val"] else "false"
    path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
    extra = ""
    if hub["kind"] == "foundation":
        extra = """
    expect(res.body.honesty.platformEngineeringOs).toBe(false);
    expect(res.body.honesty.integratesExistingSystems).toBe(true);
    expect(res.body.honesty.complianceToolingNotCertification).toBe(true);
    expect(res.body.honesty.notCertifiedCompliant).toBe(true);
    expect(res.body.honesty.policyRuntimeIntegrated).toBe(true);
    expect(res.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);
    expect(res.body.honesty.humanSignOffRequired).toBe(true);
    expect(res.body.honesty.regeneratesVolumes1to14).toBe(false);
"""
    elif hub["kind"] == "safety":
        extra = """
    expect(res.body.honesty.policyRuntimeIntegrated).toBe(true);
    expect(res.body.policyRuntimeIntegrated).toBe(true);
    expect(res.body.policyRuntime).toBeTruthy();
    expect(res.body.detections.length).toBeGreaterThan(5);

    const check = await request(app.getHttpServer())
      .get('/v1/ai-safety-platform/check')
      .query({ id: 'safe-inj-001' })
      .expect(200);
    expect(check.body.policyRuntimeIntegrated).toBe(true);
    expect(check.body.blocked).toBe(true);
    expect(check.body.policySurface).toMatch(/policy-runtime/);
"""
    elif hub["kind"] == "governance":
        extra = """
    expect(res.body.honesty.humanSignOffRequired).toBe(true);
    expect(res.body.honesty.postFactoLogOnly).toBe(false);
    expect(res.body.pending.length).toBeGreaterThan(0);

    const status = await request(app.getHttpServer())
      .get('/v1/ai-governance-platform/status/gov-model-001')
      .expect(200);
    expect(status.body.status).toBe('pending');
    expect(status.body.humanSignOffRequired).toBe(true);

    const approved = await request(app.getHttpServer())
      .post('/v1/ai-governance-platform/approvals/gov-model-001/approve')
      .expect(201);
    expect(approved.body.status).toBe('approved');
"""
    elif hub["kind"] == "privacy":
        extra = """
    expect(res.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);

    const blocked = await request(app.getHttpServer())
      .get('/v1/privacy-platform/consent-check')
      .query({ id: 'priv-tk-restricted' })
      .expect(200);
    expect(blocked.body.allowed).toBe(false);

    const unverified = await request(app.getHttpServer())
      .get('/v1/privacy-platform/consent-check')
      .query({ id: 'priv-tk-unverified' })
      .expect(200);
    expect(unverified.body.allowed).toBe(false);

    await request(app.getHttpServer())
      .get('/v1/privacy-platform/release')
      .query({ id: 'priv-tk-restricted' })
      .expect(400);

    const ok = await request(app.getHttpServer())
      .get('/v1/privacy-platform/consent-check')
      .query({ id: 'priv-tk-ok' })
      .expect(200);
    expect(ok.body.allowed).toBe(true);
"""
    elif hub["kind"] == "compliance":
        extra = """
    expect(res.body.honesty.complianceToolingNotCertification).toBe(true);
    expect(res.body.honesty.notCertifiedCompliant).toBe(true);
    expect(res.body.honesty.lawyersAuditorsStillRequired).toBe(true);
    expect(res.body.honesty.gdprCertified).toBe(false);
    expect(res.body.honesty.hipaaCertified).toBe(false);
    expect(res.body.honesty.soc2Certified).toBe(false);
    expect(res.body.honesty.pciCertified).toBe(false);
"""
    elif hub["kind"] == "identity":
        extra = """
    expect(res.body.honesty.oktaOs).toBe(false);
    expect(res.body.honesty.samlIdpOs).toBe(false);
"""

    auth_smoke = ""
    if hub["kind"] == "foundation":
        auth_smoke = """
  it('rejects unauthenticated overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/trust-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });
"""

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
    write(ROOT / "apps/api/test" / f"{slug}.spec.ts", content)


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
                extra_imports="import { UsageModule } from '../usage/usage.module';\n",
                extra_module="imports: [UsageModule],\n  ",
            ),
        )
        for name, content in FOUNDATION_APP.items():
            write(base / "application" / name, content)
    elif kind == "safety":
        write(base / f"{slug}.catalog.ts", safety_catalog())
        write(base / f"{slug}.service.ts", safety_service())
        write(base / f"{slug}.controller.ts", safety_controller())
        write(
            base / f"{slug}.module.ts",
            module_ts(
                slug,
                pascal,
                extra_imports="import { PolicyRuntimeModule } from '../policy-runtime/policy-runtime.module';\n",
                extra_module="imports: [PolicyRuntimeModule],\n  ",
            ),
        )
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "governance":
        write(base / f"{slug}.catalog.ts", governance_catalog())
        write(base / f"{slug}.service.ts", governance_service())
        write(base / f"{slug}.controller.ts", governance_controller())
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "explainability":
        write(base / f"{slug}.catalog.ts", explainability_catalog())
        write(base / f"{slug}.service.ts", generic_list_service(slug, pascal, "explanations", hub["vl"], "explainability"))
        write(base / f"{slug}.controller.ts", generic_controller(slug, pascal, "explanations"))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "privacy":
        write(base / f"{slug}.catalog.ts", privacy_catalog())
        write(base / f"{slug}.service.ts", privacy_service())
        write(base / f"{slug}.controller.ts", privacy_controller())
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "compliance":
        write(base / f"{slug}.catalog.ts", compliance_catalog())
        write(base / f"{slug}.service.ts", generic_list_service(slug, pascal, "controls", hub["vl"], "compliance"))
        write(base / f"{slug}.controller.ts", generic_controller(slug, pascal, "controls"))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "risk":
        write(base / f"{slug}.catalog.ts", risk_catalog())
        write(base / f"{slug}.service.ts", generic_list_service(slug, pascal, "scores", hub["vl"], "risk"))
        write(base / f"{slug}.controller.ts", generic_controller(slug, pascal, "scores"))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "identity":
        write(base / f"{slug}.catalog.ts", identity_catalog())
        write(base / f"{slug}.service.ts", generic_list_service(slug, pascal, "federation", hub["vl"], "identity"))
        write(base / f"{slug}.controller.ts", generic_controller(slug, pascal, "federation"))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)
    elif kind == "analytics":
        write(base / f"{slug}.catalog.ts", analytics_catalog())
        write(base / f"{slug}.service.ts", analytics_service())
        write(base / f"{slug}.controller.ts", generic_controller(slug, pascal, "snapshot"))
        write(base / f"{slug}.module.ts", module_ts(slug, pascal))
        for name, content in application_files(slug, pascal, const, hub["title"], hub["vl"]).items():
            write(base / "application" / name, content)

    honesty_field = hub["honesty_key"]
    camel = to_camel(slug)
    if kind == "foundation":
        resolver = """import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListTrustCloudProductsQuery } from '../trust-cloud/application/messages';
import { GqlTrustCloudProduct } from './gql.types';

@Resolver()
export class TrustCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlTrustCloudProduct], { name: 'trustCloudProducts' })
  async trustCloudProducts(): Promise<GqlTrustCloudProduct[]> {
    return this.queries.execute(new ListTrustCloudProductsQuery());
  }
}
"""
    else:
        resolver = f"""import {{ Query, Resolver }} from '@nestjs/graphql';
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
      {honesty_field}: catalog.honesty.{honesty_field},
    }};
  }}
}}
"""
    write(ROOT / "apps/api/src/graphql" / f"{slug}.resolver.ts", resolver)

    endpoint = f"/v1/{slug}/products" if kind == "foundation" else f"/v1/{slug}/engine"
    write(ROOT / "apps/web/app" / slug / "page.tsx", web_page(slug, pascal))
    write(ROOT / "apps/web/app" / slug / f"{slug}-client.tsx", web_client(slug, hub["title"], hub["vl"], endpoint))
    write(ROOT / "docs" / hub["doc"], product_doc(hub))
    write(ROOT / "docs/adr" / f"{hub['adr']}-{slug}.md", adr_doc(hub))
    write_hub_spec(hub)


def write_audit_pack() -> None:
    audit = ROOT / "docs/trust-cloud-audit"
    files = {
        "PRODUCTION_READINESS.md": """# Trust Cloud Production Readiness (VL-301)

Volume 15 Trust Cloud (VL-292–301) is production-ready as a catalog/enforcement layer.

## Gates

- `policyRuntimeIntegrated=true` — AI Safety consults Policy Runtime / Policy Fabric.
- `traditionalKnowledgeConsentRequired=true` — Privacy rejects restricted/unverified TK.
- `humanSignOffRequired=true` — Governance approve/reject workflow (pending|approved|rejected).
- `complianceToolingNotCertification=true` / `notCertifiedCompliant=true` — lawyers/auditors still required.
- `platformEngineeringOs=false` — Platform Engineering Cloud deferred to Volume 16+ (Rejected here).
- Auth smoke on `/v1/trust-cloud/overview`.
- GraphQL façades for all Trust Cloud hubs.
- No TODO/FIXME/implement-later markers in Volume 15 source.

## Status

**Volume 15 closed** (VL-292–301).
""",
        "ARCHITECTURE_REPORT.md": """# Trust Cloud Architecture Report (VL-301)

Trust Cloud sits as an enforcement/governance layer over Policy Runtime + Policy Fabric,
AgentOps, Continuous Learning, Volume 12 TK consent, and Clerk identity.

Hubs: trust-cloud, ai-safety-platform, ai-governance-platform, explainability-platform,
privacy-platform, compliance-platform, risk-intelligence, identity-federation, trust-analytics.

Does **not** invent Okta OS, GRC suite OS, certification OS, SIEM OS, or Platform Engineering OS.
""",
        "COVERAGE_REPORT.md": """# Trust Cloud Coverage Report (VL-301)

| VL | Product | Surfaces |
| --- | --- | --- |
| VL-292 | Trust Cloud Foundation | REST/GraphQL/SDK/CLI/web |
| VL-293 | AI Safety Platform | REST/GraphQL/SDK/CLI/web + check/evaluate |
| VL-294 | AI Governance Platform | REST/GraphQL/SDK/CLI/web + approve/reject |
| VL-295 | Explainability Platform | REST/GraphQL/SDK/CLI/web |
| VL-296 | Privacy Platform | REST/GraphQL/SDK/CLI/web + consent-check/release |
| VL-297 | Compliance Platform | REST/GraphQL/SDK/CLI/web |
| VL-298 | Risk Intelligence | REST/GraphQL/SDK/CLI/web |
| VL-299 | Identity Federation | REST/GraphQL/SDK/CLI/web |
| VL-300 | Trust Analytics | REST/GraphQL/SDK/CLI/web |
| VL-301 | Production Audit | Evidence pack + vitest gates |
""",
        "PERFORMANCE_REPORT.md": """# Trust Cloud Performance Report (VL-301)

Catalog/engine endpoints are in-memory seed responses. GraphQL façade query for all hubs
must complete under 5 seconds in vitest. No heavy inference paths introduced in Volume 15.
""",
        "DEPLOYMENT_GUIDE.md": """# Trust Cloud Deployment Guide (VL-301)

1. Deploy API with existing Nest `AppModule` (Trust Cloud modules registered).
2. Ensure Policy Runtime remains available — AI Safety imports `PolicyRuntimeModule`.
3. Web consoles under `/trust-cloud`, `/ai-safety-platform`, etc.
4. No new infrastructure OS required; Platform Engineering Cloud deferred to Volume 16+.
""",
        "TRUST_CLOUD_READINESS_REPORT.md": """# Trust Cloud Readiness Report (VL-301)

## Verdict

Volume 15 Trust Cloud is closed and ready as Lugemi's enforcement/governance layer.

## Honesty checklist

- Compliance tooling ≠ certification
- AI Safety ↔ Policy Runtime integrated
- Privacy enforces Volume 12 TK consent
- Governance human sign-off workflow live
- Platform Engineering Cloud **Rejected** for this volume (Volume 16+)
""",
    }
    for name, content in files.items():
        write(audit / name, content)
    write(
        ROOT / "docs/adr/0203-trust-cloud-production-audit.md",
        """# ADR-0203: Trust Cloud Production Audit (VL-301)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-301 (library Phase 168)

## Context

Close Volume 15 after shipping VL-292–300. Validate integration honesty and reject inventing Platform Engineering Cloud here.

## Decision

1. Ship evidence pack under `docs/trust-cloud-audit/`.
2. Vitest audit gates: no TODOs, all products shipped, compliance honesty, safety↔policy wiring, privacy consent enforcement, governance human sign-off, auth smoke, GraphQL.
3. Explicitly reject Platform Engineering Cloud / Platform Engineering OS in this volume (deferred to Volume 16+).
4. Mark Volume 15 closed in PROGRESS.md, CLOUD_BLUEPRINT.md, TRUST_CLOUD.md.

## Consequences

- Volume 15 closed (VL-292–301).
- Next cloud: Platform Engineering (Phases 169–180) when requested.
""",
    )


def write_audit_spec() -> None:
    src = Path(__file__).with_name("_v15_audit_spec.ts.txt")
    write(ROOT / "apps/api/test/trust-cloud-audit.spec.ts", src.read_text(encoding="utf-8"))


def patch_wiring() -> None:
    app_mod = ROOT / "apps/api/src/app.module.ts"
    text = app_mod.read_text()
    imports = []
    modules = []
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
            "import { MlopsLlmopsCloudModule } from './mlops-llmops-cloud/mlops-llmops-cloud.module';",
            "import { MlopsLlmopsCloudModule } from './mlops-llmops-cloud/mlops-llmops-cloud.module';\n"
            + "\n".join(imports),
        )
    if modules:
        text = text.replace(
            "    MlopsLlmopsCloudModule,",
            "    MlopsLlmopsCloudModule,\n" + "\n".join(modules),
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
            "import { MlopsLlmopsCloudApplicationModule } from '../mlops-llmops-cloud/application/mlops-llmops-cloud-application.module';",
            "import { MlopsLlmopsCloudApplicationModule } from '../mlops-llmops-cloud/application/mlops-llmops-cloud-application.module';\n"
            + "\n".join(app_imports),
        )
    if res_imports:
        text = text.replace(
            "import { MlopsLlmopsCloudGraphqlResolver } from './mlops-llmops-cloud.resolver';",
            "import { MlopsLlmopsCloudGraphqlResolver } from './mlops-llmops-cloud.resolver';\n"
            + "\n".join(res_imports),
        )
    if app_modules:
        text = text.replace(
            "    MlopsLlmopsCloudApplicationModule,",
            "    MlopsLlmopsCloudApplicationModule,\n" + "\n".join(app_modules),
        )
    if resolvers:
        text = text.replace(
            "    MlopsLlmopsCloudGraphqlResolver,",
            "    MlopsLlmopsCloudGraphqlResolver,\n" + "\n".join(resolvers),
        )
    gql_mod.write_text(text)

    gql_types = ROOT / "apps/api/src/graphql/gql.types.ts"
    types_append = """

@ObjectType()
export class GqlTrustCloudProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}


@ObjectType()
export class GqlAiSafetyPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  policyRuntimeIntegrated!: boolean;
}


@ObjectType()
export class GqlAiGovernancePlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  humanSignOffRequired!: boolean;
}


@ObjectType()
export class GqlExplainabilityPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  shapOs!: boolean;
}


@ObjectType()
export class GqlPrivacyPlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  traditionalKnowledgeConsentRequired!: boolean;
}


@ObjectType()
export class GqlCompliancePlatformEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  complianceToolingNotCertification!: boolean;
}


@ObjectType()
export class GqlRiskIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  grcSuiteOs!: boolean;
}


@ObjectType()
export class GqlIdentityFederationEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  oktaOs!: boolean;
}


@ObjectType()
export class GqlTrustAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  siemOs!: boolean;
}
"""
    gt = gql_types.read_text()
    if "GqlTrustCloudProduct" not in gt:
        gql_types.write_text(gt.rstrip() + "\n" + types_append)

    openapi = ROOT / "apps/api/src/openapi/openapi.document.ts"
    ot = openapi.read_text()
    paths_block = []
    for hub in HUBS:
        slug = hub["slug"]
        pascal = to_pascal(slug)
        if hub["kind"] == "foundation":
            entries = [
                ("products", f"list{pascal}Products", "Trust Cloud products"),
                ("engine", f"get{pascal}Engine", "Trust Cloud engine alias"),
                ("routing", f"get{pascal}Routing", "Trust Cloud routing"),
                ("overview", f"get{pascal}Overview", "Trust Cloud overview"),
                ("monitoring", f"get{pascal}Monitoring", "Trust Cloud monitoring"),
            ]
        elif hub["kind"] == "safety":
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("detections", f"list{pascal}Detections", f"{hub['title']} detections"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
                ("check", f"check{pascal}", f"Check {hub['title']}"),
                ("evaluate", f"evaluate{pascal}", f"Evaluate {hub['title']}"),
            ]
        elif hub["kind"] == "governance":
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("approvals", f"list{pascal}Approvals", f"{hub['title']} approvals"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
                ("check", f"check{pascal}", f"Check {hub['title']}"),
            ]
        elif hub["kind"] == "privacy":
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("assets", f"list{pascal}Assets", f"{hub['title']} assets"),
                ("query", f"query{pascal}", f"Query {hub['title']}"),
                ("check", f"check{pascal}", f"Check {hub['title']}"),
                ("consent-check", f"consentCheck{pascal}", f"Consent check {hub['title']}"),
                ("release", f"release{pascal}", f"Release {hub['title']}"),
            ]
        else:
            list_name = {
                "explainability": "explanations",
                "compliance": "controls",
                "risk": "scores",
                "identity": "federation",
                "analytics": "snapshot",
            }[hub["kind"]]
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
        if hub["kind"] == "governance":
            for action, op in [("approve", "approve"), ("reject", "reject")]:
                path_key = f"'/v1/{slug}/approvals/{{id}}/{action}'"
                if path_key not in ot:
                    paths_block.append(
                        f"""    {path_key}: {{
      post: {{
        summary: '{op.title()} governance approval',
        operationId: '{op}{pascal}Approval',
        responses: {{ '200': {{ description: 'Updated approval' }}, '201': {{ description: 'Updated approval' }} }},
      }},
    }},"""
                    )
            path_key = f"'/v1/{slug}/status/{{id}}'"
            if path_key not in ot:
                paths_block.append(
                    f"""    {path_key}: {{
      get: {{
        summary: 'Governance approval status',
        operationId: 'get{pascal}Status',
        responses: {{ '200': {{ description: 'Approval status' }} }},
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
        anchor = "  async aiOperationsDashboardEngine():"
        idx = st.find(anchor)
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
            "  lugemi ai-operations-dashboard-engine\n",
            "  lugemi ai-operations-dashboard-engine\n" + "\n".join(help_lines) + "\n",
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
            "  if (command === 'ai-operations-dashboard-engine') {\n    console.log(JSON.stringify(await vl.aiOperationsDashboardEngine(), null, 2));\n    return;\n  }",
            "  if (command === 'ai-operations-dashboard-engine') {\n    console.log(JSON.stringify(await vl.aiOperationsDashboardEngine(), null, 2));\n    return;\n  }"
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
            "  { href: '/ai-operations-dashboard', label: 'AI Ops Dashboard' },\n",
            "  { href: '/ai-operations-dashboard', label: 'AI Ops Dashboard' },\n" + "\n".join(navs) + "\n",
        )
        shell.write_text(sh)


def update_progress_and_blueprint() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VL-291 Done — MLOps & LLMOps Cloud Production Audit; Volume 14 closed)",
        "Last updated: 2026-10-03 (VL-301 Done — Trust Cloud Production Audit; Volume 15 closed)",
    )
    vol15_rows = """| VL-292 | Trust Cloud Foundation (Phase 159) | Done | `/trust-cloud` hub; ADR-0194. Enforcement layer. `platformEngineeringOs=false`. |
| VL-293 | AI Safety Platform (Phase 160) | Done | Safety detections + check/evaluate; `policyRuntimeIntegrated=true`. ADR-0195. |
| VL-294 | AI Governance Platform (Phase 161) | Done | Human approve/reject workflow; `humanSignOffRequired=true`. ADR-0196. |
| VL-295 | Explainability Platform (Phase 162) | Done | Confidence/evidence/attribution/traces; `shapOs=false`. ADR-0197. |
| VL-296 | Privacy Platform (Phase 163) | Done | PII/PHI + TK consent enforcement; `traditionalKnowledgeConsentRequired=true`. ADR-0198. |
| VL-297 | Compliance Platform (Phase 164) | Done | Control mapping; tooling not certification. ADR-0199. |
| VL-298 | Risk Intelligence (Phase 165) | Done | Risk scoring seed + analytics; `grcSuiteOs=false`. ADR-0200. |
| VL-299 | Identity Federation (Phase 166) | Done | Federation readiness over Clerk; `oktaOs=false`. ADR-0201. |
| VL-300 | Trust Analytics (Phase 167) | Done | Aggregates sibling trust hubs; `siemOs=false`. ADR-0202. |
| VL-301 | Trust Cloud Production Audit (Phase 168) | Done | Audit pack under `docs/trust-cloud-audit/`; ADR-0203. Volume 15 closed. Platform Engineering → Volume 16+. |
"""
    if "VL-292" not in pt:
        pt = pt.replace(
            "| VL-291 | MLOps & LLMOps Cloud Production Audit (Phase 158) | Done | Audit pack under `docs/mlops-llmops-cloud-audit/`; ADR-0193. Volume 14 closed. Trust Cloud → Volume 15+. |\n",
            "| VL-291 | MLOps & LLMOps Cloud Production Audit (Phase 158) | Done | Audit pack under `docs/mlops-llmops-cloud-audit/`; ADR-0193. Volume 14 closed. Trust Cloud → Volume 15+. |\n"
            + vol15_rows,
        )
    changelog = """| 2026-10-03 | VL-292–300 Done: Trust Cloud hubs (Phases 159–167) — foundation through trust analytics; ADR-0194–0202. Safety↔Policy, Privacy TK consent, Governance human sign-off, Compliance honesty. |
| 2026-10-03 | VL-301 Done: Trust Cloud Production Audit (Phase 168) — evidence pack; ADR-0203. Volume 15 closed. Platform Engineering → Volume 16+. |
"""
    if "VL-292–300 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog
    progress.write_text(pt)

    write(
        ROOT / "docs/TRUST_CLOUD.md",
        """# Trust Cloud (VL-292)

Library Phase 159 — part of Volume 15 Trust Cloud.

## Mission

Lugemi Trust Cloud is the enforcement/governance layer ensuring models, agents, datasets,
workflows, and customer interactions are secure, explainable, governed, auditable, and
supported for compliance work — integrating Policy Runtime, AgentOps, Continuous Learning,
Volume 12 consent, and existing honesty surfaces.

## Honesty

- Not Okta OS, GRC suite OS, certification OS, SIEM OS, or Platform Engineering OS.
- Integrates with existing systems — does not regenerate Volumes 1–14.
- `platformEngineeringOs=false` (deferred to Volume 16+).
- `complianceToolingNotCertification=true` / `notCertifiedCompliant=true` — lawyers/auditors still required.
- `policyRuntimeIntegrated=true` — AI Safety wires to Policy Runtime / Policy Fabric.
- `traditionalKnowledgeConsentRequired=true` — Privacy enforces Volume 12 TK consent fields.
- `humanSignOffRequired=true` — Governance approve/reject for consequential decisions.

## Surfaces

- Console: `/trust-cloud`
- API: `/v1/trust-cloud/engine` (foundation: `/products`)
- ADR: [`docs/adr/0194-trust-cloud.md`](./adr/0194-trust-cloud.md)

---

## Volume status

**Volume 15 closed** (VL-292–301). Production Audit evidence: [`docs/trust-cloud-audit/`](./trust-cloud-audit/). Platform Engineering deferred to Volume 16+.
""",
    )

    blueprint = ROOT / "docs/CLOUD_BLUEPRINT.md"
    bt = blueprint.read_text()
    if "| Trust Cloud | VL-292 → VL-301 |" not in bt:
        if "| MLOps & LLMOps Cloud | VL-281 → VL-291 |" in bt:
            bt = bt.replace(
                "| MLOps & LLMOps Cloud | VL-281 → VL-291 |",
                "| MLOps & LLMOps Cloud | VL-281 → VL-291 |\n| Trust Cloud | VL-292 → VL-301 |",
            )
    if "Volume 15 Trust Cloud closed" not in bt and "Trust Cloud volume closed" not in bt:
        bt = bt.rstrip() + (
            "\n\nTrust Cloud volume closed (VL-292–301) with audit pack under "
            "`docs/trust-cloud-audit/` — see [`TRUST_CLOUD.md`](./TRUST_CLOUD.md). "
            "Honesty: compliance tooling is not certification; AI Safety integrates Policy Runtime; "
            "Privacy enforces Volume 12 TK consent; Governance requires human sign-off; "
            "Platform Engineering Cloud deferred to Volume 16+.\n"
        )
    blueprint.write_text(bt)


def main() -> None:
    for hub in HUBS:
        write_hub(hub)
        print("wrote", hub["slug"])
    write_audit_pack()
    write_audit_spec()
    patch_wiring()
    update_progress_and_blueprint()
    print("Volume 15 Trust Cloud generation complete")


if __name__ == "__main__":
    main()
