import { Injectable } from '@nestjs/common';
import { aiDriftDetectionEngineCatalog, driftClearStatus } from './ai-drift-detection.catalog';

@Injectable()
export class AiDriftDetectionService {
  engine() {
    return aiDriftDetectionEngineCatalog();
  }

  signals(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const signals = catalog.signals.filter((s) => {
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.kind.toLowerCase().includes(q) ||
        s.severity.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q)
      );
    });
    return {
      signals,
      count: signals.length,
      driftClear: catalog.driftClear,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /** Required Continuous Learning promote check. */
  check() {
    return driftClearStatus();
  }

  query(query?: string) {
    return this.signals(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'drift',
      signalCount: catalog.signals.length,
      alertCount: catalog.alerts.length,
      driftClear: catalog.driftClear,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AI Drift Detection monitoring snapshot (VL-288).',
    };
  }
}
