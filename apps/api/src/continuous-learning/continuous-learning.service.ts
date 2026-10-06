import { BadRequestException, Injectable } from '@nestjs/common';
import {
  continuousLearningEngineCatalog,
  evaluatePromote,
} from './continuous-learning.catalog';

@Injectable()
export class ContinuousLearningService {
  engine() {
    return continuousLearningEngineCatalog();
  }

  feedback(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const feedback = catalog.feedback.filter((f) => {
      if (!q) return true;
      return (
        f.id.toLowerCase().includes(q) ||
        f.source.toLowerCase().includes(q) ||
        f.notes.toLowerCase().includes(q)
      );
    });
    return {
      feedback,
      count: feedback.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /** Promote check — never auto-promotes; requires all honesty gates. */
  promoteCheck(id: string) {
    return evaluatePromote(id);
  }

  /** Attempt promote — rejects unless all gates pass. */
  promote(id: string) {
    const check = evaluatePromote(id);
    if (!check.allowed) {
      throw new BadRequestException(check.reason);
    }
    return {
      promoted: true,
      autoPromote: false,
      ...check,
      docs: '/docs/CONTINUOUS_LEARNING.md',
    };
  }

  query(query?: string) {
    return this.feedback(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'learning',
      feedbackCount: catalog.feedback.length,
      candidateCount: catalog.candidates.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Continuous Learning monitoring snapshot (VL-289) — promote never automatic.',
    };
  }
}
