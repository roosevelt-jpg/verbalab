import { Injectable } from '@nestjs/common';
import { WorkflowOperatingSystemService } from '../workflow-operating-system.service';
import {
  WorkflowOperatingSystemCatalogPort,
  WorkflowOperatingSystemEngineBundle,
  WorkflowOperatingSystemProductRow,
} from './ports';

@Injectable()
export class NestWorkflowOperatingSystemCatalogAdapter implements WorkflowOperatingSystemCatalogPort {
  constructor(private readonly service: WorkflowOperatingSystemService) {}

  engine(): WorkflowOperatingSystemEngineBundle {
    return this.service.engine();
  }

  listProducts(): WorkflowOperatingSystemProductRow[] {
    const bundle = this.engine() as {
      products?: WorkflowOperatingSystemProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/workflow-operating-system`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'workflow-operating-system',
        name: 'Workflow Operating System',
        status: 'shipped',
        api: 'GET /v1/workflow-operating-system/engine',
        console: '/workflow-operating-system',
        notes: 'VL-338 shipped.',
      },
    ];
  }
}
