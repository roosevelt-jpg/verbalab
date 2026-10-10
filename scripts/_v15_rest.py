"""Rest of Volume 15 generator — imported by generate_volume15_trust_cloud.py."""

from __future__ import annotations

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
    path.write_text(content, encoding="utf-8")


def adr_doc(hub: dict) -> str:
    return f"""# ADR-{hub["adr"]}: {hub["title"]} (VL-{hub["vl"]})

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-{hub["vl"]} (library Phase {hub["phase"]})

## Context

Volume 15 builds Trust Cloud as the enforcement/governance layer over Policy Runtime, AgentOps, Continuous Learning, Volume 12 consent, and existing honesty surfaces. Risks: inventing Okta/GRC/certification/SIEM/Platform Engineering OS, claiming certification, or leaving Safety/Privacy/Governance unwired.

## Decision

1. Ship `{hub["slug"]}` as a Nest hub with catalog + service + controller + CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`).
3. Integrate with existing systems — do not regenerate Volumes 1–14.
4. Platform Engineering Cloud remains deferred to Volume 16+.

## Consequences

- {hub["title"]} is discoverable under Trust Cloud Foundation.
- Operators can inspect catalogs without false compliance or IdP/OS claims.
"""


FOUNDATION_APP = {
    "messages.ts": """export class GetTrustCloudEngineQuery {}

export class ListTrustCloudProductsQuery {}
""",
    "ports.ts": """/** Application ports for Trust Cloud (VL-292). */

export type TrustCloudProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type TrustCloudEngineBundle = ReturnType<
  import('../trust-cloud.service').TrustCloudService['products']
>;

export interface TrustCloudCatalogPort {
  engine(): TrustCloudEngineBundle;
  listProducts(): TrustCloudProductRow[];
}

export const TRUST_CLOUD_CATALOG_PORT = Symbol('TRUST_CLOUD_CATALOG_PORT');
""",
    "handlers.ts": """import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTrustCloudEngineQuery, ListTrustCloudProductsQuery } from './messages';
import {
  TRUST_CLOUD_CATALOG_PORT,
  TrustCloudCatalogPort,
  TrustCloudEngineBundle,
  TrustCloudProductRow,
} from './ports';

@QueryHandler(GetTrustCloudEngineQuery)
export class GetTrustCloudEngineHandler implements IQueryHandler<GetTrustCloudEngineQuery> {
  constructor(
    @Inject(TRUST_CLOUD_CATALOG_PORT)
    private readonly catalog: TrustCloudCatalogPort,
  ) {}

  execute(): Promise<TrustCloudEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListTrustCloudProductsQuery)
export class ListTrustCloudProductsHandler implements IQueryHandler<ListTrustCloudProductsQuery> {
  constructor(
    @Inject(TRUST_CLOUD_CATALOG_PORT)
    private readonly catalog: TrustCloudCatalogPort,
  ) {}

  execute(): Promise<TrustCloudProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const TRUST_CLOUD_HANDLERS = [GetTrustCloudEngineHandler, ListTrustCloudProductsHandler];
""",
    "nest-trust-cloud.adapter.ts": """import { Injectable } from '@nestjs/common';
import { TrustCloudService } from '../trust-cloud.service';
import {
  TrustCloudCatalogPort,
  TrustCloudEngineBundle,
  TrustCloudProductRow,
} from './ports';

@Injectable()
export class NestTrustCloudCatalogAdapter implements TrustCloudCatalogPort {
  constructor(private readonly service: TrustCloudService) {}

  engine(): TrustCloudEngineBundle {
    return this.service.products();
  }

  listProducts(): TrustCloudProductRow[] {
    return this.service.products().products;
  }
}
""",
    "trust-cloud-application.module.ts": """import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TrustCloudModule } from '../trust-cloud.module';
import { TRUST_CLOUD_CATALOG_PORT } from './ports';
import { NestTrustCloudCatalogAdapter } from './nest-trust-cloud.adapter';
import { TRUST_CLOUD_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, TrustCloudModule],
  providers: [
    NestTrustCloudCatalogAdapter,
    { provide: TRUST_CLOUD_CATALOG_PORT, useExisting: NestTrustCloudCatalogAdapter },
    ...TRUST_CLOUD_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class TrustCloudApplicationModule {}
""",
}
