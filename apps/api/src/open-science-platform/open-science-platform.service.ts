import { BadRequestException, Injectable } from '@nestjs/common';
import {
  evaluateOpenRelease,
  openSciencePlatformEngineCatalog,
  OpenReleaseCandidate,
} from './open-science-platform.catalog';

@Injectable
export class OpenSciencePlatformService {
  engine {
    return openSciencePlatformEngineCatalog;
  }

  releases(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const candidates = catalog.candidates.filter((c) => {
      if (!q) return true;
      return (
        c.id.toLowerCase.includes(q) ||
        c.title.toLowerCase.includes(q) ||
        c.kind.toLowerCase.includes(q) ||
        c.notes.toLowerCase.includes(q)
      );
    });
    const withGate = candidates.map((c) => ({
      ...c,
      releaseCheck: evaluateOpenRelease(c),
    }));
    return {
      candidates: withGate,
      count: withGate.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  checkRelease(id: string) {
    const catalog = this.engine;
    const candidate = catalog.candidates.find((c) => c.id === id);
    if (!candidate) {
      throw new BadRequestException(`Unknown open-science candidate: ${id}`);
    }
    const result = evaluateOpenRelease(candidate);
    return {
      candidate,
      ...result,
      traditionalKnowledgeConsentRequired: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      docs: catalog.docs,
    };
  }

  /** Attempt open release — rejects restricted/unverified traditional knowledge. */
  release(id: string) {
    const check = this.checkRelease(id);
    if (!check.allowed) {
      throw new BadRequestException(check.reason);
    }
    return {
      released: true,
      candidate: check.candidate,
      reason: check.reason,
      traditionalKnowledgeConsentRequired: true,
      docs: check.docs,
    };
  }

  query(query?: string) {
    return this.releases(query);
  }

  monitoring {
    const catalog = this.engine;
    const gated = catalog.candidates.map((c: OpenReleaseCandidate) => evaluateOpenRelease(c));
    return {
      mode: 'openscience',
      candidateCount: catalog.candidates.length,
      allowedCount: gated.filter((g) => g.allowed).length,
      blockedCount: gated.filter((g) => !g.allowed).length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'Open Science Platform monitoring snapshot.',
    };
  }
}
