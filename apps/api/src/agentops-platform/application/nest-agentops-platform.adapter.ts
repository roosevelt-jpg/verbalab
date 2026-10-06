import { Injectable } from '@nestjs/common';
import { AgentopsPlatformService } from '../agentops-platform.service';
import {
  AgentopsPlatformCatalogPort,
  AgentopsPlatformEngineBundle,
  AgentopsPlatformProductRow,
} from './ports';

@Injectable
export class NestAgentopsPlatformCatalogAdapter implements AgentopsPlatformCatalogPort {
  constructor(private readonly service: AgentopsPlatformService) {}

  engine: AgentopsPlatformEngineBundle {
    return this.service.engine;
  }

  listProducts: AgentopsPlatformProductRow[] {
    const bundle = this.engine as {
      products?: AgentopsPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/agentops-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'agentops-platform',
        name: 'AgentOps Platform',
        status: 'shipped',
        api: 'GET /v1/agentops-platform/engine',
        console: '/agentops-platform',
        notes: ' shipped.',
      },
    ];
  }
}
