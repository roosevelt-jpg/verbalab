import { Injectable } from '@nestjs/common';
import { AgentOperatingSystemService } from '../agent-operating-system.service';
import {
  AgentOperatingSystemCatalogPort,
  AgentOperatingSystemEngineBundle,
  AgentOperatingSystemProductRow,
} from './ports';

@Injectable()
export class NestAgentOperatingSystemCatalogAdapter implements AgentOperatingSystemCatalogPort {
  constructor(private readonly service: AgentOperatingSystemService) {}

  engine(): AgentOperatingSystemEngineBundle {
    return this.service.engine();
  }

  listProducts(): AgentOperatingSystemProductRow[] {
    const bundle = this.engine() as {
      products?: AgentOperatingSystemProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/agent-operating-system`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'agent-operating-system',
        name: 'Agent Operating System',
        status: 'shipped',
        api: 'GET /v1/agent-operating-system/engine',
        console: '/agent-operating-system',
        notes: 'VL-339 shipped.',
      },
    ];
  }
}
