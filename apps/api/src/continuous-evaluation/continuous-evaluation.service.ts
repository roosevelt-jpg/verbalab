import { Injectable } from '@nestjs/common';
import {
  continuousEvalGateStatus,
  continuousEvaluationEngineCatalog,
} from './continuous-evaluation.catalog';

@Injectable()
export class ContinuousEvaluationService {
  engine() {
    return continuousEvaluationEngineCatalog();
  }

  gates(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const gates = catalog.gates.filter((g) => {
      if (!q) return true;
      return (
        g.id.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        g.kind.toLowerCase().includes(q) ||
        g.notes.toLowerCase().includes(q)
      );
    });
    return {
      gates,
      count: gates.length,
      continuousEvalPass: catalog.continuousEvalPass,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /** Required Continuous Learning promote check. */
  gateStatus() {
    return continuousEvalGateStatus();
  }

  query(query?: string) {
    return this.gates(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'conteval',
      gateCount: catalog.gates.length,
      continuousEvalPass: catalog.continuousEvalPass,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Continuous Evaluation monitoring snapshot.',
    };
  }
}
