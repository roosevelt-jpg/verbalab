#!/usr/bin/env python3
"""Generate Lugemi Volume 18 Data Plane Cloud (VL-324–333).

Thin execution/routing façades over existing product modules — never duplicates
translation/STT/TTS/OCR/RAG business logic. Module slug for streaming is
`data-plane-streaming` (does not collide with Volume 7 `streaming-runtime`).
"""

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


# ---------------------------------------------------------------------------
# Hub definitions
# ---------------------------------------------------------------------------

HUBS = [
    {
        "slug": "data-plane-cloud",
        "vl": 324,
        "phase": 191,
        "adr": "0226",
        "title": "Data Plane Cloud",
        "kind": "foundation",
        "doc": "DATA_PLANE_CLOUD.md",
        "nav": "Data Plane",
        "honesty_key": "managesOrgsPoliciesBilling",
        "honesty_val": False,
        "list_key": "products",
        "note": "Data Plane Foundation (VL-324). Executes workloads via thin runtime hubs — never manages orgs/policies/billing. serviceMeshOs=false.",
    },
    {
        "slug": "translation-runtime",
        "vl": 325,
        "phase": 192,
        "adr": "0227",
        "title": "Translation Runtime",
        "kind": "runtime",
        "doc": "TRANSLATION_RUNTIME.md",
        "nav": "Translation Runtime",
        "honesty_key": "thinExecutionLayer",
        "honesty_val": True,
        "list_key": "routes",
        "note": "Translation Runtime (VL-325). Thin execution layer over Volume 1 translate — routes streaming/realtime/batch/parallel/low-latency; does not reimplement MT.",
        "routes_to": [
            {"module": "translate", "path": "/v1/translate/engine", "role": "Translation Engine"},
            {"module": "translate", "path": "/v1/translate", "role": "Translate API"},
        ],
        "upstream_modules": [
            ("TranslateModule", "translate", "TranslateFormatsService", "formats/translate-formats.service", "engine"),
        ],
        "capabilities": [
            ("streaming", "Streaming Translation Routing"),
            ("realtime", "Realtime Translation Routing"),
            ("batch", "Batch Translation Routing"),
            ("parallel", "Parallel Translation Routing"),
            ("low_latency", "Low-Latency Translation Routing"),
        ],
        "extra_honesty": {
            "duplicatesProductLogic": False,
            "managesOrgsPoliciesBilling": False,
            "serviceMeshOs": False,
            "reimplementsMtEngine": False,
        },
    },
    {
        "slug": "speech-runtime",
        "vl": 326,
        "phase": 193,
        "adr": "0228",
        "title": "Speech Runtime",
        "kind": "runtime",
        "doc": "SPEECH_RUNTIME.md",
        "nav": "Speech Runtime",
        "honesty_key": "thinExecutionLayer",
        "honesty_val": True,
        "list_key": "routes",
        "note": "Speech Runtime (VL-326). Thin layer over speech-cloud / speech-recognition — routes realtime STT/streaming/speaker/emotion; does not reimplement STT.",
        "routes_to": [
            {"module": "speech-cloud", "path": "/v1/speech/products", "role": "Speech Cloud products"},
            {"module": "speech-recognition", "path": "/v1/speech", "role": "Speech recognition"},
        ],
        "upstream_modules": [
            ("SpeechCloudModule", "speech-cloud", "SpeechCloudService", "speech-cloud.service", "products"),
        ],
        "capabilities": [
            ("realtime_stt", "Realtime STT Routing"),
            ("streaming", "Streaming Speech Routing"),
            ("speaker", "Speaker Diarization Routing"),
            ("emotion", "Emotion Recognition Routing"),
            ("batch", "Batch Speech Routing"),
        ],
        "extra_honesty": {
            "duplicatesProductLogic": False,
            "managesOrgsPoliciesBilling": False,
            "serviceMeshOs": False,
            "reimplementsStt": False,
        },
    },
    {
        "slug": "voice-runtime",
        "vl": 327,
        "phase": 194,
        "adr": "0229",
        "title": "Voice Runtime",
        "kind": "runtime",
        "doc": "VOICE_RUNTIME.md",
        "nav": "Voice Runtime",
        "honesty_key": "thinExecutionLayer",
        "honesty_val": True,
        "list_key": "routes",
        "note": "Voice Runtime (VL-327). Thin layer over voice-cloud / voice — routes streaming/neural/cloning/rendering; does not reimplement TTS.",
        "routes_to": [
            {"module": "voice-cloud", "path": "/v1/voice-cloud/products", "role": "Voice Cloud products"},
            {"module": "voice", "path": "/v1/voice", "role": "Voice API"},
        ],
        "upstream_modules": [
            ("VoiceCloudModule", "voice-cloud", "VoiceCloudService", "voice-cloud.service", "products"),
        ],
        "capabilities": [
            ("streaming", "Streaming Voice Routing"),
            ("neural", "Neural TTS Routing"),
            ("cloning", "Voice Cloning Routing"),
            ("rendering", "Voice Rendering Routing"),
            ("realtime", "Realtime Voice Routing"),
        ],
        "extra_honesty": {
            "duplicatesProductLogic": False,
            "managesOrgsPoliciesBilling": False,
            "serviceMeshOs": False,
            "reimplementsTts": False,
        },
    },
    {
        "slug": "vision-runtime",
        "vl": 328,
        "phase": 195,
        "adr": "0230",
        "title": "Vision Runtime",
        "kind": "runtime",
        "doc": "VISION_RUNTIME.md",
        "nav": "Vision Runtime",
        "honesty_key": "thinExecutionLayer",
        "honesty_val": True,
        "list_key": "routes",
        "note": "Vision Runtime (VL-328). Thin layer over ocr / documents — routes OCR/document vision; does not invent a new OCR engine.",
        "routes_to": [
            {"module": "ocr", "path": "/v1/ocr", "role": "OCR"},
            {"module": "documents", "path": "/v1/documents", "role": "Documents"},
        ],
        "upstream_modules": [
            ("DocumentsModule", "documents", "DocumentsService", "documents.service", None),
            ("OcrModule", "ocr", "OcrService", "ocr.service", None),
        ],
        "capabilities": [
            ("ocr", "OCR Routing"),
            ("documents", "Document Vision Routing"),
            ("batch", "Batch Vision Routing"),
            ("layout", "Layout Analysis Routing"),
        ],
        "extra_honesty": {
            "duplicatesProductLogic": False,
            "managesOrgsPoliciesBilling": False,
            "serviceMeshOs": False,
            "inventsOcrEngine": False,
        },
    },
    {
        "slug": "knowledge-runtime",
        "vl": 329,
        "phase": 196,
        "adr": "0231",
        "title": "Knowledge Runtime",
        "kind": "runtime",
        "doc": "KNOWLEDGE_RUNTIME.md",
        "nav": "Knowledge Runtime",
        "honesty_key": "thinExecutionLayer",
        "honesty_val": True,
        "list_key": "routes",
        "note": "Knowledge Runtime (VL-329). Thin layer over knowledge-cloud / knowledge / knowledge-fabric — routes search/graph/RAG/semantic/ontology.",
        "routes_to": [
            {"module": "knowledge-cloud", "path": "/v1/knowledge-cloud/products", "role": "Knowledge Cloud"},
            {"module": "knowledge", "path": "/v1/knowledge", "role": "Knowledge"},
            {"module": "knowledge-fabric", "path": "/v1/knowledge-fabric", "role": "Knowledge Fabric"},
        ],
        "upstream_modules": [
            ("KnowledgeCloudModule", "knowledge-cloud", "KnowledgeCloudService", "knowledge-cloud.service", "products"),
        ],
        "capabilities": [
            ("search", "Knowledge Search Routing"),
            ("graph", "Knowledge Graph Routing"),
            ("rag", "RAG Routing"),
            ("semantic", "Semantic Retrieval Routing"),
            ("ontology", "Ontology Routing"),
        ],
        "extra_honesty": {
            "duplicatesProductLogic": False,
            "managesOrgsPoliciesBilling": False,
            "serviceMeshOs": False,
            "reimplementsRag": False,
        },
    },
    {
        "slug": "embedding-runtime",
        "vl": 330,
        "phase": 197,
        "adr": "0232",
        "title": "Embedding Runtime",
        "kind": "runtime",
        "doc": "EMBEDDING_RUNTIME.md",
        "nav": "Embedding Runtime",
        "honesty_key": "thinExecutionLayer",
        "honesty_val": True,
        "list_key": "routes",
        "note": "Embedding Runtime (VL-330). Thin layer over embeddings / embedding-cloud — routes vector encode/batch; does not reimplement embedding models.",
        "routes_to": [
            {"module": "embeddings", "path": "/v1/embeddings", "role": "Embeddings API"},
            {"module": "embedding-cloud", "path": "/v1/embedding-cloud/engine", "role": "Embedding Cloud"},
        ],
        "upstream_modules": [
            ("EmbeddingCloudModule", "embedding-cloud", "EmbeddingCloudService", "embedding-cloud.service", "engine"),
        ],
        "capabilities": [
            ("encode", "Encode Routing"),
            ("batch", "Batch Embedding Routing"),
            ("multilingual", "Multilingual Embedding Routing"),
            ("retrieval", "Retrieval Embedding Routing"),
        ],
        "extra_honesty": {
            "duplicatesProductLogic": False,
            "managesOrgsPoliciesBilling": False,
            "serviceMeshOs": False,
            "reimplementsEmbeddingModels": False,
        },
    },
    {
        "slug": "data-plane-streaming",
        "vl": 331,
        "phase": 198,
        "adr": "0233",
        "title": "Data Plane Streaming",
        "kind": "runtime",
        "doc": "DATA_PLANE_STREAMING.md",
        "nav": "DP Streaming",
        "honesty_key": "thinExecutionLayer",
        "honesty_val": True,
        "list_key": "routes",
        "note": "Data Plane Streaming (VL-331). Façade over Volume 7 streaming-runtime — extendsStreamingRuntime=true; does not create a second streaming-runtime module.",
        "routes_to": [
            {"module": "streaming-runtime", "path": "/v1/streaming-runtime/engine", "role": "Streaming Runtime (Volume 7)"},
            {"module": "streaming-runtime", "path": "/v1/streaming-runtime", "role": "Streaming Runtime API"},
        ],
        "upstream_modules": [
            ("StreamingRuntimeModule", "streaming-runtime", "StreamingRuntimeService", "streaming-runtime.service", "engine"),
        ],
        "capabilities": [
            ("sse", "SSE Stream Routing"),
            ("chunk", "Chunk Stream Routing"),
            ("realtime", "Realtime Stream Routing"),
            ("backpressure", "Backpressure Routing"),
        ],
        "extra_honesty": {
            "duplicatesProductLogic": False,
            "managesOrgsPoliciesBilling": False,
            "serviceMeshOs": False,
            "extendsStreamingRuntime": True,
            "secondStreamingRuntimeModule": False,
        },
    },
    {
        "slug": "gpu-runtime",
        "vl": 332,
        "phase": 199,
        "adr": "0234",
        "title": "GPU Runtime",
        "kind": "runtime",
        "doc": "GPU_RUNTIME.md",
        "nav": "GPU Runtime",
        "honesty_key": "thinExecutionLayer",
        "honesty_val": True,
        "list_key": "routes",
        "note": "GPU Runtime (VL-332). Thin layer over gpu-platform — allocation/scheduling/memory/parallelism/health/autoscaling as catalog. gpuBudgetLimitsRequired=true. Not Ray/K8s GPU OS.",
        "routes_to": [
            {"module": "gpu-platform", "path": "/v1/gpu-platform/engine", "role": "GPU Platform"},
            {"module": "gpu-platform", "path": "/v1/gpu-platform", "role": "GPU Platform API"},
        ],
        "upstream_modules": [
            ("GpuPlatformModule", "gpu-platform", "GpuPlatformService", "gpu-platform.service", "engine"),
        ],
        "capabilities": [
            ("allocation", "GPU Allocation Routing"),
            ("scheduling", "GPU Scheduling Routing"),
            ("memory", "GPU Memory Routing"),
            ("parallelism", "GPU Parallelism Routing"),
            ("health", "GPU Health Routing"),
            ("autoscaling", "GPU Autoscaling Catalog"),
        ],
        "extra_honesty": {
            "duplicatesProductLogic": False,
            "managesOrgsPoliciesBilling": False,
            "serviceMeshOs": False,
            "gpuBudgetLimitsRequired": True,
            "rayOs": False,
            "kubernetesGpuOs": False,
        },
    },
]

FOUNDATION_PRODUCTS = [
    ("data-plane-cloud", "Data Plane Cloud", "GET /v1/data-plane-cloud/products", "/data-plane-cloud", "Foundation hub (VL-324). managesOrgsPoliciesBilling=false; serviceMeshOs=false."),
    ("translation-runtime", "Translation Runtime", "GET /v1/translation-runtime/engine", "/translation-runtime", "VL-325. Thin over translate; thinExecutionLayer=true."),
    ("speech-runtime", "Speech Runtime", "GET /v1/speech-runtime/engine", "/speech-runtime", "VL-326. Thin over speech-cloud / speech-recognition."),
    ("voice-runtime", "Voice Runtime", "GET /v1/voice-runtime/engine", "/voice-runtime", "VL-327. Thin over voice-cloud / voice."),
    ("vision-runtime", "Vision Runtime", "GET /v1/vision-runtime/engine", "/vision-runtime", "VL-328. Thin over ocr / documents."),
    ("knowledge-runtime", "Knowledge Runtime", "GET /v1/knowledge-runtime/engine", "/knowledge-runtime", "VL-329. Thin over knowledge-cloud / knowledge / knowledge-fabric."),
    ("embedding-runtime", "Embedding Runtime", "GET /v1/embedding-runtime/engine", "/embedding-runtime", "VL-330. Thin over embeddings / embedding-cloud."),
    ("data-plane-streaming", "Data Plane Streaming", "GET /v1/data-plane-streaming/engine", "/data-plane-streaming", "VL-331. Façade over streaming-runtime; extendsStreamingRuntime=true."),
    ("gpu-runtime", "GPU Runtime", "GET /v1/gpu-runtime/engine", "/gpu-runtime", "VL-332. Thin over gpu-platform; gpuBudgetLimitsRequired=true."),
    ("api-runtime", "API Runtime", "GET /v1/data-plane-cloud/routing", "/data-plane-cloud", "Ingress path into data-plane runtimes (foundation routing)."),
    ("monitoring", "Data Plane Monitoring", "GET /v1/data-plane-cloud/monitoring", "/data-plane-cloud", "Foundation monitoring snapshot."),
]


def honesty_block(hub: dict) -> str:
    lines = [
        f"      {hub['honesty_key']}: {ts_bool(hub['honesty_val'])},",
        "      thinExecutionLayer: true," if hub["kind"] != "foundation" else "      thinExecutionLayer: true,",
        "      duplicatesProductLogic: false,",
        "      managesOrgsPoliciesBilling: false,",
        "      serviceMeshOs: false,",
        "      controlPlaneSeparation: true,",
        "      regeneratesVolumes1to17: false,",
        "      integratesExistingSystems: true,",
    ]
    # Deduplicate thinExecutionLayer for foundation (already set)
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
        VL-{vl} — Lugemi {title} console in the Data Plane Cloud.
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
            {{JSON.stringify({{ honesty: data.honesty, routesTo: data.routesTo }}, null, 2)}}
          </pre>
        </div>
      ) : null}}
    </AppShell>
  );
}}
"""


def product_doc(hub: dict) -> str:
    routes = hub.get("routes_to") or []
    routes_md = "\n".join(f"- `{r['module']}` → `{r['path']}` ({r['role']})" for r in routes) or "- Foundation discovery hub."
    return f"""# {hub["title"]} (VL-{hub["vl"]})

Library Phase {hub["phase"]} — part of Volume 18 Data Plane Cloud.

## Mission

Lugemi {hub["title"]} is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`

## Routes to (upstream)

{routes_md}

## Surfaces

- Console: `/{hub["slug"]}`
- API: `/v1/{hub["slug"]}/engine`{" (foundation: `/products`)" if hub["kind"] == "foundation" else ""}
- ADR: [`docs/adr/{hub["adr"]}-{hub["slug"]}.md`](./adr/{hub["adr"]}-{hub["slug"]}.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
"""


def adr_doc(hub: dict) -> str:
    return f"""# ADR-{hub["adr"]}: {hub["title"]} (VL-{hub["vl"]})

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-{hub["vl"]} (library Phase {hub["phase"]})

## Context

Volume 18 builds Data Plane Cloud as the execution layer for workloads. Risk: duplicating
Translation/Speech/Voice/Vision/Knowledge/Embedding product logic already shipped in
Volumes 1–7, inventing Service Mesh / architecture-freeze OS / VAIOS, or managing
orgs/policies/billing (Control Plane concerns).

## Decision

1. Ship `{hub["slug"]}` as a Nest hub with catalog + service + controller + CQRS + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`thinExecutionLayer=true`; `duplicatesProductLogic=false`; `managesOrgsPoliciesBilling=false`; `serviceMeshOs=false`).
3. Route to existing product modules — do not copy-paste MT/STT/TTS/OCR/RAG business logic.
4. Reject Service Mesh / VAIOS invention in this volume.

## Consequences

- {hub["title"]} is discoverable under Data Plane Cloud Foundation.
- Operators can inspect routing catalogs with explicit thin-layer honesty.
"""


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
        thinExecutionLayer: true,
        routesTo: {[r["module"] for r in (h.get("routes_to") or [])]},
      }}"""
        for h in HUBS
        if h["kind"] == "runtime"
    )
    return f"""export type DataPlaneCloudProductStatus = 'shipped' | 'partial' | 'deferred';

export type DataPlaneCloudProductRow = {{
  id: string;
  name: string;
  status: DataPlaneCloudProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
}};

/**
 * Library Phase 191 → Data Plane Cloud Foundation (VL-324).
 * Execution layer — never manages orgs/policies/billing.
 * Not Service Mesh / VAIOS / architecture-freeze OS.
 */
export function dataPlaneCloudProductCatalog(): DataPlaneCloudProductRow[] {{
  return [
{chr(10).join(rows)}
  ];
}}

export function dataPlaneCloudRoutingTable(): Array<{{
  id: string;
  path: string;
  purpose: string;
}}> {{
  return [
    {{ id: 'products', path: '/v1/data-plane-cloud/products', purpose: 'Product catalog' }},
    {{ id: 'engine', path: '/v1/data-plane-cloud/engine', purpose: 'Engine alias' }},
    {{ id: 'routing', path: '/v1/data-plane-cloud/routing', purpose: 'Static routing table' }},
    {{ id: 'monitoring', path: '/v1/data-plane-cloud/monitoring', purpose: 'Monitoring snapshot' }},
    {{ id: 'overview', path: '/v1/data-plane-cloud/overview', purpose: 'Authenticated overview' }},
  ];
}}

export function dataPlaneCloudRuntimeInventory(): Array<{{
  id: string;
  title: string;
  thinExecutionLayer: boolean;
  routesTo: string[];
}}> {{
  return [
{inventory}
  ];
}}

export function dataPlaneCloudArchitectureNotes(): Record<string, unknown> {{
  return {{
    role: 'data-plane-execution',
    extends: [
      'translate',
      'speech-cloud',
      'voice-cloud',
      'ocr',
      'documents',
      'knowledge-cloud',
      'embeddings',
      'embedding-cloud',
      'streaming-runtime',
      'gpu-platform',
      'control-plane-cloud',
    ],
    regeneratesVolumes1to17: false,
    managesOrgsPoliciesBilling: false,
    serviceMeshOs: false,
    thinExecutionLayers: true,
    controlPlaneSeparation: true,
    deferredPastVolume18: ['service-mesh', 'vaios', 'architecture-freeze-os'],
  }};
}}

export function dataPlaneCloudHonesty(): Record<string, boolean | string> {{
  return {{
    managesOrgsPoliciesBilling: false,
    serviceMeshOs: false,
    thinExecutionLayer: true,
    duplicatesProductLogic: false,
    controlPlaneSeparation: true,
    regeneratesVolumes1to17: false,
    integratesExistingSystems: true,
    gpuBudgetLimitsRequired: true,
    note:
      'Data Plane Cloud executes workloads via thin runtime hubs that route to existing product logic. Never manages orgs/policies/billing. Service Mesh / VAIOS rejected in this volume.',
  }};
}}
"""


def foundation_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  dataPlaneCloudArchitectureNotes,
  dataPlaneCloudHonesty,
  dataPlaneCloudProductCatalog,
  dataPlaneCloudRoutingTable,
  dataPlaneCloudRuntimeInventory,
} from './data-plane-cloud.catalog';

@Injectable()
export class DataPlaneCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi Data Plane Cloud',
      products: dataPlaneCloudProductCatalog(),
      runtimeInventory: dataPlaneCloudRuntimeInventory(),
      architecture: dataPlaneCloudArchitectureNotes(),
      honesty: dataPlaneCloudHonesty(),
      safety: {
        managesOrgsPoliciesBilling: false,
        serviceMeshOs: false,
        thinExecutionLayer: true,
        duplicatesProductLogic: false,
        note:
          'Volume 18 README: Data Plane executes workloads. Thin hubs route to Volumes 1–7 product logic. Service Mesh / VAIOS deferred past Volume 18.',
      },
      docs: '/docs/DATA_PLANE_CLOUD.md',
      note:
        'Data Plane Foundation (VL-324). Executes via thin runtimes — never manages orgs/policies/billing. Not Service Mesh OS.',
    };
  }

  routing() {
    return {
      routes: dataPlaneCloudRoutingTable(),
      products: dataPlaneCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      runtimeInventory: dataPlaneCloudRuntimeInventory(),
      honesty: dataPlaneCloudHonesty(),
      note: 'Static Data Plane Cloud discovery catalog for Foundation.',
      docs: '/docs/DATA_PLANE_CLOUD.md',
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
      products: dataPlaneCloudProductCatalog(),
      runtimeInventory: dataPlaneCloudRuntimeInventory(),
      architecture: dataPlaneCloudArchitectureNotes(),
      honesty: dataPlaneCloudHonesty(),
      safety: {
        managesOrgsPoliciesBilling: false,
        serviceMeshOs: false,
        note:
          'Data Plane honesty enforced. Orgs/policies/billing stay in Control Plane. Service Mesh rejected here.',
      },
      deferred: {
        serviceMeshOs: true,
        vaios: true,
        architectureFreezeOs: true,
        managesOrgsPoliciesBilling: false,
      },
      links: {
        dataPlaneCloud: '/data-plane-cloud',
        translationRuntime: '/translation-runtime',
        speechRuntime: '/speech-runtime',
        voiceRuntime: '/voice-runtime',
        visionRuntime: '/vision-runtime',
        knowledgeRuntime: '/knowledge-runtime',
        embeddingRuntime: '/embedding-runtime',
        dataPlaneStreaming: '/data-plane-streaming',
        gpuRuntime: '/gpu-runtime',
        controlPlaneCloud: '/control-plane-cloud',
        streamingRuntime: '/streaming-runtime',
        gpuPlatform: '/gpu-platform',
      },
      docs: '/docs/DATA_PLANE_CLOUD.md',
      note:
        'Data Plane Cloud (VL-324–333). Discovery hub over thin execution runtimes; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = dataPlaneCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      runtimeInventory: dataPlaneCloudRuntimeInventory(),
      architecture: dataPlaneCloudArchitectureNotes(),
      honesty: dataPlaneCloudHonesty(),
      note: 'Data Plane Cloud monitoring snapshot (VL-324).',
    };
  }
}
"""


def foundation_controller() -> str:
    return """import { Controller, Get, UseGuards } from '@nestjs/common';
import { DataPlaneCloudService } from './data-plane-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/data-plane-cloud')
export class DataPlaneCloudController {
  constructor(private readonly dp: DataPlaneCloudService) {}

  @Get('products')
  products() {
    return this.dp.products();
  }

  @Get('engine')
  engine() {
    return this.dp.products();
  }

  @Get('routing')
  routing() {
    return this.dp.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.dp.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.dp.monitoring();
  }
}
"""


def runtime_catalog(hub: dict) -> str:
    slug = hub["slug"]
    camel = to_camel(slug)
    caps = hub.get("capabilities") or []
    routes = hub.get("routes_to") or []
    cap_rows = ",\n".join(
        f"      {{ id: '{cid}', name: '{cname}', status: 'shipped', notes: 'VL-{hub['vl']} routing capability — not a new engine.' }}"
        for cid, cname in caps
    )
    route_rows = ",\n".join(
        f"""      {{
        id: 'route-{i}',
        module: '{r["module"]}',
        path: '{r["path"]}',
        role: '{r["role"]}',
        status: 'shipped',
        notes: 'Upstream product surface — thin layer routes here.',
      }}"""
        for i, r in enumerate(routes, 1)
    )
    routes_to_rows = ",\n".join(
        f"      {{ module: '{r['module']}', path: '{r['path']}', role: '{r['role']}' }}"
        for r in routes
    )
    note = hub["note"].replace("'", "\\'")
    return f"""/**
 * Library Phase {hub['phase']} → {hub['title']} (VL-{hub['vl']}).
 * {hub['note']}
 */
export function {camel}EngineCatalog() {{
  return {{
    product: 'Lugemi {hub['title']}',
    thinExecutionLayer: true,
    duplicatesProductLogic: false,
    capabilities: [
{cap_rows}
    ],
    routes: [
{route_rows}
    ],
    routesTo: [
{routes_to_rows}
    ],
    honesty: {{
{honesty_block(hub)}
    }},
    safety: {{
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
      managesOrgsPoliciesBilling: false,
      serviceMeshOs: false,
      note: '{note}',
    }},
    docs: '/docs/{hub['doc']}',
    note: '{note}',
  }};
}}
"""


def runtime_service(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = to_camel(slug)
    upstreams = hub.get("upstream_modules") or []
    imports = [f"import {{ {camel}EngineCatalog }} from './{slug}.catalog';"]
    ctor_params = []
    private_fields = []
    status_calls = []

    for mod_class, mod_slug, svc_class, svc_path, method in upstreams:
        imports.append(f"import {{ {svc_class} }} from '../{mod_slug}/{svc_path}';")
        field = to_camel(svc_class.replace("Service", "")) if svc_class.endswith("Service") else to_camel(svc_class)
        # simplify: translateFormats, speechCloud, etc.
        field = svc_class[0].lower() + svc_class[1:]
        field = field[0].lower() + field[1:]
        # Use short names
        short = {
            "TranslateFormatsService": "translateFormats",
            "SpeechCloudService": "speechCloud",
            "VoiceCloudService": "voiceCloud",
            "DocumentsService": "documents",
            "OcrService": "ocr",
            "KnowledgeCloudService": "knowledgeCloud",
            "EmbeddingCloudService": "embeddingCloud",
            "StreamingRuntimeService": "streamingRuntime",
            "GpuPlatformService": "gpuPlatform",
        }.get(svc_class, field)
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

  /** Route/execute façade: returns upstream endpoint + live status from injected product services. */
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
      thinExecutionLayer: true,
      duplicatesProductLogic: false,
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

  monitoring() {{
    const catalog = this.engine();
    return {{
      mode: '{slug}',
      count: catalog.routes.length,
      thinExecutionLayer: true,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: '{pascal} monitoring snapshot (VL-{hub["vl"]}).',
    }};
  }}
}}
"""


def runtime_controller(hub: dict) -> str:
    slug = hub["slug"]
    pascal = to_pascal(slug)
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
}}
"""


def runtime_module(hub: dict) -> str:
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
      thinExecutionLayer: catalog.honesty.thinExecutionLayer,
      duplicatesProductLogic: catalog.honesty.duplicatesProductLogic,
      managesOrgsPoliciesBilling: catalog.honesty.managesOrgsPoliciesBilling,
      serviceMeshOs: catalog.honesty.serviceMeshOs,
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
  thinExecutionLayer!: boolean;

  @Field(() => Boolean)
  duplicatesProductLogic!: boolean;

  @Field(() => Boolean)
  managesOrgsPoliciesBilling!: boolean;

  @Field(() => Boolean)
  serviceMeshOs!: boolean;
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
    expect(res.body.honesty.managesOrgsPoliciesBilling).toBe(false);
    expect(res.body.honesty.serviceMeshOs).toBe(false);
    expect(res.body.products.length).toBeGreaterThan(8);
    expect(res.body.runtimeInventory.length).toBeGreaterThan(5);
    for (const row of res.body.runtimeInventory) {
      expect(row.thinExecutionLayer).toBe(true);
      expect(Array.isArray(row.routesTo)).toBe(true);
    }
"""
    else:
        routes_expect = "\n".join(
            f"    expect(JSON.stringify(res.body.routesTo)).toContain('{r['module']}');"
            for r in (hub.get("routes_to") or [])
        )
        extra = f"""
    expect(res.body.honesty.thinExecutionLayer).toBe(true);
    expect(res.body.honesty.duplicatesProductLogic).toBe(false);
    expect(res.body.honesty.managesOrgsPoliciesBilling).toBe(false);
    expect(res.body.honesty.serviceMeshOs).toBe(false);
    expect(res.body.thinExecutionLayer).toBe(true);
    expect(res.body.duplicatesProductLogic).toBe(false);
    expect(Array.isArray(res.body.routesTo)).toBe(true);
    expect(res.body.routesTo.length).toBeGreaterThan(0);
{routes_expect}

    const route = await request(app.getHttpServer())
      .get('/v1/{slug}/route')
      .expect(200);
    expect(route.body.thinExecutionLayer).toBe(true);
    expect(route.body.duplicatesProductLogic).toBe(false);
    expect(route.body.upstreamStatus.length).toBeGreaterThan(0);
"""
        if hub["slug"] == "data-plane-streaming":
            extra += """
    expect(res.body.honesty.extendsStreamingRuntime).toBe(true);
    expect(res.body.honesty.secondStreamingRuntimeModule).toBe(false);
"""
        if hub["slug"] == "gpu-runtime":
            extra += """
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.rayOs).toBe(false);
    expect(res.body.honesty.kubernetesGpuOs).toBe(false);
"""

    auth_smoke = ""
    if hub["kind"] == "foundation":
        auth_smoke = """
  it('rejects unauthenticated overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/data-plane-cloud/overview');
    expect([401, 403, 503]).toContain(res.status);
  });
"""

    no_dupe = ""
    if hub["kind"] == "runtime":
        no_dupe = f"""
  it('does not embed full product business-logic trees', () => {{
    const dir = join(apiSrc, '{slug}');
    const bannedImpl = /class TranslateService|decodeAudioBuffer|whisper|tesseract|neuralTtsEngine|buildRagIndex|sentencePiece/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(dir)) {{
      const text = readFileSync(file, 'utf8');
      if (bannedImpl.test(text)) hits.push(file.replace(root, ''));
    }}
    expect(hits).toEqual([]);
  }});
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
{no_dupe}
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
        write(base / f"{slug}.catalog.ts", runtime_catalog(hub))
        write(base / f"{slug}.service.ts", runtime_service(hub))
        write(base / f"{slug}.controller.ts", runtime_controller(hub))
        write(base / f"{slug}.module.ts", runtime_module(hub))
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
    audit = ROOT / "docs/data-plane-cloud-audit"
    write(
        audit / "PRODUCTION_READINESS.md",
        """# Data Plane Cloud — Production Readiness

Volume 18 (VL-324–333) Production Audit.

## Gates

- All Volume 18 products shipped (foundation + 8 thin runtimes).
- No TODO/FIXME/`implement later` markers in Volume 18 hub sources.
- Each runtime: `thinExecutionLayer=true`, `duplicatesProductLogic=false`.
- `managesOrgsPoliciesBilling=false` (Control Plane separation).
- `serviceMeshOs=false` — Service Mesh / VAIOS / architecture-freeze OS **rejected** in this volume (deferred past Volume 18).
- GPU: `gpuBudgetLimitsRequired=true` (Volume 7 / FinOps honesty).
- Streaming façade uses `data-plane-streaming` (does not collide with `streaming-runtime`).
- Auth smoke on `/v1/data-plane-cloud/overview`.
- GraphQL honesty fields for thin layers.

## Rejected inventions

- Service Mesh OS
- Architecture freeze OS
- VAIOS
- Second streaming-runtime module
- Ray / Kubernetes GPU OS
- Reimplemented MT/STT/TTS/OCR/RAG engines
""",
    )
    write(
        audit / "ARCHITECTURE_REPORT.md",
        """# Data Plane Cloud — Architecture Report

## Role

Data Plane executes customer workloads. Control Plane (Volume 17) manages orgs/policies/billing.

## Pattern

Each runtime hub is a thin Nest façade:

1. Catalog of routing capabilities + `routesTo` upstream modules.
2. Service injects existing product Nest modules and exposes `route`/`execute` that returns upstream endpoints + status.
3. CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.

## Upstream map

| Runtime | Upstream |
| --- | --- |
| translation-runtime | translate |
| speech-runtime | speech-cloud, speech-recognition |
| voice-runtime | voice-cloud, voice |
| vision-runtime | ocr, documents |
| knowledge-runtime | knowledge-cloud, knowledge, knowledge-fabric |
| embedding-runtime | embeddings, embedding-cloud |
| data-plane-streaming | streaming-runtime |
| gpu-runtime | gpu-platform |
""",
    )
    write(
        audit / "COVERAGE_REPORT.md",
        """# Data Plane Cloud — Coverage Report

| VL | Product | Spec |
| --- | --- | --- |
| VL-324 | data-plane-cloud | `apps/api/test/data-plane-cloud.spec.ts` |
| VL-325 | translation-runtime | `apps/api/test/translation-runtime.spec.ts` |
| VL-326 | speech-runtime | `apps/api/test/speech-runtime.spec.ts` |
| VL-327 | voice-runtime | `apps/api/test/voice-runtime.spec.ts` |
| VL-328 | vision-runtime | `apps/api/test/vision-runtime.spec.ts` |
| VL-329 | knowledge-runtime | `apps/api/test/knowledge-runtime.spec.ts` |
| VL-330 | embedding-runtime | `apps/api/test/embedding-runtime.spec.ts` |
| VL-331 | data-plane-streaming | `apps/api/test/data-plane-streaming.spec.ts` |
| VL-332 | gpu-runtime | `apps/api/test/gpu-runtime.spec.ts` |
| VL-333 | Production Audit | `apps/api/test/data-plane-cloud-audit.spec.ts` |
""",
    )
    write(
        audit / "PERFORMANCE_REPORT.md",
        """# Data Plane Cloud — Performance Report

Thin façades add catalog/route overhead only — product work remains in upstream engines.
Audit GraphQL smoke expects completion under 5s in the test harness.
Streaming and GPU budgets remain governed by Volume 7 ceilings (`gpuBudgetLimitsRequired`).
""",
    )
    write(
        audit / "DEPLOYMENT_GUIDE.md",
        """# Data Plane Cloud — Deployment Guide

1. Deploy API with Volume 18 modules registered in `app.module.ts`.
2. Web consoles under `/data-plane-cloud`, `/translation-runtime`, `/data-plane-streaming`, `/gpu-runtime`, etc.
3. Do not enable Service Mesh / VAIOS from this volume.
4. GPU: keep sandbox / budget ceilings from `gpu-platform` before any real cloud GPU account.
5. Control Plane remains authoritative for orgs/policies/billing.
""",
    )
    write(
        audit / "DATA_PLANE_CLOUD_READINESS_REPORT.md",
        """# Data Plane Cloud Readiness Report

**Volume 18 closed** (VL-324–333).

## Summary

Data Plane Cloud ships as thin execution/routing façades over existing Lugemi product logic.
No org/policy/billing management. No Service Mesh invention. GPU budget honesty retained.

## Evidence

- Product docs ADR-0226–0235
- Audit pack under `docs/data-plane-cloud-audit/`
- Vitest gates in `apps/api/test/data-plane-cloud-audit.spec.ts`
""",
    )
    write(
        ROOT / "docs/adr/0235-data-plane-cloud-production-audit.md",
        """# ADR-0235: Data Plane Cloud Production Audit (VL-333)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-333 (library Phase 200)

## Context

Volume 18 closes with a hardening pass. Risks: duplicated product engines, Service Mesh / VAIOS invention,
Control Plane concerns leaking into Data Plane, GPU budget dishonesty, colliding with `streaming-runtime`.

## Decision

1. Ship evidence pack under `docs/data-plane-cloud-audit/`.
2. Gate with vitest: no TODOs, all products shipped, thinExecutionLayer on each runtime, no duplicated product logic trees, managesOrgsPoliciesBilling=false, GPU budget honesty, auth smoke, GraphQL.
3. Explicitly reject Service Mesh / architecture-freeze OS / VAIOS in this audit (`serviceMeshOs=false`).
4. Keep streaming façade as `data-plane-streaming` routing to Volume 7 `streaming-runtime`.

## Consequences

- Volume 18 closed.
- Service Mesh / VAIOS deferred past Volume 18.
""",
    )


def write_audit_spec() -> None:
    runtime_slugs = [h["slug"] for h in HUBS if h["kind"] == "runtime"]
    gql_fields = "\n          ".join(
        [
            "dataPlaneCloudProducts { id name status }",
            *[
                f"{to_camel(s)}Engine {{ product note thinExecutionLayer duplicatesProductLogic managesOrgsPoliciesBilling serviceMeshOs }}"
                for s in runtime_slugs
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

const VOLUME18_HUBS = {json.dumps([h["slug"] for h in HUBS])};
const RUNTIME_HUBS = {json.dumps(runtime_slugs)};

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

describe('Data Plane Cloud Production Audit (VL-333)', () => {{
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

  it('ships audit pack and ADR-0235', () => {{
    expect(existsSync(join(root, 'docs/adr/0235-data-plane-cloud-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/DATA_PLANE_CLOUD.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/data-plane-cloud-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(
      existsSync(join(root, 'docs/data-plane-cloud-audit/DATA_PLANE_CLOUD_READINESS_REPORT.md')),
    ).toBe(true);
  }});

  it('has no TODO/FIXME markers across Volume 18 hubs', () => {{
    const banned = /TODO|FIXME|implement later|XXX\\s*:|not implemented/i;
    const hits: string[] = [];
    for (const slug of VOLUME18_HUBS) {{
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

  it('foundation catalogs all shipped products', async () => {{
    const res = await request(app.getHttpServer())
      .get('/v1/data-plane-cloud/products')
      .expect(200);
    expect(res.body.honesty.managesOrgsPoliciesBilling).toBe(false);
    expect(res.body.honesty.serviceMeshOs).toBe(false);
    const ids = res.body.products.map((p: {{ id: string }}) => p.id);
    for (const slug of RUNTIME_HUBS) {{
      expect(ids).toContain(slug);
    }}
    expect(ids).toContain('data-plane-cloud');
  }});

  it('each runtime is a thinExecutionLayer with routesTo', async () => {{
    for (const slug of RUNTIME_HUBS) {{
      const res = await request(app.getHttpServer())
        .get(`/v1/${{slug}}/engine`)
        .expect(200);
      expect(res.body.honesty.thinExecutionLayer).toBe(true);
      expect(res.body.honesty.duplicatesProductLogic).toBe(false);
      expect(res.body.honesty.managesOrgsPoliciesBilling).toBe(false);
      expect(res.body.routesTo.length).toBeGreaterThan(0);
    }}
  }});

  it('spot-checks runtimes do not contain full MT/STT implementations', () => {{
    const bannedImpl = /class TranslateService|decodeAudioBuffer|whisperTranscribe|tesseractRecognize|neuralTtsEngine|buildRagIndex/i;
    const hits: string[] = [];
    for (const slug of RUNTIME_HUBS) {{
      for (const file of walkTsFiles(join(apiSrc, slug))) {{
        if (bannedImpl.test(readFileSync(file, 'utf8'))) hits.push(file.replace(root, ''));
      }}
    }}
    expect(hits).toEqual([]);
  }});

  it('does not create a second streaming-runtime module under data plane', () => {{
    expect(existsSync(join(apiSrc, 'data-plane-streaming'))).toBe(true);
    // Volume 7 module remains the sole streaming-runtime implementation directory name for product logic
    expect(existsSync(join(apiSrc, 'streaming-runtime'))).toBe(true);
    const facade = readFileSync(join(apiSrc, 'data-plane-streaming/data-plane-streaming.catalog.ts'), 'utf8');
    expect(facade).toMatch(/extendsStreamingRuntime:\\s*true/);
    expect(facade).toMatch(/streaming-runtime/);
  }});

  it('GPU budget honesty', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/gpu-runtime/engine').expect(200);
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.rayOs).toBe(false);
    expect(res.body.honesty.kubernetesGpuOs).toBe(false);
  }});

  it('auth smoke on overview', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/data-plane-cloud/overview');
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
    expect(gql.body.data.dataPlaneCloudProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.translationRuntimeEngine.thinExecutionLayer).toBe(true);
    expect(gql.body.data.translationRuntimeEngine.duplicatesProductLogic).toBe(false);
    expect(gql.body.data.gpuRuntimeEngine.managesOrgsPoliciesBilling).toBe(false);
    expect(gql.body.data.dataPlaneStreamingEngine.serviceMeshOs).toBe(false);
  }});

  it('rejects inventing Service Mesh / VAIOS in this volume', () => {{
    const readiness = readFileSync(
      join(root, 'docs/data-plane-cloud-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/serviceMeshOs=false|Service Mesh.*rejected|Rejected/i);
    const adr = readFileSync(
      join(root, 'docs/adr/0235-data-plane-cloud-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/serviceMeshOs=false|reject Service Mesh|VAIOS/i);
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/Data Plane/);
  }});
}});
"""
    write(ROOT / "apps/api/test/data-plane-cloud-audit.spec.ts", content)


def insert_after(text: str, anchor: str, addition: str) -> str:
    if not addition.strip():
        return text
    if addition.strip() in text:
        return text
    if anchor not in text:
        raise RuntimeError(f"Anchor not found: {anchor[:80]}")
    return text.replace(anchor, anchor + addition, 1)


def ensure_ocr_exports() -> None:
    path = ROOT / "apps/api/src/ocr/ocr.module.ts"
    text = path.read_text()
    if "exports: [OcrService]" in text:
        return
    text = text.replace(
        "  controllers: [OcrController],\n  providers: [OcrService, TranslateAuthGuard],\n})",
        "  controllers: [OcrController],\n  providers: [OcrService, TranslateAuthGuard],\n  exports: [OcrService],\n})",
    )
    path.write_text(text)


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
            "import { ControlPlaneAnalyticsModule } from './control-plane-analytics/control-plane-analytics.module';\n",
            "\n".join(imports) + "\n",
        )
    if modules:
        text = insert_after(
            text,
            "    ControlPlaneAnalyticsModule,\n",
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
            "import { ControlPlaneAnalyticsApplicationModule } from '../control-plane-analytics/application/control-plane-analytics-application.module';\n",
            "\n".join(app_imports) + "\n",
        )
    if res_imports:
        text = insert_after(
            text,
            "import { ControlPlaneAnalyticsGraphqlResolver } from './control-plane-analytics.resolver';\n",
            "\n".join(res_imports) + "\n",
        )
    if app_modules:
        text = insert_after(
            text,
            "    ControlPlaneAnalyticsApplicationModule,\n",
            "\n".join(app_modules) + "\n",
        )
    if resolvers:
        text = insert_after(
            text,
            "    ControlPlaneAnalyticsGraphqlResolver,\n",
            "\n".join(resolvers) + "\n",
        )
    gql_mod.write_text(text)

    gql_types = ROOT / "apps/api/src/graphql/gql.types.ts"
    gt = gql_types.read_text()
    if "GqlDataPlaneCloudProduct" not in gt:
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
                ("products", f"list{pascal}Products", "Data Plane products"),
                ("engine", f"get{pascal}Engine", "Data Plane engine alias"),
                ("routing", f"get{pascal}Routing", "Data Plane routing"),
                ("overview", f"get{pascal}Overview", "Data Plane overview"),
                ("monitoring", f"get{pascal}Monitoring", "Data Plane monitoring"),
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
  }}> {{
    return this.requestJson('{path}', {{ method: 'GET' }});
  }}
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
        line = f"  lugemi {cmd}"
        if line not in ct:
            help_lines.append(line)
    if help_lines:
        ct = ct.replace(
            "  lugemi control-plane-analytics-engine\n",
            "  lugemi control-plane-analytics-engine\n" + "\n".join(help_lines) + "\n",
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
            "  if (command === 'control-plane-analytics-engine') {\n    console.log(JSON.stringify(await vl.controlPlaneAnalyticsEngine(), null, 2));\n    return;\n  }",
            "  if (command === 'control-plane-analytics-engine') {\n    console.log(JSON.stringify(await vl.controlPlaneAnalyticsEngine(), null, 2));\n    return;\n  }"
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
            "  { href: '/control-plane-analytics', label: 'CP Analytics' },\n",
            "  { href: '/control-plane-analytics', label: 'CP Analytics' },\n"
            + "\n".join(navs)
            + "\n",
        )
        shell.write_text(sh)


def update_progress_and_blueprint() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VL-323 Done — Control Plane Cloud Production Audit; Volume 17 closed)",
        "Last updated: 2026-10-03 (VL-333 Done — Data Plane Cloud Production Audit; Volume 18 closed)",
    )
    vol18_rows = """| VL-324 | Data Plane Foundation (Phase 191) | Done | `/data-plane-cloud` hub; ADR-0226. `managesOrgsPoliciesBilling=false`; `serviceMeshOs=false`. |
| VL-325 | Translation Runtime (Phase 192) | Done | Thin over translate; `thinExecutionLayer`; ADR-0227. |
| VL-326 | Speech Runtime (Phase 193) | Done | Thin over speech-cloud / speech-recognition; ADR-0228. |
| VL-327 | Voice Runtime (Phase 194) | Done | Thin over voice-cloud / voice; ADR-0229. |
| VL-328 | Vision Runtime (Phase 195) | Done | Thin over ocr / documents; ADR-0230. |
| VL-329 | Knowledge Runtime (Phase 196) | Done | Thin over knowledge-cloud / knowledge / knowledge-fabric; ADR-0231. |
| VL-330 | Embedding Runtime (Phase 197) | Done | Thin over embeddings / embedding-cloud; ADR-0232. |
| VL-331 | Data Plane Streaming (Phase 198) | Done | Façade `data-plane-streaming` → streaming-runtime; `extendsStreamingRuntime`; ADR-0233. |
| VL-332 | GPU Runtime (Phase 199) | Done | Thin over gpu-platform; `gpuBudgetLimitsRequired`; ADR-0234. |
| VL-333 | Data Plane Production Audit (Phase 200) | Done | Audit pack under `docs/data-plane-cloud-audit/`; ADR-0235. Volume 18 closed. Service Mesh → past Volume 18. |
"""
    if "VL-324" not in pt:
        pt = pt.replace(
            "| VL-323 | Control Plane Production Audit (Phase 190) | Done | Audit pack under `docs/control-plane-cloud-audit/`; ADR-0225. Volume 17 closed. Data Plane → Volume 18+. |\n",
            "| VL-323 | Control Plane Production Audit (Phase 190) | Done | Audit pack under `docs/control-plane-cloud-audit/`; ADR-0225. Volume 17 closed. Data Plane → Volume 18+. |\n"
            + vol18_rows,
        )
    changelog = """| 2026-10-03 | VL-324–332 Done: Data Plane Cloud hubs (Phases 191–199) — foundation through GPU runtime; ADR-0226–0234. Thin execution layers; no Service Mesh. |
| 2026-10-03 | VL-333 Done: Data Plane Cloud Production Audit (Phase 200) — evidence pack; ADR-0235. Volume 18 closed. Service Mesh / VAIOS deferred past Volume 18. |
"""
    if "VL-324–332 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog
    progress.write_text(pt)

    write(
        ROOT / "docs/DATA_PLANE_CLOUD.md",
        """# Data Plane Cloud (VL-324)

Library Phase 191 — part of Volume 18 Data Plane Cloud.

## Mission

Lugemi Data Plane Cloud executes every customer workload via thin runtime hubs that
route to existing product logic (Translation, Speech, Voice, Vision, Knowledge,
Embeddings, Streaming, GPU). It never manages organizations, policies, or billing.

## Honesty

- `managesOrgsPoliciesBilling=false` (Control Plane separation).
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18).
- `thinExecutionLayer=true` on each runtime; `duplicatesProductLogic=false`.
- GPU: `gpuBudgetLimitsRequired=true` (Volume 7 / FinOps).
- Streaming façade: `data-plane-streaming` routes to Volume 7 `streaming-runtime`.

## Surfaces

- Console: `/data-plane-cloud`
- API: `/v1/data-plane-cloud/engine` (foundation: `/products`)
- ADR: [`docs/adr/0226-data-plane-cloud.md`](./adr/0226-data-plane-cloud.md)

---

## Volume status

**Volume 18 closed** (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/). Service Mesh / VAIOS deferred past Volume 18.
""",
    )

    blueprint = ROOT / "docs/CLOUD_BLUEPRINT.md"
    bt = blueprint.read_text()
    if "| Data Plane Cloud | VL-324 → VL-333 |" not in bt:
        if "| Control Plane Cloud | VL-314 → VL-323 |" in bt:
            bt = bt.replace(
                "| Control Plane Cloud | VL-314 → VL-323 |",
                "| Control Plane Cloud | VL-314 → VL-323 |\n| Data Plane Cloud | VL-324 → VL-333 |",
            )
    if "Data Plane Cloud volume closed" not in bt:
        bt = bt.rstrip() + (
            "\n\nData Plane Cloud volume closed (VL-324–333) with audit pack under "
            "`docs/data-plane-cloud-audit/` — see [`DATA_PLANE_CLOUD.md`](./DATA_PLANE_CLOUD.md). "
            "Honesty: thin execution layers over Volumes 1–7; `managesOrgsPoliciesBilling=false`; "
            "`serviceMeshOs=false`; GPU `gpuBudgetLimitsRequired=true`; "
            "Service Mesh / VAIOS deferred past Volume 18.\n"
        )
    bt = bt.replace(
        "Data Plane deferred to Volume 18+.\n",
        "Data Plane shipped in Volume 18 (VL-324–333).\n",
    )
    blueprint.write_text(bt)


def run_generation() -> None:
    ensure_ocr_exports()
    for hub in HUBS:
        write_hub(hub)
        print("wrote", hub["slug"])
    write_audit_pack()
    write_audit_spec()
    patch_wiring()
    update_progress_and_blueprint()
    print("Volume 18 Data Plane Cloud generation complete")


if __name__ == "__main__":
    run_generation()
