import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ApprovalRequest,
  aiGovernancePlatformEngineCatalog,
  seedApprovalRequests,
} from './ai-governance-platform.catalog';

@Injectable
export class AiGovernancePlatformService {
  private approvals: ApprovalRequest[] = seedApprovalRequests.map((a) => ({ ...a }));

  engine {
    return aiGovernancePlatformEngineCatalog(this.approvals);
  }

  list(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const approvals = catalog.approvals.filter((a) => {
      if (!q) return true;
      return (
        a.id.toLowerCase.includes(q) ||
        a.kind.toLowerCase.includes(q) ||
        a.title.toLowerCase.includes(q) ||
        a.status.toLowerCase.includes(q) ||
        a.notes.toLowerCase.includes(q)
      );
    });
    return {
      approvals,
      count: approvals.length,
      pending: approvals.filter((a) => a.status === 'pending'),
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  status(id: string) {
    const row = this.approvals.find((a) => a.id === id);
    if (!row) throw new BadRequestException(`Unknown approval request: ${id}`);
    return {
      ...row,
      humanSignOffRequired: true as const,
      honesty: this.engine.honesty,
      docs: '/docs/AI_GOVERNANCE_PLATFORM.md',
    };
  }

  approve(id: string) {
    const row = this.approvals.find((a) => a.id === id);
    if (!row) throw new BadRequestException(`Unknown approval request: ${id}`);
    row.status = 'approved';
    return {
      ...row,
      humanSignOffRequired: true as const,
      note: 'Human approved — consequential action may proceed.',
      docs: '/docs/AI_GOVERNANCE_PLATFORM.md',
    };
  }

  reject(id: string) {
    const row = this.approvals.find((a) => a.id === id);
    if (!row) throw new BadRequestException(`Unknown approval request: ${id}`);
    row.status = 'rejected';
    return {
      ...row,
      humanSignOffRequired: true as const,
      note: 'Human rejected — consequential action must not proceed.',
      docs: '/docs/AI_GOVERNANCE_PLATFORM.md',
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'governance',
      approvalCount: catalog.approvals.length,
      pendingCount: catalog.pending.length,
      humanSignOffRequired: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AI Governance Platform monitoring snapshot — human sign-off required.',
    };
  }
}
