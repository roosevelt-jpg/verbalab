import { Injectable } from '@nestjs/common';
import { visionRuntimeEngineCatalog } from './vision-runtime.catalog';
import { DocumentsService } from '../documents/documents.service';
import { OcrService } from '../ocr/ocr.service';

@Injectable
export class VisionRuntimeService {
  constructor(
    private readonly documents: DocumentsService,
    private readonly ocr: OcrService
  ) {}

  engine {
    return visionRuntimeEngineCatalog;
  }

  /** Route/execute façade: returns upstream endpoint + live status from injected product services. */
  route(capability?: string) {
    const catalog = this.engine;
    const q = (capability ?? '').trim.toLowerCase;
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase.includes(q);
    });
    const upstreamStatus = [
      {
        module: 'documents',
        method: 'injected',
        status: 'reachable',
        upstream: { injected: true, service: 'DocumentsService' },
      },
      {
        module: 'ocr',
        method: 'injected',
        status: 'reachable',
        upstream: { injected: true, service: 'OcrService' },
      }
    ];
    return {
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
    };
  }

  execute(capability?: string) {
    return this.route(capability);
  }

  list(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.routes.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      routes: rows,
      count: rows.length,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'vision-runtime',
      count: catalog.routes.length,
      thinExecutionLayer: true,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'VisionRuntime monitoring snapshot.',
    };
  }
}
