import { Injectable } from '@nestjs/common';
import { agentopsPlatformEngineCatalog } from './agentops-platform.catalog';

@Injectable()
export class AgentopsPlatformService {
  engine() {
    return agentopsPlatformEngineCatalog();
  }

  agents(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const agents = catalog.agents.filter((a) => {
      if (!q) return true;
      return (
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q)
      );
    });
    return {
      agents,
      count: agents.length,
      policyViolations: catalog.policyViolations,
      blockedActions: catalog.blockedActions,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.agents(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'agentops',
      agentCount: catalog.agents.length,
      policyViolations: catalog.policyViolations,
      blockedActions: catalog.blockedActions,
      policyViolationsVisible: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AgentOps Platform monitoring snapshot — policy violations visible to humans.',
    };
  }
}
