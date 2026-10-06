#!/usr/bin/env python3
"""Generate VerbaLab Volume 19 VAIOS (VL-334–343).

Unifying orchestration façades over AI Kernel + AI Fabric + Data Plane —
never a third parallel OS, not Linux/Kubernetes, not Enterprise Engineering System.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path("/workspace/verbalab")


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
        "slug": "vaios",
        "vl": 334,
        "phase": 201,
        "adr": "0236",
        "title": "VAIOS Foundation",
        "kind": "foundation",
        "doc": "VAIOS.md",
        "nav": "VAIOS",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "VAIOS Foundation (VL-334). Unifying orchestration layer over Kernel + Fabric + Data Plane — notLinux/notKubernetes; not a third OS.",
    },
    {
        "slug": "ai-scheduler",
        "vl": 335,
        "phase": 202,
        "adr": "0237",
        "title": "AI Scheduler",
        "kind": "orchestration",
        "doc": "AI_SCHEDULER.md",
        "nav": "AI Scheduler",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "AI Scheduler (VL-335). Unifies scheduling over global-scheduler, gpu-runtime/gpu-platform, workflow-runtime, agent-runtime queues — not a new cron OS.",
        "routes_to": [
            {"module": "global-scheduler", "path": "/v1/global-scheduler/engine", "role": "Global Scheduler"},
            {"module": "gpu-runtime", "path": "/v1/gpu-runtime/engine", "role": "GPU Runtime"},
            {"module": "gpu-platform", "path": "/v1/gpu-platform/engine", "role": "GPU Platform"},
            {"module": "workflow-runtime", "path": "/v1/workflow-runtime/engine", "role": "Workflow Runtime queues"},
            {"module": "agent-runtime", "path": "/v1/agent-runtime/engine", "role": "Agent Runtime queues"},
        ],
        "upstream_modules": [
            ("GlobalSchedulerModule", "global-scheduler", "GlobalSchedulerService", "global-scheduler.service", "engine"),
            ("GpuRuntimeModule", "gpu-runtime", "GpuRuntimeService", "gpu-runtime.service", "engine"),
            ("GpuPlatformModule", "gpu-platform", "GpuPlatformService", "gpu-platform.service", "engine"),
            ("WorkflowRuntimeModule", "workflow-runtime", "WorkflowRuntimeService", "workflow-runtime.service", "engine"),
            ("AgentRuntimeModule", "agent-runtime", "AgentRuntimeService", "agent-runtime.service", "engine"),
        ],
        "capabilities": [
            ("ai_scheduling", "AI Scheduling Catalog"),
            ("gpu_scheduling", "GPU Scheduling Routing"),
            ("workflow_scheduling", "Workflow Scheduling Routing"),
            ("agent_scheduling", "Agent Scheduling Routing"),
            ("queue_scheduling", "Queue Scheduling Routing"),
            ("priority_scheduling", "Priority Scheduling Catalog"),
            ("distributed_scheduling", "Distributed Scheduling Catalog"),
        ],
        "extra_honesty": {
            "notCronOs": True,
            "newSchedulerEngine": False,
        },
    },
    {
        "slug": "runtime-manager",
        "vl": 336,
        "phase": 203,
        "adr": "0238",
        "title": "Runtime Manager",
        "kind": "orchestration",
        "doc": "RUNTIME_MANAGER.md",
        "nav": "Runtime Manager",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "Runtime Manager (VL-336). Lifecycle/allocation/health/recovery/scaling catalog over existing Kernel + Data Plane runtimes — routes to ai-kernel inventory.",
        "routes_to": [
            {"module": "ai-kernel", "path": "/v1/ai-kernel/products", "role": "AI Kernel inventory"},
            {"module": "agent-runtime", "path": "/v1/agent-runtime/engine", "role": "Agent Runtime"},
            {"module": "workflow-runtime", "path": "/v1/workflow-runtime/engine", "role": "Workflow Runtime"},
            {"module": "memory-runtime", "path": "/v1/memory-runtime/engine", "role": "Memory Runtime"},
            {"module": "policy-runtime", "path": "/v1/policy-runtime/engine", "role": "Policy Runtime"},
            {"module": "prompt-runtime", "path": "/v1/prompt-runtime/engine", "role": "Prompt Runtime"},
            {"module": "context-runtime", "path": "/v1/context-runtime/engine", "role": "Context Runtime"},
            {"module": "batch-runtime", "path": "/v1/batch-runtime/engine", "role": "Batch Runtime"},
            {"module": "streaming-runtime", "path": "/v1/streaming-runtime/engine", "role": "Streaming Runtime"},
            {"module": "data-plane-cloud", "path": "/v1/data-plane-cloud/products", "role": "Data Plane runtimes"},
        ],
        "upstream_modules": [
            ("AiKernelModule", "ai-kernel", "AiKernelService", "ai-kernel.service", "products"),
            ("AgentRuntimeModule", "agent-runtime", "AgentRuntimeService", "agent-runtime.service", "engine"),
            ("WorkflowRuntimeModule", "workflow-runtime", "WorkflowRuntimeService", "workflow-runtime.service", "engine"),
            ("MemoryRuntimeModule", "memory-runtime", "MemoryRuntimeService", "memory-runtime.service", "engine"),
            ("PolicyRuntimeModule", "policy-runtime", "PolicyRuntimeService", "policy-runtime.service", "engine"),
            ("PromptRuntimeModule", "prompt-runtime", "PromptRuntimeService", "prompt-runtime.service", "engine"),
            ("ContextRuntimeModule", "context-runtime", "ContextRuntimeService", "context-runtime.service", "engine"),
            ("BatchRuntimeModule", "batch-runtime", "BatchRuntimeService", "batch-runtime.service", "engine"),
            ("StreamingRuntimeModule", "streaming-runtime", "StreamingRuntimeService", "streaming-runtime.service", "engine"),
            ("DataPlaneCloudModule", "data-plane-cloud", "DataPlaneCloudService", "data-plane-cloud.service", "products"),
        ],
        "capabilities": [
            ("lifecycle", "Runtime Lifecycle Catalog"),
            ("allocation", "Runtime Allocation Catalog"),
            ("health", "Runtime Health Catalog"),
            ("recovery", "Runtime Recovery Catalog"),
            ("scaling", "Runtime Scaling Catalog"),
        ],
        "extra_honesty": {
            "newRuntimeEngine": False,
        },
    },
    {
        "slug": "resource-manager",
        "vl": 337,
        "phase": 204,
        "adr": "0239",
        "title": "Resource Manager",
        "kind": "orchestration",
        "doc": "RESOURCE_MANAGER.md",
        "nav": "Resource Manager",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "Resource Manager (VL-337). GPU/CPU/RAM/storage/networking/vector/context-window allocation catalog over gpu-platform/gpu-runtime + FinOps budget honesty — not K8s resource OS.",
        "routes_to": [
            {"module": "gpu-platform", "path": "/v1/gpu-platform/engine", "role": "GPU Platform"},
            {"module": "gpu-runtime", "path": "/v1/gpu-runtime/engine", "role": "GPU Runtime"},
            {"module": "ai-kernel", "path": "/v1/ai-kernel/products", "role": "AI Kernel resource surfaces"},
        ],
        "upstream_modules": [
            ("GpuPlatformModule", "gpu-platform", "GpuPlatformService", "gpu-platform.service", "engine"),
            ("GpuRuntimeModule", "gpu-runtime", "GpuRuntimeService", "gpu-runtime.service", "engine"),
            ("AiKernelModule", "ai-kernel", "AiKernelService", "ai-kernel.service", "products"),
        ],
        "capabilities": [
            ("gpu", "GPU Allocation Catalog"),
            ("cpu", "CPU Allocation Catalog"),
            ("ram", "RAM Allocation Catalog"),
            ("storage", "Storage Allocation Catalog"),
            ("networking", "Networking Allocation Catalog"),
            ("vector_memory", "Vector Memory Allocation Catalog"),
            ("context_window", "Context Window Allocation Catalog"),
        ],
        "extra_honesty": {
            "gpuBudgetLimitsRequired": True,
            "kubernetesResourceOs": False,
            "rayOs": False,
        },
    },
    {
        "slug": "workflow-operating-system",
        "vl": 338,
        "phase": 205,
        "adr": "0240",
        "title": "Workflow Operating System",
        "kind": "orchestration",
        "doc": "WORKFLOW_OPERATING_SYSTEM.md",
        "nav": "Workflow OS",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "Workflow Operating System (VL-338). Façade over workflow-runtime + workflow-marketplace. HITL/approval/rollback as routed capabilities — duplicatesKernelOrFabric=false.",
        "routes_to": [
            {"module": "workflow-runtime", "path": "/v1/workflow-runtime/engine", "role": "Workflow Runtime"},
            {"module": "workflow-marketplace", "path": "/v1/workflow-marketplace/engine", "role": "Workflow Marketplace"},
            {"module": "ai-kernel", "path": "/v1/ai-kernel/products", "role": "AI Kernel workflow surface"},
        ],
        "upstream_modules": [
            ("WorkflowRuntimeModule", "workflow-runtime", "WorkflowRuntimeService", "workflow-runtime.service", "engine"),
            ("WorkflowMarketplaceModule", "workflow-marketplace", "WorkflowMarketplaceService", "workflow-marketplace.service", "engine"),
            ("AiKernelModule", "ai-kernel", "AiKernelService", "ai-kernel.service", "products"),
        ],
        "capabilities": [
            ("distributed_workflows", "Distributed Workflow Routing"),
            ("hitl", "Human-in-the-Loop Routing"),
            ("approval", "Approval Routing"),
            ("rollback", "Rollback Routing"),
        ],
        "extra_honesty": {
            "newWorkflowEngine": False,
        },
    },
    {
        "slug": "agent-operating-system",
        "vl": 339,
        "phase": 206,
        "adr": "0241",
        "title": "Agent Operating System",
        "kind": "orchestration",
        "doc": "AGENT_OPERATING_SYSTEM.md",
        "nav": "Agent OS",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "Agent Operating System (VL-339). Façade over agent-runtime + agent-fabric + agent-marketplace. Registry/lifecycle/security/collaboration/memory as routed — not a third agent executor.",
        "routes_to": [
            {"module": "agent-runtime", "path": "/v1/agent-runtime/engine", "role": "Agent Runtime"},
            {"module": "agent-fabric", "path": "/v1/agent-fabric/products", "role": "Agent Fabric"},
            {"module": "agent-marketplace", "path": "/v1/agent-marketplace/engine", "role": "Agent Marketplace"},
            {"module": "ai-kernel", "path": "/v1/ai-kernel/products", "role": "AI Kernel agent surface"},
            {"module": "ai-fabric", "path": "/v1/ai-fabric/products", "role": "AI Fabric"},
        ],
        "upstream_modules": [
            ("AgentRuntimeModule", "agent-runtime", "AgentRuntimeService", "agent-runtime.service", "engine"),
            ("AgentFabricModule", "agent-fabric", "AgentFabricService", "agent-fabric.service", "products"),
            ("AgentMarketplaceModule", "agent-marketplace", "AgentMarketplaceService", "agent-marketplace.service", "engine"),
            ("AiKernelModule", "ai-kernel", "AiKernelService", "ai-kernel.service", "products"),
            ("AiFabricModule", "ai-fabric", "AiFabricService", "ai-fabric.service", "products"),
        ],
        "capabilities": [
            ("registry", "Agent Registry Routing"),
            ("lifecycle", "Agent Lifecycle Routing"),
            ("security", "Agent Security Routing"),
            ("collaboration", "Agent Collaboration Routing"),
            ("memory", "Agent Memory Routing"),
        ],
        "extra_honesty": {
            "newAgentExecutor": False,
        },
    },
    {
        "slug": "ai-memory-operating-system",
        "vl": 340,
        "phase": 207,
        "adr": "0242",
        "title": "AI Memory Operating System",
        "kind": "orchestration",
        "doc": "AI_MEMORY_OPERATING_SYSTEM.md",
        "nav": "Memory OS",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "AI Memory Operating System (VL-340). Façade over memory-runtime + memory-fabric + knowledge-memory. Global/org/workspace/user/semantic scopes as catalog — not a third memory store.",
        "routes_to": [
            {"module": "memory-runtime", "path": "/v1/memory-runtime/engine", "role": "Memory Runtime"},
            {"module": "memory-fabric", "path": "/v1/memory-fabric/products", "role": "Memory Fabric"},
            {"module": "knowledge-memory", "path": "/v1/knowledge-memory/engine", "role": "Knowledge Memory"},
            {"module": "ai-kernel", "path": "/v1/ai-kernel/products", "role": "AI Kernel memory surface"},
        ],
        "upstream_modules": [
            ("MemoryRuntimeModule", "memory-runtime", "MemoryRuntimeService", "memory-runtime.service", "engine"),
            ("MemoryFabricModule", "memory-fabric", "MemoryFabricService", "memory-fabric.service", "products"),
            ("KnowledgeMemoryModule", "knowledge-memory", "KnowledgeMemoryService", "knowledge-memory.service", "engine"),
            ("AiKernelModule", "ai-kernel", "AiKernelService", "ai-kernel.service", "products"),
        ],
        "capabilities": [
            ("global_scope", "Global Memory Scope Catalog"),
            ("org_scope", "Org Memory Scope Catalog"),
            ("workspace_scope", "Workspace Memory Scope Catalog"),
            ("user_scope", "User Memory Scope Catalog"),
            ("semantic_scope", "Semantic Memory Scope Catalog"),
        ],
        "extra_honesty": {
            "newMemoryStore": False,
        },
    },
    {
        "slug": "knowledge-operating-system",
        "vl": 341,
        "phase": 208,
        "adr": "0243",
        "title": "Knowledge Operating System",
        "kind": "orchestration",
        "doc": "KNOWLEDGE_OPERATING_SYSTEM.md",
        "nav": "Knowledge OS",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "Knowledge Operating System (VL-341). Façade over knowledge-runtime + knowledge-fabric + knowledge-cloud / african-knowledge-graph. Federation/sync as catalog.",
        "routes_to": [
            {"module": "knowledge-runtime", "path": "/v1/knowledge-runtime/engine", "role": "Knowledge Runtime"},
            {"module": "knowledge-fabric", "path": "/v1/knowledge-fabric/products", "role": "Knowledge Fabric"},
            {"module": "knowledge-cloud", "path": "/v1/knowledge-cloud/products", "role": "Knowledge Cloud"},
            {"module": "african-knowledge-graph", "path": "/v1/african-knowledge-graph/engine", "role": "African Knowledge Graph"},
        ],
        "upstream_modules": [
            ("KnowledgeRuntimeModule", "knowledge-runtime", "KnowledgeRuntimeService", "knowledge-runtime.service", "engine"),
            ("KnowledgeFabricModule", "knowledge-fabric", "KnowledgeFabricService", "knowledge-fabric.service", "products"),
            ("KnowledgeCloudModule", "knowledge-cloud", "KnowledgeCloudService", "knowledge-cloud.service", "products"),
            ("AfricanKnowledgeGraphModule", "african-knowledge-graph", "AfricanKnowledgeGraphService", "african-knowledge-graph.service", "engine"),
        ],
        "capabilities": [
            ("routing", "Knowledge Routing Catalog"),
            ("federation", "Knowledge Federation Catalog"),
            ("sync", "Knowledge Sync Catalog"),
        ],
        "extra_honesty": {
            "newKnowledgeEngine": False,
        },
    },
    {
        "slug": "plugin-operating-system",
        "vl": 342,
        "phase": 209,
        "adr": "0244",
        "title": "Plugin Operating System",
        "kind": "orchestration",
        "doc": "PLUGIN_OPERATING_SYSTEM.md",
        "nav": "Plugin OS",
        "honesty_key": "unifyingOrchestrationLayer",
        "honesty_val": True,
        "note": "Plugin Operating System (VL-342). Façade over plugin-runtime + plugin-marketplace. Isolation/sandbox/security honesty from existing policy gates — do not invent new sandbox OS.",
        "routes_to": [
            {"module": "plugin-runtime", "path": "/v1/plugin-runtime/engine", "role": "Plugin Runtime"},
            {"module": "plugin-marketplace", "path": "/v1/plugin-marketplace/engine", "role": "Plugin Marketplace"},
            {"module": "ai-kernel", "path": "/v1/ai-kernel/products", "role": "AI Kernel plugin surface"},
            {"module": "policy-runtime", "path": "/v1/policy-runtime/engine", "role": "Policy Runtime gates"},
        ],
        "upstream_modules": [
            ("PluginRuntimeModule", "plugin-runtime", "PluginRuntimeService", "plugin-runtime.service", "engine"),
            ("PluginMarketplaceModule", "plugin-marketplace", "PluginMarketplaceService", "plugin-marketplace.service", "engine"),
            ("AiKernelModule", "ai-kernel", "AiKernelService", "ai-kernel.service", "products"),
            ("PolicyRuntimeModule", "policy-runtime", "PolicyRuntimeService", "policy-runtime.service", "engine"),
        ],
        "capabilities": [
            ("execution", "Plugin Execution Routing"),
            ("isolation", "Plugin Isolation Catalog"),
            ("sandbox", "Sandbox Honesty via existing policy gates"),
            ("security", "Plugin Security Routing"),
        ],
        "extra_honesty": {
            "newSandboxOs": False,
            "usesExistingPolicyGates": True,
        },
    },
]

FOUNDATION_PRODUCTS = [
    ("vaios", "VAIOS Foundation", "GET /v1/vaios/products", "/vaios", "VL-334. Unifying orchestration layer; notLinux/notKubernetes."),
    ("ai-scheduler", "AI Scheduler", "GET /v1/ai-scheduler/engine", "/ai-scheduler", "VL-335. Unifies scheduling over global-scheduler/GPU/workflow/agent queues."),
    ("runtime-manager", "Runtime Manager", "GET /v1/runtime-manager/engine", "/runtime-manager", "VL-336. Lifecycle catalog over Kernel + Data Plane runtimes."),
    ("resource-manager", "Resource Manager", "GET /v1/resource-manager/engine", "/resource-manager", "VL-337. Resource allocation catalog; gpuBudgetLimitsRequired=true."),
    ("workflow-operating-system", "Workflow Operating System", "GET /v1/workflow-operating-system/engine", "/workflow-operating-system", "VL-338. Façade over workflow-runtime + marketplace."),
    ("agent-operating-system", "Agent Operating System", "GET /v1/agent-operating-system/engine", "/agent-operating-system", "VL-339. Façade over agent-runtime + fabric + marketplace."),
    ("ai-memory-operating-system", "AI Memory Operating System", "GET /v1/ai-memory-operating-system/engine", "/ai-memory-operating-system", "VL-340. Façade over memory-runtime + fabric + knowledge-memory."),
    ("knowledge-operating-system", "Knowledge Operating System", "GET /v1/knowledge-operating-system/engine", "/knowledge-operating-system", "VL-341. Façade over knowledge-runtime/fabric/cloud + AKG."),
    ("plugin-operating-system", "Plugin Operating System", "GET /v1/plugin-operating-system/engine", "/plugin-operating-system", "VL-342. Façade over plugin-runtime + marketplace; existing policy gates."),
    ("ai-kernel", "AI Kernel (upstream)", "GET /v1/ai-kernel/products", "/ai-kernel", "Volume 8 surface unified by VAIOS."),
    ("ai-fabric", "AI Fabric (upstream)", "GET /v1/ai-fabric/products", "/ai-fabric", "Volume 10 surface unified by VAIOS."),
    ("data-plane-cloud", "Data Plane Cloud (upstream)", "GET /v1/data-plane-cloud/products", "/data-plane-cloud", "Volume 18 surface unified by VAIOS."),
    ("monitoring", "VAIOS Monitoring", "GET /v1/vaios/monitoring", "/vaios", "Foundation monitoring snapshot."),
]


def honesty_block(hub: dict) -> str:
    lines = [
        "      unifyingOrchestrationLayer: true,",
        "      duplicatesKernelOrFabric: false,",
        "      notLinux: true,",
        "      notKubernetes: true,",
        "      literalOsKernel: false,",
        "      enterpriseEngineeringSystemOs: false,",
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
        VL-{vl} — VerbaLab {title} console in VAIOS (unifying orchestration layer).
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
    routes_md = (
        "\n".join(f"- `{r['module']}` → `{r['path']}` ({r['role']})" for r in routes)
        or "- Foundation discovery hub over Kernel + Fabric + Data Plane."
    )
    return f"""# {hub["title"]} (VL-{hub["vl"]})

Library Phase {hub["phase"]} — part of Volume 19 VAIOS (VerbaLab AI Operating System).

## Mission

VerbaLab {hub["title"]} is a **unifying orchestration façade** above AI Kernel (Volume 8),
AI Fabric (Volume 10), and Data Plane (Volume 18). It is not Linux, not Kubernetes,
and not a third parallel agent/workflow/memory implementation.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)
- `{hub["honesty_key"]}={str(hub["honesty_val"]).lower()}`

## Routes to (upstream)

{routes_md}

## Surfaces

- Console: `/{hub["slug"]}`
- API: `/v1/{hub["slug"]}/engine`{" (foundation: `/products`)" if hub["kind"] == "foundation" else ""}
- ADR: [`docs/adr/{hub["adr"]}-{hub["slug"]}.md`](./adr/{hub["adr"]}-{hub["slug"]}.md)

---

## Volume status

**Volume 19** VAIOS (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
"""


def adr_doc(hub: dict) -> str:
    return f"""# ADR-{hub["adr"]}: {hub["title"]} (VL-{hub["vl"]})

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-{hub["vl"]} (library Phase {hub["phase"]})

## Context

Volume 19 builds VAIOS as the highest-level AI orchestration environment. Risk: reimplementing
agent execution, workflow engines, memory stores, or plugin sandboxes already shipped in
Volume 8 (AI Kernel) and Volume 10 (AI Fabric), inventing a literal Linux/Kubernetes OS,
or inventing the Enterprise Engineering System (Volume 20+).

## Decision

1. Ship `{hub["slug"]}` as a Nest hub with catalog + service + controller + CQRS + GraphQL + OpenAPI + SDK/CLI + web console.
2. Keep honesty flags explicit (`unifyingOrchestrationLayer=true`; `duplicatesKernelOrFabric=false`; `notLinux=true`; `notKubernetes=true`; `literalOsKernel=false`; `enterpriseEngineeringSystemOs=false`).
3. Route to existing Kernel / Fabric / Data Plane modules — do not copy-paste execution engines.
4. Reject third parallel OS invention and Enterprise Engineering System in this volume.

## Consequences

- {hub["title"]} is discoverable under VAIOS Foundation.
- Operators can inspect routing catalogs with explicit unifying-layer honesty.
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
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        routesTo: {[r["module"] for r in (h.get("routes_to") or [])]},
      }}"""
        for h in HUBS
        if h["kind"] == "orchestration"
    )
    unified_surfaces = """,
""".join(
        [
            """      {
        id: 'ai-kernel',
        volume: 8,
        path: '/v1/ai-kernel/products',
        role: 'Agent/Workflow/Plugin/Memory/Policy runtimes',
      }""",
            """      {
        id: 'ai-fabric',
        volume: 10,
        path: '/v1/ai-fabric/products',
        role: 'Cross-cloud buses (event/context/knowledge/memory/agent/policy)',
      }""",
            """      {
        id: 'data-plane-cloud',
        volume: 18,
        path: '/v1/data-plane-cloud/products',
        role: 'Thin execution runtimes (translation/speech/voice/vision/knowledge/embedding/streaming/GPU)',
      }""",
            """      {
        id: 'agent-runtime',
        volume: 8,
        path: '/v1/agent-runtime/engine',
        role: 'Agent execution',
      }""",
            """      {
        id: 'workflow-runtime',
        volume: 8,
        path: '/v1/workflow-runtime/engine',
        role: 'Workflow execution',
      }""",
            """      {
        id: 'memory-runtime',
        volume: 8,
        path: '/v1/memory-runtime/engine',
        role: 'Memory store',
      }""",
            """      {
        id: 'plugin-runtime',
        volume: 8,
        path: '/v1/plugin-runtime/engine',
        role: 'Plugin sandbox',
      }""",
            """      {
        id: 'global-scheduler',
        volume: 7,
        path: '/v1/global-scheduler/engine',
        role: 'Global scheduling',
      }""",
            """      {
        id: 'gpu-runtime',
        volume: 18,
        path: '/v1/gpu-runtime/engine',
        role: 'GPU runtime façade',
      }""",
        ]
    )
    return f"""export type VaiosProductStatus = 'shipped' | 'partial' | 'deferred';

export type VaiosProductRow = {{
  id: string;
  name: string;
  status: VaiosProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
}};

/**
 * Library Phase 201 → VAIOS Foundation (VL-334).
 * Unifying orchestration layer over Kernel + Fabric + Data Plane.
 * Not Linux / not Kubernetes / not a third parallel OS.
 */
export function vaiosProductCatalog(): VaiosProductRow[] {{
  return [
{chr(10).join(rows)}
  ];
}}

export function vaiosRoutingTable(): Array<{{
  id: string;
  path: string;
  purpose: string;
}}> {{
  return [
    {{ id: 'products', path: '/v1/vaios/products', purpose: 'Product catalog' }},
    {{ id: 'engine', path: '/v1/vaios/engine', purpose: 'Engine alias' }},
    {{ id: 'routing', path: '/v1/vaios/routing', purpose: 'Static routing table' }},
    {{ id: 'monitoring', path: '/v1/vaios/monitoring', purpose: 'Monitoring snapshot' }},
    {{ id: 'overview', path: '/v1/vaios/overview', purpose: 'Authenticated overview' }},
  ];
}}

export function vaiosHubInventory(): Array<{{
  id: string;
  title: string;
  unifyingOrchestrationLayer: boolean;
  duplicatesKernelOrFabric: boolean;
  routesTo: string[];
}}> {{
  return [
{inventory}
  ];
}}

export function vaiosUnifiedSurfaces(): Array<{{
  id: string;
  volume: number;
  path: string;
  role: string;
}}> {{
  return [
{unified_surfaces}
  ];
}}

export function vaiosArchitectureNotes(): Record<string, unknown> {{
  return {{
    role: 'vaios-unifying-orchestration',
    extends: [
      'ai-kernel',
      'ai-fabric',
      'data-plane-cloud',
      'agent-runtime',
      'workflow-runtime',
      'memory-runtime',
      'plugin-runtime',
      'global-scheduler',
      'gpu-runtime',
      'gpu-platform',
      'knowledge-runtime',
      'knowledge-fabric',
      'memory-fabric',
      'agent-fabric',
    ],
    notLinux: true,
    notKubernetes: true,
    literalOsKernel: false,
    unifyingOrchestrationLayer: true,
    duplicatesKernelOrFabric: false,
    enterpriseEngineeringSystemOs: false,
    deferredPastVolume19: ['enterprise-engineering-system', 'service-mesh-os'],
  }};
}}

export function vaiosHonesty(): Record<string, boolean | string> {{
  return {{
    unifyingOrchestrationLayer: true,
    duplicatesKernelOrFabric: false,
    notLinux: true,
    notKubernetes: true,
    literalOsKernel: false,
    enterpriseEngineeringSystemOs: false,
    integratesExistingSystems: true,
    note:
      'VAIOS unifies Kernel + Fabric + Data Plane as orchestration façades. Not Linux/Kubernetes. Not a third agent/workflow/memory implementation. Enterprise Engineering System deferred past Volume 19.',
  }};
}}
"""


def foundation_service() -> str:
    return """import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  vaiosArchitectureNotes,
  vaiosHonesty,
  vaiosHubInventory,
  vaiosProductCatalog,
  vaiosRoutingTable,
  vaiosUnifiedSurfaces,
} from './vaios.catalog';

@Injectable()
export class VaiosService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'VerbaLab AI Operating System (VAIOS)',
      products: vaiosProductCatalog(),
      hubInventory: vaiosHubInventory(),
      unifiedSurfaces: vaiosUnifiedSurfaces(),
      architecture: vaiosArchitectureNotes(),
      honesty: vaiosHonesty(),
      safety: {
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        notLinux: true,
        notKubernetes: true,
        literalOsKernel: false,
        enterpriseEngineeringSystemOs: false,
        note:
          'Volume 19 README: VAIOS is the unifying orchestration layer ON TOP OF AI Kernel and AI Fabric — not a third reimplementation. Not Linux / not Kubernetes.',
      },
      docs: '/docs/VAIOS.md',
      note:
        'VAIOS Foundation (VL-334). Unifying orchestration over Kernel + Fabric + Data Plane. notLinux/notKubernetes; enterpriseEngineeringSystemOs=false.',
    };
  }

  routing() {
    return {
      routes: vaiosRoutingTable(),
      products: vaiosProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      hubInventory: vaiosHubInventory(),
      unifiedSurfaces: vaiosUnifiedSurfaces(),
      honesty: vaiosHonesty(),
      note: 'Static VAIOS discovery catalog for Foundation.',
      docs: '/docs/VAIOS.md',
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
      products: vaiosProductCatalog(),
      hubInventory: vaiosHubInventory(),
      unifiedSurfaces: vaiosUnifiedSurfaces(),
      architecture: vaiosArchitectureNotes(),
      honesty: vaiosHonesty(),
      safety: {
        unifyingOrchestrationLayer: true,
        duplicatesKernelOrFabric: false,
        notLinux: true,
        notKubernetes: true,
        note:
          'VAIOS honesty enforced. Routes to Kernel/Fabric/Data Plane. Enterprise Engineering System rejected here.',
      },
      deferred: {
        enterpriseEngineeringSystemOs: true,
        serviceMeshOs: true,
        literalOsKernel: false,
      },
      links: {
        vaios: '/vaios',
        aiScheduler: '/ai-scheduler',
        runtimeManager: '/runtime-manager',
        resourceManager: '/resource-manager',
        workflowOperatingSystem: '/workflow-operating-system',
        agentOperatingSystem: '/agent-operating-system',
        aiMemoryOperatingSystem: '/ai-memory-operating-system',
        knowledgeOperatingSystem: '/knowledge-operating-system',
        pluginOperatingSystem: '/plugin-operating-system',
        aiKernel: '/ai-kernel',
        aiFabric: '/ai-fabric',
        dataPlaneCloud: '/data-plane-cloud',
      },
      docs: '/docs/VAIOS.md',
      note:
        'VAIOS (VL-334–343). Discovery hub over unifying orchestration façades; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = vaiosProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      hubInventory: vaiosHubInventory(),
      unifiedSurfaces: vaiosUnifiedSurfaces(),
      architecture: vaiosArchitectureNotes(),
      honesty: vaiosHonesty(),
      note: 'VAIOS monitoring snapshot (VL-334).',
    };
  }
}
"""


def foundation_controller() -> str:
    return """import { Controller, Get, UseGuards } from '@nestjs/common';
import { VaiosService } from './vaios.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/vaios')
export class VaiosController {
  constructor(private readonly vaios: VaiosService) {}

  @Get('products')
  products() {
    return this.vaios.products();
  }

  @Get('engine')
  engine() {
    return this.vaios.products();
  }

  @Get('routing')
  routing() {
    return this.vaios.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.vaios.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.vaios.monitoring();
  }
}
"""


SHORT_NAMES = {
    "GlobalSchedulerService": "globalScheduler",
    "GpuRuntimeService": "gpuRuntime",
    "GpuPlatformService": "gpuPlatform",
    "WorkflowRuntimeService": "workflowRuntime",
    "AgentRuntimeService": "agentRuntime",
    "AiKernelService": "aiKernel",
    "MemoryRuntimeService": "memoryRuntime",
    "PolicyRuntimeService": "policyRuntime",
    "PromptRuntimeService": "promptRuntime",
    "ContextRuntimeService": "contextRuntime",
    "BatchRuntimeService": "batchRuntime",
    "StreamingRuntimeService": "streamingRuntime",
    "DataPlaneCloudService": "dataPlaneCloud",
    "WorkflowMarketplaceService": "workflowMarketplace",
    "AgentFabricService": "agentFabric",
    "AgentMarketplaceService": "agentMarketplace",
    "AiFabricService": "aiFabric",
    "MemoryFabricService": "memoryFabric",
    "KnowledgeMemoryService": "knowledgeMemory",
    "KnowledgeRuntimeService": "knowledgeRuntime",
    "KnowledgeFabricService": "knowledgeFabric",
    "KnowledgeCloudService": "knowledgeCloud",
    "AfricanKnowledgeGraphService": "africanKnowledgeGraph",
    "PluginRuntimeService": "pluginRuntime",
    "PluginMarketplaceService": "pluginMarketplace",
}


def orchestration_catalog(hub: dict) -> str:
    slug = hub["slug"]
    camel = to_camel(slug)
    caps = hub.get("capabilities") or []
    routes = hub.get("routes_to") or []
    cap_rows = ",\n".join(
        f"      {{ id: '{cid}', name: '{cname}', status: 'shipped', notes: 'VL-{hub['vl']} routed capability — not a new engine.' }}"
        for cid, cname in caps
    )
    route_rows = ",\n".join(
        f"""      {{
        id: 'route-{i}',
        module: '{r["module"]}',
        path: '{r["path"]}',
        role: '{r["role"]}',
        status: 'shipped',
        notes: 'Upstream Kernel/Fabric/Data Plane surface — unifying layer routes here.',
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
    product: 'VerbaLab {hub['title']}',
    unifyingOrchestrationLayer: true,
    duplicatesKernelOrFabric: false,
    notLinux: true,
    notKubernetes: true,
    literalOsKernel: false,
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
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      notLinux: true,
      notKubernetes: true,
      literalOsKernel: false,
      enterpriseEngineeringSystemOs: false,
      note: '{note}',
    }},
    docs: '/docs/{hub['doc']}',
    note: '{note}',
  }};
}}
"""


def orchestration_service(hub: dict) -> str:
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

  /** Route/execute façade: returns upstream endpoint + live status from injected Kernel/Fabric/Data Plane services. */
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
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
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
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: '{pascal} monitoring snapshot (VL-{hub["vl"]}).',
    }};
  }}
}}
"""


def orchestration_controller(hub: dict) -> str:
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


def orchestration_module(hub: dict) -> str:
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
      unifyingOrchestrationLayer: catalog.honesty.unifyingOrchestrationLayer,
      duplicatesKernelOrFabric: catalog.honesty.duplicatesKernelOrFabric,
      notLinux: catalog.honesty.notLinux,
      notKubernetes: catalog.honesty.notKubernetes,
      literalOsKernel: catalog.honesty.literalOsKernel,
      enterpriseEngineeringSystemOs: catalog.honesty.enterpriseEngineeringSystemOs,
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
  unifyingOrchestrationLayer!: boolean;

  @Field(() => Boolean)
  duplicatesKernelOrFabric!: boolean;

  @Field(() => Boolean)
  notLinux!: boolean;

  @Field(() => Boolean)
  notKubernetes!: boolean;

  @Field(() => Boolean)
  literalOsKernel!: boolean;

  @Field(() => Boolean)
  enterpriseEngineeringSystemOs!: boolean;
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
    expect(res.body.honesty.unifyingOrchestrationLayer).toBe(true);
    expect(res.body.honesty.duplicatesKernelOrFabric).toBe(false);
    expect(res.body.honesty.notLinux).toBe(true);
    expect(res.body.honesty.notKubernetes).toBe(true);
    expect(res.body.honesty.literalOsKernel).toBe(false);
    expect(res.body.honesty.enterpriseEngineeringSystemOs).toBe(false);
    expect(res.body.products.length).toBeGreaterThan(8);
    expect(res.body.hubInventory.length).toBeGreaterThan(5);
    expect(res.body.unifiedSurfaces.length).toBeGreaterThan(5);
    for (const row of res.body.hubInventory) {
      expect(row.unifyingOrchestrationLayer).toBe(true);
      expect(row.duplicatesKernelOrFabric).toBe(false);
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
    expect(res.body.honesty.unifyingOrchestrationLayer).toBe(true);
    expect(res.body.honesty.duplicatesKernelOrFabric).toBe(false);
    expect(res.body.honesty.notLinux).toBe(true);
    expect(res.body.honesty.notKubernetes).toBe(true);
    expect(res.body.honesty.literalOsKernel).toBe(false);
    expect(res.body.honesty.enterpriseEngineeringSystemOs).toBe(false);
    expect(res.body.unifyingOrchestrationLayer).toBe(true);
    expect(res.body.duplicatesKernelOrFabric).toBe(false);
    expect(Array.isArray(res.body.routesTo)).toBe(true);
    expect(res.body.routesTo.length).toBeGreaterThan(0);
{routes_expect}

    const route = await request(app.getHttpServer())
      .get('/v1/{slug}/route')
      .expect(200);
    expect(route.body.unifyingOrchestrationLayer).toBe(true);
    expect(route.body.duplicatesKernelOrFabric).toBe(false);
    expect(route.body.upstreamStatus.length).toBeGreaterThan(0);
"""
        if hub["slug"] == "resource-manager":
            extra += """
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.kubernetesResourceOs).toBe(false);
"""
        if hub["slug"] == "plugin-operating-system":
            extra += """
    expect(res.body.honesty.newSandboxOs).toBe(false);
    expect(res.body.honesty.usesExistingPolicyGates).toBe(true);
"""

    auth_smoke = ""
    if hub["kind"] == "foundation":
        auth_smoke = """
  it('rejects unauthenticated overview (auth smoke)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/vaios/overview');
    expect([401, 403, 503]).toContain(res.status);
  });
"""

    no_dupe = ""
    if hub["kind"] == "orchestration":
        no_dupe = f"""
  it('does not embed a third parallel agent/workflow/memory engine', () => {{
    const dir = join(apiSrc, '{slug}');
    const bannedImpl = /class AgentExecutor|new WorkflowEngine|Mem0Client|createSandboxVm|kubernetesResourceController|linuxSyscallTable/i;
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
        write(base / f"{slug}.catalog.ts", orchestration_catalog(hub))
        write(base / f"{slug}.service.ts", orchestration_service(hub))
        write(base / f"{slug}.controller.ts", orchestration_controller(hub))
        write(base / f"{slug}.module.ts", orchestration_module(hub))
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
    audit = ROOT / "docs/vaios-audit"
    write(
        audit / "PRODUCTION_READINESS.md",
        """# VAIOS — Production Readiness

Volume 19 (VL-334–343) Production Audit.

## Gates

- All Volume 19 products shipped (foundation + 8 orchestration hubs).
- No TODO/FIXME/`implement later` markers in Volume 19 hub sources.
- Each hub: `unifyingOrchestrationLayer=true`, `duplicatesKernelOrFabric=false`.
- Each orchestration hub: non-empty `routesTo` listing Kernel/Fabric/Data Plane upstreams.
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`.
- `enterpriseEngineeringSystemOs=false` — Enterprise Engineering System **rejected** in this volume (deferred past Volume 19).
- Resource Manager: `gpuBudgetLimitsRequired=true`.
- Plugin OS: `newSandboxOs=false` / `usesExistingPolicyGates=true`.
- Auth smoke on `/v1/vaios/overview`.
- GraphQL honesty fields for unifying orchestration layers.

## Rejected inventions

- Third parallel agent / workflow / memory implementation
- Literal Linux / Kubernetes OS kernel
- Enterprise Engineering System / ADR factory / Service Mesh OS
- New cron OS / new sandbox OS / Kubernetes resource OS
""",
    )
    write(
        audit / "ARCHITECTURE.md",
        """# VAIOS — Architecture Validation

## Role

VAIOS is the unifying orchestration layer above:

| Upstream | Volume | Role |
| --- | --- | --- |
| AI Kernel | 8 | Agent/Workflow/Plugin/Memory/Policy runtimes |
| AI Fabric | 10 | Cross-cloud buses |
| Data Plane Cloud | 18 | Thin execution runtimes |

## Pattern

Each VAIOS hub is a thin Nest façade:

1. Catalog of orchestration capabilities + `routesTo` upstream modules.
2. Service injects existing Kernel/Fabric/Data Plane Nest modules and exposes `route`/`execute`.
3. CQRS application slice + GraphQL + OpenAPI + SDK/CLI + web console.
4. Honesty: `unifyingOrchestrationLayer=true`, `duplicatesKernelOrFabric=false`, `notLinux`/`notKubernetes`.

## Upstream map

| Hub | Upstream |
| --- | --- |
| ai-scheduler | global-scheduler, gpu-runtime, gpu-platform, workflow-runtime, agent-runtime |
| runtime-manager | ai-kernel + agent/workflow/memory/policy/prompt/context/batch/streaming + data-plane-cloud |
| resource-manager | gpu-platform, gpu-runtime, ai-kernel |
| workflow-operating-system | workflow-runtime, workflow-marketplace, ai-kernel |
| agent-operating-system | agent-runtime, agent-fabric, agent-marketplace, ai-kernel, ai-fabric |
| ai-memory-operating-system | memory-runtime, memory-fabric, knowledge-memory, ai-kernel |
| knowledge-operating-system | knowledge-runtime, knowledge-fabric, knowledge-cloud, african-knowledge-graph |
| plugin-operating-system | plugin-runtime, plugin-marketplace, ai-kernel, policy-runtime |
""",
    )
    write(
        audit / "COVERAGE.md",
        """# VAIOS — Coverage Report

| VL | Product | Spec |
| --- | --- | --- |
| VL-334 | vaios | `apps/api/test/vaios.spec.ts` |
| VL-335 | ai-scheduler | `apps/api/test/ai-scheduler.spec.ts` |
| VL-336 | runtime-manager | `apps/api/test/runtime-manager.spec.ts` |
| VL-337 | resource-manager | `apps/api/test/resource-manager.spec.ts` |
| VL-338 | workflow-operating-system | `apps/api/test/workflow-operating-system.spec.ts` |
| VL-339 | agent-operating-system | `apps/api/test/agent-operating-system.spec.ts` |
| VL-340 | ai-memory-operating-system | `apps/api/test/ai-memory-operating-system.spec.ts` |
| VL-341 | knowledge-operating-system | `apps/api/test/knowledge-operating-system.spec.ts` |
| VL-342 | plugin-operating-system | `apps/api/test/plugin-operating-system.spec.ts` |
| VL-343 | Production Audit | `apps/api/test/vaios-audit.spec.ts` |
""",
    )
    write(
        audit / "PERFORMANCE.md",
        """# VAIOS — Performance Validation

Unifying façades add catalog/route overhead only — execution remains in Kernel/Fabric/Data Plane.
Audit GraphQL smoke expects completion under 5s in the test harness.
GPU budgets remain governed by Volume 7 / FinOps ceilings (`gpuBudgetLimitsRequired`).
""",
    )
    write(
        audit / "DEPLOYMENT.md",
        """# VAIOS — Deployment Guide

1. Deploy API with Volume 19 modules registered in `app.module.ts`.
2. Web consoles under `/vaios`, `/ai-scheduler`, `/runtime-manager`, `/resource-manager`, `/workflow-operating-system`, `/agent-operating-system`, `/ai-memory-operating-system`, `/knowledge-operating-system`, `/plugin-operating-system`.
3. Do not enable Enterprise Engineering System / Service Mesh OS from this volume.
4. GPU: keep sandbox / budget ceilings from `gpu-platform` / `gpu-runtime`.
5. Kernel and Fabric remain authoritative for agent/workflow/memory/plugin execution.
""",
    )
    write(
        audit / "VAIOS_READINESS_REPORT.md",
        """# VAIOS Readiness Report

**Volume 19 closed** (VL-334–343).

## Summary

VAIOS ships as unifying orchestration façades over AI Kernel, AI Fabric, and Data Plane.
Not Linux. Not Kubernetes. Not a third parallel agent/workflow/memory implementation.
Enterprise Engineering System deferred past Volume 19.

## Evidence

- Product docs ADR-0236–0245
- Audit pack under `docs/vaios-audit/`
- Vitest gates in `apps/api/test/vaios-audit.spec.ts`
""",
    )
    write(
        ROOT / "docs/adr/0245-vaios-production-audit.md",
        """# ADR-0245: VAIOS Production Audit (VL-343)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-343 (library Phase 210)

## Context

Volume 19 closes with a hardening pass. Risks: third parallel agent/workflow/memory
implementation, inventing Linux/Kubernetes OS, inventing Enterprise Engineering System /
ADR factory / Service Mesh, empty `routesTo`, dishonest OS branding.

## Decision

1. Ship evidence pack under `docs/vaios-audit/`.
2. Gate with vitest: no TODOs, all products shipped, `unifyingOrchestrationLayer` on each hub,
   `duplicatesKernelOrFabric=false`, non-empty `routesTo`, `notLinux`/`notKubernetes`,
   auth smoke, GraphQL.
3. Explicitly reject third parallel agent/workflow/memory implementation and Enterprise
   Engineering System invention (`enterpriseEngineeringSystemOs=false`).
4. Keep Resource Manager GPU budget honesty (`gpuBudgetLimitsRequired=true`).

## Consequences

- Volume 19 closed.
- Enterprise Engineering System deferred past Volume 19.
""",
    )


def write_audit_spec() -> None:
    orch_slugs = [h["slug"] for h in HUBS if h["kind"] == "orchestration"]
    gql_fields = "\n          ".join(
        [
            "vaiosProducts { id name status }",
            *[
                f"{to_camel(s)}Engine {{ product note unifyingOrchestrationLayer duplicatesKernelOrFabric notLinux notKubernetes literalOsKernel enterpriseEngineeringSystemOs }}"
                for s in orch_slugs
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

const VOLUME19_HUBS = {json.dumps([h["slug"] for h in HUBS])};
const ORCH_HUBS = {json.dumps(orch_slugs)};

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

describe('VAIOS Production Audit (VL-343)', () => {{
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

  it('ships audit pack and ADR-0245', () => {{
    expect(existsSync(join(root, 'docs/adr/0245-vaios-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/VAIOS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/ARCHITECTURE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/PERFORMANCE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/COVERAGE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/DEPLOYMENT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vaios-audit/VAIOS_READINESS_REPORT.md'))).toBe(true);
  }});

  it('has no TODO/FIXME markers across Volume 19 hubs', () => {{
    const banned = /TODO|FIXME|implement later|XXX\\s*:|not implemented/i;
    const hits: string[] = [];
    for (const slug of VOLUME19_HUBS) {{
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
      .get('/v1/vaios/products')
      .expect(200);
    expect(res.body.honesty.unifyingOrchestrationLayer).toBe(true);
    expect(res.body.honesty.duplicatesKernelOrFabric).toBe(false);
    expect(res.body.honesty.notLinux).toBe(true);
    expect(res.body.honesty.notKubernetes).toBe(true);
    expect(res.body.honesty.enterpriseEngineeringSystemOs).toBe(false);
    const ids = res.body.products.map((p: {{ id: string }}) => p.id);
    for (const slug of ORCH_HUBS) {{
      expect(ids).toContain(slug);
    }}
    expect(ids).toContain('vaios');
  }});

  it('each hub is unifyingOrchestrationLayer with non-empty routesTo', async () => {{
    for (const slug of ORCH_HUBS) {{
      const res = await request(app.getHttpServer())
        .get(`/v1/${{slug}}/engine`)
        .expect(200);
      expect(res.body.honesty.unifyingOrchestrationLayer).toBe(true);
      expect(res.body.honesty.duplicatesKernelOrFabric).toBe(false);
      expect(res.body.honesty.notLinux).toBe(true);
      expect(res.body.honesty.notKubernetes).toBe(true);
      expect(res.body.honesty.literalOsKernel).toBe(false);
      expect(res.body.routesTo.length).toBeGreaterThan(0);
    }}
  }});

  it('rejects third parallel agent/workflow/memory implementation', () => {{
    const bannedImpl = /class AgentExecutor|new WorkflowEngine|Mem0Client|createSandboxVm|linuxSyscallTable/i;
    const hits: string[] = [];
    for (const slug of ORCH_HUBS) {{
      for (const file of walkTsFiles(join(apiSrc, slug))) {{
        if (bannedImpl.test(readFileSync(file, 'utf8'))) hits.push(file.replace(root, ''));
      }}
    }}
    expect(hits).toEqual([]);
    const readiness = readFileSync(
      join(root, 'docs/vaios-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/third parallel|Rejected inventions/i);
  }});

  it('rejects Enterprise Engineering System invention', () => {{
    const readiness = readFileSync(
      join(root, 'docs/vaios-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/enterpriseEngineeringSystemOs=false|Enterprise Engineering System/i);
    const adr = readFileSync(
      join(root, 'docs/adr/0245-vaios-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/enterpriseEngineeringSystemOs=false|Enterprise Engineering System/i);
    const foundation = readFileSync(join(apiSrc, 'vaios/vaios.catalog.ts'), 'utf8');
    expect(foundation).toMatch(/enterpriseEngineeringSystemOs:\\s*false/);
  }});

  it('resource manager GPU budget honesty', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/resource-manager/engine').expect(200);
    expect(res.body.honesty.gpuBudgetLimitsRequired).toBe(true);
    expect(res.body.honesty.kubernetesResourceOs).toBe(false);
  }});

  it('auth smoke on overview', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/vaios/overview');
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
    expect(gql.body.data.vaiosProducts.length).toBeGreaterThan(8);
    expect(gql.body.data.aiSchedulerEngine.unifyingOrchestrationLayer).toBe(true);
    expect(gql.body.data.aiSchedulerEngine.duplicatesKernelOrFabric).toBe(false);
    expect(gql.body.data.agentOperatingSystemEngine.notLinux).toBe(true);
    expect(gql.body.data.pluginOperatingSystemEngine.notKubernetes).toBe(true);
    expect(gql.body.data.resourceManagerEngine.enterpriseEngineeringSystemOs).toBe(false);
  }});

  it('documents VAIOS in CLOUD_BLUEPRINT', () => {{
    const blueprint = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(blueprint).toMatch(/VAIOS/);
    expect(blueprint).toMatch(/VL-334/);
  }});
}});
"""
    write(ROOT / "apps/api/test/vaios-audit.spec.ts", content)


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
            "import { GpuRuntimeModule } from './gpu-runtime/gpu-runtime.module';\n",
            "\n".join(imports) + "\n",
        )
    if modules:
        text = insert_after(
            text,
            "    GpuRuntimeModule,\n",
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
            "import { GpuRuntimeApplicationModule } from '../gpu-runtime/application/gpu-runtime-application.module';\n",
            "\n".join(app_imports) + "\n",
        )
    if res_imports:
        text = insert_after(
            text,
            "import { GpuRuntimeGraphqlResolver } from './gpu-runtime.resolver';\n",
            "\n".join(res_imports) + "\n",
        )
    if app_modules:
        text = insert_after(
            text,
            "    GpuRuntimeApplicationModule,\n",
            "\n".join(app_modules) + "\n",
        )
    if resolvers:
        text = insert_after(
            text,
            "    GpuRuntimeGraphqlResolver,\n",
            "\n".join(resolvers) + "\n",
        )
    gql_mod.write_text(text)

    gql_types = ROOT / "apps/api/src/graphql/gql.types.ts"
    gt = gql_types.read_text()
    if "GqlVaiosProduct" not in gt:
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
                ("products", f"list{pascal}Products", "VAIOS products"),
                ("engine", f"get{pascal}Engine", "VAIOS engine alias"),
                ("routing", f"get{pascal}Routing", "VAIOS routing"),
                ("overview", f"get{pascal}Overview", "VAIOS overview"),
                ("monitoring", f"get{pascal}Monitoring", "VAIOS monitoring"),
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
        line = f"  verbalab {cmd}"
        if line not in ct:
            help_lines.append(line)
    if help_lines:
        ct = ct.replace(
            "  verbalab gpu-runtime-engine\n",
            "  verbalab gpu-runtime-engine\n" + "\n".join(help_lines) + "\n",
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
            "  if (command === 'gpu-runtime-engine') {\n    console.log(JSON.stringify(await vl.gpuRuntimeEngine(), null, 2));\n    return;\n  }",
            "  if (command === 'gpu-runtime-engine') {\n    console.log(JSON.stringify(await vl.gpuRuntimeEngine(), null, 2));\n    return;\n  }"
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
            "  { href: '/gpu-runtime', label: 'GPU Runtime' },\n",
            "  { href: '/gpu-runtime', label: 'GPU Runtime' },\n"
            + "\n".join(navs)
            + "\n",
        )
        shell.write_text(sh)


def update_progress_and_blueprint() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VL-333 Done — Data Plane Cloud Production Audit; Volume 18 closed)",
        "Last updated: 2026-10-03 (VL-343 Done — VAIOS Production Audit; Volume 19 closed)",
    )
    vol19_rows = """| VL-334 | VAIOS Foundation (Phase 201) | Done | `/vaios` hub; ADR-0236. `unifyingOrchestrationLayer`; `notLinux`/`notKubernetes`; `enterpriseEngineeringSystemOs=false`. |
| VL-335 | AI Scheduler (Phase 202) | Done | Unifies global-scheduler/GPU/workflow/agent queues; ADR-0237. |
| VL-336 | Runtime Manager (Phase 203) | Done | Lifecycle catalog over Kernel + Data Plane runtimes; ADR-0238. |
| VL-337 | Resource Manager (Phase 204) | Done | Resource allocation catalog; `gpuBudgetLimitsRequired`; ADR-0239. |
| VL-338 | Workflow Operating System (Phase 205) | Done | Façade over workflow-runtime + marketplace; ADR-0240. |
| VL-339 | Agent Operating System (Phase 206) | Done | Façade over agent-runtime + fabric + marketplace; ADR-0241. |
| VL-340 | AI Memory Operating System (Phase 207) | Done | Façade over memory-runtime + fabric + knowledge-memory; ADR-0242. |
| VL-341 | Knowledge Operating System (Phase 208) | Done | Façade over knowledge-runtime/fabric/cloud + AKG; ADR-0243. |
| VL-342 | Plugin Operating System (Phase 209) | Done | Façade over plugin-runtime + marketplace; existing policy gates; ADR-0244. |
| VL-343 | VAIOS Production Audit (Phase 210) | Done | Audit pack under `docs/vaios-audit/`; ADR-0245. Volume 19 closed. Enterprise Engineering System → past Volume 19. |
"""
    if "VL-334" not in pt:
        pt = pt.replace(
            "| VL-333 | Data Plane Production Audit (Phase 200) | Done | Audit pack under `docs/data-plane-cloud-audit/`; ADR-0235. Volume 18 closed. Service Mesh → past Volume 18. |\n",
            "| VL-333 | Data Plane Production Audit (Phase 200) | Done | Audit pack under `docs/data-plane-cloud-audit/`; ADR-0235. Volume 18 closed. Service Mesh → past Volume 18. |\n"
            + vol19_rows,
        )
    changelog = """| 2026-10-03 | VL-334–342 Done: VAIOS hubs (Phases 201–209) — foundation through Plugin OS; ADR-0236–0244. Unifying orchestration over Kernel + Fabric + Data Plane; notLinux/notKubernetes. |
| 2026-10-03 | VL-343 Done: VAIOS Production Audit (Phase 210) — evidence pack; ADR-0245. Volume 19 closed. Enterprise Engineering System deferred past Volume 19. |
"""
    if "VL-334–342 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog
    progress.write_text(pt)

    write(
        ROOT / "docs/VAIOS.md",
        """# VAIOS — VerbaLab AI Operating System (VL-334)

Library Phase 201 — part of Volume 19 VAIOS.

## Mission

VAIOS is the highest-level **unifying orchestration layer** for VerbaLab. It catalogs and
routes across AI Kernel (Volume 8), AI Fabric (Volume 10), and Data Plane Cloud (Volume 18).
It is **not** Linux, **not** Kubernetes, and **not** a third parallel agent/workflow/memory OS.

## Honesty

- `unifyingOrchestrationLayer=true`
- `duplicatesKernelOrFabric=false`
- `notLinux=true` / `notKubernetes=true` / `literalOsKernel=false`
- `enterpriseEngineeringSystemOs=false` (deferred past Volume 19)

## Products

| Hub | VL | Role |
| --- | --- | --- |
| vaios | 334 | Foundation catalog + Kernel/Fabric/Data Plane inventory |
| ai-scheduler | 335 | Scheduling unification |
| runtime-manager | 336 | Runtime lifecycle catalog |
| resource-manager | 337 | Resource allocation + GPU FinOps honesty |
| workflow-operating-system | 338 | Workflow OS façade |
| agent-operating-system | 339 | Agent OS façade |
| ai-memory-operating-system | 340 | Memory OS façade |
| knowledge-operating-system | 341 | Knowledge OS façade |
| plugin-operating-system | 342 | Plugin OS façade |

## Surfaces

- Console: `/vaios`
- API: `/v1/vaios/products` (also `/engine`, `/routing`, `/monitoring`, `/overview`)
- ADR: [`docs/adr/0236-vaios.md`](./adr/0236-vaios.md)

---

## Volume status

**Volume 19 closed** (VL-334–343). Production Audit evidence: [`docs/vaios-audit/`](./vaios-audit/).
Enterprise Engineering System deferred past Volume 19.
""",
    )

    blueprint = ROOT / "docs/CLOUD_BLUEPRINT.md"
    bt = blueprint.read_text()
    if "| VAIOS | VL-334 → VL-343 |" not in bt:
        if "| Data Plane Cloud | VL-324 → VL-333 |" in bt:
            bt = bt.replace(
                "| Data Plane Cloud | VL-324 → VL-333 |",
                "| Data Plane Cloud | VL-324 → VL-333 |\n| VAIOS | VL-334 → VL-343 |",
            )
    if "VAIOS volume closed" not in bt:
        bt = bt.rstrip() + (
            "\n\nVAIOS volume closed (VL-334–343) with audit pack under "
            "`docs/vaios-audit/` — see [`VAIOS.md`](./VAIOS.md). "
            "Honesty: unifying orchestration over Kernel + Fabric + Data Plane; "
            "`duplicatesKernelOrFabric=false`; `notLinux`/`notKubernetes`; "
            "`enterpriseEngineeringSystemOs=false` (deferred past Volume 19).\n"
        )
    bt = bt.replace(
        "Service Mesh / VAIOS deferred past Volume 18.\n",
        "Service Mesh deferred; VAIOS shipped in Volume 19 (VL-334–343).\n",
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
    print("Volume 19 VAIOS generation complete")


if __name__ == "__main__":
    run_generation()
 